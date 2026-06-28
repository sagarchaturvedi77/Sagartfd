from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from datetime import datetime
import uuid

Role = Literal["admin", "employee"]

class UserCreate(BaseModel):
    """Used by ADMIN to create a new employee account."""
    name: str
    email: EmailStr
    password: str            # plain text in request, hashed before storing
    role: Role = "employee"
    phone: Optional[str] = None
    designation: Optional[str] = None   # e.g. "Relationship Manager"
    base_salary: Optional[float] = None
    training_days: Optional[int] = None
    training_salary: Optional[bool] = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    """Used by any logged-in user to change their own password."""
    current_password: str
    new_password: str

class UserOut(BaseModel):
    """Safe user object returned to frontend (no password)."""
    id: str
    name: str
    email: EmailStr
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

class UserInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    password_hash: str
    role: Role
    phone: Optional[str] = None
    designation: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    base_salary: Optional[float] = None
    training_days: Optional[int] = None
    training_salary: Optional[bool] = False
    training_start_date: Optional[str] = None
    profile_completed: Optional[bool] = False
    join_date: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
