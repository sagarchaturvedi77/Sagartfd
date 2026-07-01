"""Notification helpers: store in-app notifications and (optionally) send web push.

Web push is only attempted when VAPID keys are configured via env vars:
  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CLAIM_EMAIL (e.g. mailto:admin@...)
If they are missing or pywebpush isn't installed, push is silently skipped and
only the in-app notification is stored (so the bell icon still works everywhere).
"""
import os
import json
import logging

from notification_models import NotificationInDB
from database import notifications_collection, push_subscriptions_collection

logger = logging.getLogger(__name__)

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIM_EMAIL = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:admin@thefinancialdoctor.in")

try:
    from pywebpush import webpush, WebPushException
    _PUSH_AVAILABLE = True
except Exception:  # pragma: no cover - optional dependency
    _PUSH_AVAILABLE = False


def push_enabled() -> bool:
    return bool(_PUSH_AVAILABLE and VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY)


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
            # Subscription expired/invalid -> remove it
            if getattr(exc, "response", None) is not None and exc.response.status_code in (404, 410):
                await push_subscriptions_collection.delete_one({"_id": sub["_id"]})
        except Exception as exc:  # pragma: no cover
            logger.warning("Web push error for %s: %s", user_id, exc)


async def create_notification(
    user_id: str,
    title: str,
    body: str,
    n_type: str = "general",
    link: str | None = None,
) -> None:
    """Store an in-app notification and try to deliver a web push."""
    note = NotificationInDB(user_id=user_id, title=title, body=body, type=n_type, link=link)
    await notifications_collection.insert_one(note.dict())
    await _send_web_push(
        user_id,
        {"title": title, "body": body, "link": link or "/portal/employee"},
    )
