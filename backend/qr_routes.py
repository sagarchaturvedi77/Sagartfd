"""QR Code & Public Verification API (employees + certificates).

Each employee gets a unique verify URL:  {SITE}/verify/{employee_id}
The QR code encodes that URL. When scanned, the public verify page hits
GET /api/verify/{employee_id} and shows the employee's status.

Certificates (see certificate_routes.py) get their own verify link:
{SITE}/verify?certificate={number} — the /verify page's "Verify
Certificate" tab hits GET /api/verify/certificate/{number}.

Both public lookup endpoints are rate-limited (20/minute per IP) so
employee codes/certificate numbers can't be bulk-guessed at scale.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from io import BytesIO
import qrcode
import qrcode.image.svg
from auth_utils import get_current_user_payload
from database import users_collection, certificates_collection
from rate_limit import limiter

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
@limiter.limit("20/minute")
async def verify_employee(request: Request, employee_id: str):
    """Public endpoint — no auth. Returns employee verification status.
    Called by the /verify/:employee_id React page when someone scans an
    employee's QR, and by the /verify page's "Verify Employee" tab for a
    typed-in employee code.
    """
    emp = await users_collection.find_one({"id": employee_id, "role": "employee"}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="No record found")

    is_active = emp.get("is_active", True)
    cert_count = await certificates_collection.count_documents({"linked_employee_id": employee_id})

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
        "certificates_earned": cert_count,
        "last_working_date": emp.get("deactivated_at") if not is_active else None,
        "company": "The Financial Doctor",
        "company_url": "www.thefinancialdoctor.in",
        "message": (
            ""
            if is_active
            else (
                f"This person was associated with The Financial Doctor until {emp.get('deactivated_at')}. They are no longer with us."
                if emp.get("deactivated_at")
                else "This person is no longer associated with The Financial Doctor."
            )
        ),
    }


# ── Certificate verification (internship/employee certificates + achievements) ──

# Fields deliberately never returned here, even though they exist on the
# certificate record: college (privacy), linked_employee_id (internal),
# any contact/financial info — this endpoint is public and unauthenticated.
_CERT_PUBLIC_FIELDS = {"certificate_number", "person_name", "type", "department", "issue_date", "duration_label"}


@router.get("/certificate/{certificate_number}")
@limiter.limit("20/minute")
async def verify_certificate(request: Request, certificate_number: str):
    """Public endpoint — no auth. certificate_number arrives with dashes in
    place of slashes (the frontend/QR encode it that way, e.g.
    TFD-INT-2026-0001), so normalize back before querying."""
    normalized = certificate_number.replace("-", "/")
    cert = await certificates_collection.find_one(
        {"certificate_number": normalized, "type": {"$in": ["internship", "employee", "achievement", "letterhead"]}},
        {"_id": 0},
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    out = {k: v for k, v in cert.items() if k in _CERT_PUBLIC_FIELDS}
    out["valid"] = True
    return out
