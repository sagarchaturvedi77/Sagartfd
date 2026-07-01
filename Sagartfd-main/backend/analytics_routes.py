"""Website analytics tracking + public push notification endpoints.

Public endpoints (no auth):
  POST /api/analytics/pageview     — record a page view
  POST /api/analytics/event        — record an event (calculator use, proposal, etc.)
  POST /api/analytics/web-push/subscribe   — subscribe a website visitor to push
  POST /api/analytics/web-push/unsubscribe — remove subscription
  GET  /api/analytics/vapid-public-key     — VAPID key for the browser

Admin-only:
  GET  /api/analytics/summary      — dashboard stats
  POST /api/analytics/web-push/broadcast — send notification to all website subscribers
"""

import json
import logging
import os
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, Request

from analytics_models import PageView, EventTrack, WebPushSubscriptionIn, WebsiteBroadcastIn
from auth_utils import require_admin
from database import page_views_collection, events_collection, web_push_collection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIM_EMAIL = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:admin@thefinancialdoctor.in")

try:
    from pywebpush import webpush, WebPushException
    _PUSH_OK = True
except Exception:
    _PUSH_OK = False


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return ""


# ── public tracking ───────────────────────────────────────────────

@router.post("/pageview")
async def record_pageview(pv: PageView, request: Request):
    doc = pv.model_dump()
    doc["ip"] = _client_ip(request)
    await page_views_collection.insert_one(doc)
    return {"status": "ok"}


@router.post("/event")
async def record_event(ev: EventTrack, request: Request):
    doc = ev.model_dump()
    doc["ip"] = _client_ip(request)
    await events_collection.insert_one(doc)
    return {"status": "ok"}


# ── public push subscribe ────────────────────────────────────────

@router.get("/vapid-public-key")
async def vapid_key():
    return {"key": VAPID_PUBLIC_KEY, "enabled": bool(_PUSH_OK and VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY)}


@router.post("/web-push/subscribe")
async def web_push_subscribe(sub: WebPushSubscriptionIn):
    await web_push_collection.update_one(
        {"endpoint": sub.endpoint},
        {"$set": {"endpoint": sub.endpoint, "keys": sub.keys, "subscribed_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"status": "subscribed"}


@router.post("/web-push/unsubscribe")
async def web_push_unsubscribe(sub: WebPushSubscriptionIn):
    await web_push_collection.delete_one({"endpoint": sub.endpoint})
    return {"status": "unsubscribed"}


# ── admin: broadcast to website visitors ─────────────────────────

@router.post("/web-push/broadcast")
async def web_push_broadcast(data: WebsiteBroadcastIn, _admin: dict = Depends(require_admin)):
    if not (_PUSH_OK and VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY):
        return {"status": "push_not_configured", "sent": 0}

    payload = json.dumps({"title": data.title, "body": data.body, "url": data.url or "/"})
    sent = 0
    stale = []
    async for sub in web_push_collection.find():
        try:
            webpush(
                subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_CLAIM_EMAIL},
            )
            sent += 1
        except Exception as exc:
            resp = getattr(exc, "response", None)
            if resp is not None and resp.status_code in (404, 410):
                stale.append(sub["_id"])
            else:
                logger.warning("Website push error: %s", exc)

    if stale:
        await web_push_collection.delete_many({"_id": {"$in": stale}})

    return {"status": "sent", "sent": sent, "stale_removed": len(stale)}


# ── admin: analytics summary ─────────────────────────────────────

@router.get("/summary")
async def analytics_summary(_admin: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    total_visitors = await page_views_collection.estimated_document_count()
    today_visitors = await page_views_collection.count_documents({"ts": {"$gte": today_start}})

    # event breakdown
    calc_total = await events_collection.count_documents({"event": "calculator_use"})
    calc_today = await events_collection.count_documents({"event": "calculator_use", "ts": {"$gte": today_start}})
    proposal_total = await events_collection.count_documents({"event": "proposal_generate"})
    proposal_today = await events_collection.count_documents({"event": "proposal_generate", "ts": {"$gte": today_start}})

    # most used calculator
    calc_pipeline = [
        {"$match": {"event": "calculator_use"}},
        {"$group": {"_id": "$label", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_calcs = []
    async for doc in events_collection.aggregate(calc_pipeline):
        top_calcs.append({"name": doc["_id"] or "Unknown", "count": doc["count"]})

    # city-wise visitors (top 10)
    city_pipeline = [
        {"$match": {"city": {"$ne": None, "$exists": True}}},
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_cities = []
    async for doc in page_views_collection.aggregate(city_pipeline):
        top_cities.append({"city": doc["_id"] or "Unknown", "count": doc["count"]})

    # last 7 days daily visitors
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    daily_pipeline = [
        {"$match": {"ts": {"$gte": seven_days_ago}}},
        {"$addFields": {"day": {"$substr": ["$ts", 0, 10]}}},
        {"$group": {"_id": "$day", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    daily_visitors = []
    async for doc in page_views_collection.aggregate(daily_pipeline):
        daily_visitors.append({"date": doc["_id"], "count": doc["count"]})

    # top pages
    page_pipeline = [
        {"$group": {"_id": "$page", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_pages = []
    async for doc in page_views_collection.aggregate(page_pipeline):
        top_pages.append({"page": doc["_id"] or "/", "count": doc["count"]})

    # push subscribers count
    push_subs = await web_push_collection.estimated_document_count()

    return {
        "total_visitors": total_visitors,
        "today_visitors": today_visitors,
        "calculator_uses": {"total": calc_total, "today": calc_today},
        "proposals_generated": {"total": proposal_total, "today": proposal_today},
        "top_calculators": top_calcs,
        "top_cities": top_cities,
        "daily_visitors": daily_visitors,
        "top_pages": top_pages,
        "push_subscribers": push_subs,
    }
