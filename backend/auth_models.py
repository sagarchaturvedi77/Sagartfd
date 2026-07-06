from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from datetime import datetime
import uuid

Role = Literal["admin", "employee"]

class UserCreate(BaseModel):
    """Used by ADMIN to create a new employee account."""
    name: str
    phone: str               # mobile number (primary login ID)
    email: Optional[str] = None
    password: Optional[str] = None  # if not provided, auto-generated
    role: Role = "employee"
    designation: Optional[str] = None   # e.g. "Relationship Manager"
    base_salary: Optional[float] = None
    training_days: Optional[int] = None
    training_salary: Optional[bool] = False

class UserLogin(BaseModel):
    phone: str       # mobile number as user ID
    password: str

class PasswordChange(BaseModel):
    """Used by any logged-in user to change their own password."""
    current_password: str
    new_password: str

class UserOut(BaseModel):
    """Safe user object returned to frontend (no password)."""
    id: str
    name: str
    email: Optional[str] = None
    role: Role
    phone: Optional[str] = None
    designation: Optional[str] = None
    created_at: datetime
    training_days: Optional[int] = None
    training_salary: Optional[bool] = None
    training_start_date: Optional[str] = None
    base_salary: Optional[float] = None
    profile_completed: Optional[bool] = None
    join_date: Optional[str] = None
    is_active: Optional[bool] = True
    deactivated_at: Optional[str] = None

class UserInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    password_hash: str
    role: Role
    designation: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    base_salary: Optional[float] = None
    training_days: Optional[int] = None
    training_salary: Optional[bool] = False
    training_start_date: Optional[str] = None
    profile_completed: Optional[bool] = False
    join_date: Optional[str] = None
    certificate_no: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
