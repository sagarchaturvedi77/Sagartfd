# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This repo is **The Financial Doctor (TFD)** — a public marketing site for a mutual fund distributor (Sagar Chaturvedi, AMFI ARN-290298, Sehore MP) plus a **Staff Portal CRM** (`/portal/*`) for TFD's own employees (leads, attendance, targets, salary, onboarding, documents, accounts, chat, leave management). It's a two-part app: a React SPA (`frontend/`) and a FastAPI + MongoDB backend (`backend/`).

The codebase was originally scaffolded/iterated via the Emergent platform (`.emergent/emergent.yml`, `test_result.md` testing protocol, `@emergentbase/visual-edits` webpack plugin). Those artifacts are safe to ignore for normal dev; see "Emergent legacy" below if touched.

Product history and conventions live in `memory/PRD.md` — read it for the *why* behind AI chat persona, brand-colour migration, and past XSS fixes before touching `AIChat.jsx`, `Calculators.jsx`, or `Reviews.jsx`.

## Commands

### Frontend (`frontend/`)
```
yarn start          # craco start — dev server on :3000
yarn build           # craco build — production build (Netlify runs this)
yarn test            # craco test
```
Package manager is **yarn** (pinned in `package.json`). Path alias `@` → `frontend/src` (configured in `craco.config.js`).

### Backend (`backend/`)
```
pip install -r requirements.txt
python server.py                       # runs uvicorn on $PORT or 8001
python seed_admin.py                   # one-time: creates the first admin user (edit email/password in the file first)
```
Run tests **from the repo root** (not from `backend/`) — `backend/tests/test_basic.py` imports `from backend.server import app`:
```
pytest backend/tests/test_basic.py
pytest backend/tests/test_basic.py::test_root   # single test
```
Backend needs a `backend/.env` (gitignored, not committed) with at minimum:
```
MONGO_URL=...
DB_NAME=tfd_crm
JWT_SECRET=...
```
Optional: `GEMINI_API_KEY` (AI chat), `CORS_ORIGINS`, `FIREBASE_SERVICE_ACCOUNT` / `GOOGLE_APPLICATION_CREDENTIALS` (FCM push), `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` (web push fallback).

Frontend needs `frontend/.env` with `REACT_APP_BACKEND_URL=http://localhost:8001` (or deployed backend URL) for the **portal** to work — see "Two API clients" below.

### Deployment
Netlify builds the **frontend only** (`netlify.toml`: base `frontend`, publish `build`, command `yarn build`). The FastAPI backend is deployed separately (its own host, not part of this repo's build).

## Architecture

### Backend: one big router-per-feature app
`backend/server.py` is the FastAPI entrypoint. It defines a few inline routes (public reviews, contact form, MFAPI.in mutual-fund proxy, AI chat via Gemini/SSE) directly in the file, then at the bottom imports and mounts ~15 separate `APIRouter`s from sibling files — `auth_routes`, `attendance_routes`, `target_routes`, `notification_routes`, `pipeline_routes`, `notification_ack`, `analytics_routes`, `lead_routes`, `salary_routes`, `task_routes`, `onboarding_routes`, `chat_routes`, `leave_routes`, `access_routes`, `qr_routes`, `services_routes`, `documents_routes`, `accounts_routes`. Each feature is `{feature}_models.py` (Pydantic) + `{feature}_routes.py` (`APIRouter(prefix="/api/...")`), all flat in `backend/` (not nested under `routes/`, except one legacy file — `backend/routes/education_routes.py` — and an unused `backend/src/` scaffold). When adding a new portal feature, follow this same models+routes file pair pattern and register the router at the bottom of `server.py`.

- `database.py` is the single source of Motor/MongoDB collections — every collection used anywhere in the backend is declared here (`users_collection`, `leads_collection`, `attendance_collection`, etc.). Don't reach into `db["..."]` ad hoc elsewhere; import the named collection from `database.py`.
- `auth_utils.py` has the JWT + bcrypt primitives and two FastAPI dependencies: `get_current_user_payload` (any logged-in user) and `require_admin` (403s non-admins). Protected routes depend on one of these.
- Auth model: JWT bearer tokens, login by **phone (primary) or email (legacy/admin)**, roles are `admin` | `employee`. `auth_routes.py` also auto-generates employee passwords (`TFD@xxxx` pattern) and employee IDs (`utils/employee.py`).
- `notification_service.py` fans out every in-app notification through **Firebase Cloud Messaging first**, falling back to VAPID web push (`pywebpush`) if FCM isn't configured. `init_firebase.py` lazily inits `firebase_admin` from `FIREBASE_SERVICE_ACCOUNT` (JSON env var) or a credentials file — both are optional and the app degrades gracefully if absent.
- `scheduler_worker.py` is a standalone worker (not imported by `server.py`) — check it separately if working on reminders/scheduled notifications.

### Frontend: public site + gated staff portal in one SPA
`frontend/src/App.js` is the single router. Public marketing pages (`Home`, `AboutPage`, `CalculatorsPage`, `TopFundsPage`, `ServicesPage`, `ReviewsPage`, `ContactPage`, `CareerPage`, `EducationPortal`) live at top-level paths. Everything under `/portal/*` is the staff CRM, wrapped in `<ProtectedRoute requiredRole="admin"|"employee">` (`components/ProtectedRoute.jsx`), which redirects to `/portal/login` if unauthenticated or role-mismatched. Auth state (`user`, `token`, `login`, `logout`) comes from `context/AuthContext.jsx`, which stores the JWT in `localStorage` under `tfd_token` and re-validates it against `GET /api/auth/me` on load.

**Two separate API clients exist — don't mix them up:**
- `frontend/src/lib/api.js` — public site only (reviews, contact, MFAPI proxy). Hardcodes `http://localhost:5000/api` as `BACKEND_BASE_URL` — this only works when a local backend runs on port 5000; adjust or replace with the env-based client for anything that needs to work outside that setup.
- `frontend/src/portal/api.js` — staff portal only. Uses `REACT_APP_BACKEND_URL` (or same-origin if unset) and auto-attaches the `tfd_token` bearer header via `apiGet`/`apiSend`. New portal features should use this client.

Pages are organized as `AdminX.jsx` / `EmployeeX.jsx` pairs per feature (e.g. `AdminLeads.jsx` + `EmployeeLeads.jsx`, `AdminAttendance.jsx` + `EmployeeAttendance.jsx`) — admin pages manage/oversee, employee pages are the self-service view of the same domain. `components/PortalLayout.jsx` is the shared shell (sidebar/nav) for all `/portal/*` pages.

### Conventions (from `memory/PRD.md`)
- All portal API calls go through `frontend/src/portal/api.js` (not raw `fetch`).
- All external brand links (WhatsApp, AssetPlus, Google Reviews, socials) are centralised in `frontend/src/lib/links.js` — update once, used everywhere. Don't hardcode URLs in components.
- UI test IDs are centralised in `frontend/src/constants/testIds/`.
- Currency formatting goes through `fmtINR` (₹ with Lakh/Crore grouping) rather than ad hoc `toLocaleString`.
- Bilingual (EN/HI) tips/copy live in `frontend/src/lib/recommendations.js`.
- The AI chat (`components/AIChat.jsx`) system prompt is persona-bound ("TFD-AI"/"Sagar ji") and must only ever suggest **Regular Plan** mutual funds (TFD is a commission-earning MFD, not a Direct-plan advisor) — never add Direct-plan language here.
- `AIChat.jsx`'s markdown renderer builds React nodes directly (no `dangerouslySetInnerHTML`) with a `safeUrl` allowlist (http/https/mailto only) — this was a deliberate XSS fix; don't reintroduce raw HTML injection when touching chat rendering.

## Emergent legacy (usually ignorable)

- `test_result.md` describes a YAML-based "main agent / testing agent" handoff protocol specific to the Emergent platform — there is no testing agent available in this environment, so this file can be read for historical context but the protocol itself doesn't apply here.
- `.emergent/emergent.yml` and `frontend/craco.config.js`'s `@emergentbase/visual-edits` block are for Emergent's cloud editor only; they're inert/opt-in locally (`EMERGENT_VISUAL_EDITS=true` to enable, otherwise skipped).
- `test_reports/` contains historical iteration test run artifacts (JSON/XML), not a live test suite to run.
