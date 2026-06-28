from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class NotificationInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str                           # recipient employee/admin id
    title: str
    body: str
    type: str = "general"                  # general / announcement / holiday / lead / task / target
    link: Optional[str] = None             # in-app route to open
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class NotificationOut(BaseModel):
    id: str
    title: str
    body: str
    type: str
    link: Optional[str] = None
    read: bool
    created_at: datetime


class BroadcastIn(BaseModel):
    """Admin sends an announcement/holiday/update to employees."""
    title: str
    body: str
    type: str = "announcement"
    employee_ids: Optional[list[str]] = None   # None = all employees


class PushSubscriptionIn(BaseModel):
    endpoint: str
    keys: dict                              # {"p256dh": "...", "auth": "..."}
