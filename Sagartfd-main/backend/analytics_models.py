from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone


class PageView(BaseModel):
    page: str
    referrer: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    user_agent: Optional[str] = None
    ts: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class EventTrack(BaseModel):
    event: str        # "calculator_use", "proposal_generate", "contact_submit"
    label: Optional[str] = None   # e.g. "SIP Calculator", "Term Insurance"
    page: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    ts: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WebPushSubscriptionIn(BaseModel):
    endpoint: str
    keys: dict  # {"p256dh": "...", "auth": "..."}


class WebsiteBroadcastIn(BaseModel):
    title: str
    body: str
    url: Optional[str] = None   # link to open on click
