# Deployment (Render API + Vercel frontend)

## Backend on Render

1. **MongoDB:** Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas). Under **Network Access**, allow **`0.0.0.0/0`** (or Render’s egress IPs if you lock it down later). Copy the **connection string** into `MONGODB_URI`.

2. **Render (recommended):** [New → Blueprint](https://dashboard.render.com/) → select this repo → apply **`render.yaml`**. The blueprint uses **Docker** (`Dockerfile`) with **Python 3.12** so `pydantic_core` installs from wheels. Do **not** rely on Render’s default native Python **3.14** for `pip install -r requirements.txt` — it often tries to **compile** `pydantic_core` (Rust) and fails with *read-only file system* / *maturin* errors.

   **Manual Web Service (native Python, no Docker):** only if you pin Python explicitly:
   - **Root directory:** repository root
   - **Runtime:** Python
   - **Environment →** add **`PYTHON_VERSION`** = `3.12.8` (or another **3.12.x** Render supports)
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn agents.api.server:app --host 0.0.0.0 --port $PORT`

   **Existing service stuck on 3.14:** either switch the service to **Docker** and point at the repo `Dockerfile`, or add **`PYTHON_VERSION=3.12.8`** (or `3.12.0`) under **Environment**, clear build cache, and redeploy.

3. **Environment variables** (Render → your service → **Environment**):

   | Variable | Notes |
   |----------|--------|
   | `GEMINI_API_KEY` | Required |
   | `MONGODB_URI` | Atlas SRV URI |
   | `MONGODB_DB_NAME` | e.g. `fetch_help` |
   | `REPLY_CURATOR_SEED_PHRASE` | Same random seeds as local (stable identity) |
   | `SYNTHESIZER_SEED_PHRASE` | |
   | `ORCHESTRATOR_SEED_PHRASE` | Loaded by config; set for consistency |
   | `ALLOWED_ORIGINS` | **Required for browser access:** comma-separated, no spaces after commas is fine if you strip in app — e.g. `https://your-app.vercel.app` |

   Local Vite URLs (`http://localhost:5173`, etc.) are **always** allowed by the API; `ALLOWED_ORIGINS` **adds** your production frontend(s).

4. **Smoke test:** `GET https://<your-service>.onrender.com/api/health` — should show DB connected once Atlas is reachable.

**Note:** Render **free** web services **spin down** after idle; first request can be slow (cold start).

---

## Frontend on Vercel

1. **New project** → import repo → set **Root Directory** to `client`.
2. **Environment variables** (at build time):
   - `VITE_FACE_API_URL` = `https://<your-service>.onrender.com` (no trailing slash)

3. Redeploy whenever you change `VITE_FACE_API_URL`.

---

## CORS

The API builds allowed origins from:

- Fixed localhost / 127.0.0.1 Vite ports
- Plus `ALLOWED_ORIGINS` (comma-separated)

Set `ALLOWED_ORIGINS` on Render to your Vercel URL(s) so the browser can call the API.
