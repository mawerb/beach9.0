from agents.models.config import BOB_SEED, GEMINI_API_KEY
from agents.models.models import SharedAgentState
from uagents import Agent, Context
from google import genai

client = genai.Client(api_key=GEMINI_API_KEY)
system_prompt = '''
You are a memory-support assistant for a person with dementia.

Read the conversation transcript and return a short, accurate summary that helps the user remember:
- who they spoke with,
- that person’s relationship to them,
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

Guidance:
- synopsis should be 2 to 4 sentences
- key_points should have 2 to 5 items
- recognition_cues should have 1 to 3 items
- next_steps should include only plans clearly mentioned
'''


bob = Agent(
    name="bob",
    seed=BOB_SEED,
    port=8002,
    mailbox=True,
    publish_agent_details=True,
)


def chat_synopsis(state: SharedAgentState) -> SharedAgentState:
    """
    Generate a memory-support synopsis from a conversation transcript.

    Uses Gemini to analyze the transcript in state.query and extract structured
    JSON with: person_name, relationship_tag, synopsis, key_points, recognition_cues,
    and next_steps. The output is written to state.result for the orchestrator
    to relay back to the user.
    """
    
    prompt = system_prompt + "\n\nTranscript:\n" + state.query

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[{"role": "user", "parts": [{"text": prompt}]}],
    )
    state.result = response.text

    return state


@bob.on_message(SharedAgentState)
async def handle_message(ctx: Context, sender: str, state: SharedAgentState):
    ctx.logger.info(f"Received state from orchestrator: session={state.chat_session_id}, query={state.query!r}")
    state = chat_synopsis(state)
    await ctx.send(sender, state)


if __name__ == "__main__":
    bob.run()
