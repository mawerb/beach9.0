from datetime import datetime
from typing import Optional

from uagents import Model


class SharedAgentState(Model):
    """
    Shared communication contract between the orchestrator and all helper agents.

    The orchestrator manages this state and forwards it to the appropriate subagent.
    The subagent runs its workflow, writes its output to `result`, and sends the state
    back.

    Attributes:
        chat_session_id: Identifies the originating chat session.
        query: The user's request.
        user_sender_address: ASI:One address of the original user, so the orchestrator
            can relay the final response back.
        result: Written by the subagent once its workflow completes. Empty until then.
        message_timestamp: When the user sent the message; used for merge logic and age calculation.
        audience_type: Optional placeholder for future audience variants (e.g. dementia vs social anxiety).
    """

    chat_session_id: str
    query: str
    user_sender_address: str
    result: str = ""
    message_timestamp: Optional[datetime] = None
    audience_type: Optional[str] = None
