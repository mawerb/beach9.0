import asyncio
import json
import logging
from datetime import datetime, timezone
from uuid import uuid4

from agents.models.config import ALICE_ADDRESS, ORCHESTRATOR_SEED, SYNOPSIS_ADDRESS
from agents.models.models import SharedAgentState
from agents.orchestrator.chat_protocol import chat_proto
from uagents import Agent, Context, Model
from uagents_core.contrib.protocols.chat import ChatMessage, EndSessionContent, TextContent

logger = logging.getLogger(__name__)

AGGREGATION_TIMEOUT_S = 10

orchestrator = Agent(
    name="orchestrator",
    seed=ORCHESTRATOR_SEED,
    port=8003,
    mailbox=True,
    publish_agent_details=True,
)

orchestrator.include(chat_proto, publish_manifest=True)

_pending: dict[str, dict] = {}


def _build_response(synopsis_result: str | None, suggestions: str | None) -> str:
    """Combine synopsis and reply suggestions into a single JSON response."""
    synopsis = None
    if synopsis_result:
        try:
            synopsis = json.loads(synopsis_result)
        except json.JSONDecodeError:
            synopsis = synopsis_result

    reply_suggestions = []
    if suggestions:
        try:
            reply_suggestions = json.loads(suggestions)
        except json.JSONDecodeError:
            pass

    return json.dumps({"synopsis": synopsis, "reply_suggestions": reply_suggestions})


async def _send_to_user(ctx: Context, session_id: str) -> None:
    """Send the aggregated response and clean up pending state."""
    entry = _pending.pop(session_id, None)
    if entry is None or entry.get("sent"):
        return
    entry["sent"] = True

    response = _build_response(entry.get("synopsis"), entry.get("suggestions"))
    user_address = entry.get("user_address")
    if not user_address:
        logger.warning("No user address for session %s", session_id)
        return

    await ctx.send(
        user_address,
        ChatMessage(
            timestamp=datetime.now(tz=timezone.utc),
            msg_id=uuid4(),
            content=[
                TextContent(type="text", text=response),
                EndSessionContent(type="end-session"),
            ],
        ),
    )


class HealthResponse(Model):
    status: str


class HttpMessagePost(Model):
    content: str


class HttpMessageResponse(Model):
    echo: str


@orchestrator.on_rest_get("/health", HealthResponse)
async def health(ctx: Context) -> HealthResponse:
    return HealthResponse(status="ok healthy")


@orchestrator.on_rest_post("/message", HttpMessagePost, HttpMessageResponse)
async def message(ctx: Context, req: HttpMessagePost) -> HttpMessageResponse:
    return HttpMessageResponse(echo=req.content)


@orchestrator.on_message(SharedAgentState)
async def handle_agent_response(ctx: Context, sender: str, state: SharedAgentState):
    """
    Aggregate responses from Synthesizer and Alice.

    Whichever arrives first is stored. When both arrive, or after the timeout,
    the combined response is sent to the user.
    """
    session_id = state.chat_session_id
    ctx.logger.info(f"Received from {sender}: session={session_id}")

    if session_id not in _pending:
        _pending[session_id] = {
            "user_address": state.user_sender_address,
            "synopsis": None,
            "suggestions": None,
            "sent": False,
        }

    entry = _pending[session_id]
    if entry.get("sent"):
        return

    is_synopsis = sender == SYNOPSIS_ADDRESS
    is_alice = sender == ALICE_ADDRESS

    if is_synopsis:
        entry["synopsis"] = state.result
        ctx.logger.info(f"Synopsis received for session {session_id}")
    elif is_alice:
        entry["suggestions"] = state.reply_suggestions
        ctx.logger.info(f"Suggestions received for session {session_id}")

    both_ready = entry["synopsis"] is not None and entry["suggestions"] is not None

    if both_ready:
        await _send_to_user(ctx, session_id)
    elif is_synopsis and entry["suggestions"] is None:
        # Synopsis arrived first — start timeout for Alice
        async def _timeout():
            await asyncio.sleep(AGGREGATION_TIMEOUT_S)
            if session_id in _pending and not _pending[session_id].get("sent"):
                ctx.logger.info(f"Timeout: sending synopsis without suggestions for {session_id}")
                await _send_to_user(ctx, session_id)

        asyncio.ensure_future(_timeout())
    elif is_alice and entry["synopsis"] is None:
        # Alice arrived first — start timeout for Synthesizer
        async def _timeout():
            await asyncio.sleep(AGGREGATION_TIMEOUT_S)
            if session_id in _pending and not _pending[session_id].get("sent"):
                ctx.logger.info(f"Timeout: sending suggestions without synopsis for {session_id}")
                await _send_to_user(ctx, session_id)

        asyncio.ensure_future(_timeout())


if __name__ == "__main__":
    orchestrator.run()
