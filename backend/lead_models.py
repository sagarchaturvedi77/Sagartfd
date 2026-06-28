from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid


class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=8, max_length=15)
    email: Optional[str] = None
    city: Optional[str] = None
    source: str = "manual"  # manual, website, referral, calculator, whatsapp
    service_interest: Optional[str] = None  # SIP, Insurance, Tax Planning, etc.
    notes: Optional[str] = None
    assigned_to: Optional[str] = None  # employee user_id


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    source: Optional[str] = None
    service_interest: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None  # new, contacted, follow_up, interested, converted, lost


class LeadStatusUpdate(BaseModel):
    status: str  # new, contacted, follow_up, interested, converted, lost
    follow_up_note: Optional[str] = None
    follow_up_date: Optional[str] = None  # ISO date string


class LeadInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    source: str = "manual"
    service_interest: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    status: str = "new"
    follow_up_note: Optional[str] = None
    follow_up_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status_history: list = Field(default_factory=list)


class LeadOut(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    source: str = "manual"
    service_interest: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    status: str = "new"
    follow_up_note: Optional[str] = None
    follow_up_date: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""
