"""Server-side PDF generation for offer letters, completion letters, and
certificates — reportlab (pure Python, no native deps, safe on Render's
standard build) rather than a browser print-to-PDF, because these need to
be an actual stored file (R2 + pdf_url) for later download/email/
verification, not just a one-off print dialog.
"""
import io
import os
import uuid
from datetime import date, datetime
from typing import Optional

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib.utils import ImageReader

TFD_NAVY = colors.HexColor("#024396")
TFD_CREAM = colors.HexColor("#F6F2E9")
TFD_RED = colors.HexColor("#C7102E")

LOGO_PATH = os.path.join(os.path.dirname(__file__), "assets", "tfd-logo-main.png")

COMPANY_ADDRESS = "1st Floor, New Bus Stand, Sekdakhedi Road, Sehore, MP - 466001"
COMPANY_FOOTER = "The Financial Doctor | AMFI Registered | ARN-290298 | www.thefinancialdoctor.in"


def _duration_days(start: str, end: str) -> int:
    s = date.fromisoformat(start)
    e = date.fromisoformat(end)
    return (e - s).days + 1


def _fmt_date(d: str) -> str:
    return date.fromisoformat(d).strftime("%d %B %Y")


def _letter_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("TFDTitle", parent=styles["Heading1"], alignment=TA_CENTER, textColor=TFD_NAVY, fontSize=16, spaceAfter=4))
    styles.add(ParagraphStyle("TFDSub", parent=styles["Normal"], alignment=TA_CENTER, textColor=colors.grey, fontSize=9))
    styles.add(ParagraphStyle("TFDBody", parent=styles["Normal"], alignment=TA_JUSTIFY, fontSize=11, leading=16, spaceAfter=10))
    styles.add(ParagraphStyle("TFDMeta", parent=styles["Normal"], fontSize=10, textColor=colors.grey))
    return styles


def _letterhead(elements, styles, title: str):
    if os.path.exists(LOGO_PATH):
        elements.append(Image(LOGO_PATH, width=55 * mm, height=12 * mm, hAlign="CENTER"))
    elements.append(Paragraph("The Financial Doctor", styles["TFDTitle"]))
    elements.append(Paragraph(COMPANY_ADDRESS, styles["TFDSub"]))
    elements.append(Paragraph("AMFI Registered | ARN-290298 | Mutual Funds &amp; Insurance Advisory", styles["TFDSub"]))
    elements.append(Spacer(1, 14))
    elements.append(Paragraph(title, ParagraphStyle("LetterTitle", parent=styles["Heading2"], alignment=TA_CENTER, textColor=colors.HexColor("#0E1B2C"))))
    elements.append(Spacer(1, 10))


def _signature_block(elements, styles, signature_type: str = "ceo"):
    """signature_type: "ceo" (Sagar Chaturvedi, named) or "authorized"
    (generic, unnamed) — used by the blank letterhead tool's signature selector."""
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("For The Financial Doctor,", styles["TFDBody"]))
    elements.append(Spacer(1, 24))
    if signature_type == "authorized":
        elements.append(Paragraph("<b>Authorized Signatory</b>", styles["TFDBody"]))
        elements.append(Paragraph("The Financial Doctor", styles["TFDMeta"]))
    else:
        elements.append(Paragraph("<b>Sagar Chaturvedi</b>", styles["TFDBody"]))
        elements.append(Paragraph("Founder &amp; CEO, The Financial Doctor", styles["TFDMeta"]))


def watermark_page(canvas_obj, doc):
    """Faint diagonal background watermark — shared across every
    reportlab-generated document (letters, invoices, letterheads) via
    SimpleDocTemplate's onFirstPage/onLaterPages hooks."""
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica-Bold", 60)
    canvas_obj.setFillColor(TFD_NAVY)
    try:
        canvas_obj.setFillAlpha(0.05)
    except Exception:
        pass  # older reportlab without alpha support — watermark just renders solid-but-faint-color instead
    canvas_obj.translate(doc.pagesize[0] / 2, doc.pagesize[1] / 2)
    canvas_obj.rotate(45)
    canvas_obj.drawCentredString(0, 0, "THE FINANCIAL DOCTOR")
    canvas_obj.restoreState()


def _watermark_canvas_direct(c, width, height):
    """Same watermark, for canvas-based (non-Platypus) documents like the
    decorative certificate."""
    c.saveState()
    c.setFont("Helvetica-Bold", 50)
    c.setFillColor(TFD_NAVY)
    try:
        c.setFillAlpha(0.04)
    except Exception:
        pass
    c.translate(width / 2, height / 2)
    c.rotate(30)
    c.drawCentredString(0, 0, "THE FINANCIAL DOCTOR")
    c.restoreState()


def build_offer_letter_body(data: dict) -> str:
    """Plain-text editable body (paragraphs separated by a blank line) —
    what the admin sees/edits in the template-editing step before the PDF
    is generated."""
    from certificate_content import offer_duties_for

    college_clause = f" from {data['college']}" if data.get("college") else ""
    stipend_clause = f" You will be paid a stipend of Rs. {data['stipend']:,.0f} per month." if data.get("stipend") else " This is an unpaid internship."

    para1 = (
        f"We are pleased to offer you an internship position at The Financial Doctor{college_clause}, "
        f"in the {data['department']} department, for a period from "
        f"{_fmt_date(data['start_date'])} to {_fmt_date(data['end_date'])}. "
        f"During this internship, you will {offer_duties_for(data['department'])}."
        f"{stipend_clause}"
    )
    para2 = f"You will be reporting to: {data['manager_name']}, {data['manager_designation']}."
    para3 = (
        "We look forward to a productive and enriching internship experience for you at The Financial Doctor. "
        "Please confirm your acceptance of this offer."
    )
    return f"{para1}\n\n{para2}\n\n{para3}"


def generate_offer_letter_pdf(data: dict, custom_body: Optional[str] = None) -> bytes:
    """data: name, college, department, start_date, end_date, stipend,
    manager_name, manager_designation. custom_body, if given (from the
    template-editing step), replaces the auto-built paragraphs verbatim."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm, leftMargin=22 * mm, rightMargin=22 * mm)
    styles = _letter_styles()
    elements = []
    _letterhead(elements, styles, "INTERNSHIP OFFER LETTER")

    today = datetime.utcnow().strftime("%d %B %Y")
    elements.append(Paragraph(f"Date: {today}", styles["TFDMeta"]))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Dear {data['name']},", styles["TFDBody"]))

    body_text = custom_body if custom_body is not None else build_offer_letter_body(data)
    for para in body_text.split("\n\n"):
        if para.strip():
            elements.append(Paragraph(para.strip(), styles["TFDBody"]))

    _signature_block(elements, styles)
    doc.build(elements, onFirstPage=watermark_page, onLaterPages=watermark_page)
    return buf.getvalue()


def build_completion_letter_body(data: dict) -> str:
    from certificate_content import responsibilities_for

    duration = _duration_days(data["start_date"], data["end_date"])
    para1 = (
        f"This is to certify that {data['name']} successfully completed their internship "
        f"at The Financial Doctor from {_fmt_date(data['start_date'])} to {_fmt_date(data['end_date'])}, "
        f"a duration of {duration} days, in the {data['department']} department. "
        f"During this period, {data['name'].split()[0]} was involved in {responsibilities_for(data['department'])}, "
        f"under the supervision of {data['manager_name']}, {data['manager_designation']}."
    )
    para2 = (
        f"We found {data['name'].split()[0]} to be sincere, dedicated, and a valuable contributor during the internship period. "
        "We wish them the very best in their future endeavours."
    )
    paras = [para1, para2]
    if data.get("college"):
        paras.append(f"This letter is issued for submission to {data['college']}.")
    return "\n\n".join(paras)


def generate_completion_letter_pdf(data: dict, custom_body: Optional[str] = None) -> bytes:
    """data: name, college, department, start_date, end_date,
    manager_name, manager_designation"""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm, leftMargin=22 * mm, rightMargin=22 * mm)
    styles = _letter_styles()
    elements = []
    _letterhead(elements, styles, "INTERNSHIP COMPLETION LETTER")

    today = datetime.utcnow().strftime("%d %B %Y")
    elements.append(Paragraph(f"Date: {today}", styles["TFDMeta"]))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("TO WHOMSOEVER IT MAY CONCERN", ParagraphStyle("ToWhom", parent=styles["Normal"], alignment=TA_CENTER, fontSize=11)))
    elements.append(Spacer(1, 10))

    body_text = custom_body if custom_body is not None else build_completion_letter_body(data)
    for para in body_text.split("\n\n"):
        if para.strip():
            elements.append(Paragraph(para.strip(), styles["TFDBody"]))

    _signature_block(elements, styles)
    doc.build(elements, onFirstPage=watermark_page, onLaterPages=watermark_page)
    return buf.getvalue()


def default_certificate_detail(cert: dict) -> str:
    if cert["cert_type"] == "internship":
        return f"for successfully completing an internship of {cert['duration_label']} in the {cert['department']} department"
    return f"in recognition of their service in the {cert['department']} department, {cert['duration_label']}"


def _make_qr_image_reader(verify_url: str):
    img = qrcode.make(verify_url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def generate_certificate_pdf(cert: dict, verify_url: str) -> bytes:
    """Decorative certificate — border, badge, QR code. Visually distinct
    from the formal letters above.
    cert: certificate_number, person_name, cert_type ("internship"|"employee"),
          department, issue_date, duration_label (e.g. "45 days"), college (optional)
    """
    buf = io.BytesIO()
    width, height = A4[1], A4[0]  # landscape
    c = pdf_canvas.Canvas(buf, pagesize=(width, height))

    _watermark_canvas_direct(c, width, height)

    # Decorative border
    c.setStrokeColor(TFD_NAVY)
    c.setLineWidth(3)
    c.rect(12 * mm, 12 * mm, width - 24 * mm, height - 24 * mm)
    c.setStrokeColor(TFD_RED)
    c.setLineWidth(0.75)
    c.rect(15 * mm, 15 * mm, width - 30 * mm, height - 30 * mm)

    # Logo
    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, width / 2 - 30 * mm, height - 42 * mm, width=60 * mm, height=13 * mm, mask="auto")

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(TFD_NAVY)
    c.drawCentredString(width / 2, height - 52 * mm, "THE FINANCIAL DOCTOR")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.grey)
    c.drawCentredString(width / 2, height - 57 * mm, "AMFI Registered | ARN-290298")

    title = "CERTIFICATE OF INTERNSHIP" if cert["cert_type"] == "internship" else "CERTIFICATE OF EXPERIENCE"
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(TFD_RED)
    c.drawCentredString(width / 2, height - 75 * mm, title)

    c.setFont("Helvetica", 11)
    c.setFillColor(colors.HexColor("#333333"))
    c.drawCentredString(width / 2, height - 90 * mm, "This certificate is proudly presented to")

    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(TFD_NAVY)
    c.drawCentredString(width / 2, height - 102 * mm, cert["person_name"])

    detail = cert.get("custom_detail") or default_certificate_detail(cert)
    c.setFont("Helvetica", 11)
    c.setFillColor(colors.HexColor("#333333"))
    c.drawCentredString(width / 2, height - 112 * mm, detail)

    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 120 * mm, f"Issued on {_fmt_date(cert['issue_date'])}")

    # QR code (bottom-left) — links to the public verification page
    qr_buf = _make_qr_image_reader(verify_url)
    c.drawImage(ImageReader(qr_buf), 25 * mm, 20 * mm, width=25 * mm, height=25 * mm, mask="auto")
    c.setFont("Helvetica", 6)
    c.setFillColor(colors.grey)
    c.drawCentredString(37.5 * mm, 17 * mm, "Scan to verify")

    # Certificate number + signature (bottom-right)
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.grey)
    c.drawString(width - 90 * mm, 32 * mm, f"Certificate No: {cert['certificate_number']}")
    c.line(width - 90 * mm, 25 * mm, width - 25 * mm, 25 * mm)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#0E1B2C"))
    c.drawCentredString(width - 57.5 * mm, 19 * mm, "Sagar Chaturvedi")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.grey)
    c.drawCentredString(width - 57.5 * mm, 14 * mm, "Founder & CEO, The Financial Doctor")

    c.showPage()
    c.save()
    return buf.getvalue()


_CERT_CODE_MAP = {"internship": "INT", "employee": "EMP", "offer_letter": "OL", "completion_letter": "CL"}


def next_certificate_number(cert_type: str, year: int, sequence: int) -> str:
    code = _CERT_CODE_MAP.get(cert_type, "EMP")
    return f"TFD/{code}/{year}/{sequence:04d}"


def new_certificate_id() -> str:
    return str(uuid.uuid4())
