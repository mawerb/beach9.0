import json
import logging
from datetime import datetime, timezone

from agents.models.config import SYNTHESIZER_SEED, GEMINI_API_KEY
from agents.models.models import SharedAgentState
from agents.services.conversation_db import (
    create_conversation,
    find_conversation_to_merge,
    update_conversation,
)
from google import genai
from uagents import Agent, Context

client = genai.Client(api_key=GEMINI_API_KEY)
logger = logging.getLogger(__name__)

MIN_TRANSCRIPT_LENGTH = 20
GENERIC_ERROR_MESSAGE = "Sorry, could not summarize. Please try again."
EMPTY_MESSAGE = "Add more detail to summarize."


def _age_tier(started_at: datetime) -> str:
    """
    Return synthesis tier based on conversation age.

    - 0–24 hours: full
    - 1–7 days: medium
    - 7+ days: tight
    """
    now = datetime.now(tz=timezone.utc)
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    delta = now - started_at
    days = delta.total_seconds() / (24 * 3600)
    if days < 1:
        return "full"
    if days < 7:
        return "medium"
    return "tight"


def _tier_prompt_suffix(tier: str) -> str:
    """Return prompt instruction for the given age tier."""
    if tier == "full":
        return "Use full format: synopsis 2-4 sentences, key_points 2-5 items, recognition_cues 1-3 items."
    if tier == "medium":
        return "This conversation is a few days old. Use medium format: synopsis 2-3 sentences, key_points 2-4 items, recognition_cues 1-2 items."
    return "This conversation is a week or more old. Use condensed format: synopsis 1-2 sentences, key_points 1-2 items, recognition_cues 1 item."


_base_system_prompt = '''
You are a memory-support assistant for a person with dementia.

Read the conversation transcript and return a short, accurate summary that helps the user remember:
- who they spoke with,
- that person's relationship to them,
- what they talked about,
- any important follow-up plans.

Rules:
- Be warm, respectful, and simple.
- Use plain language.
- Do not invent facts.
- If the name or relationship is unclear, return "Unknown".
- Focus on concrete details that help recognition: name, relationship, shared context, topics, and plans.
- If multiple people appear, choose the main person the user was speaking with.

Return valid JSON only with this schema:
{
  "person_name": "string",
  "relationship_tag": "string",
  "synopsis": "string",
  "key_points": ["string"],
  "recognition_cues": ["string"],
  "next_steps": ["string"]
}

'''


def _run_synopsis(transcript: str, tier: str = "full") -> str:
    """Call Gemini and return raw response text."""
    suffix = _tier_prompt_suffix(tier)
    prompt = _base_system_prompt + f"\n{suffix}\n\nTranscript:\n{transcript}"
    response = client.models.generate_content(
        model="gemini-3.1-flash-lite-preview",
        contents=[{"role": "user", "parts": [{"text": prompt}]}],
    )
    return response.text


def _parse_synopsis(text: str) -> dict | None:
    """Parse JSON from Gemini response. Returns None on failure."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


synthesizer = Agent(
    name="Synthesizer",
    seed=SYNTHESIZER_SEED,
    port=8002,
    mailbox=True,
    publish_agent_details=True,
)


def _apply_face_identity(
    parsed: dict,
    known_person_name: str | None,
    known_relationship: str | None,
) -> str:
    """
    Use face-enrollment identity for MongoDB + stored synopsis.

    When known_person_name is set (web / face match), it is the canonical
    person_name in the database — not Gemini's transcript guess.
    When known_relationship is set, it overwrites relationship_tag in the blob.
    """
    known_name = (known_person_name or "").strip()
    if known_name:
        person_name = known_name
        parsed["person_name"] = person_name
    else:
        person_name = (parsed.get("person_name") or "").strip() or "Unknown"
        parsed["person_name"] = person_name

    rel = (known_relationship or "").strip()
    if rel:
        parsed["relationship_tag"] = rel

    return person_name


async def chat_synopsis(
    state: SharedAgentState,
    known_person_name: str | None = None,
    known_relationship: str | None = None,
) -> SharedAgentState:
    """
    Generate a memory-support synopsis from a conversation transcript.

    Uses Gemini to analyze the transcript, optionally merges with existing
    conversations (10-min window), persists to MongoDB, and writes the
    result to state.result.

    known_person_name / known_relationship: when provided (e.g. from face
    recognition + enrollment), they override Gemini for DB keys and the
    returned synopsis fields person_name / relationship_tag.
    """
    query = (state.query or "").strip()
    if len(query) < MIN_TRANSCRIPT_LENGTH:
        state.result = EMPTY_MESSAGE
        return state

    message_ts = state.message_timestamp or datetime.now(tz=timezone.utc)

    try:
        raw = _run_synopsis(query, tier="full")
    except Exception as e:
        logger.exception("Gemini API error: %s", e)
        state.result = GENERIC_ERROR_MESSAGE
        return state

    parsed = _parse_synopsis(raw)
    if parsed is None:
        logger.warning("Failed to parse synopsis JSON: %s", raw[:200])
        state.result = GENERIC_ERROR_MESSAGE
        return state

    person_name = _apply_face_identity(parsed, known_person_name, known_relationship)

    try:
        existing = await find_conversation_to_merge(
            state.user_sender_address,
            person_name,
            message_ts,
            within_minutes=10,
        )
    except Exception as e:
        logger.exception("MongoDB find error: %s", e)
        existing = None

    if existing:
        merged_transcript = existing["transcript"] + "\n\n" + query
        tier = _age_tier(existing["started_at"])
        try:
            raw = _run_synopsis(merged_transcript, tier=tier)
        except Exception as e:
            logger.exception("Gemini re-run error: %s", e)
            state.result = GENERIC_ERROR_MESSAGE
            return state
        parsed = _parse_synopsis(raw)
        if parsed is None:
            logger.warning("Failed to parse merged synopsis")
            state.result = GENERIC_ERROR_MESSAGE
            return state
        person_name = _apply_face_identity(parsed, known_person_name, known_relationship)
        try:
            await update_conversation(
                str(existing["_id"]),
                merged_transcript,
                parsed,
                message_ts,
            )
        except Exception as e:
            logger.exception("MongoDB update error: %s", e)
    else:
        try:
            await create_conversation(
                state.user_sender_address,
                person_name,
                query,
                parsed,
                message_ts,
                message_ts,
            )
        except Exception as e:
            logger.exception("MongoDB create error: %s", e)

    state.result = json.dumps(parsed)
    return state


@synthesizer.on_message(SharedAgentState)
async def handle_message(ctx: Context, sender: str, state: SharedAgentState):
    ctx.logger.info(
        f"Received state from orchestrator: session={state.chat_session_id}, query={state.query!r}"
    )
    state = await chat_synopsis(state)
    await ctx.send(sender, state)


if __name__ == "__main__":
    synthesizer.run()
