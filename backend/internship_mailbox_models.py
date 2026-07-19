"""TFD Mailbox — a fictional, Gmail-styled inbox each intern uses to email
simulated clients (never real people) as part of their track's tasks. See
internship_mailbox_routes.py for the auto-responder engine."""

from typing import Literal, Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

MailDirection = Literal["outbound", "inbound"]
MailStatus = Literal["draft", "sent"]
MailSentiment = Literal["positive", "negative", "query", "revision_request"]


class MailContact(BaseModel):
    name: str
    email: str
    role: str


class MailComposeIn(BaseModel):
    to_email: str
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=8000)
    thread_id: Optional[str] = None
    task_id: Optional[str] = None
    is_draft: bool = False


class MailMessageInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    thread_id: str
    task_id: Optional[str] = None
    from_name: str
    from_email: str
    to_name: str
    to_email: str
    subject: str
    body: str
    direction: MailDirection
    status: MailStatus = "sent"
    sentiment: Optional[MailSentiment] = None
    is_read: bool = False
    locked: bool = False
    response_due_at: Optional[datetime] = None
    response_generated: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MailMessageOut(BaseModel):
    id: str
    thread_id: str
    task_id: Optional[str] = None
    from_name: str
    from_email: str
    to_name: str
    to_email: str
    subject: str
    body: str
    direction: MailDirection
    status: MailStatus
    sentiment: Optional[MailSentiment] = None
    is_read: bool
    locked: bool
    created_at: datetime
