import json
import logging

from agents.models.config import ALICE_SEED, GEMINI_API_KEY
from agents.models.models import SharedAgentState
from google import genai
from uagents import Agent, Context

client = genai.Client(api_key=GEMINI_API_KEY)
logger = logging.getLogger(__name__)

ALICE_MODEL = "gemini-2.5-flash-lite"

_suggestion_prompt = '''
You are a reply assistant for a person with dementia.

Given the conversation transcript below, figure out who the user was speaking with and suggest 3 short replies the user could send back. Each reply should have a distinct mood (you choose appropriate moods, e.g. Warm, Casual, Grateful, Playful, Brief). Use the other person's name if mentioned.

Keep each reply 1-2 sentences. Simple, warm language.

Return valid JSON only — an array of 3 objects:
[{"mood": "string", "text": "string"}, {"mood": "string", "text": "string"}, {"mood": "string", "text": "string"}]
'''

alice = Agent(
    name="alice",
    seed=ALICE_SEED,
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


async def generate_reply_suggestions(state: SharedAgentState) -> SharedAgentState:
    """
    Generate 3 reply suggestions from the conversation transcript.

    Uses a lightweight Gemini model. Stores the result in state.reply_suggestions
    as a JSON string. On failure, leaves reply_suggestions as None.
    """
    query = (state.query or "").strip()
    if not query:
        return state

    prompt = _suggestion_prompt + f"\n\nTranscript:\n{query}"

    try:
        response = client.models.generate_content(
            model=ALICE_MODEL,
            contents=[{"role": "user", "parts": [{"text": prompt}]}],
        )
        parsed = _parse_suggestions(response.text)
        if parsed is not None:
            state.reply_suggestions = json.dumps(parsed)
        else:
            logger.warning("Failed to parse suggestions JSON: %s", response.text[:200])
    except Exception as e:
        logger.exception("Gemini error in Alice: %s", e)

    return state


@alice.on_message(SharedAgentState)
async def handle_message(ctx: Context, sender: str, state: SharedAgentState):
    ctx.logger.info(
        f"Received state from orchestrator: session={state.chat_session_id}, query={state.query!r}"
    )
    state = await generate_reply_suggestions(state)
    await ctx.send(sender, state)


if __name__ == "__main__":
    alice.run()
