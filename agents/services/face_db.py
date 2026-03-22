"""
MongoDB service for the `faces` collection.

Stores enrolled face landmarks linked to person profiles.
"""

import logging
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from agents.models.config import MONGODB_DB_NAME, MONGODB_URI

log = logging.getLogger(__name__)
COLLECTION = "faces"

_client: AsyncIOMotorClient | None = None
_indexes_created = False


def _get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _client


def _get_db():
    return _get_client()[MONGODB_DB_NAME]


async def _ensure_indexes(db) -> None:
    global _indexes_created
    if _indexes_created:
        return
    try:
        collection = db[COLLECTION]
        await collection.create_index([("person_name", 1)])
        _indexes_created = True
    except Exception as exc:
        log.warning("Index creation failed (will retry next request): %s", exc)


async def store_face(
    person_name: str,
    relationship: str,
    relationship_type: str,
    landmarks: list[float],
) -> str:
    """Insert a new face document. Returns the inserted ID as string."""
    db = _get_db()
    await _ensure_indexes(db)

    now = datetime.now(tz=timezone.utc)
    doc = {
        "person_name": person_name,
        "relationship": relationship,
        "relationship_type": relationship_type,
        "landmarks": landmarks,
        "created_at": now,
        "updated_at": now,
    }
    result = await db[COLLECTION].insert_one(doc)
    return str(result.inserted_id)


async def get_all_faces(include_landmarks: bool = False) -> list[dict[str, Any]]:
    """Return all enrolled faces. Omits landmark arrays by default."""
    db = _get_db()
    projection = None if include_landmarks else {"landmarks": 0}
    cursor = db[COLLECTION].find({}, projection)
    docs = await cursor.to_list(length=500)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs


async def get_all_landmarks() -> list[dict[str, Any]]:
    """Return face_id, person_name, and landmarks for every enrolled face."""
    db = _get_db()
    cursor = db[COLLECTION].find({}, {"person_name": 1, "relationship": 1, "landmarks": 1})
    docs = await cursor.to_list(length=500)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs


async def get_face_by_id(face_id: str) -> dict[str, Any] | None:
    db = _get_db()
    doc = await db[COLLECTION].find_one({"_id": ObjectId(face_id)})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


async def delete_face(face_id: str) -> bool:
    """Delete a face by ID. Returns True if a document was deleted."""
    db = _get_db()
    result = await db[COLLECTION].delete_one({"_id": ObjectId(face_id)})
    return result.deleted_count > 0
