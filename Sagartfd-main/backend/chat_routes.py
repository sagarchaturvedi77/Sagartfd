"""Team Chat — Admin & Employee can send messages to each other.
Each message belongs to a "room" (currently "general" global room,
or "dm:{user_id1}_{user_id2}" for direct messages in future).
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from auth_utils import get_current_user_payload
from database import chat_collection, users_collection

router = APIRouter(prefix="/api/chat", tags=["chat"])


class MessageCreate(BaseModel):
    text: str
    room: str = "general"           # "general" | "dm:uid1_uid2"
    reply_to: Optional[str] = None  # message id being replied to


@router.post("/")
async def send_message(data: MessageCreate, user=Depends(get_current_user_payload)):
    user_doc = await users_collection.find_one({"id": user["sub"]})
    msg = {
        "id": str(uuid.uuid4()),
        "room": data.room,
        "text": data.text.strip(),
        "reply_to": data.reply_to,
        "sender_id": user["sub"],
        "sender_name": user_doc.get("name", "Unknown") if user_doc else "Unknown",
        "sender_role": user.get("role", "employee"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await chat_collection.insert_one(msg)
    msg.pop("_id", None)
    return msg


@router.get("/")
async def get_messages(
    room: str = Query("general"),
    limit: int = Query(50, le=200),
    user=Depends(get_current_user_payload),
):
    cursor = chat_collection.find({"room": room}, {"_id": 0}).sort("created_at", -1).limit(limit)
    msgs = await cursor.to_list(limit)
    return list(reversed(msgs))  # oldest first for display


@router.delete("/{message_id}")
async def delete_message(message_id: str, user=Depends(get_current_user_payload)):
    # Only the sender or admin can delete
    msg = await chat_collection.find_one({"id": message_id})
    if not msg:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Message not found")
    if msg["sender_id"] != user["sub"] and user.get("role") != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not allowed")
    await chat_collection.delete_one({"id": message_id})
    return {"status": "deleted"}
