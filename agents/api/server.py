"""
FastAPI server for face enrollment, matching, and conversation processing.

Run with:  uvicorn agents.api.server:app --reload --port 8000
"""

import asyncio
import json
import logging
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from pydantic import BaseModel
from typing import Optional

from agents.services.face_db import (
    delete_face,
    get_all_faces,
    get_all_landmarks,
    store_face,
)
from agents.services.face_matching import (
    VECTOR_DIM,
    find_best_match,
)
from agents.reply_curator.reply_curator_fetchai_wrapped_agent import generate_suggestions
from agents.synthesizer.synthesizer_fetchai_wrapped_agent import chat_synopsis
from agents.models.models import SharedAgentState
from agents.services.conversation_db import (
    get_all_conversations_grouped,
    get_latest_synopsis_for_person,
)

log = logging.getLogger(__name__)

app = FastAPI(title="Conversation Helper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class EnrollRequest(BaseModel):
    person_name: str
    relationship: str
    relationship_type: str
    landmarks: list[float]


class EnrollResponse(BaseModel):
    face_id: str
    person_name: str


class MatchRequest(BaseModel):
    landmarks: list[float]


class MatchResult(BaseModel):
    face_id: str
    person_name: str
    relationship: str
    distance: float


class MatchResponse(BaseModel):
    match: MatchResult | None


class FaceMeta(BaseModel):
    id: str
    person_name: str
    relationship: str
    relationship_type: str
    created_at: str


def _db_unavailable(exc: Exception):
    log.error("MongoDB unreachable: %s", exc)
    raise HTTPException(status_code=503, detail="Database unavailable — check MongoDB connection")


@app.post("/api/faces/enroll", response_model=EnrollResponse)
async def enroll_face(req: EnrollRequest):
    if len(req.landmarks) != VECTOR_DIM:
        raise HTTPException(
            status_code=422,
            detail=f"Expected {VECTOR_DIM} face descriptor values, got {len(req.landmarks)}",
        )

    try:
        face_id = await store_face(
            person_name=req.person_name,
            relationship=req.relationship,
            relationship_type=req.relationship_type,
            landmarks=req.landmarks,
        )
    except (ServerSelectionTimeoutError, ConnectionFailure) as exc:
        _db_unavailable(exc)

    return EnrollResponse(face_id=face_id, person_name=req.person_name)


@app.post("/api/faces/match", response_model=MatchResponse)
async def match_face(req: MatchRequest):
    if len(req.landmarks) != VECTOR_DIM:
        raise HTTPException(
            status_code=422,
            detail=f"Expected {VECTOR_DIM} face descriptor values, got {len(req.landmarks)}",
        )

    try:
        stored = await get_all_landmarks()
    except (ServerSelectionTimeoutError, ConnectionFailure) as exc:
        _db_unavailable(exc)

    result = find_best_match(req.landmarks, stored)

    if result is None:
        return MatchResponse(match=None)

    return MatchResponse(
        match=MatchResult(
            face_id=result["face_id"],
            person_name=result["person_name"],
            relationship=result["relationship"],
            distance=result["distance"],
        )
    )


@app.get("/api/faces")
async def list_faces():
    try:
        faces = await get_all_faces(include_landmarks=False)
    except (ServerSelectionTimeoutError, ConnectionFailure) as exc:
        _db_unavailable(exc)

    return [
        {
            "id": f["_id"],
            "person_name": f["person_name"],
            "relationship": f.get("relationship", ""),
            "relationship_type": f.get("relationship_type", ""),
            "created_at": f.get("created_at", "").isoformat() if f.get("created_at") else "",
        }
        for f in faces
    ]


@app.delete("/api/faces/{face_id}")
async def remove_face(face_id: str):
    try:
        deleted = await delete_face(face_id)
    except (ServerSelectionTimeoutError, ConnectionFailure) as exc:
        _db_unavailable(exc)

    if not deleted:
        raise HTTPException(status_code=404, detail="Face not found")
    return {"deleted": True}


class ProcessRequest(BaseModel):
    transcript: str
    person_name: str
    relationship: str
    user_id: Optional[str] = "frontend-user"


class ProcessResponse(BaseModel):
    synopsis: dict | None = None
    suggestions: list | None = None


@app.post("/api/conversations/process", response_model=ProcessResponse)
async def process_conversation(req: ProcessRequest):
    if not req.transcript.strip():
        raise HTTPException(status_code=422, detail="Transcript is empty")

    person_name = (req.person_name or "").strip()
    if not person_name:
        raise HTTPException(
            status_code=422,
            detail="person_name is required — use the name from face recognition / enrollment",
        )
    relationship = (req.relationship or "").strip() or None

    state = SharedAgentState(
        chat_session_id=f"web_{int(datetime.now(tz=timezone.utc).timestamp())}",
        query=req.transcript,
        user_sender_address=req.user_id,
        message_timestamp=datetime.now(tz=timezone.utc),
    )

    try:
        synopsis_task = asyncio.create_task(
            chat_synopsis(
                state,
                known_person_name=person_name,
                known_relationship=relationship,
            )
        )
        suggestions_task = asyncio.create_task(generate_suggestions(req.transcript))

        state_result, suggestions = await asyncio.gather(
            synopsis_task, suggestions_task, return_exceptions=True,
        )
    except Exception as exc:
        log.exception("Process conversation error: %s", exc)
        raise HTTPException(status_code=500, detail="Processing failed")

    synopsis = None
    if isinstance(state_result, SharedAgentState) and state_result.result:
        try:
            synopsis = json.loads(state_result.result)
        except (json.JSONDecodeError, TypeError):
            synopsis = {"raw": state_result.result}
    elif isinstance(state_result, Exception):
        log.error("Synopsis generation failed: %s", state_result)

    if isinstance(suggestions, Exception):
        log.error("Suggestion generation failed: %s", suggestions)
        suggestions = None

    return ProcessResponse(synopsis=synopsis, suggestions=suggestions)


@app.get("/api/people")
async def list_people():
    """
    Return all known people by joining enrolled faces with their conversation history.
    Each person includes their latest synopsis and conversation timeline.
    """
    try:
        faces = await get_all_faces(include_landmarks=False)
        conversations = await get_all_conversations_grouped()
    except (ServerSelectionTimeoutError, ConnectionFailure) as exc:
        _db_unavailable(exc)

    conv_by_name = {c["_id"]: c for c in conversations}

    people = []
    seen_names = set()

    for face in faces:
        name = face["person_name"]
        if name in seen_names:
            continue
        seen_names.add(name)

        conv_data = conv_by_name.get(name)

        person = {
            "id": face["_id"],
            "name": name,
            "relationship": face.get("relationship", ""),
            "relationshipType": face.get("relationship_type", ""),
            "createdAt": face.get("created_at", "").isoformat() if face.get("created_at") else "",
            "synopsis": conv_data["latest_synopsis"] if conv_data else None,
            "lastMessageAt": conv_data["last_message_at"].isoformat() if conv_data and conv_data.get("last_message_at") else None,
            "conversationCount": conv_data["conversation_count"] if conv_data else 0,
            "conversations": [],
        }

        if conv_data and conv_data.get("conversations"):
            for conv in conv_data["conversations"][:10]:
                person["conversations"].append({
                    "id": conv["id"],
                    "startedAt": conv["started_at"].isoformat() if conv.get("started_at") else None,
                    "lastMessageAt": conv["last_message_at"].isoformat() if conv.get("last_message_at") else None,
                    "synopsis": conv.get("synopsis"),
                })

        people.append(person)

    for conv in conversations:
        name = conv["_id"]
        if name in seen_names:
            continue
        seen_names.add(name)

        people.append({
            "id": None,
            "name": name,
            "relationship": conv["latest_synopsis"].get("relationship_tag", "") if conv.get("latest_synopsis") else "",
            "relationshipType": "",
            "createdAt": None,
            "synopsis": conv.get("latest_synopsis"),
            "lastMessageAt": conv["last_message_at"].isoformat() if conv.get("last_message_at") else None,
            "conversationCount": conv["conversation_count"],
            "conversations": [
                {
                    "id": c["id"],
                    "startedAt": c["started_at"].isoformat() if c.get("started_at") else None,
                    "lastMessageAt": c["last_message_at"].isoformat() if c.get("last_message_at") else None,
                    "synopsis": c.get("synopsis"),
                }
                for c in conv.get("conversations", [])[:10]
            ],
        })

    return people


@app.get("/api/people/{person_name}/synopsis")
async def get_person_synopsis(person_name: str):
    """Return the latest synopsis for a person by name."""
    try:
        doc = await get_latest_synopsis_for_person(person_name)
    except (ServerSelectionTimeoutError, ConnectionFailure) as exc:
        _db_unavailable(exc)

    if not doc:
        return {"synopsis": None}

    return {
        "synopsis": doc.get("synopsis"),
        "lastMessageAt": doc["last_message_at"].isoformat() if doc.get("last_message_at") else None,
    }


@app.get("/api/health")
async def health():
    try:
        from agents.services.face_db import _get_client
        await _get_client().admin.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as exc:
        return {"status": "degraded", "db": str(exc)}
