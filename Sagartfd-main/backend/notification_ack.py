from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime

from auth_utils import get_current_user_payload
from database import reminders_collection

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class AckIn(BaseModel):
    type: str = "punch_out"

@router.post("/ack")
async def ack_notification(data: AckIn, user=Depends(get_current_user_payload)):
    """User acknowledged the reminder notification (e.g., clicked it). Create an hourly reminder record until punch_out."""
    remind = {
        "user_id": user["sub"],
        "type": data.type,
        "active": True,
        "next_send_at": datetime.utcnow(),
        "interval_minutes": 60,
        "meta": {},
        "created_at": datetime.utcnow(),
    }
    await reminders_collection.update_one({"user_id": user["sub"], "type": data.type}, {"$set": remind}, upsert=True)
    return {"ok": True}
