from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class TargetCreate(BaseModel):
    """Admin sets a monthly target for an employee. Multiple targets can
    exist for the same employee/month — e.g. "5 SIPs" and "₹15,000 revenue"
    and "3 courses" as three separate line items, not squeezed into one."""
    employee_id: str
    month: int                             # 1-12
    year: int
    target_amount: float = 0               # the numeric goal — rupees if unit="amount", a count if unit="count"
    unit: str = "amount"                   # "amount" (₹) | "count" (numbers of something)
    target_type: str = "SIP"               # SIP / Lumpsum / Insurance / Demat Account / Course / Brokerage / Revenue / Custom
    target_description: Optional[str] = None  # flexible text description


class TargetEditIn(BaseModel):
    """Admin edits an existing target line item's definition (not progress)."""
    target_amount: Optional[float] = None
    unit: Optional[str] = None
    target_type: Optional[str] = None
    target_description: Optional[str] = None


class TargetUpdate(BaseModel):
    achieved_amount: float


class EmployeeTargetUpdate(BaseModel):
    """Employee self-reports achieved amount + work details for their target."""
    achieved_amount: float
    note: Optional[str] = None
    details: Optional[str] = None  # detailed work done description


class TargetInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    month: int
    year: int
    target_amount: float = 0
    achieved_amount: float = 0
    unit: str = "amount"
    target_type: str = "SIP"
    target_description: Optional[str] = None
    note: Optional[str] = None
    details: Optional[str] = None
    updated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TargetOut(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    month: int
    year: int
    target_amount: float
    achieved_amount: float
    unit: str = "amount"
    target_type: str
    target_description: Optional[str] = None
    progress_pct: float                    # computed field
    note: Optional[str] = None
    details: Optional[str] = None
    updated_at: Optional[datetime] = None
