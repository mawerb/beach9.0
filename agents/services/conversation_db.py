"""
MongoDB service for conversation synopses.

Stores conversations with merge support (10-minute window for same person).
"""

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from agents.models.config import MONGODB_DB_NAME, MONGODB_URI

COLLECTION = "conversations"


_client: AsyncIOMotorClient | None = None


def _get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client


def _get_db():
    return _get_client()[MONGODB_DB_NAME]


async def _ensure_indexes(db) -> None:
    collection = db[COLLECTION]
    await collection.create_index([("user_address", 1), ("person_name", 1)])
    await collection.create_index([("last_message_at", 1)])


async def find_conversation_to_merge(
    user_address: str,
    person_name: str,
    new_message_at: datetime,
    within_minutes: int = 10,
) -> dict[str, Any] | None:
    """
    Find an existing conversation to merge into.

    Returns the conversation doc if one exists with same user/person
    and last_message_at within `within_minutes` of new_message_at.
    """
    from datetime import timedelta

    db = _get_db()
    await _ensure_indexes(db)
    collection = db[COLLECTION]

    cutoff = new_message_at - timedelta(minutes=within_minutes)
    doc = await collection.find_one(
        {
            "user_address": user_address,
            "person_name": person_name,
            "last_message_at": {"$gte": cutoff},
        },
        sort=[("last_message_at", -1)],
    )
    return doc


async def create_conversation(
    user_address: str,
    person_name: str,
    transcript: str,
    synopsis: dict[str, Any],
    started_at: datetime,
    last_message_at: datetime,
) -> str:
    """Create a new conversation document. Returns the inserted ID."""
    db = _get_db()
    await _ensure_indexes(db)
    collection = db[COLLECTION]

    doc = {
        "user_address": user_address,
        "person_name": person_name,
        "started_at": started_at,
        "last_message_at": last_message_at,
        "transcript": transcript,
        "synopsis": synopsis,
    }
    result = await collection.insert_one(doc)
    return str(result.inserted_id)


async def update_conversation(
    conv_id: str,
    transcript: str,
    synopsis: dict[str, Any],
    last_message_at: datetime,
) -> None:
    """Update an existing conversation with merged transcript and new synopsis."""
    from bson import ObjectId

    db = _get_db()
    collection = db[COLLECTION]

    await collection.update_one(
        {"_id": ObjectId(conv_id)},
        {
            "$set": {
                "transcript": transcript,
                "synopsis": synopsis,
                "last_message_at": last_message_at,
            }
        },
    )
