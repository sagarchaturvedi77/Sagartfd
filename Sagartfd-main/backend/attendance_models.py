from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class PunchLocation(BaseModel):
    """Optional geolocation sent by the browser when punching in/out."""
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    accuracy: Optional[float] = None


class AttendanceRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    date: str                              # YYYY-MM-DD
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    status: str = "present"                # present / absent / half-day
    total_hours: Optional[float] = None
    clock_in_location: Optional[str] = None
    clock_out_location: Optional[str] = None
    clock_in_lat: Optional[float] = None
    clock_in_lng: Optional[float] = None
    clock_out_lat: Optional[float] = None
    clock_out_lng: Optional[float] = None


class AttendanceOut(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    date: str
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    status: str
    total_hours: Optional[float] = None
    clock_in_location: Optional[str] = None
    clock_out_location: Optional[str] = None
    clock_in_lat: Optional[float] = None
    clock_in_lng: Optional[float] = None
    clock_out_lat: Optional[float] = None
    clock_out_lng: Optional[float] = None
