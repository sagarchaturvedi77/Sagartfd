from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high, urgent
    due_date: Optional[str] = None  # ISO date
    reminder_time: Optional[str] = None  # ISO datetime for reminder
    category: str = "general"  # general, client_meeting, follow_up, documentation, other
    assigned_to: Optional[str] = None  # admin-only: employee user id to assign this task to (else self-task)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    reminder_time: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None  # pending, in_progress, completed, cancelled


class TaskInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[str] = None
    reminder_time: Optional[str] = None
    category: str = "general"
    status: str = "pending"
    assigned_by: Optional[str] = None       # admin user id, set only when this was assigned rather than self-created
    assigned_by_name: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TaskOut(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[str] = None
    reminder_time: Optional[str] = None
    category: str = "general"
    status: str = "pending"
    assigned_by: Optional[str] = None
    assigned_by_name: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""
