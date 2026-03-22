# InTouch — Orchestrator Agent

**InTouch** is the conversation **orchestrator** for the fetch-help stack. It sits between you and two specialist agents: it accepts natural chat over the **Fetch.ai Chat Protocol**, **fans out** each substantive message to both downstream agents in parallel, **merges** their outputs, and returns a single structured reply.

---

## Chat on Agentverse

**[Open InTouch on Agentverse →](https://agentverse.ai/agents/details/agent1qvnpu46exfw4jazkhwxdqpq48kcdg0u0ak3mz36yg93ej06xntklsxcwplc/profile)**

Use **Chat with Agent** (mailbox session) from the agent profile. Send a **transcript or conversation snippet** (about **20+ characters** after trimming); shorter messages get a prompt to add more detail.

---

## What it does

| Capability | Description |
|------------|-------------|
| **Dual routing** | For each qualifying user message, InTouch sends the same `SharedAgentState` to **Reply Curator** (reply suggestions) and **Synthesizer** (memory-style synopsis). |
| **Aggregation** | Collects both responses and returns **one JSON payload** with `synopsis` and `reply_suggestions`. |
| **Resilience** | If one side is slow, InTouch still replies after a **10 second** timeout with whatever arrived (synopsis-only or suggestions-only when needed). |
| **Chat UX** | Implements the standard **uAgents Chat Protocol** (acknowledgements, text content, end-session). |

---

## Response shape

The user receives a **text** message whose body is JSON, for example:

```json
{
  "synopsis": {
    "person_name": "...",
    "relationship_tag": "...",
    "synopsis": "...",
    "key_points": [],
    "recognition_cues": [],
    "next_steps": []
  },
  "reply_suggestions": [
    { "mood": "Warm", "text": "..." }
  ]
}
```

Exact fields depend on the Synthesizer and Reply Curator agents; parsing may fall back to raw strings if JSON decoding fails.

---

## Downstream agents

| Agent | Role |
|-------|------|
| **Reply Curator** | Generates short **reply suggestions** (Gemini), tuned for supportive, simple language. |
| **Synthesizer** | Produces a **structured synopsis** and (when configured) persists conversation memory via MongoDB. |

Both must be **running and reachable** on the Agentverse mailbox network for full responses. The orchestrator resolves them by **agent address** from the same deployment’s seed configuration.

---

## Local development

From the **repository root** (with `.env` containing `ORCHESTRATOR_SEED_PHRASE` and the same seeds as Reply Curator + Synthesizer so addresses match):

```bash
source .venv/bin/activate
make orchestrator
```

- **Port:** `8003` (local agent process)
- **Mailbox:** enabled (`mailbox=True`)
- **Agent details:** published for discovery (`publish_agent_details=True`)

### REST probes (local)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness — returns status OK |
| `POST` | `/message` | Simple echo test (`HttpMessagePost` → `HttpMessageResponse`) |

These are useful for sanity checks; **end-user chat** goes through the **chat protocol**, not `/message`.

---

## Implementation map

| File | Responsibility |
|------|----------------|
| `orchestrator_fetchai_wrapped_agent.py` | Agent definition, aggregation, timeouts, user reply |
| `chat_protocol.py` | Incoming chat, transcript length gate, dispatch to Reply Curator + Synthesizer |

---

## Naming

The uAgent’s internal name in code is `orchestrator`; **InTouch** is the product name used on **Agentverse** and in this README.

---

## Related

- Root project overview: [`../../README.md`](../../README.md)
- Web + API path (face enrollment, REST): FastAPI in `agents/api/server.py`
