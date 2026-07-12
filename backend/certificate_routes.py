"""Offer letters, completion letters, and certificates (internship,
employee, and quick "achievement" entries). This is the foundation the
public verification system (backend/verify_routes.py, once built) queries
against — every certificate created here gets a unique, verifiable
certificate_number and a QR code pointing at the public /verify page.
"""
import uuid
from datetime import date, datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import get_current_user_payload, require_admin
from database import certificates_collection, interns_collection, users_collection
from storage_r2 import r2_enabled, upload_bytes, presigned_url
from certificate_pdf import (
    generate_offer_letter_pdf, generate_completion_letter_pdf, generate_certificate_pdf,
    next_certificate_number,
)
from certificate_content import DEPARTMENTS
from email_service import (
    send_email_with_pdfs, document_email_html, email_configured,
    certificate_completion_email_html, offer_letter_email_html,
)
from activity_service import log_activity
from notification_service import create_notification

router = APIRouter(prefix="/api", tags=["certificates"])

SITE_URL = "https://www.thefinancialdoctor.in"


def _verify_url(certificate_number: str) -> str:
    return f"{SITE_URL}/verify?certificate={certificate_number.replace('/', '-')}"


def _duration_label(start: str, end: str) -> str:
    days = (date.fromisoformat(end) - date.fromisoformat(start)).days + 1
    return f"{days} days"


_SEQ_CODE_MAP = {"internship": "INT", "employee": "EMP", "offer_letter": "OL", "completion_letter": "CL"}


async def _next_sequence(cert_type: str, year: int) -> int:
    prefix = f"TFD/{_SEQ_CODE_MAP.get(cert_type, 'EMP')}/{year}/"
    count = await certificates_collection.count_documents({"certificate_number": {"$regex": f"^{prefix.replace('/', chr(92) + '/')}"}})
    return count + 1


async def _store_pdf(pdf_bytes: bytes, key: str) -> Optional[str]:
    if r2_enabled():
        upload_bytes(key, pdf_bytes, "application/pdf")
        return key
    return None


async def _persist_letter_record(intern: dict, letter_type: str, pdf_bytes: bytes, created_by: str) -> None:
    """Offer/completion letters are generated on demand for download, but also
    get a numbered, R2-stored record here so Universal Document Search can
    find them — same pattern certificates/letterheads already use. These are
    intentionally NOT publicly verifiable (see qr_routes.py's type filter)."""
    year = date.today().year
    seq = await _next_sequence(letter_type, year)
    number = next_certificate_number(letter_type, year, seq)
    doc_id = str(uuid.uuid4())
    r2_key = None
    if r2_enabled():
        r2_key = f"letters/{doc_id}.pdf"
        upload_bytes(r2_key, pdf_bytes, "application/pdf")
    doc = {
        "id": doc_id, "certificate_number": number, "person_name": intern["name"], "type": letter_type,
        "department": intern["department"], "issue_date": date.today().isoformat(), "duration_label": None,
        "college": None, "linked_employee_id": None, "intern_id": intern["id"],
        "r2_key": r2_key, "created_by": created_by, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await certificates_collection.insert_one(doc)


# ── Interns: one record created up front, offer letter then completion+certificate later ──

class InternCreate(BaseModel):
    name: str
    college: Optional[str] = None
    department: str
    start_date: str
    end_date: str
    stipend: Optional[float] = None
    stipend_type: Literal["fixed", "performance_based", "unpaid"] = "fixed"
    manager_name: str
    manager_designation: Optional[str] = None
    father_name: Optional[str] = None
    address: Optional[str] = None
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


@router.get("/interns/departments")
async def list_departments(admin: dict = Depends(require_admin)):
    return DEPARTMENTS


@router.post("/interns")
async def create_intern(data: InternCreate, admin: dict = Depends(require_admin)):
    """Admin manually adding an intern — approved immediately, unlike a
    self-service application (see /interns/public/apply below)."""
    if data.department not in DEPARTMENTS:
        raise HTTPException(status_code=400, detail=f"Department must be one of {DEPARTMENTS}")
    intern = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "approved",
        "offer_letter_generated_at": None,
        "completion_letter_generated_at": None,
        "certificate_id": None,
        "created_by": admin["sub"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await interns_collection.insert_one(intern)
    intern.pop("_id", None)
    await log_activity(admin["sub"], "intern_added", f"Added intern record: {data.name} ({data.department})", link="/portal/admin/certificates")

    try:
        await _auto_generate_offer_letter(intern["id"], intern, admin["sub"])
        intern["offer_letter_generated_at"] = datetime.now(timezone.utc).isoformat()
    except Exception:
        pass  # offer letter can still be generated manually from the list if this fails

    return intern


@router.get("/interns")
async def list_interns(admin: dict = Depends(require_admin)):
    """Approved interns only — self-submitted applications awaiting
    approval live in /interns/pending until an admin approves them."""
    docs = []
    async for doc in interns_collection.find({"status": "approved"}).sort("created_at", -1):
        doc.pop("_id", None)
        docs.append(doc)
    return docs


# ── Self-service intern application (public, no auth) ──────────────────

class InternApplicationIn(BaseModel):
    name: str
    college: Optional[str] = None
    department: str
    start_date: str
    end_date: str
    contact_phone: str
    contact_email: Optional[str] = None


@router.post("/interns/public/apply")
async def submit_intern_application(data: InternApplicationIn):
    """Public, unauthenticated — the self-service form intern fills out
    from the link admin shares. Lands in /interns/pending for admin review;
    manager_name/manager_designation get filled in at approval time, since
    an intern applying wouldn't know who they're assigned to yet."""
    if data.department not in DEPARTMENTS:
        raise HTTPException(status_code=400, detail=f"Department must be one of {DEPARTMENTS}")
    intern = {
        "id": str(uuid.uuid4()),
        "name": data.name, "college": data.college, "department": data.department,
        "start_date": data.start_date, "end_date": data.end_date, "stipend": None,
        "manager_name": None, "manager_designation": None,
        "contact_phone": data.contact_phone, "contact_email": data.contact_email,
        "status": "pending",
        "offer_letter_generated_at": None, "completion_letter_generated_at": None, "certificate_id": None,
        "created_by": None, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await interns_collection.insert_one(intern)

    admins = users_collection.find({"role": "admin"})
    async for adm in admins:
        await create_notification(
            user_id=adm["id"],
            title="New Intern Application",
            body=f"{data.name} applied for an internship ({data.department}) — review in Pending Approval",
            n_type="general",
            link="/portal/admin/certificates",
        )
    return {"status": "submitted"}


@router.get("/interns/pending")
async def list_pending_interns(admin: dict = Depends(require_admin)):
    docs = []
    async for doc in interns_collection.find({"status": "pending"}).sort("created_at", -1):
        doc.pop("_id", None)
        docs.append(doc)
    return docs


class ApproveInternIn(BaseModel):
    manager_name: str
    manager_designation: Optional[str] = None
    stipend: Optional[float] = None
    stipend_type: Literal["fixed", "performance_based", "unpaid"] = "fixed"


@router.post("/interns/{intern_id}/approve")
async def approve_intern(intern_id: str, data: ApproveInternIn, admin: dict = Depends(require_admin)):
    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    if intern.get("status") != "pending":
        raise HTTPException(status_code=400, detail="This intern is not pending approval")
    await interns_collection.update_one(
        {"id": intern_id},
        {"$set": {
            "status": "approved", "manager_name": data.manager_name,
            "manager_designation": data.manager_designation, "stipend": data.stipend,
            "stipend_type": data.stipend_type,
            "created_by": admin["sub"],
        }},
    )
    await log_activity(admin["sub"], "intern_approved", f"Approved intern application: {intern['name']}", link="/portal/admin/certificates")

    try:
        approved_intern = await interns_collection.find_one({"id": intern_id})
        await _auto_generate_offer_letter(intern_id, approved_intern, admin["sub"])
    except Exception:
        pass  # offer letter can still be generated manually from the list if this fails

    return {"status": "approved"}


@router.delete("/interns/{intern_id}/reject")
async def reject_intern(intern_id: str, admin: dict = Depends(require_admin)):
    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    if intern.get("status") != "pending":
        raise HTTPException(status_code=400, detail="This intern is not pending approval")
    await interns_collection.delete_one({"id": intern_id})
    await log_activity(admin["sub"], "intern_rejected", f"Rejected intern application: {intern['name']}", link="/portal/admin/certificates")
    return {"status": "rejected"}


@router.get("/interns/{intern_id}/offer-letter/text")
async def preview_offer_letter_text(intern_id: str, admin: dict = Depends(require_admin)):
    """Auto-built body text for the template-editing step — admin can edit
    this before the PDF is actually generated."""
    from certificate_pdf import build_offer_letter_body
    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    return {"body": build_offer_letter_body(intern)}


@router.get("/interns/{intern_id}/completion-letter/text")
async def preview_completion_letter_text(intern_id: str, admin: dict = Depends(require_admin)):
    from certificate_pdf import build_completion_letter_body
    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    return {"body": build_completion_letter_body(intern)}


class GenerateLetterIn(BaseModel):
    custom_body: Optional[str] = None


async def _auto_generate_offer_letter(intern_id: str, intern: dict, admin_id: str) -> bytes:
    """Shared by the explicit "Generate Offer Letter" button and the
    auto-generate-on-add/approve hooks below — same PDF, same persisted
    record, same activity log either way."""
    pdf_bytes = generate_offer_letter_pdf(intern)
    await _persist_letter_record(intern, "offer_letter", pdf_bytes, admin_id)
    await interns_collection.update_one({"id": intern_id}, {"$set": {"offer_letter_generated_at": datetime.now(timezone.utc).isoformat()}})
    await log_activity(admin_id, "offer_letter_generated", f"Generated offer letter for {intern['name']}", link="/portal/admin/certificates")
    return pdf_bytes


@router.post("/interns/{intern_id}/offer-letter")
async def get_offer_letter(intern_id: str, data: GenerateLetterIn = GenerateLetterIn(), admin: dict = Depends(require_admin)):
    from fastapi.responses import StreamingResponse
    import io

    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    if intern.get("status") != "approved":
        raise HTTPException(status_code=400, detail="This intern application hasn't been approved yet")

    if data.custom_body is not None:
        pdf_bytes = generate_offer_letter_pdf(intern, custom_body=data.custom_body)
        await _persist_letter_record(intern, "offer_letter", pdf_bytes, admin["sub"])
        await interns_collection.update_one({"id": intern_id}, {"$set": {"offer_letter_generated_at": datetime.now(timezone.utc).isoformat()}})
        await log_activity(admin["sub"], "offer_letter_generated", f"Generated offer letter for {intern['name']}", link="/portal/admin/certificates")
    else:
        pdf_bytes = await _auto_generate_offer_letter(intern_id, intern, admin["sub"])
    filename = f"Offer_Letter_{intern['name'].replace(' ', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/interns/{intern_id}/offer-letter/download")
async def download_offer_letter(intern_id: str, admin: dict = Depends(require_admin)):
    """Serves the intern's already-generated offer letter (e.g. right after
    adding an intern auto-generates it) without minting a new numbered
    record — reads the persisted PDF from R2, or regenerates it on the fly
    from the intern's own fields if R2 is unavailable, same resilience
    pattern as invoices' download endpoint."""
    from fastapi.responses import StreamingResponse
    import io

    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    rec = await certificates_collection.find_one({"intern_id": intern_id, "type": "offer_letter"}, sort=[("created_at", -1)])
    if not rec:
        raise HTTPException(status_code=404, detail="Offer letter hasn't been generated for this intern yet")

    pdf_bytes = None
    if rec.get("r2_key"):
        try:
            from storage_r2 import get_client, R2_BUCKET_NAME
            obj = get_client().get_object(Bucket=R2_BUCKET_NAME, Key=rec["r2_key"])
            pdf_bytes = obj["Body"].read()
        except Exception:
            pdf_bytes = None
    if pdf_bytes is None:
        pdf_bytes = generate_offer_letter_pdf(intern)

    filename = f"Offer_Letter_{intern['name'].replace(' ', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})


@router.get("/interns/{intern_id}/completion-letter/download")
async def download_completion_letter(intern_id: str, admin: dict = Depends(require_admin)):
    """Same resilience pattern as the offer letter's download endpoint —
    serves the already-generated completion letter without minting a new
    numbered record. This is what was missing from the intern profile
    view (only Certificate had a real download button there)."""
    from fastapi.responses import StreamingResponse
    import io

    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    rec = await certificates_collection.find_one({"intern_id": intern_id, "type": "completion_letter"}, sort=[("created_at", -1)])
    if not rec:
        raise HTTPException(status_code=404, detail="Completion letter hasn't been generated for this intern yet")

    pdf_bytes = None
    if rec.get("r2_key"):
        try:
            from storage_r2 import get_client, R2_BUCKET_NAME
            obj = get_client().get_object(Bucket=R2_BUCKET_NAME, Key=rec["r2_key"])
            pdf_bytes = obj["Body"].read()
        except Exception:
            pdf_bytes = None
    if pdf_bytes is None:
        cert = await certificates_collection.find_one({"intern_id": intern_id, "type": "internship"})
        verify_url = _verify_url(cert["certificate_number"]) if cert else None
        cert_number = cert["certificate_number"] if cert else None
        pdf_bytes = generate_completion_letter_pdf(intern, verify_url=verify_url, certificate_number=cert_number)

    filename = f"Completion_Letter_{intern['name'].replace(' ', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})


async def _ensure_intern_certificate(intern_id: str, intern: dict, admin_id: str) -> dict:
    """Returns the intern's internship certificate record, creating it
    (silently, with the default auto-built detail text) if it doesn't exist
    yet — so the completion letter always has a real certificate to point
    its QR/number at, regardless of whether the admin generated the
    certificate first or not."""
    cert = await certificates_collection.find_one({"intern_id": intern_id, "type": "internship"})
    if cert:
        return cert

    year = date.fromisoformat(intern["end_date"]).year
    seq = await _next_sequence("internship", year)
    cert_number = next_certificate_number("internship", year, seq)
    duration_label = _duration_label(intern["start_date"], intern["end_date"])
    issue_date = intern["end_date"]

    cert_data = {
        "certificate_number": cert_number, "person_name": intern["name"], "cert_type": "internship",
        "department": intern["department"], "issue_date": issue_date, "duration_label": duration_label,
        "custom_detail": None,
    }
    pdf_bytes = generate_certificate_pdf(cert_data, _verify_url(cert_number))

    cert_id = str(uuid.uuid4())
    r2_key = None
    if r2_enabled():
        r2_key = f"certificates/{cert_id}.pdf"
        upload_bytes(r2_key, pdf_bytes, "application/pdf")

    cert_doc = {
        "id": cert_id, "certificate_number": cert_number, "person_name": intern["name"], "type": "internship",
        "department": intern["department"], "issue_date": issue_date, "duration_label": duration_label,
        "college": intern.get("college"), "linked_employee_id": None, "intern_id": intern_id,
        "r2_key": r2_key, "created_by": admin_id, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await certificates_collection.insert_one(cert_doc)
    await interns_collection.update_one({"id": intern_id}, {"$set": {"certificate_id": cert_id}})
    await log_activity(admin_id, "certificate_generated", f"Auto-generated internship certificate {cert_number} for {intern['name']} (via completion letter)", link="/portal/admin/certificates")
    return cert_doc


@router.post("/interns/{intern_id}/completion-letter")
async def get_completion_letter(intern_id: str, data: GenerateLetterIn = GenerateLetterIn(), admin: dict = Depends(require_admin)):
    from fastapi.responses import StreamingResponse
    import io

    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    if intern.get("status") != "approved":
        raise HTTPException(status_code=400, detail="This intern application hasn't been approved yet")

    # Reuse the intern's actual internship certificate's QR/number on the
    # letter (not a separate one) — auto-creating the certificate record
    # first if the admin hasn't generated it yet, so the letter is never
    # missing its QR/number just because of generation order.
    cert = await _ensure_intern_certificate(intern_id, intern, admin["sub"])
    verify_url = _verify_url(cert["certificate_number"])
    cert_number = cert["certificate_number"]

    pdf_bytes = generate_completion_letter_pdf(intern, custom_body=data.custom_body, verify_url=verify_url, certificate_number=cert_number)
    await _persist_letter_record(intern, "completion_letter", pdf_bytes, admin["sub"])
    await interns_collection.update_one({"id": intern_id}, {"$set": {"completion_letter_generated_at": datetime.now(timezone.utc).isoformat()}})
    await log_activity(admin["sub"], "completion_letter_generated", f"Generated completion letter for {intern['name']}", link="/portal/admin/certificates")
    filename = f"Completion_Letter_{intern['name'].replace(' ', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/interns/{intern_id}/certificate/text")
async def preview_certificate_text(intern_id: str, admin: dict = Depends(require_admin)):
    from certificate_pdf import default_certificate_detail
    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    duration_label = _duration_label(intern["start_date"], intern["end_date"])
    detail = default_certificate_detail({"cert_type": "internship", "department": intern["department"], "duration_label": duration_label})
    return {"detail": detail}


class GenerateCertificateIn(BaseModel):
    custom_detail: Optional[str] = None


@router.post("/interns/{intern_id}/certificate")
async def create_intern_certificate(intern_id: str, data: GenerateCertificateIn = GenerateCertificateIn(), admin: dict = Depends(require_admin)):
    """Generates the decorative internship certificate (with QR + unique
    certificate number) and creates the certificates collection record the
    public verification system will query."""
    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    if intern.get("status") != "approved":
        raise HTTPException(status_code=400, detail="This intern application hasn't been approved yet")

    year = date.fromisoformat(intern["end_date"]).year
    seq = await _next_sequence("internship", year)
    cert_number = next_certificate_number("internship", year, seq)
    duration_label = _duration_label(intern["start_date"], intern["end_date"])
    issue_date = intern["end_date"]

    cert_data = {
        "certificate_number": cert_number, "person_name": intern["name"], "cert_type": "internship",
        "department": intern["department"], "issue_date": issue_date, "duration_label": duration_label,
        "custom_detail": data.custom_detail,
    }
    pdf_bytes = generate_certificate_pdf(cert_data, _verify_url(cert_number))

    cert_id = str(uuid.uuid4())
    r2_key = None
    if r2_enabled():
        r2_key = f"certificates/{cert_id}.pdf"
        upload_bytes(r2_key, pdf_bytes, "application/pdf")

    cert_doc = {
        "id": cert_id,
        "certificate_number": cert_number,
        "person_name": intern["name"],
        "type": "internship",
        "department": intern["department"],
        "issue_date": issue_date,
        "duration_label": duration_label,
        "college": intern.get("college"),  # NEVER exposed on the public verify endpoint
        "linked_employee_id": None,
        "intern_id": intern_id,
        "r2_key": r2_key,
        "created_by": admin["sub"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await certificates_collection.insert_one(cert_doc)
    await interns_collection.update_one({"id": intern_id}, {"$set": {"certificate_id": cert_id}})
    await log_activity(admin["sub"], "certificate_generated", f"Generated internship certificate {cert_number} for {intern['name']}", link="/portal/admin/certificates")

    return _cert_to_out(cert_doc)


# ── Employee certificates (existing employees, experience-framed) ──────

class EmployeeCertificateCreate(BaseModel):
    employee_id: str
    department: str
    start_date: str
    end_date: Optional[str] = None  # None = ongoing, uses today
    duration_label: Optional[str] = None  # overrides auto-computed label if given


@router.post("/certificates/employee")
async def create_employee_certificate(data: EmployeeCertificateCreate, admin: dict = Depends(require_admin)):
    emp = await users_collection.find_one({"id": data.employee_id})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    end = data.end_date or date.today().isoformat()
    duration_label = data.duration_label or _duration_label(data.start_date, end)
    year = date.fromisoformat(end).year
    seq = await _next_sequence("employee", year)
    cert_number = next_certificate_number("employee", year, seq)

    cert_data = {
        "certificate_number": cert_number, "person_name": emp["name"], "cert_type": "employee",
        "department": data.department, "issue_date": end, "duration_label": duration_label,
        "designation": emp.get("designation") or "Team Member",
        "start_date": data.start_date, "ongoing": data.end_date is None,
    }
    pdf_bytes = generate_certificate_pdf(cert_data, _verify_url(cert_number))

    cert_id = str(uuid.uuid4())
    r2_key = None
    if r2_enabled():
        r2_key = f"certificates/{cert_id}.pdf"
        upload_bytes(r2_key, pdf_bytes, "application/pdf")

    cert_doc = {
        "id": cert_id, "certificate_number": cert_number, "person_name": emp["name"], "type": "employee",
        "department": data.department, "issue_date": end, "duration_label": duration_label,
        "college": None, "linked_employee_id": data.employee_id, "intern_id": None,
        "r2_key": r2_key, "created_by": admin["sub"], "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await certificates_collection.insert_one(cert_doc)
    await log_activity(admin["sub"], "certificate_generated", f"Generated employee certificate {cert_number} for {emp['name']}", link="/portal/admin/certificates")
    return _cert_to_out(cert_doc)


class AchievementCreate(BaseModel):
    employee_id: str
    title: str  # e.g. "Employee of the Month — June 2026"
    description: Optional[str] = None
    issue_date: Optional[str] = None


@router.post("/certificates/achievement")
async def create_achievement(data: AchievementCreate, admin: dict = Depends(require_admin)):
    """Lightweight recognition entry (e.g. "Employee of the Month") — still
    gets a certificate number + QR so it's verifiable, but framed as an
    achievement rather than an employment-duration certificate."""
    emp = await users_collection.find_one({"id": data.employee_id})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    issue_date = data.issue_date or date.today().isoformat()
    year = date.fromisoformat(issue_date).year
    seq = await _next_sequence("employee", year)
    cert_number = next_certificate_number("employee", year, seq)

    cert_data = {
        "certificate_number": cert_number, "person_name": emp["name"], "cert_type": "achievement",
        "department": emp.get("designation") or "General", "issue_date": issue_date, "duration_label": data.title,
    }
    pdf_bytes = generate_certificate_pdf(cert_data, _verify_url(cert_number))

    cert_id = str(uuid.uuid4())
    r2_key = None
    if r2_enabled():
        r2_key = f"certificates/{cert_id}.pdf"
        upload_bytes(r2_key, pdf_bytes, "application/pdf")

    cert_doc = {
        "id": cert_id, "certificate_number": cert_number, "person_name": emp["name"], "type": "achievement",
        "department": emp.get("designation") or "General", "issue_date": issue_date, "duration_label": data.title,
        "description": data.description, "college": None, "linked_employee_id": data.employee_id, "intern_id": None,
        "r2_key": r2_key, "created_by": admin["sub"], "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await certificates_collection.insert_one(cert_doc)
    await log_activity(admin["sub"], "certificate_generated", f"Added achievement '{data.title}' for {emp['name']}", link="/portal/admin/certificates")
    return _cert_to_out(cert_doc)


# ── Listing / download / email ──────────────────────────────────────────

def _cert_to_out(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    if doc.get("r2_key"):
        doc["pdf_url"] = presigned_url(doc["r2_key"])
    return doc


@router.get("/certificates")
async def list_certificates(admin: dict = Depends(require_admin)):
    docs = []
    async for doc in certificates_collection.find({}).sort("created_at", -1):
        docs.append(_cert_to_out(doc))
    return docs


@router.get("/certificates/mine")
async def my_certificates(payload: dict = Depends(get_current_user_payload)):
    """For the Employee Portal's Achievements tab."""
    docs = []
    async for doc in certificates_collection.find({"linked_employee_id": payload["sub"]}).sort("created_at", -1):
        docs.append(_cert_to_out(doc))
    return docs


@router.get("/certificates/{cert_id}")
async def get_certificate(cert_id: str, payload: dict = Depends(get_current_user_payload)):
    doc = await certificates_collection.find_one({"id": cert_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if payload["role"] != "admin" and doc.get("linked_employee_id") != payload["sub"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    return _cert_to_out(doc)


@router.get("/certificates/{cert_id}/download")
async def download_certificate(cert_id: str, payload: dict = Depends(get_current_user_payload)):
    """Serves the certificate PDF directly (not a presigned R2 link, which
    is silently missing whenever R2 is unconfigured) — reads from R2 if
    available, else regenerates on the fly from the stored fields, same
    resilience pattern as invoices/offer-letter downloads."""
    from fastapi.responses import StreamingResponse
    import io

    doc = await certificates_collection.find_one({"id": cert_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if payload["role"] != "admin" and doc.get("linked_employee_id") != payload["sub"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    pdf_bytes = None
    if doc.get("r2_key"):
        try:
            from storage_r2 import get_client, R2_BUCKET_NAME
            obj = get_client().get_object(Bucket=R2_BUCKET_NAME, Key=doc["r2_key"])
            pdf_bytes = obj["Body"].read()
        except Exception:
            pdf_bytes = None
    if pdf_bytes is None:
        cert_data = {
            "certificate_number": doc["certificate_number"], "person_name": doc["person_name"],
            "cert_type": doc.get("type", "employee"), "department": doc.get("department"),
            "issue_date": doc["issue_date"], "duration_label": doc.get("duration_label"),
            "designation": doc.get("designation"), "start_date": doc.get("start_date"), "ongoing": doc.get("ongoing"),
        }
        pdf_bytes = generate_certificate_pdf(cert_data, _verify_url(doc["certificate_number"]))

    filename = f"Certificate_{doc['certificate_number'].replace('/', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})


class EmailCertificateIn(BaseModel):
    to_email: str
    cc_emails: List[str] = []


def _validate_cc(cc_emails: List[str]) -> List[str]:
    cc_emails = [e.strip() for e in cc_emails if e and e.strip()]
    if len(cc_emails) > 10:
        raise HTTPException(status_code=400, detail="Up to 10 CC addresses only")
    return cc_emails


@router.post("/certificates/{cert_id}/email")
async def email_certificate(cert_id: str, data: EmailCertificateIn, admin: dict = Depends(require_admin)):
    """Emails the certificate. If it's an internship certificate, the
    completion letter is automatically bundled in too — an internship
    certificate on its own, without the letter certifying the internship
    happened, is an incomplete document for the recipient's purposes."""
    if not email_configured():
        raise HTTPException(status_code=503, detail="Email sending not configured")
    cc_emails = _validate_cc(data.cc_emails)
    doc = await certificates_collection.find_one({"id": cert_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if not doc.get("r2_key"):
        raise HTTPException(status_code=400, detail="No PDF stored for this certificate")

    from storage_r2 import get_client, R2_BUCKET_NAME
    obj = get_client().get_object(Bucket=R2_BUCKET_NAME, Key=doc["r2_key"])
    attachments = [(f"Certificate_{doc['certificate_number'].replace('/', '_')}.pdf", obj["Body"].read())]
    doc_labels = [f"Certificate ({doc['certificate_number']})"]

    is_internship = doc.get("type") == "internship" and doc.get("intern_id")
    if is_internship:
        intern = await interns_collection.find_one({"id": doc["intern_id"]})
        if intern:
            completion_pdf = generate_completion_letter_pdf(intern, verify_url=_verify_url(doc["certificate_number"]), certificate_number=doc["certificate_number"])
            attachments.append((f"Completion_Letter_{intern['name'].replace(' ', '_')}.pdf", completion_pdf))
            doc_labels.append("Internship Completion Letter")

    if is_internship:
        subject = "Your Internship Certificate & Completion Letter — The Financial Doctor"
        body_html = certificate_completion_email_html(doc["person_name"], doc["department"])
    else:
        subject = f"Your Documents from The Financial Doctor — {doc['certificate_number']}"
        body_html = document_email_html(doc["person_name"], doc_labels)
    ok, message = send_email_with_pdfs(data.to_email, subject, body_html, attachments, cc_emails=cc_emails)
    if not ok:
        raise HTTPException(status_code=503, detail=message)
    await log_activity(admin["sub"], "certificate_emailed", f"Emailed {', '.join(doc_labels)} to {data.to_email}" + (f" (cc: {', '.join(cc_emails)})" if cc_emails else ""), link="/portal/admin/certificates")
    return {"status": "sent", "documents": doc_labels}


# ── Intern document mailing — offer letter independent, certificate auto-bundles completion letter ──

class InternEmailIn(BaseModel):
    to_email: str
    documents: List[str]  # any of: "offer_letter", "completion_letter", "certificate"
    cc_emails: List[str] = []


@router.post("/interns/{intern_id}/email")
async def email_intern_documents(intern_id: str, data: InternEmailIn, admin: dict = Depends(require_admin)):
    if not email_configured():
        raise HTTPException(status_code=503, detail="Email sending not configured")
    cc_emails = _validate_cc(data.cc_emails)
    intern = await interns_collection.find_one({"id": intern_id})
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")

    wanted = set(data.documents) & {"offer_letter", "completion_letter", "certificate"}
    if "certificate" in wanted:
        wanted.add("completion_letter")  # automatic bundling — see email_certificate's docstring
    if not wanted:
        raise HTTPException(status_code=400, detail="Select at least one document to email")

    attachments = []
    doc_labels = []
    name_safe = intern["name"].replace(" ", "_")

    if "offer_letter" in wanted:
        attachments.append((f"Offer_Letter_{name_safe}.pdf", generate_offer_letter_pdf(intern)))
        doc_labels.append("Internship Offer Letter")
    if "completion_letter" in wanted or "certificate" in wanted:
        cert = await _ensure_intern_certificate(intern_id, intern, admin["sub"])
        if "completion_letter" in wanted:
            completion_pdf = generate_completion_letter_pdf(intern, verify_url=_verify_url(cert["certificate_number"]), certificate_number=cert["certificate_number"])
            attachments.append((f"Completion_Letter_{name_safe}.pdf", completion_pdf))
            doc_labels.append("Internship Completion Letter")
    if "certificate" in wanted:
        if not cert.get("r2_key"):
            raise HTTPException(status_code=400, detail="Certificate PDF not found")
        from storage_r2 import get_client, R2_BUCKET_NAME
        obj = get_client().get_object(Bucket=R2_BUCKET_NAME, Key=cert["r2_key"])
        attachments.append((f"Certificate_{cert['certificate_number'].replace('/', '_')}.pdf", obj["Body"].read()))
        doc_labels.append(f"Certificate ({cert['certificate_number']})")

    if "certificate" in wanted:
        subject = "Your Internship Certificate & Completion Letter — The Financial Doctor"
        body_html = certificate_completion_email_html(intern["name"], intern["department"])
    elif wanted == {"offer_letter"}:
        subject = "Your Internship Offer Letter — The Financial Doctor"
        body_html = offer_letter_email_html(intern["name"])
    else:
        subject = f"Your Documents from The Financial Doctor — {intern['name']}"
        body_html = document_email_html(intern["name"], doc_labels)
    ok, message = send_email_with_pdfs(data.to_email, subject, body_html, attachments, cc_emails=cc_emails)
    if not ok:
        raise HTTPException(status_code=503, detail=message)
    await log_activity(admin["sub"], "documents_emailed", f"Emailed {', '.join(doc_labels)} to {data.to_email} for {intern['name']}" + (f" (cc: {', '.join(cc_emails)})" if cc_emails else ""), link="/portal/admin/certificates")
    return {"status": "sent", "documents": doc_labels}
