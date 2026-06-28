from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid


class SalaryConfig(BaseModel):
    employee_id: str
    base_salary: float = 0
    hra: float = 0
    da: float = 0
    other_allowances: float = 0
    pf_deduction: float = 0
    tax_deduction: float = 0
    other_deductions: float = 0
    incentive_per_target_pct: float = 0  # bonus per % of target achieved above threshold


class SalarySlip(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str = ""
    designation: str = ""
    month: int  # 1-12
    year: int
    # earnings
    base_salary: float = 0
    hra: float = 0
    da: float = 0
    other_allowances: float = 0
    incentive: float = 0
    gross_salary: float = 0
    # deductions
    pf_deduction: float = 0
    tax_deduction: float = 0
    other_deductions: float = 0
    total_deductions: float = 0
    # net
    net_salary: float = 0
    # attendance context
    working_days: int = 0
    present_days: int = 0
    half_days: int = 0
    absent_days: int = 0
    # target context
    target_amount: float = 0
    achieved_amount: float = 0
    target_pct: float = 0
    # meta
    status: str = "draft"  # draft, finalized
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SalaryConfigIn(BaseModel):
    base_salary: float = 0
    hra: float = 0
    da: float = 0
    other_allowances: float = 0
    pf_deduction: float = 0
    tax_deduction: float = 0
    other_deductions: float = 0
    incentive_per_target_pct: float = 0


class GenerateSlipIn(BaseModel):
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2024, le=2030)
    employee_ids: Optional[list[str]] = None  # None = all employees
