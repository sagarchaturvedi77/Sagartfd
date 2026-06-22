# The Financial Doctor — PRD

## Original Problem Statement
"Phase 4 build karo: 1) In-website Google review form with 5★ — saves to DB & shows live, 2) Live MF data via MFAPI.in (top funds, search, NAV, returns), 3) Calculator PNG snapshot download with TFD logo + Sagar ji photo + AssetPlus QR + ARN-290298 + contact (using html2canvas + qrcode.react), 4) Daily SIP Calculator (22 working days/month logic), 5) Content + design refresh."

## Brand & Personas
- **Brand:** The Financial Doctor (TFD), led by Sagar Chaturvedi — AMFI Registered MFD, ARN-290298, Sehore MP
- **Primary persona:** Salaried investor in Tier-2/3 MP (Sehore, Bhopal, Indore) starting SIPs
- **Secondary persona:** Existing investor seeking portfolio review / insurance bundle
- **Tertiary persona:** Aspiring sub-broker / MFD partner

## Tech Stack
- Frontend: React 19, React Router 7, TailwindCSS 3, Recharts, html2canvas, qrcode.react, lucide-react, sonner
- Backend: FastAPI (Python), Motor (MongoDB async), httpx (MFAPI proxy)
- Data: MongoDB (reviews, contact_requests), MFAPI.in (live NAV/returns)

## Architecture
- `/api/reviews` — POST/GET reviews, GET stats (avg + count)
- `/api/contact` — POST contact form
- `/api/mf/top-funds` — curated 15 funds × 5 categories with NAV + 1Y/3Y/5Y CAGR (1-hour cache)
- `/api/mf/search?q=` — search via MFAPI
- `/api/mf/{code}` — fund detail

## Implemented (2026-06-22 — Phase 4)
1. **Live Google-style review form (5★)** — saves to MongoDB and renders live on the Reviews section. Seed reviews shown until first user submission. Avg rating + count surfaced in card. Auto-approved (per user choice).
2. **Live MF data (MFAPI.in)** — backend caches MFAPI responses for 1 hour. Top Funds table grouped by Large/Mid/Small/Flexi/ELSS with NAV, NAV date, 1Y/3Y/5Y CAGR. Live search modal opens fund detail.
3. **Calculator PNG snapshot download** — html2canvas + qrcode.react. Snapshot includes: TFD brand mark, Sagar photo, AssetPlus QR (ARN-290298 link), contact (+91 77738 05794 · wecare@thefinancialdoctor.in), metrics, mini bar visualisation, AMFI disclosure footer.
4. **Daily SIP Calculator** — uses 22 working days/month convention. Shows effective monthly SIP equivalent.
5. **Content + design refresh** — full rebuild with cream / deep-emerald / ochre palette, Fraunces + Instrument Serif + DM Sans typography, asymmetric hero, marquee partner strip, multi-language education (English/हिंदी/Hinglish).

## Backlog (P1)
- Add admin moderation toggle for reviews
- Email notification on new contact_request via SendGrid/Resend
- Add OG image + structured data (LocalBusiness) for SEO
- Cache MF top-funds to MongoDB for cold-start performance

## Future / P2
- TFD-AI chat (Emergent LLM key) for goal-based fund suggestions
- Multi-language landing variants
- Compare mode for funds (side-by-side returns)

## Conventions
- All UI test IDs centralised in `/app/frontend/src/constants/testIds/index.js`
- All API calls via `/app/frontend/src/lib/api.js`
- Currency formatting via `fmtINR` (₹ + Lakh/Crore notation)
