"""
FastAPI server for face enrollment and matching.

Run with:  uvicorn agents.api.server:app --reload --port 8000
"""

import logging

logging.basicConfig(level=logging.INFO)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from pydantic import BaseModel

from agents.services.face_db import (
    delete_face,
    get_all_faces,
    get_all_landmarks,
    store_face,
)
from agents.services.face_matching import (
    VECTOR_DIM,
    find_best_match,
    normalize_landmarks,
)

log = logging.getLogger(__name__)

app = FastAPI(title="Conversation Helper — Face API")

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
            detail=f"Expected {VECTOR_DIM} landmark values (478 x 3), got {len(req.landmarks)}",
        )

    normalised = normalize_landmarks(req.landmarks)

    try:
        face_id = await store_face(
            person_name=req.person_name,
            relationship=req.relationship,
            relationship_type=req.relationship_type,
            landmarks=normalised,
        )
    except (ServerSelectionTimeoutError, ConnectionFailure) as exc:
        _db_unavailable(exc)

    return EnrollResponse(face_id=face_id, person_name=req.person_name)


@app.post("/api/faces/match", response_model=MatchResponse)
async def match_face(req: MatchRequest):
    if len(req.landmarks) != VECTOR_DIM:
        raise HTTPException(
            status_code=422,
            detail=f"Expected {VECTOR_DIM} landmark values (478 x 3), got {len(req.landmarks)}",
        )

    normalised = normalize_landmarks(req.landmarks)

    try:
        stored = await get_all_landmarks()
    except (ServerSelectionTimeoutError, ConnectionFailure) as exc:
        _db_unavailable(exc)

    result = find_best_match(normalised, stored)

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


@app.get("/api/health")
async def health():
    try:
        from agents.services.face_db import _get_client
        await _get_client().admin.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as exc:
        return {"status": "degraded", "db": str(exc)}
