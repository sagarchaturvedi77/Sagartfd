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
    pipeline_id: Optional[str] = None  # which custom pipeline this lead follows
    reference_note: Optional[str] = None  # e.g. "Referred by Priya Sharma (client)"


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
    pipeline_id: Optional[str] = None
    pipeline_stage_id: Optional[str] = None  # current stage within the pipeline


class CallOutcomeIn(BaseModel):
    """Submitted right after an employee finishes a call — drives the whole
    connected/not-connected decision tree."""
    connection_status: str  # "connected" | "not_connected"
    sub_stage: str
    # connected branch: "interested" | "not_interested" | "converted" | "lost"
    # not_connected branch: "npc" | "switchoff" | "invalid" | "network_issue"
    notes: Optional[str] = None
    service_interest: Optional[str] = None
    code_name: Optional[str] = None            # converted: product/plan code
    service_duration_months: Optional[int] = None  # converted: for monthly-service expiry reminders
    follow_up_date: Optional[str] = None        # "YYYY-MM-DD"
    follow_up_time: Optional[str] = None        # "HH:MM"
    referred_by_lead_id: Optional[str] = None   # if this client was referred by another existing client
    pipeline_stage_id: Optional[str] = None     # if the employee's pipeline has custom stages, which one they picked


class TransferIn(BaseModel):
    to_employee_id: str
    reference_note: Optional[str] = None


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
    pipeline_id: Optional[str] = None
    pipeline_stage_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status_history: list = Field(default_factory=list)
    # ── call-flow tracking ──
    connection_status: Optional[str] = None     # last call outcome: connected / not_connected
    call_attempts: int = 0                      # consecutive unresolved attempts (resets on interested/converted)
    last_call_at: Optional[str] = None
    transfer_history: list = Field(default_factory=list)   # [{from, to, note, at}]
    reference_note: Optional[str] = None        # visible on the lead so employees know who referred them
    code_name: Optional[str] = None
    service_duration_months: Optional[int] = None
    service_expires_at: Optional[str] = None
    call_touched: bool = False                  # False until first call attempt — used for the "10 at a time" queue


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
    pipeline_id: Optional[str] = None
    pipeline_stage_id: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""
    connection_status: Optional[str] = None
    call_attempts: int = 0
    last_call_at: Optional[str] = None
    transfer_history: list = Field(default_factory=list)
    reference_note: Optional[str] = None
    code_name: Optional[str] = None
    service_duration_months: Optional[int] = None
    service_expires_at: Optional[str] = None
    call_touched: bool = False
