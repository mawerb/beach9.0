# InTouch

**InTouch** is an AR-style **conversation helper** for people affected by **memory loss** or **social anxiety**. It uses the **camera** to **recognize** who someone is talking to, **speech-to-text** for live dialogue, and **AI** to produce **memory-friendly synopses** and **suggested replies**—so moments with family and friends are easier to hold onto.

The same codebase powers a **web + API** product and optional **Fetch.ai uAgents** on **Agentverse / ASI:ONE**.

![Architecture](docs/architecture.png)

---

## What it does

| Capability | Description |
|------------|-------------|
| **Face enroll & match** | Learn or recognize someone from the camera; identity drives **which name** is stored with conversations. |
| **Live transcript** | Speech is captured and summarized after pauses. |
| **Synopsis + memory** | **Google Gemini** builds a structured summary; **MongoDB** stores conversation history keyed by the **enrolled person’s name**. |
| **Reply suggestions** | Short, varied-tone lines the user can tap to respond. |
| **People** | Browse people you’ve met and see **latest synopses** from the backend. |
| **Agent path** | **InTouch** orchestrates **Reply Curator** + **Synthesizer** over the Fetch.ai mailbox for demos on **ASI:ONE**. |

---

## Architecture

| Layer | Stack |
|--------|--------|
| **Frontend** | React 19, Vite 8, Zustand, Framer Motion, Phosphor Icons — camera, face descriptors, Web Speech API |
| **API** | FastAPI, Uvicorn, Motor, MongoDB, Gemini (`google-genai`) |
| **Agents** | `uagents` — **InTouch** (orchestrator), **Reply Curator**, **Synthesizer** |
| **Deploy** | API on **Render** (Docker recommended), SPA on **Vercel** — see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) |

**Two ways the “brains” run**

1. **Web app:** Browser → **FastAPI** → same Python functions as the agents (in-process). No mailbox required.
2. **Fetch.ai:** User → **InTouch** → parallel messages to **Reply Curator** + **Synthesizer** → merged JSON reply. Details: [`agents/orchestrator/README.md`](agents/orchestrator/README.md).

---

## Repository layout

```
agents/
  api/              # FastAPI REST server
  orchestrator/     # InTouch uAgent
  reply_curator/    # Reply suggestions uAgent
  synthesizer/      # Synopsis + Mongo uAgent
  services/         # face_db, conversation_db, face_matching, …
  models/
client/             # Vite + React UI
docs/               # architecture, deployment, screenshots
```

---

## Prerequisites

- **Python 3.12** (recommended)
- **Node.js 18+**
- **MongoDB** (local or Atlas)
- **Gemini API key**
- (Optional) **Agentverse / ASI:ONE** for uAgent testing

---

## Local setup

### 1. Environment

```bash
cp .env.example .env
```

Set at least: `GEMINI_API_KEY`, `MONGODB_URI`, `MONGODB_DB_NAME`, `REPLY_CURATOR_SEED_PHRASE`, `SYNTHESIZER_SEED_PHRASE`, `ORCHESTRATOR_SEED_PHRASE` (legacy `ALICE_*` / `BOB_*` still work). See [`.env.example`](.env.example).

### 2. Backend

```bash
python3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
make api
# → http://localhost:8000  ·  GET /api/health
```

### 3. Frontend

```bash
cd client && npm install && npm run dev
```

Optional: `client/.env.local` with `VITE_FACE_API_URL=http://localhost:8000`.

### 4. uAgents (optional)

Three terminals from repo root (venv active):

```bash
make orchestrator
make reply-curator
make synthesizer
```

Test via **Agent Inspector** on [Agentverse](https://agentverse.ai) / [ASI:ONE](https://asi1.ai/) — see [`agents/orchestrator/README.md`](agents/orchestrator/README.md).

**Video (agents):** [Setup walkthrough](https://youtu.be/FPsl3cSIGQw)

---

## Production deployment

- **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)** — Render (API), Vercel (client), Atlas, **`ALLOWED_ORIGINS`**, **`VITE_FACE_API_URL`**, Docker / Python 3.12 notes.

---

## API (high level)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/faces/enroll` | Enroll face + person metadata |
| `POST` | `/api/faces/match` | Match face to enrolled person |
| `GET` | `/api/faces` | List faces |
| `DELETE` | `/api/faces/{id}` | Remove face |
| `POST` | `/api/conversations/process` | Transcript → synopsis + suggestions (`person_name` from face match) |
| `GET` | `/api/people` | People + synopses |
| `GET` | `/api/people/{name}/synopsis` | Latest synopsis for one person |
| `GET` | `/api/health` | Liveness + DB ping |

---

## Contributing & license

Add project license and contribution guidelines here if you open-source the repo.

---

## More docs

| Doc | Topic |
|-----|--------|
| [`agents/orchestrator/README.md`](agents/orchestrator/README.md) | InTouch on Agentverse |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Render + Vercel + CORS |
| [`FRONTEND_PLAN.md`](FRONTEND_PLAN.md) | Frontend planning notes (if present) |
