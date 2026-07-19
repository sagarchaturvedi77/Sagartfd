"""TFD Connect — a fictional, WhatsApp-styled chat where interns practice
live client conversations (lead conversion / objection handling) against
entirely fictional AI-played contacts. See internship_connect_routes.py."""

from typing import Literal, Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

ConnectSender = Literal["student", "client"]
ConnectStatus = Literal["new", "in_progress", "converted", "lost"]
ConnectSentiment = Literal["positive", "neutral", "negative"]


class ConnectContact(BaseModel):
    id: str
    name: str
    role: str
    temperament: str


class ConnectMessage(BaseModel):
    sender: ConnectSender
    text: str
    sentiment: Optional[ConnectSentiment] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ConnectSendIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class ConnectThreadInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    contact_id: str
    contact_name: str
    contact_role: str
    status: ConnectStatus = "new"
    locked: bool = False
    messages: list[ConnectMessage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ConnectThreadOut(BaseModel):
    id: str
    contact_id: str
    contact_name: str
    contact_role: str
    status: ConnectStatus
    locked: bool
    messages: list[ConnectMessage]
    updated_at: datetime
