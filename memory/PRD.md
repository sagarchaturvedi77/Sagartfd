# The Financial Doctor — PRD

## Original Problem Statement
"Phase 4 build karo: 1) In-website Google review form with 5★ — saves to DB & shows live, 2) Live MF data via MFAPI.in (top funds, search, NAV, returns), 3) Calculator PNG snapshot download with TFD logo + Sagar ji photo + AssetPlus QR + ARN-290298 + contact (using html2canvas + qrcode.react), 4) Daily SIP Calculator (22 working days/month logic), 5) Content + design refresh."

## Brand & Personas
- **Brand:** The Financial Doctor (TFD), led by Sagar Chaturvedi — AMFI Registered MFD, ARN-290298, Sehore MP
- **Personas:** salaried investors (T2/3 MP), existing investors, aspiring sub-brokers
- **All recommendations:** Regular Plan (Growth option) — TFD earns commission as MFD; no Direct plan suggestions anywhere on the site or via AI.

## Tech Stack
- Frontend: React 19, React Router 7, Tailwind 3, Recharts, html2canvas, qrcode.react, lucide-react, sonner
- Backend: FastAPI, Motor (MongoDB async), httpx, emergentintegrations
- AI: Claude Sonnet 4.6 via Emergent Universal LLM key (SSE streaming, persisted history)
- Data: MongoDB (reviews, contact_requests, ai_sessions), MFAPI.in (live NAV/returns with retry+1h cache)

## Architecture
- `/api/reviews` POST/GET + `/stats`
- `/api/contact` POST
- `/api/mf/top-funds` 15 Regular-plan funds × 5 categories with 1y/3y/5y CAGR (retry + cache)
- `/api/mf/search?q=`, `/api/mf/{code}`
- `/api/ai/chat` (SSE streaming, persona-bound to Sagar ji, Regular-plan only)
- `/api/ai/history/{session_id}`

## Implemented
### 2026-06-22 (Phase 4 baseline)
- Live Google-style review form, MFAPI top funds, calculator PNG, Daily SIP, full design refresh

### 2026-06-22 (iter 2)
- Landscape TFD logo (Navbar, Footer, Snapshot)
- TFD-AI chat (Claude Sonnet 4.6, Emergent key, SSE streaming, multi-turn, "Sagar ji" persona)
- FloatingActions widget (AI + 7 social/CTAs)
- Portrait calculator snapshot with +2Y/+5Y/+10Y projection cards
- Mobile-responsive calculator (scrollable tabs, stacked metrics, smaller chart)

### 2026-06-22 (iter 3)
- FloatingActions restructured: AI on bottom-LEFT, WhatsApp on bottom-RIGHT with expandable stack of 5 socials
- 5-second LeadPopup (name + phone, skippable, posts to /api/contact)
- 10-second WhatsAppCommunityPopup with strong "Join Community" CTA
- TopFunds: ALL 15 funds now Regular Plan codes (Direct removed); mobile renders as card list with ReturnPills
- Calculator + AI Plan PNG: both PORTRAIT (600px wide) with bilingual EN+HI "Smart Tips · सुझाव" recommendations
- AI Chat PNG download (`ai-chat-download`) — only enabled after first assistant reply
- AI system prompt mandates Regular Plan recommendations only

### 2026-06-22 (iter 4 — current)
- Centralised LINKS module (`/app/frontend/src/lib/links.js`)
- New WhatsApp Community link → `https://chat.whatsapp.com/JEb2Ilngiq45oqyUQDMFSX` (replaces old)
- New Google Reviews link → `google.com/search?q=the+financial+doctor+reviews`
- Reviews section: "Write a Google Review" is the PRIMARY CTA (Google-yellow); local form moved to "or quick note here" secondary
- Each review card carries a "Google" badge (multi-colour Google G mark) to communicate verified-Google-source
- SEED_REVIEWS expanded to 6 realistic Google-style entries (Rahul, Priya, Amit, Neha, Vikram, Anjali) across Sehore/Bhopal/Indore
- Backend resilience: per-fund retry (3 attempts with backoff) inside /api/mf/top-funds so cold-start MFAPI hiccups never drop funds

### 2026-06-23 (iter 5 — logo-matched palette + snapshot fix)
- **Brand colour migration**: Extracted exact hex from TFD logo (navy `#024396` + red `#C7102E`) and migrated entire codebase. Old emerald `#0E5E48` and ochre `#C9802A` replaced everywhere. CSS HSL tokens updated (`--primary: 213 97% 30%`, `--accent: 351 85% 42%`).
- **AI Chat snapshot fix**: `PlanSnapshot` refactored to render ONLY the latest user question + latest substantial AI plan (full content via new `stripMdFull` helper, NO truncation). Long multi-turn chats no longer cut off — verified producing 1280×5376 PNGs with the entire planning + recommendations visible.
- Added duplicate-line/duplicate-sentence collapse in `stripMdFull` to clean SSE streaming artefacts in snapshot rendering.
- `downloadPlanning` now passes explicit width/height to html2canvas so very tall snapshots capture reliably.

## Test status
- iter_1: 100% backend, 95% frontend
- iter_2: 100% backend, 100% frontend
- iter_3: 100% backend (22/22 once cache warm), 100% frontend (all 6 new flows pass)
- iter_4: 100% frontend (colour migration + AI snapshot full-content download, calculator regression, top funds, floating actions all pass)

## Backlog
- P1: Admin moderation panel for reviews, Resend email notification on new contact, SEO LocalBusiness JSON-LD + OG image, persistent MF cache in MongoDB
- P2: Side-by-side fund compare (max 3), multi-language full landing toggle (EN/HI/Hinglish)
- P2: Real Google Places API integration to ingest live Google reviews (currently curated seed)

## Conventions
- All UI test IDs centralised in `/app/frontend/src/constants/testIds/index.js`
- All API calls via `/app/frontend/src/lib/api.js`
- All external links via `/app/frontend/src/lib/links.js`
- Currency formatting via `fmtINR` (₹ + Lakh/Crore)
- Bilingual tips via `/app/frontend/src/lib/recommendations.js`
