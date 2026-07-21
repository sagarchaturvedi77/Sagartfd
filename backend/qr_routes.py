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
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from io import BytesIO
from pydantic import BaseModel
from typing import Optional
import qrcode
import qrcode.image.svg
from auth_utils import get_current_user_payload
from database import (
    users_collection, certificates_collection, interns_collection,
    internship_students_collection, internship_submissions_collection, internship_reports_collection,
)
from notification_service import create_notification
from rate_limit import limiter
from internship_models import TRACK_LABELS

router = APIRouter(prefix="/api/verify", tags=["qr"])

SITE_URL = "https://www.thefinancialdoctor.in"  # change if domain differs


def _mask_phone(phone: Optional[str]) -> Optional[str]:
    """First 2 + last 2 digits visible, rest masked — e.g. 9876543210 -> 98XXXXXX10."""
    if not phone:
        return None
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) <= 4:
        return "X" * len(digits)
    return digits[:2] + "X" * (len(digits) - 4) + digits[-2:]


def _mask_email(email: Optional[str]) -> Optional[str]:
    """First letter + last 2 characters of the local part visible, domain
    untouched — e.g. sagar.chaturvedi@gmail.com -> s*************di@gmail.com."""
    if not email or "@" not in email:
        return None
    local, domain = email.split("@", 1)
    if len(local) <= 3:
        visible = local[:1]
        return visible + "*" * max(1, len(local) - len(visible)) + "@" + domain
    return local[0] + "*" * (len(local) - 3) + local[-2:] + "@" + domain


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
        "phone": _mask_phone(emp.get("phone")) or "",
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
# certificate/intern record: address (privacy), linked_employee_id/intern_id
# (internal), Aadhaar/PAN (sensitive KYC), raw contact_email/contact_phone
# (masked versions are added separately) — this endpoint is public and
# unauthenticated.
_CERT_PUBLIC_FIELDS = {
    "certificate_number", "person_name", "type", "department", "issue_date", "duration_label", "college",
    "percentage", "earned_points", "total_points",
}


@router.get("/certificate/{certificate_number}")
@limiter.limit("20/minute")
async def verify_certificate(request: Request, certificate_number: str):
    """Public endpoint — no auth. certificate_number arrives with dashes in
    place of slashes (the frontend/QR encode it that way, e.g.
    TFD-INT-2026-0001), so normalize back before querying."""
    normalized = certificate_number.replace("-", "/")
    cert = await certificates_collection.find_one(
        {"certificate_number": normalized, "type": {"$in": ["internship", "employee", "achievement", "letterhead", "internship_program"]}},
        {"_id": 0},
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    out = {k: v for k, v in cert.items() if k in _CERT_PUBLIC_FIELDS}
    out["valid"] = True

    # Same display normalization as the printed certificate/letters, so the
    # public verification page matches what's on the actual document.
    from certificate_pdf import _title_case_name, _upper_text
    if out.get("person_name"):
        out["person_name"] = _title_case_name(out["person_name"])
    if out.get("college"):
        out["college"] = _upper_text(out["college"])

    # Internship certs carry extra personal details on the linked intern
    # record, not the certificate itself — father's name shown as-is,
    # contact details masked, address never exposed.
    if cert.get("type") == "internship" and cert.get("intern_id"):
        intern = await interns_collection.find_one({"id": cert["intern_id"]})
        if intern:
            out["father_name"] = _title_case_name(intern.get("father_name"))
            out["start_date"] = intern.get("start_date")
            out["end_date"] = intern.get("end_date")
            out["contact_email_masked"] = _mask_email(intern.get("contact_email"))
            out["contact_phone_masked"] = _mask_phone(intern.get("contact_phone"))

    # TFD Internship (gamified program) certificates carry a full portfolio —
    # this is deliberately richer than a typical certificate verify page
    # (score, every completed task's actual submitted work, daily report)
    # since the whole point is to double as an employer-facing "digital
    # project report", not just a yes/no authenticity check. Still no
    # phone/email/Aadhaar exposed — those stay behind the student's own login.
    if cert.get("type") == "internship_program" and cert.get("internship_student_id"):
        student = await internship_students_collection.find_one({"id": cert["internship_student_id"]})
        if student:
            out["college_id_number"] = student.get("college_id_number")
            out["track_label"] = TRACK_LABELS.get(student.get("track"), student.get("track"))
            out["program_start_date"] = student.get("program_start_date")
            out["radar_scores"] = student.get("radar_scores", {})

            # Task titles/points/dates are curriculum metadata, not personal
            # free text, so they're safe to show publicly. The student's own
            # written answer (text_answer) is free-text personal content and
            # is deliberately excluded — this is a public, unauthenticated
            # endpoint, and that content is only for the student's own login.
            tasks = []
            async for sub in internship_submissions_collection.find(
                {"student_id": student["id"], "status": "approved"}, {"_id": 0}
            ).sort("submitted_at", 1):
                tasks.append({
                    "task_title": sub.get("task_title"), "week_number": sub.get("week_number"),
                    "points_awarded": sub.get("points_awarded"),
                    "had_photo": bool(sub.get("photo_r2_key")), "submitted_at": sub.get("submitted_at"),
                })
            out["completed_tasks"] = tasks

            # Daily report dates are kept (they show cadence/consistency);
            # what_learned/what_did are free-text journal entries and are
            # deliberately excluded from this public, unauthenticated response.
            report = []
            async for entry in internship_reports_collection.find({"student_id": student["id"]}, {"_id": 0}).sort("date", 1):
                report.append({"date": entry["date"]})
            out["daily_report"] = report

    return out


class RegenerationRequestIn(BaseModel):
    contact: Optional[str] = None  # phone or email the requester wants to be reached at


@router.post("/certificate/{certificate_number}/request-regeneration")
@limiter.limit("5/minute")
async def request_certificate_regeneration(request: Request, certificate_number: str, data: RegenerationRequestIn = RegenerationRequestIn()):
    """Public endpoint — no auth. Someone who's lost their certificate/
    completion letter taps "Regenerate" on the verify page. There's no
    payment gateway wired up yet, so this doesn't charge anything or send
    documents automatically — it notifies every admin so they can follow up
    manually (collect the Rs. 499 fee, then resend via the existing
    Email Documents flow). The automatic pay-then-email flow is a planned
    follow-up once a payment gateway is integrated."""
    normalized = certificate_number.replace("-", "/")
    cert = await certificates_collection.find_one(
        {"certificate_number": normalized, "type": {"$in": ["internship", "employee", "achievement", "letterhead", "internship_program"]}},
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    contact_note = f" (reach them at: {data.contact.strip()})" if data.contact and data.contact.strip() else ""
    admins = users_collection.find({"role": "admin"})
    async for adm in admins:
        await create_notification(
            user_id=adm["id"],
            title="Certificate Regeneration Requested",
            body=f"{cert.get('person_name')} requested regeneration of {cert['certificate_number']} (Rs. 499 pending){contact_note}",
            n_type="general",
            link="/portal/admin/document-search",
        )

    return {
        "status": "requested",
        "message": "Request received. Our team will contact you shortly to arrange the Rs. 499 payment and resend your Certificate and Completion Letter.",
    }
