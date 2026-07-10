"""Computes real storage usage across MongoDB Atlas and Cloudflare R2, plus
manually-tracked figures for Render/Netlify (no billing API configured for
either, so those are admin-entered and marked "Estimated"). Caches the
result and fires an admin notification the moment a service crosses the
80% (warning) or 95% (critical) threshold — not on every check, only on
the transition, so it doesn't nag daily once already above a threshold.

Deliberately synchronous (pymongo + boto3), not async Motor — this is
shared by scheduler_worker.py (which is itself sync, see its module
docstring on why) and by the FastAPI "Refresh Now" route, which can afford
a blocking call for an admin-triggered, low-frequency action.
"""
import json
import logging
import os
import uuid
from datetime import datetime, timezone

from pymongo import MongoClient

from storage_r2 import r2_enabled, get_client as get_r2_client, R2_BUCKET_NAME

LOG = logging.getLogger("storage_status")

MONGO_URL = os.environ.get("MONGO_URL", "")
DB_NAME = os.environ.get("DB_NAME", "tfd_crm")
MONGO_FREE_TIER_LIMIT_MB = 512
R2_FREE_TIER_LIMIT_GB = 10.0

WARNING_PCT = 80
CRITICAL_PCT = 95

# Which human-facing category each Mongo collection's size rolls up into.
MONGO_CATEGORY_MAP = {
    "leads": "Leads",
    "users": "Employee & admin records",
    "employee_profiles": "Employee & admin records",
    "uploads": "Employee documents (metadata only — files are on R2)",
    "chat_messages": "Chat",
    "notifications": "Notifications",
    "attendance": "Attendance",
    "company_documents": "Company documents (metadata only — files are on R2)",
}

R2_PREFIX_CATEGORY_MAP = {
    "employee-uploads": "Employee documents (photos, Aadhaar, resumes, signatures)",
    "company-documents": "Company documents",
}

_sync_client = None


def _get_sync_db():
    global _sync_client
    if _sync_client is None:
        _sync_client = MongoClient(MONGO_URL)
    return _sync_client[DB_NAME]


def _tier_for(percent: float) -> str:
    if percent >= CRITICAL_PCT:
        return "critical"
    if percent >= WARNING_PCT:
        return "warning"
    return "ok"


def compute_mongo_stats(limit_mb: float = MONGO_FREE_TIER_LIMIT_MB) -> dict:
    db = _get_sync_db()
    stats = db.command("dbStats")
    used_mb = stats["dataSize"] / 1024 / 1024

    categories = {}
    for coll_name in db.list_collection_names():
        try:
            cstats = db.command("collStats", coll_name)
        except Exception:
            continue
        size_mb = cstats.get("size", 0) / 1024 / 1024
        if size_mb <= 0:
            continue
        category = MONGO_CATEGORY_MAP.get(coll_name, "Misc")
        categories[category] = categories.get(category, 0) + size_mb

    breakdown = sorted(
        ({"category": k, "size_mb": round(v, 3)} for k, v in categories.items()),
        key=lambda x: -x["size_mb"],
    )
    percent = round(used_mb / limit_mb * 100, 1) if limit_mb else 0
    return {
        "service": "mongodb", "label": "MongoDB Atlas",
        "used_mb": round(used_mb, 2), "limit_mb": limit_mb, "percent": percent,
        "live": True, "breakdown": list(breakdown),
    }


def compute_r2_stats(limit_gb: float = R2_FREE_TIER_LIMIT_GB) -> dict:
    limit_mb = limit_gb * 1024
    if not r2_enabled():
        return {"service": "r2", "label": "Cloudflare R2", "used_mb": 0, "limit_mb": limit_mb, "percent": 0, "live": False, "breakdown": []}

    s3 = get_r2_client()
    categories = {}
    total_bytes = 0
    token = None
    while True:
        kwargs = {"Bucket": R2_BUCKET_NAME}
        if token:
            kwargs["ContinuationToken"] = token
        resp = s3.list_objects_v2(**kwargs)
        for obj in resp.get("Contents", []):
            total_bytes += obj["Size"]
            prefix = obj["Key"].split("/")[0]
            category = R2_PREFIX_CATEGORY_MAP.get(prefix, "Misc")
            categories[category] = categories.get(category, 0) + obj["Size"]
        if resp.get("IsTruncated"):
            token = resp.get("NextContinuationToken")
        else:
            break

    used_mb = total_bytes / 1024 / 1024
    breakdown = sorted(
        ({"category": k, "size_mb": round(v / 1024 / 1024, 3)} for k, v in categories.items()),
        key=lambda x: -x["size_mb"],
    )
    percent = round(used_mb / limit_mb * 100, 1) if limit_mb else 0
    return {
        "service": "r2", "label": "Cloudflare R2",
        "used_mb": round(used_mb, 2), "limit_mb": limit_mb, "percent": percent,
        "live": True, "breakdown": list(breakdown),
    }


def compute_manual_stats(service: str, label: str, settings: dict) -> dict:
    """Render/Netlify (and MongoDB once upgraded past M0, if the admin
    records the new limit) — no billing API is wired up, so these figures
    come from whatever was last entered via the settings endpoint."""
    used = settings.get("used_mb") or 0
    limit = settings.get("limit_mb") or 0
    percent = round(used / limit * 100, 1) if limit else 0
    return {
        "service": service, "label": label,
        "used_mb": used, "limit_mb": limit, "percent": percent,
        "live": False,
        "account_email": settings.get("account_email"),
        "plan": settings.get("plan"),
        "breakdown": [],
    }


def _notify_admins_sync(title: str, body: str, link: str) -> None:
    """Same insert-directly-then-best-effort-push shape as
    scheduler_worker.send_push_to_user — this module is sync, so it can't
    call the async notification_service.create_notification directly."""
    db = _get_sync_db()
    users = db.get_collection("users")
    notifications = db.get_collection("notifications")
    push_subscriptions = db.get_collection("push_subscriptions")

    try:
        from pywebpush import webpush
        push_ok = True
    except Exception:
        push_ok = False
    vapid_private_key = os.environ.get("VAPID_PRIVATE_KEY", "")
    vapid_claim_email = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:admin@thefinancialdoctor.in")

    for admin in users.find({"role": "admin"}):
        notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": admin["id"], "title": title, "body": body,
            "type": "storage_warning", "link": link, "read": False,
            "created_at": datetime.utcnow(),
        })
        if push_ok and vapid_private_key:
            for sub in push_subscriptions.find({"user_id": admin["id"]}):
                try:
                    webpush(
                        subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                        data=json.dumps({"title": title, "body": body, "url": link}),
                        vapid_private_key=vapid_private_key,
                        vapid_claims={"sub": vapid_claim_email},
                    )
                except Exception as e:
                    LOG.warning("Storage warning push failed for %s: %s", admin["id"], e)


def refresh_storage_status() -> dict:
    """Recomputes every service, caches the snapshot, and fires a
    notification for any service whose tier just got worse since the last
    cached snapshot."""
    db = _get_sync_db()
    settings_coll = db.get_collection("storage_settings")
    cache_coll = db.get_collection("storage_cache")

    prior = cache_coll.find_one({"_id": "latest"}) or {}
    prior_tiers = prior.get("tiers", {})

    render_settings = settings_coll.find_one({"_id": "render"}) or {}
    netlify_settings = settings_coll.find_one({"_id": "netlify"}) or {}
    mongo_override = settings_coll.find_one({"_id": "mongodb"}) or {}

    mongo = compute_mongo_stats(mongo_override.get("limit_mb") or MONGO_FREE_TIER_LIMIT_MB)
    r2 = compute_r2_stats()
    render = compute_manual_stats("render", "Render", render_settings)
    netlify = compute_manual_stats("netlify", "Netlify", netlify_settings)

    services = {"mongodb": mongo, "r2": r2, "render": render, "netlify": netlify}
    tiers = {}
    for key, svc in services.items():
        tier = _tier_for(svc["percent"])
        tiers[key] = tier
        prior_tier = prior_tiers.get(key, "ok")
        tier_rank = {"ok": 0, "warning": 1, "critical": 2}
        if tier_rank[tier] > tier_rank.get(prior_tier, 0):
            if tier == "critical":
                _notify_admins_sync(
                    f"⚠️ {svc['label']} storage at {svc['percent']}%",
                    f"{svc['label']} is critically close to its limit ({svc['used_mb']:.0f} MB of {svc['limit_mb']:.0f} MB). Upgrade soon to avoid disruption.",
                    "/portal/admin/storage",
                )
            elif tier == "warning":
                _notify_admins_sync(
                    f"{svc['label']} storage at {svc['percent']}%",
                    f"{svc['label']} has crossed 80% usage ({svc['used_mb']:.0f} MB of {svc['limit_mb']:.0f} MB). Worth keeping an eye on.",
                    "/portal/admin/storage",
                )

    snapshot = {
        "_id": "latest",
        "services": services,
        "tiers": tiers,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    cache_coll.update_one({"_id": "latest"}, {"$set": snapshot}, upsert=True)
    return snapshot
