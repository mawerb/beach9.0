import json
import logging

from agents.models.config import REPLY_CURATOR_SEED, GEMINI_API_KEY
from agents.models.models import SharedAgentState
from google import genai
from uagents import Agent, Context

client = genai.Client(api_key=GEMINI_API_KEY)
logger = logging.getLogger(__name__)

REPLY_CURATOR_MODEL = "gemini-2.5-flash-lite"

_suggestion_prompt = '''
You are a reply assistant for a person with dementia.

Given the conversation transcript below, figure out who the user was speaking with and suggest 3 short replies the user could send back. Each reply should have a distinct mood (you choose appropriate moods, e.g. Warm, Casual, Grateful, Playful, Brief). Use the other person's name if mentioned.

Keep each reply 1-2 sentences. Simple, warm language.

Return valid JSON only — an array of 3 objects:
[{"mood": "string", "text": "string"}, {"mood": "string", "text": "string"}, {"mood": "string", "text": "string"}]
'''

reply_curator = Agent(
    name="Reply Curator",
    seed=REPLY_CURATOR_SEED,
    port=8001,
    mailbox=True,
    publish_agent_details=True,
)


def _parse_suggestions(text: str) -> list | None:
    """Parse JSON array from Gemini response."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    try:
        result = json.loads(text)
        if isinstance(result, list):
            return result
        return None
    except json.JSONDecodeError:
        return None


async def generate_suggestions(transcript: str) -> list | None:
    """
    Generate 3 reply suggestions from a conversation transcript.

    Standalone function callable without agent context.
    Returns a list of suggestion dicts or None on failure.
    """
    transcript = (transcript or "").strip()
    if not transcript:
        return None

    prompt = _suggestion_prompt + f"\n\nTranscript:\n{transcript}"

    try:
        response = client.models.generate_content(
            model=REPLY_CURATOR_MODEL,
            contents=[{"role": "user", "parts": [{"text": prompt}]}],
        )
        parsed = _parse_suggestions(response.text)
        if parsed is None:
            logger.warning("Failed to parse suggestions JSON: %s", response.text[:200])
        return parsed
    except Exception as e:
        logger.exception("Gemini error in Reply Curator: %s", e)
        return None


async def generate_reply_suggestions(state: SharedAgentState) -> SharedAgentState:
    """
    Generate 3 reply suggestions from the conversation transcript.

    Uses a lightweight Gemini model. Stores the result in state.reply_suggestions
    as a JSON string. On failure, leaves reply_suggestions as None.
    """
    result = await generate_suggestions(state.query)
    if result is not None:
        state.reply_suggestions = json.dumps(result)
    return state


@reply_curator.on_message(SharedAgentState)
async def handle_message(ctx: Context, sender: str, state: SharedAgentState):
    ctx.logger.info(
        f"Received state from orchestrator: session={state.chat_session_id}, query={state.query!r}"
    )
    state = await generate_reply_suggestions(state)
    await ctx.send(sender, state)


if __name__ == "__main__":
    reply_curator.run()
