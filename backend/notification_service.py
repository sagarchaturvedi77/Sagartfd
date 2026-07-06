"""Notification helpers: store in-app notifications and send via Firebase Cloud Messaging.

All notifications go through Firebase FCM. Falls back to web push (VAPID) if FCM
is not configured.
"""
import os
import json
import logging

from notification_models import NotificationInDB
from database import notifications_collection, push_subscriptions_collection, fcm_tokens_collection

logger = logging.getLogger(__name__)

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIM_EMAIL = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:admin@thefinancialdoctor.in")

try:
    from pywebpush import webpush, WebPushException
    _PUSH_AVAILABLE = True
except Exception:
    _PUSH_AVAILABLE = False

# Firebase messaging
try:
    from init_firebase import init_firebase_from_env
    _fb = init_firebase_from_env()
    if _fb:
        from firebase_admin import messaging as fcm_messaging
        _FCM_AVAILABLE = True
    else:
        _FCM_AVAILABLE = False
        fcm_messaging = None
except Exception:
    _FCM_AVAILABLE = False
    fcm_messaging = None


def push_enabled() -> bool:
    return bool(_PUSH_AVAILABLE and VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY)


async def _send_fcm(user_id: str, title: str, body: str, link: str | None = None) -> None:
    """Send push notification via Firebase Cloud Messaging."""
    if not _FCM_AVAILABLE or not fcm_messaging:
        return
    cursor = fcm_tokens_collection.find({"user_id": user_id})
    async for doc in cursor:
        token = doc.get("token")
        if not token:
            continue
        try:
            message = fcm_messaging.Message(
                notification=fcm_messaging.Notification(title=title, body=body),
                data={"link": link or "/portal/employee", "title": title, "body": body},
                token=token,
            )
            fcm_messaging.send(message)
        except Exception as exc:
            logger.warning("FCM send failed for %s: %s", user_id, exc)
            # Remove invalid tokens
            if "NOT_FOUND" in str(exc) or "INVALID_ARGUMENT" in str(exc):
                await fcm_tokens_collection.delete_one({"_id": doc["_id"]})


async def _send_web_push(user_id: str, payload: dict) -> None:
    if not push_enabled():
        return
    cursor = push_subscriptions_collection.find({"user_id": user_id})
    async for sub in cursor:
        try:
            webpush(
                subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                data=json.dumps(payload),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_CLAIM_EMAIL},
            )
        except WebPushException as exc:
            logger.warning("Web push failed for %s: %s", user_id, exc)
            if getattr(exc, "response", None) is not None and exc.response.status_code in (404, 410):
                await push_subscriptions_collection.delete_one({"_id": sub["_id"]})
        except Exception as exc:
            logger.warning("Web push error for %s: %s", user_id, exc)


async def create_notification(
    user_id: str,
    title: str,
    body: str,
    n_type: str = "general",
    link: str | None = None,
) -> None:
    """Store an in-app notification and send via FCM + fallback web push."""
    note = NotificationInDB(user_id=user_id, title=title, body=body, type=n_type, link=link)
    await notifications_collection.insert_one(note.dict())
    # Try FCM first (Firebase Cloud Messaging)
    await _send_fcm(user_id, title, body, link)
    # Fallback to VAPID web push
    await _send_web_push(
        user_id,
        {"title": title, "body": body, "link": link or "/portal/employee"},
    )
