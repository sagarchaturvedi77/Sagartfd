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

    await db.web_leads.insert_one({
        "id": obj.id,
        "full_name": payload.full_name,
        "phone": payload.phone,
        "email": payload.email,
        "service": payload.service,
        "message": payload.message,
        "source": "contact_form",
        "converted": False,
        "created_at": obj.created_at,
    })

    return obj


# -------------- ROUTES: MF Data (proxy MFAPI.in with caching) --------------

# Curated top funds across categories
TOP_FUNDS = {
    "Large Cap": [
        {"code": "106235", "name": "Nippon India Large Cap Fund - Regular Growth"},
        {"code": "108466", "name": "ICICI Prudential Large Cap (Bluechip) Fund - Regular Growth"},
        {"code": "112277", "name": "Axis Large Cap Fund - Regular Growth"},
    ],
    "Mid Cap": [
        {"code": "127039", "name": "Motilal Oswal Midcap Fund - Regular Growth"},
        {"code": "105758", "name": "HDFC Mid Cap Fund - Regular Growth"},
        {"code": "101161", "name": "Nippon India Multi Cap Fund - Regular Growth"},
    ],
    "Small Cap": [
        {"code": "113177", "name": "Nippon India Small Cap Fund - Regular Growth"},
        {"code": "100177", "name": "Quant Small Cap Fund - Regular Growth"},
        {"code": "125350", "name": "Axis Small Cap Fund - Regular Growth"},
    ],
    "Flexi Cap": [
        {"code": "122640", "name": "Parag Parikh Flexi Cap Fund - Regular Growth"},
        {"code": "101762", "name": "HDFC Flexi Cap Fund - Regular Growth"},
        {"code": "109830", "name": "Quant Flexi Cap Fund - Regular Growth"},
    ],
    "ELSS (Tax Saver)": [
        {"code": "135784", "name": "Mirae Asset ELSS Tax Saver Fund - Regular Growth"},
        {"code": "100175", "name": "Quant ELSS Tax Saver Fund - Regular Growth"},
        {"code": "112323", "name": "Axis ELSS Tax Saver Fund - Regular Growth"},
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
        for attempt in range(3):
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
                if attempt == 2:
                    logger.warning(f"Failed fetch {fund['code']}: {e}")
                    return None
                await asyncio.sleep(0.4 * (attempt + 1))

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

SAGAR_SYSTEM_PROMPT = """
You are TFD-AI, the official AI assistant for The Financial Doctor and Sagar Chaturvedi.

Business rules:
- Speak only about The Financial Doctor, Sagar Chaturvedi, and the user's financial planning needs.
- Do not recommend, promote, compare, or name other advisory businesses, distributors, brokers, agencies, or competitor brands.
- Answer in the user's language: Hindi, English, or Hinglish.
- Cover mutual funds, SIP, STP, SWP, ELSS, PPF, NPS, tax planning, insurance, emergency fund, goal planning, retirement planning, and general finance questions.
- Ask clarifying questions when age, income, dependents, risk profile, time horizon, tax regime, or goal amount is missing.
- If the question is unrelated, politely refuse and bring the user back to finance, tax, insurance, or planning.

Compliance rules:
- Keep answers educational.
- Do not promise guaranteed returns.
- Do not give stock buy/sell/hold calls.
- Do not recommend specific mutual fund schemes unless approved data is provided.
- For tax, explain general rules and ask user to confirm with a qualified tax professional.
- Never ask for PAN, Aadhaar, OTP, card details, bank password, or full account number.
- Always add a short risk/disclaimer line for investment or insurance answers.

For onboarding or actual investing, direct users to:
https://www.assetplus.in/mfd/ARN-290298
or WhatsApp Sagar ji at +91 77738 05794.

You speak as TFD-AI, not as Sagar ji himself.
"""


class AIChatRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=1, max_length=2000)
    assistant_profile: Optional[str] = None


@api_router.post("/ai/chat")
async def ai_chat(payload: AIChatRequest):
    gemini_key = os.environ.get("GEMINI_API_KEY")

    if not gemini_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    full_response_chunks: list[str] = []

    async def event_gen():
        try:
            async with httpx.AsyncClient(timeout=60.0) as cli:
                response = await cli.post(
                    "https://generativelanguage.googleapis.com/v1beta/interactions",
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": gemini_key,
                    },
                    json={
                        "model": os.environ.get("GEMINI_MODEL", "gemini-3.5-flash"),
                        "system_instruction": SAGAR_SYSTEM_PROMPT,
                        "input": payload.message,
                        "generation_config": {
                            "temperature": 0.4,
                            "thinking_level": "low",
                        },
                    },
                )

            if response.status_code != 200:
                logger.warning(f"Gemini error: {response.text}")
                msg = "Sorry, abhi AI service connect nahi ho pa rahi hai. Thoda baad try karein ya Sagar ji se direct baat karein."
                full_response_chunks.append(msg)
                yield _sse(msg)
                yield "event: done\ndata: [DONE]\n\n"
                return

            data = response.json()
            answer = data.get("output_text") or "Sorry, main abhi answer generate nahi kar pa raha hoon."

            full_response_chunks.append(answer)
            yield _sse(answer)
            yield "event: done\ndata: [DONE]\n\n"

        except Exception as exc:
            logger.exception("AI chat stream error")
            msg = "Sorry, abhi technical issue aa gaya hai. Kripya thoda baad try karein."
            full_response_chunks.append(msg)
            yield _sse(msg)
            yield "event: done\ndata: [DONE]\n\n"

        finally:
            full_text = "".join(full_response_chunks)
            now = datetime.now(timezone.utc).isoformat()

            await db.ai_sessions.update_one(
                {"session_id": payload.session_id},
                {
                    "$setOnInsert": {
                        "session_id": payload.session_id,
                        "created_at": now,
                    },
                    "$push": {
                        "messages": {
                            "$each": [
                                {
                                    "role": "user",
                                    "content": payload.message,
                                    "ts": now,
                                },
                                {
                                    "role": "assistant",
                                    "content": full_text,
                                    "ts": now,
                                },
                            ]
                        }
                    },
                },
                upsert=True,
            )

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
    lines = str(text).replace("\r", "").split("\n")
    return "".join(f"data: {line}\n" for line in lines) + "\n"


@api_router.get("/ai/history/{session_id}")
async def ai_history(session_id: str):
    doc = await db.ai_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        return {"session_id": session_id, "messages": []}
    return doc
    # -------------- mount router --------------

app.include_router(api_router)

from auth_routes import router as auth_router
app.include_router(auth_router)

from attendance_routes import router as attendance_router
app.include_router(attendance_router)

from target_routes import router as target_router
app.include_router(target_router)

from notification_routes import router as notification_router
app.include_router(notification_router)

from analytics_routes import router as analytics_router
app.include_router(analytics_router)

from lead_routes import router as lead_router
app.include_router(lead_router)

from salary_routes import router as salary_router
app.include_router(salary_router)

from task_routes import router as task_router
app.include_router(task_router)

from onboarding_routes import router as onboarding_router
app.include_router(onboarding_router)

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


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
