from fastapi import APIRouter, HTTPException, Depends

from notification_models import (
    NotificationOut,
    BroadcastIn,
    PushSubscriptionIn,
)
from notification_service import create_notification, push_enabled, VAPID_PUBLIC_KEY
from auth_utils import get_current_user_payload, require_admin
from database import (
    notifications_collection,
    push_subscriptions_collection,
    users_collection,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def to_notification_out(doc: dict) -> NotificationOut:
    return NotificationOut(**{k: doc.get(k) for k in NotificationOut.model_fields})


@router.get("/", response_model=list[NotificationOut])
async def list_notifications(payload: dict = Depends(get_current_user_payload)):
    """Current user's notifications, newest first (latest 50)."""
    cursor = (
        notifications_collection.find({"user_id": payload["sub"]})
        .sort("created_at", -1)
        .limit(50)
    )
    return [to_notification_out(doc) async for doc in cursor]


@router.get("/unread-count")
async def unread_count(payload: dict = Depends(get_current_user_payload)):
    count = await notifications_collection.count_documents(
        {"user_id": payload["sub"], "read": False}
    )
    return {"unread": count}


@router.post("/mark-read/{notification_id}")
async def mark_read(notification_id: str, payload: dict = Depends(get_current_user_payload)):
    await notifications_collection.update_one(
        {"id": notification_id, "user_id": payload["sub"]},
        {"$set": {"read": True}},
    )
    return {"status": "ok"}


@router.post("/mark-all-read")
async def mark_all_read(payload: dict = Depends(get_current_user_payload)):
    await notifications_collection.update_many(
        {"user_id": payload["sub"], "read": False},
        {"$set": {"read": True}},
    )
    return {"status": "ok"}


@router.post("/broadcast")
async def broadcast(data: BroadcastIn, admin: dict = Depends(require_admin)):
    """ADMIN ONLY — send an announcement / holiday / update to employees."""
    if data.employee_ids:
        targets = data.employee_ids
    else:
        targets = [doc["id"] async for doc in users_collection.find({"role": "employee"})]

    for uid in targets:
        await create_notification(
            user_id=uid,
            title=data.title,
            body=data.body,
            n_type=data.type,
            link="/portal/employee",
        )
    return {"status": "sent", "recipients": len(targets)}


@router.get("/vapid-public-key")
async def vapid_public_key():
    """Public key the browser needs to subscribe to web push. Empty if push disabled."""
    return {"key": VAPID_PUBLIC_KEY, "enabled": push_enabled()}


@router.post("/subscribe")
async def subscribe(sub: PushSubscriptionIn, payload: dict = Depends(get_current_user_payload)):
    """Save (or refresh) this device's web-push subscription for the current user."""
    await push_subscriptions_collection.update_one(
        {"endpoint": sub.endpoint},
        {"$set": {"user_id": payload["sub"], "endpoint": sub.endpoint, "keys": sub.keys}},
        upsert=True,
    )
    return {"status": "subscribed"}


@router.post("/unsubscribe")
async def unsubscribe(sub: PushSubscriptionIn, payload: dict = Depends(get_current_user_payload)):
    await push_subscriptions_collection.delete_one(
        {"endpoint": sub.endpoint, "user_id": payload["sub"]}
    )
    return {"status": "unsubscribed"}
