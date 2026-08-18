# RepPlan

<<<<<<< HEAD
**Discipline made visible.** A mobile-first workout split planner and in-gym logger — built to be used standing at the rack, not filled out at a desk.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)
q![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white&style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white&style=flat-square)

**Live demo:** https://rep-plan.vercel.app/

<!-- Add a screenshot or short GIF of the app here before publishing — Home screen or an active logging session works best. Recruiters open this before they open the code. -->

---

## Why this exists

Most workout-planner apps ask for a full profile before they'll show you anything, then let your stats go stale forever. RepPlan generates a plan from four inputs — no account required — and treats body metrics as a running log instead of a one-time form, so the plan and the AI coach are always working from current data, not onboarding-day data.

## Features

- **No-signup quick start** — days per week, experience, goal, and equipment access generate a full weekly split immediately. Sign in later, only if you want to save it — the app runs on a locally-issued anonymous ID until then, and merges everything into your account the moment you do sign in.
- **Weekly split generator** — rule-based split selection (Full Body / Upper-Lower / Push-Pull-Legs) driven by experience level and training days, with each day's exercises pulled from a real exercise dataset filtered by target muscle and available equipment.
- **In-gym logger** — log sets, weights, reps, and cardio sessions with large tap targets and stepper controls built for mid-workout, one-handed use, plus a rest timer between sets.
- **AI training coach** — a chat assistant scoped strictly to fitness questions (training, form, recovery, nutrition basics). Grounded via tool calls against the exercise dataset and the user's own logged history, instead of answering from general knowledge — so exercise instructions and progress commentary are based on real data, not generated guesses.
- **Progress tracking** — a calendar heatmap of training history; tapping any date shows exactly what was logged that day, with weight/volume trends charted over time.
- **Installable PWA** — add-to-home-screen support with offline shell caching, since gym wifi is never reliable.

## Notable engineering decisions

A few choices worth knowing about if you're reading this before an interview:

- **Guest-first architecture without sacrificing security.** The backend verifies real Supabase JWTs for authenticated requests, but also accepts a self-issued anonymous UUID for guest use — with an explicit claim/migration endpoint that re-keys a guest's data to their account on sign-in, rather than losing it. This was a deliberate fix for a real onboarding-friction problem, not the default architecture.
- **Structured-data grounding over RAG.** The AI coach uses direct SQL-backed tool calls (`search_exercises`, `get_progress`) against Postgres rather than a vector database — the exercise dataset is structured, not unstructured text, so embeddings would have been unnecessary complexity for the actual problem.
- **Age as a computed field, not stored state.** Profile stores `date_of_birth` and derives current age on read, instead of storing a static `age` integer that silently goes stale.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS, installable PWA |
| Backend | FastAPI (Python) |
| Database & Auth | Supabase (Postgres + Google OAuth) |
| AI Coach | LLM chat via OpenRouter, tool-grounded against Postgres |
| Charts | Recharts |
| State | TanStack Query |
| Hosting | Vercel (frontend) · Render (backend) |

## Project structure

```
backend/
  app/
    routers/     profile, plan, exercises, session, progress, coach, body_metrics
    services/    split generation, planner logic, AI coach orchestration
    schemas/     Pydantic models
  migrations/    incremental SQL migrations
frontend/
  src/
    screens/     Landing, Onboarding, Home, Plan, ActiveLog, Progress, Coach, Settings...
    components/  shared UI (Button, GlassCard, DisciplineRing, CalendarHeatmap, ...)
    lib/         API client, auth, types
```

## Running locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your Supabase + OpenRouter keys
uvicorn app.main:app --reload --port 8100
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # fill in VITE_API_URL and Supabase keys
npm run dev
```

Frontend runs at `localhost:5173` and proxies `/api` to the backend at `localhost:8100`.

## Deployment

Deployed on Vercel (frontend) and Render (backend), against a shared Supabase project. See `DEPLOYMENT.md` for the full setup, including environment variables and the Supabase Auth redirect configuration.

## Attribution

Exercise media (thumbnails/GIFs) is © Gym visual, used under license. Images are kept at their distributed 180×180 resolution and attributed in Settings/About.

## License

MIT — see `LICENSE`.

---

Built by [Sri Ragul](https://github.com/Sriragul-7)
=======
**Discipline made visible.** A mobile-first workout split planner and in-gym logger with AI coaching.

## Features

- **Smart Split Generation** — Rule-based weekly plan tailored to experience, equipment, and goals
- **In-Gym Logger** — Log sets, reps, weight, and cardio with a custom number keypad and rest timer
- **Progress Tracking** — Calendar heatmap, exercise progress charts, muscle balance analysis
- **AI Coach** — Streaming chat with safety guardrails, RAG-powered fitness knowledge
- **PWA** — Installable progressive web app with offline shell
- **Guest Mode** — Full functionality without signup; claim data on authentication
- **Dark/Light Theme** — System-aware with manual toggle and localStorage persistence

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth) |
| AI | OpenRouter LLM with RAG retrieval |
| PWA | vite-plugin-pwa with service worker |

## Layout

```
backend/     FastAPI app, services, routers, tests, knowledge base
frontend/    React + Vite PWA
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- A Supabase project (or use local JSON fallback)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in Supabase + OpenRouter keys
uvicorn app.main:app --reload --port 8100
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # fill in Supabase anon key
npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:8100`.

### Running Tests

```bash
# Backend
cd backend && python -m pytest tests/ -v

# Frontend typecheck
cd frontend && npx tsc --noEmit

# Frontend build
cd frontend && npm run build
```

## Environment Variables

### Backend (`.env`)

| Variable | Description | Required |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | Yes (for production) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes (for production) |
| `SUPABASE_JWT_SECRET` | JWT verification secret | Yes (for auth) |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI coach | Optional |
| `OPENROUTER_MODEL` | Model ID (default: `openrouter/free`) | Optional |
| `APP_ENV` | `development` or `production` | Optional |
| `FRONTEND_URL` | Frontend URL for CORS (production) | Optional |

Backend works in local/dev mode with `LocalRepo` (JSON files) when Supabase is not configured.

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_API_URL` | Backend API URL (empty for proxy mode) |

## Architecture

### Authentication Flow

1. Guest users get a random UUID stored in `localStorage`
2. All API requests include `X-User-Id` header (guest UUID or Supabase user ID)
3. Authenticated requests also include `Authorization: Bearer <token>`
4. After Google OAuth, guest data is claimed (re-keyed) to the authenticated user

### Data Flow

```
User → React UI → api.ts → Vite Proxy → FastAPI → SupabaseRepo → Supabase
                                              ↓
                                         LocalRepo → local_store.json (dev)
```

### AI Coach Flow

1. User message → domain classifier (fitness/nutrition/recovery/safety/off-topic)
2. If off-topic or safety concern → static response
3. Otherwise → BM25 RAG retrieval over knowledge base JSON files
4. User profile + conversation history + RAG context → LLM prompt
5. Streaming response via SSE → saved to database

### Key Directories

- `backend/app/routers/` — API endpoint handlers
- `backend/app/services/` — Business logic (split generation, planning, AI coach)
- `backend/app/repo.py` — Storage abstraction (Supabase + local JSON)
- `backend/knowledge/` — RAG knowledge base (fitness, nutrition, recovery, safety)
- `frontend/src/screens/` — Page components (lazy-loaded)
- `frontend/src/components/` — Reusable UI components
- `frontend/src/lib/` — API client, auth, theme, types

## Attribution

Exercise media (thumbnails/GIFs) is © Gym visual, used under license. Images are kept at their distributed 180x180 resolution and attributed in Settings/About.
>>>>>>> 2ecc95b (fix: security hardening, bug fixes, dead code removal, and docs update)
