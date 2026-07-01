"""QR Code & Employee Verification API.

Each employee gets a unique verify URL:  {SITE}/verify/{employee_id}
The QR code encodes that URL. When scanned, the public verify page
hits GET /api/verify/{employee_id} and shows the employee's status.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
import qrcode
import qrcode.image.svg

from auth_utils import get_current_user_payload
from database import users_collection

router = APIRouter(prefix="/api/verify", tags=["qr"])

SITE_URL = "https://www.thefinancialdoctor.in"  # change if domain differs


@router.get("/qr/{employee_id}")
async def get_employee_qr(employee_id: str, user=Depends(get_current_user_payload)):
    """Return a PNG QR code image encoding the public verify URL for this employee.
    Employee can only get their own QR; admin can get anyone's.
    """
    if user["role"] != "admin" and user["sub"] != employee_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    emp = await users_collection.find_one({"id": employee_id})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    verify_url = f"{SITE_URL}/verify/{employee_id}"
    img = qrcode.make(verify_url)
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@router.get("/{employee_id}")
async def verify_employee(employee_id: str):
    """Public endpoint — no auth. Returns employee verification status.
    Called by the /verify/:employee_id React page when someone scans the QR.
    """
    emp = await users_collection.find_one({"id": employee_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    is_active = emp.get("is_active", True)
    return {
        "verified": True,
        "active": is_active,
        "name": emp.get("name", ""),
        "designation": emp.get("designation", ""),
        "employee_id": emp.get("employee_id", employee_id[:8].upper()),
        "department": emp.get("department", ""),
        "blood_group": emp.get("blood_group", ""),
        "phone": emp.get("phone", ""),
        "photo_url": emp.get("photo_url", ""),
        "company": "The Financial Doctor",
        "company_url": "www.thefinancialdoctor.in",
        "message": "" if is_active else "⚠️ This employee is no longer part of The Financial Doctor. Please do not treat them as a current representative.",
    }
