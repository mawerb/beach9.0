# fetch-help — Fetch.ai agents (ASI:ONE / Agentverse)

**This README is for the Fetch.ai uAgent stack** you run and showcase on **Agentverse** and **ASI:ONE**. It describes **InTouch** (orchestrator), **Reply Curator**, and **Synthesizer**: how they work together, how to configure them, and how to chat via Agent Inspector.

The same Git repository also contains a **separate** web app (React + FastAPI) for camera, face enrollment, and REST — that path is **not** the focus here; see [**Also in this repository**](#also-in-this-repository) at the bottom.

---

## What the agents do

| Agent | Role |
|--------|------|
| **InTouch** (`agents/orchestrator/`) | **Orchestrator.** Accepts chat over the Fetch.ai **Chat Protocol**, forwards each substantive message to **Reply Curator** and **Synthesizer** in parallel, then **aggregates** their outputs into one JSON reply (`synopsis` + `reply_suggestions`). |
| **Reply Curator** (`agents/reply_curator/`) | Uses **Gemini** to suggest **short, warm replies** the user could send next (multiple moods). |
| **Synthesizer** (`agents/synthesizer/`) | Uses **Gemini** to build a **structured memory-support synopsis** of the conversation; can **persist** to **MongoDB** when configured (same logic as the companion API in this repo). |

Synopsis and suggestions are powered by **Google Gemini**. Keep your **`GEMINI_API_KEY`** set wherever you run these processes.

More detail for **InTouch** on Agentverse: [`agents/orchestrator/README.md`](agents/orchestrator/README.md).

---

## Architecture

![architecture](docs/architecture.png)

**Mailbox flow:** User ↔ **InTouch** ↔ (**Reply Curator** + **Synthesizer**). InTouch waits for both responses (with a timeout) before replying.

---

## Prerequisites

- **Python 3.12** (recommended)
- **pip** + dependencies from `requirements.txt` (includes `uagents`, `google-genai`, etc.)
- **`GEMINI_API_KEY`** — required for all three agents’ LLM calls
- **MongoDB** — required if you want the **Synthesizer** to **store** synopses (same as production-style runs); optional for a quick demo if you only care about in-session JSON
- **[Agentverse](https://agentverse.ai)** + **[ASI:ONE](https://asi1.ai/)** accounts — for Agent Inspector / published agents

---

## Environment

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `ORCHESTRATOR_SEED_PHRASE` | **InTouch** agent identity (random string, no spaces) |
| `REPLY_CURATOR_SEED_PHRASE` | **Reply Curator** identity |
| `SYNTHESIZER_SEED_PHRASE` | **Synthesizer** identity |
| `ALICE_SEED_PHRASE` / `BOB_SEED_PHRASE` | **Legacy** — still used if the new keys above are unset |
| `GEMINI_API_KEY` | Gemini API access |
| `MONGODB_URI` / `MONGODB_DB_NAME` | Optional but typical for **Synthesizer** persistence |

Seeds must stay **stable** for the same on-chain / Agentverse addresses between deploys.

Configuration is loaded from `.env` via `agents/models/config.py` (`python-dotenv`).

---

## Python setup

```bash
python3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

If `from google import genai` fails:

```bash
pip install google-genai
```

---

## Run the agents (local / connected mailbox)

Run **each agent in its own terminal** from the **repository root** (with venv activated):

```bash
make orchestrator    # InTouch — port 8003
make reply-curator   # Reply Curator — port 8001
make synthesizer     # Synthesizer — port 8002
```

Aliases: `make alice` → reply-curator, `make bob` → synthesizer.

Ensure all three use the **same** `.env` so orchestrator addresses match the curator and synthesizer.

---

## Try it on Agentverse / ASI:ONE (Agent Inspector)

1. Sign in at [Agentverse](https://agentverse.ai) and [ASI:ONE](https://asi1.ai/).
2. Open **all three** agent inspectors (InTouch, Reply Curator, Synthesizer) **after** sign-in.
3. **Connect** each agent and choose **Mailbox**.
4. On **InTouch**, open **Agent Profile** → **Chat with Agent**.

**What to send:** a **conversation transcript** or snippet (**about 20+ characters** after trimming). Shorter input gets a prompt to add more detail.

**What you get back:** one message whose text is **JSON** combining `synopsis` (from Synthesizer) and `reply_suggestions` (from Reply Curator), assembled by InTouch.

**Screenshots:** `docs/step_*.png`

### Video walkthrough

https://youtu.be/FPsl3cSIGQw

---

## Project layout (agent-focused)

```
agents/
  orchestrator/   # InTouch
  reply_curator/  # Reply Curator
  synthesizer/    # Synthesizer
  services/       # shared: conversation_db, state, …
  api/            # FastAPI — companion web stack only
client/           # React — companion web stack only
docs/             # diagrams + Agent Inspector screenshots
```

---

## Also in this repository

The **web client** (`client/`) and **FastAPI** server (`agents/api/server.py`) implement a **camera + face + speech** workflow. The browser calls **REST**, not the mailbox; the API **imports the same Python functions** as Reply Curator and Synthesizer and runs them in-process. You **do not** need the three uAgents running for that UI.

If you maintain a separate doc for contributors or deployment of that stack, you can expand there; this README stays oriented to **Fetch agents / ASI:ONE**.

---

## Other docs

- **Deploy API (Render) + frontend (Vercel):** [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- **InTouch** (orchestrator) deep dive: [`agents/orchestrator/README.md`](agents/orchestrator/README.md)
- Frontend notes: [`client/README.md`](client/README.md) (if present)
- Planning: [`FRONTEND_PLAN.md`](FRONTEND_PLAN.md)
