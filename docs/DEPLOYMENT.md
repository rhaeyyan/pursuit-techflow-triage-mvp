# Deployment Guide — TechFlow Support Queue

This guide outlines how to deploy TechFlow Support Queue to the web using **Option 1: PaaS (Vercel + Render + Groq/Gemini Cloud LLM)**.

---

## 1. Backend Deployment (Render)

1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** -> **Blueprint**.
2. Connect your GitHub repository: `rhaeyyan/pursuit-techflow-triage-mvp`.
3. Render will automatically read [`render.yaml`](../render.yaml) and configure the `techflow-triage-backend` service.
4. Set Environment Variables in Render:
   - `LLM_PROVIDER`: `groq` or `gemini`
   - `GROQ_API_KEY`: *(Get a free key from [consolegroq.com](https://console.groq.com))*
   - `GEMINI_API_KEY`: *(Or get a free key from [aistudio.google.com](https://aistudio.google.com))*
5. Click **Apply**.
6. Copy your live backend URL (e.g., `https://techflow-triage-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new) and import `rhaeyyan/pursuit-techflow-triage-mvp`.
2. Set **Root Directory**: `frontend`.
3. Framework Preset: **Vite** (auto-detected).
4. Set Environment Variable in Vercel:
   - `VITE_API_BASE_URL`: `https://techflow-triage-backend.onrender.com` *(Your Render backend URL)*
5. Click **Deploy**.

---

## 3. Local Development (FastAPI + Vite)

### Backend:
```bash
source .venv/bin/activate.fish   # Or source .venv/bin/activate for bash
uvicorn main:app --reload
```

### Frontend:
```bash
cd frontend
npm run dev
```

---

## Architecture Summary
- **Rules Engine**: Catch critical keywords (*billing error, outage, data loss*) deterministically without GPU or external AI dependencies.
- **Classification Engine**: Fast, sub-millisecond keyword matching with safe baseline fallback.
  - **Optional Cloud Providers**: Groq (`gemma2-9b-it`) or Google Gemini (`gemini-2.5-flash`) via environment variables.
- **Prioritization**: Deterministic Python sorting by urgency score ($4 \to 1$) and timestamp.
