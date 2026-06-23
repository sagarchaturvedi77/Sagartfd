from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
import asyncio
import time
import httpx
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="The Financial Doctor API")
api_router = APIRouter(prefix="/api")

# -------------- MODELS --------------

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: Optional[str] = "Sehore"
    rating: int = Field(ge=1, le=5)
    message: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    approved: bool = True  # auto-approved per user choice


class ReviewCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    location: Optional[str] = Field(default="Sehore", max_length=80)
    rating: int = Field(ge=1, le=5)
    message: str = Field(min_length=10, max_length=600)


class ContactRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    phone: str
    email: Optional[str] = None
    service: Optional[str] = None
    message: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ContactCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=8, max_length=15)
    email: Optional[str] = None
    service: Optional[str] = None
    message: Optional[str] = None


# -------------- ROUTES: meta --------------

@api_router.get("/")
async def root():
    return {"app": "The Financial Doctor", "status": "ok"}


# -------------- ROUTES: Reviews --------------

@api_router.post("/reviews", response_model=Review)
async def create_review(payload: ReviewCreate):
    review = Review(**payload.model_dump())
    await db.reviews.insert_one(review.model_dump())
    return review


@api_router.get("/reviews", response_model=List[Review])
async def list_reviews(limit: int = 50):
    items = await db.reviews.find({"approved": True}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return items


@api_router.get("/reviews/stats")
async def reviews_stats():
    pipeline = [
        {"$match": {"approved": True}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    cursor = db.reviews.aggregate(pipeline)
    docs = await cursor.to_list(1)
    if not docs:
        return {"average": 0, "count": 0}
    return {"average": round(docs[0]["avg"], 2), "count": docs[0]["count"]}


# -------------- ROUTES: Contact --------------

@api_router.post("/contact", response_model=ContactRequest)
async def create_contact(payload: ContactCreate):
    obj = ContactRequest(**payload.model_dump())
    await db.contact_requests.insert_one(obj.model_dump())
    return obj


# -------------- ROUTES: MF Data (proxy MFAPI.in with caching) --------------

# Curated top funds across categories
TOP_FUNDS = {
    "Large Cap": [
        {"code": "118632", "name": "Nippon India Large Cap Fund - Direct Growth"},
        {"code": "120586", "name": "ICICI Prudential Large Cap (Bluechip) Fund - Direct Growth"},
        {"code": "120465", "name": "Axis Large Cap Fund - Direct Growth"},
    ],
    "Mid Cap": [
        {"code": "127042", "name": "Motilal Oswal Midcap Fund - Direct Growth"},
        {"code": "118989", "name": "HDFC Mid Cap Fund - Direct Growth"},
        {"code": "118650", "name": "Nippon India Multi Cap Fund - Direct Growth"},
    ],
    "Small Cap": [
        {"code": "118778", "name": "Nippon India Small Cap Fund - Direct Growth"},
        {"code": "120828", "name": "Quant Small Cap Fund - Direct Growth"},
        {"code": "125354", "name": "Axis Small Cap Fund - Direct Growth"},
    ],
    "Flexi Cap": [
        {"code": "122639", "name": "Parag Parikh Flexi Cap Fund - Direct Growth"},
        {"code": "118955", "name": "HDFC Flexi Cap Fund - Direct Growth"},
        {"code": "120843", "name": "Quant Flexi Cap Fund - Direct Growth"},
    ],
    "ELSS (Tax Saver)": [
        {"code": "135781", "name": "Mirae Asset ELSS Tax Saver Fund - Direct Growth"},
        {"code": "120847", "name": "Quant ELSS Tax Saver Fund - Direct Growth"},
        {"code": "120503", "name": "Axis ELSS Tax Saver Fund - Direct Growth"},
    ],
}

_cache: dict = {}
_CACHE_TTL = 60 * 60  # 1 hour


def _annualised_return(navs: list[dict], years: float) -> Optional[float]:
    """navs: list newest first with date dd-mm-yyyy and nav string."""
    if not navs:
        return None
    try:
        current_nav = float(navs[0]["nav"])
        current_date = datetime.strptime(navs[0]["date"], "%d-%m-%Y")
        # find closest historical nav
        best = None
        for entry in navs:
            d = datetime.strptime(entry["date"], "%d-%m-%Y")
            delta_years = (current_date - d).days / 365.25
            if delta_years >= years:
                best = entry
                break
        if not best:
            return None
        old_nav = float(best["nav"])
        if old_nav <= 0:
            return None
        if years >= 1:
            cagr = ((current_nav / old_nav) ** (1 / years) - 1) * 100
        else:
            cagr = ((current_nav / old_nav) - 1) * 100
        return round(cagr, 2)
    except Exception:
        return None


async def fetch_fund(code: str) -> dict:
    cache_key = f"mf:{code}"
    now = time.time()
    cached = _cache.get(cache_key)
    if cached and now - cached["ts"] < _CACHE_TTL:
        return cached["data"]
    async with httpx.AsyncClient(timeout=15.0) as cli:
        r = await cli.get(f"https://api.mfapi.in/mf/{code}")
        r.raise_for_status()
        data = r.json()
    _cache[cache_key] = {"ts": now, "data": data}
    return data


@api_router.get("/mf/top-funds")
async def top_funds():
    """Return curated top funds across categories with latest NAV and returns."""
    out = []
    async def _build(category: str, fund: dict):
        try:
            data = await fetch_fund(fund["code"])
            meta = data.get("meta", {})
            navs = data.get("data", [])
            latest = navs[0] if navs else {}
            return {
                "code": fund["code"],
                "name": meta.get("scheme_name", fund["name"]),
                "fund_house": meta.get("fund_house", ""),
                "category": category,
                "nav": latest.get("nav"),
                "nav_date": latest.get("date"),
                "return_1y": _annualised_return(navs, 1),
                "return_3y": _annualised_return(navs, 3),
                "return_5y": _annualised_return(navs, 5),
            }
        except Exception as e:
            logger.warning(f"Failed fetch {fund['code']}: {e}")
            return None

    tasks = []
    for cat, funds in TOP_FUNDS.items():
        for f in funds:
            tasks.append(_build(cat, f))
    results = await asyncio.gather(*tasks)
    out = [r for r in results if r]
    return {"categories": list(TOP_FUNDS.keys()), "funds": out}


@api_router.get("/mf/search")
async def search_funds(q: str = Query(min_length=2)):
    """Search funds by name via MFAPI."""
    cache_key = f"search:{q.lower()}"
    now = time.time()
    cached = _cache.get(cache_key)
    if cached and now - cached["ts"] < _CACHE_TTL:
        return cached["data"]
    async with httpx.AsyncClient(timeout=15.0) as cli:
        r = await cli.get(f"https://api.mfapi.in/mf/search?q={q}")
        r.raise_for_status()
        results = r.json()
    # limit to 25
    out = results[:25] if isinstance(results, list) else []
    _cache[cache_key] = {"ts": now, "data": out}
    return out


@api_router.get("/mf/{code}")
async def fund_detail(code: str):
    try:
        data = await fetch_fund(code)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Fund not found: {e}")
    meta = data.get("meta", {})
    navs = data.get("data", [])
    latest = navs[0] if navs else {}
    return {
        "code": code,
        "name": meta.get("scheme_name"),
        "fund_house": meta.get("fund_house"),
        "scheme_type": meta.get("scheme_type"),
        "scheme_category": meta.get("scheme_category"),
        "nav": latest.get("nav"),
        "nav_date": latest.get("date"),
        "return_1y": _annualised_return(navs, 1),
        "return_3y": _annualised_return(navs, 3),
        "return_5y": _annualised_return(navs, 5),
        "history": navs[:60],  # last ~60 days
    }


# -------------- ROUTES: AI Chat (Sagar ji persona) --------------

SAGAR_SYSTEM_PROMPT = """You are 'TFD-AI' — a friendly mutual fund & insurance advisor speaking on behalf of **Sagar Chaturvedi**, founder of **The Financial Doctor** (AMFI Registered MFD · ARN-290298 · Sehore, MP).

Personality:
- Warm, simple, and respectful. Use Hindi-English mix (Hinglish) when natural, otherwise English. Match the user's language.
- Address users politely (ji, aap). Never be pushy.
- Always be educational first, recommendation second.

Topics you cover:
- Mutual Funds: SIP, lumpsum, SWP, ELSS, large/mid/small/flexi cap, debt, hybrid
- Insurance: term, health, life (endowment/ULIP), motor
- Tax-saving (ELSS, 80C), goal-based planning (retirement, child education, home)
- Basic personal finance hygiene (emergency fund, insurance before investment)

Hard rules:
- ALWAYS end recommendations with: "Mutual fund investments are subject to market risks. Read all scheme-related documents carefully."
- NEVER promise specific returns. Use ranges or historical CAGR with a "past performance is not indicative of future returns" caveat.
- NEVER share PAN/Aadhaar/OTP requests. If user shares sensitive info, politely tell them not to.
- Do NOT recommend direct stock picks or speculative products (F&O, crypto).
- For onboarding / actual investing, direct them to AssetPlus: https://www.assetplus.in/mfd/ARN-290298 or WhatsApp Sagar ji at +91 77738 05794.
- Keep responses concise (3-6 short paragraphs max). Use markdown sparingly (bullets for lists).
- If asked about specific NAVs or live returns, mention the user can check the "Top Funds" section on this website.
- If user is in distress / asks anything off-topic (politics, gossip), politely redirect to finance.

Sign-off: When user says thanks/bye, sign off as: "— TFD-AI 💚 (on behalf of Sagar ji)"

You speak as TFD-AI, not as Sagar ji himself. You can quote Sagar ji's advice but always clarify you are the AI assistant trained on his approach.
"""


class AIChatRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=1, max_length=2000)


@api_router.post("/ai/chat")
async def ai_chat(payload: AIChatRequest):
    """Streaming SSE endpoint for TFD-AI chatbot using Claude Sonnet 4.6."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"emergentintegrations missing: {e}")

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    # Load existing history for this session
    history_doc = await db.ai_sessions.find_one({"session_id": payload.session_id}, {"_id": 0})
    chat = LlmChat(
        api_key=api_key,
        session_id=payload.session_id,
        system_message=SAGAR_SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-6")

    # Rehydrate history into the chat instance (library maintains its own list internally)
    # The library will append new messages to its in-memory history per session, so we
    # store each turn ourselves and pass prior turns in via the system message context if needed.
    # For our scope, we keep history in MongoDB and stream tokens out.

    full_response_chunks: list[str] = []

    async def event_gen():
        try:
            async for ev in chat.stream_message(UserMessage(text=payload.message)):
                if isinstance(ev, TextDelta):
                    full_response_chunks.append(ev.content)
                    # SSE-style data line
                    yield f"data: {ev.content}\n\n".replace("\n\n", "\n\n", 1) if False else _sse(ev.content)
                elif isinstance(ev, StreamDone):
                    break
        except Exception as exc:
            logger.exception("AI chat stream error")
            yield _sse(f"\n\n[error: {exc}]")
        finally:
            # Persist the turn
            full_text = "".join(full_response_chunks)
            now = datetime.now(timezone.utc).isoformat()
            await db.ai_sessions.update_one(
                {"session_id": payload.session_id},
                {
                    "$setOnInsert": {"session_id": payload.session_id, "created_at": now},
                    "$push": {
                        "messages": {
                            "$each": [
                                {"role": "user", "content": payload.message, "ts": now},
                                {"role": "assistant", "content": full_text, "ts": now},
                            ]
                        }
                    },
                },
                upsert=True,
            )
            yield "event: done\ndata: [DONE]\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


def _sse(text: str) -> str:
    # Encode preserving newlines using base64-free format: split on \n into multiple data: lines
    lines = text.split("\n")
    return "".join(f"data: {line}\n" for line in lines) + "\n"


@api_router.get("/ai/history/{session_id}")
async def ai_history(session_id: str):
    doc = await db.ai_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        return {"session_id": session_id, "messages": []}
    return doc


# -------------- mount router --------------

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
