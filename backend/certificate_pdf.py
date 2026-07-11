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
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

TFD_NAVY = colors.HexColor("#024396")
TFD_CREAM = colors.HexColor("#F6F2E9")
TFD_RED = colors.HexColor("#C7102E")

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
LOGO_PATH = os.path.join(ASSETS_DIR, "tfd-main-logo.png")
INTERNSHIP_LOGO_PATH = os.path.join(ASSETS_DIR, "tfd-internship-logo.png")
WORKSPACE_LOGO_PATH = os.path.join(ASSETS_DIR, "tfd-workspace-logo.png")
SIGNATURE_PATH = os.path.join(ASSETS_DIR, "ceo-signature.png")
SEAL_PATH = os.path.join(ASSETS_DIR, "tfd-seal.png")
TEMPLATE_PATH = os.path.join(ASSETS_DIR, "certificate-template.png")

_FONTS_DIR = os.path.join(ASSETS_DIR, "fonts")
FONT_SCRIPT = "Helvetica-Oblique"
FONT_SERIF = "Times-Bold"
FONT_SERIF_ITALIC = "Times-Italic"
try:
    pdfmetrics.registerFont(TTFont("DancingScript", os.path.join(_FONTS_DIR, "dancingscript.ttf")))
    pdfmetrics.registerFont(TTFont("PlayfairDisplay", os.path.join(_FONTS_DIR, "playfair.ttf")))
    pdfmetrics.registerFont(TTFont("PlayfairDisplay-Italic", os.path.join(_FONTS_DIR, "playfair-italic.ttf")))
    FONT_SCRIPT = "DancingScript"
    FONT_SERIF = "PlayfairDisplay"
    FONT_SERIF_ITALIC = "PlayfairDisplay-Italic"
except Exception:
    pass  # falls back to built-in Times/Helvetica if font files are missing

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
    """Logo + a thin dashed rule (matching the reference letter design),
    then the bold underlined centered title. The address/AMFI line moved
    into the footer badge (see _formal_letter_decorator) to match the
    reference's clean top section."""
    if os.path.exists(LOGO_PATH):
        elements.append(Image(LOGO_PATH, width=66 * mm, height=17.2 * mm, hAlign="LEFT"))
    rule = Table([[""]], colWidths=[162 * mm], rowHeights=[1], hAlign="LEFT")
    rule.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 1, colors.HexColor("#024396"), 0, (2, 2))]))
    elements.append(Spacer(1, 2))
    elements.append(rule)
    elements.append(Spacer(1, 16))
    if title:
        elements.append(Paragraph(f"<u>{title}</u>", ParagraphStyle("LetterTitle", parent=styles["Heading2"], alignment=TA_CENTER, textColor=colors.HexColor("#0E1B2C"), fontName="Helvetica-Bold")))
    elements.append(Spacer(1, 12))


def _signature_block(elements, styles, signature_type: str = "ceo"):
    """signature_type: "ceo" (Sagar Chaturvedi, named — embeds the actual
    signature + seal images) or "authorized" (generic, unnamed, text-only)
    — used by the blank letterhead tool's signature selector."""
    elements.append(Spacer(1, 22))
    elements.append(Paragraph("For The Financial Doctor,", styles["TFDBody"]))
    if signature_type == "authorized":
        elements.append(Spacer(1, 24))
        elements.append(Paragraph("<b>Authorized Signatory</b>", styles["TFDBody"]))
        elements.append(Paragraph("The Financial Doctor", styles["TFDMeta"]))
        return

    if os.path.exists(SIGNATURE_PATH):
        elements.append(Spacer(1, 4))
        sig_row = Table(
            [[Image(SIGNATURE_PATH, width=38 * mm, height=13.3 * mm), Image(SEAL_PATH, width=18 * mm, height=18 * mm)] if os.path.exists(SEAL_PATH) else [Image(SIGNATURE_PATH, width=38 * mm, height=13.3 * mm)]],
            colWidths=[45 * mm, 22 * mm] if os.path.exists(SEAL_PATH) else [45 * mm],
            hAlign="LEFT",
        )
        sig_row.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "LEFT"), ("VALIGN", (0, 0), (-1, -1), "BOTTOM"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
        elements.append(sig_row)
    else:
        elements.append(Spacer(1, 24))
    elements.append(Paragraph("<b>Sagar Chaturvedi</b>", styles["TFDBody"]))
    elements.append(Paragraph("(Founder &amp; CEO at The Financial Doctor)", styles["TFDMeta"]))


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


def _draw_side_chevrons(c, width, height):
    """A ribbon-style red/navy strip running the full right edge of the
    page, top to bottom — alternating diagonal blocks with a small gap
    between each, matching the reference letter design's side accent."""
    c.saveState()
    strip_w = 9 * mm
    block_h = 22 * mm
    gap = 3 * mm
    step = block_h + gap
    cy = height - block_h / 2
    toggle = True
    while cy > -block_h / 2:
        c.setFillColor(TFD_RED if toggle else TFD_NAVY)
        p = c.beginPath()
        p.moveTo(width, cy + block_h / 2)
        p.lineTo(width - strip_w, cy + block_h / 2 - 5 * mm)
        p.lineTo(width - strip_w, cy - block_h / 2 - 5 * mm)
        p.lineTo(width, cy - block_h / 2)
        p.close()
        c.drawPath(p, fill=1, stroke=0)
        toggle = not toggle
        cy -= step
    c.restoreState()


def _draw_letter_header(c, width, height, title: str = "", show_internship_logo: bool = False):
    """Logo + dashed navy rule + bold underlined title, drawn directly on
    the canvas (not the Platypus flow) so it repeats identically on every
    page of a multi-page document, not just the first. The internship logo
    (when shown) sits lower on the right side, below the rule, rather than
    competing with the main logo at the very top."""
    c.saveState()
    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, 22 * mm, height - 28 * mm, width=66 * mm, height=17.2 * mm, mask="auto", preserveAspectRatio=True, anchor="sw")
    c.setStrokeColor(TFD_NAVY)
    c.setLineWidth(1)
    c.setDash(2, 2)
    c.line(22 * mm, height - 30 * mm, width - 22 * mm, height - 30 * mm)
    c.setDash()
    if title:
        c.setFont("Helvetica-Bold", 15)
        c.setFillColor(colors.HexColor("#0E1B2C"))
        tw = c.stringWidth(title, "Helvetica-Bold", 15)
        tx = width / 2
        ty = height - 42 * mm
        c.drawCentredString(tx, ty, title)
        c.line(tx - tw / 2, ty - 2.5, tx + tw / 2, ty - 2.5)
    if show_internship_logo and os.path.exists(INTERNSHIP_LOGO_PATH):
        c.drawImage(INTERNSHIP_LOGO_PATH, width - 22 * mm - 32 * mm, height - 48 * mm, width=32 * mm, height=15.8 * mm, mask="auto", preserveAspectRatio=True, anchor="sw")
    c.restoreState()


def _draw_letter_footer(c, width, extra_footer_line: str = None):
    """Full-width navy box with white contact text, a red rule directly
    above it, and (for the blank letterhead tool) a small reference line
    just above the red rule. Matches the certificate's solid footer-bar
    treatment for a consistent look across every formal document."""
    c.saveState()
    box_h = 20 * mm
    rule_y = box_h + 1.5 * mm

    if extra_footer_line:
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.grey)
        c.drawCentredString(width / 2, rule_y + 5 * mm, extra_footer_line)

    c.setFillColor(TFD_RED)
    c.rect(0, rule_y, width, 1.5 * mm, fill=1, stroke=0)

    c.setFillColor(TFD_NAVY)
    c.rect(0, 0, width, box_h, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(width / 2, box_h / 2 + 3.5, "www.thefinancialdoctor.in   |   wecare@thefinancialdoctor.in   |   07562463942")
    c.setFont("Helvetica", 8)
    c.drawCentredString(width / 2, box_h / 2 - 4.5, "AMFI Registered Distributor  ·  ARN-290298")
    c.restoreState()


def make_formal_letter_decorator(title: str = "", extra_footer_line: str = None, show_internship_logo: bool = False):
    """Factory for the combined page decorator shared by every formal TFD
    document (offer letter, completion letter, blank letterhead): watermark
    + header (logo/rule/title) + side chevrons + footer (icons/ARN badge),
    identically on every page — not just the first — so multi-page
    documents stay fully branded throughout."""
    def _decorate(canvas_obj, doc):
        watermark_page(canvas_obj, doc)
        _draw_letter_header(canvas_obj, doc.pagesize[0], doc.pagesize[1], title, show_internship_logo)
        _draw_side_chevrons(canvas_obj, doc.pagesize[0], doc.pagesize[1])
        _draw_letter_footer(canvas_obj, doc.pagesize[0], extra_footer_line)
    return _decorate


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

    duration_days = _duration_days(data["start_date"], data["end_date"])
    stipend_clause = f" with a stipend of Rs. {data['stipend']:,.0f}/month" if data.get("stipend") else ""
    paid_word = "a paid" if data.get("stipend") else "an unpaid"

    para1 = (
        f"We are pleased to offer you an internship position at <b>The Financial Doctor</b>, "
        f"in the <b>{data['department']}</b> department, for a period from "
        f"<b>{_fmt_date(data['start_date'])}</b> to <b>{_fmt_date(data['end_date'])}</b> (<b>{duration_days} days</b>). "
        f"During this internship, you will {offer_duties_for(data['department'])}."
    )
    para2 = f"This is {paid_word} internship{stipend_clause}."
    para3 = f"You will be reporting to <b>{data['manager_name']}</b>, {data['manager_designation']}."
    para4 = (
        "We look forward to a productive and enriching internship experience for you at The Financial Doctor. "
        "Please confirm your acceptance of this offer by replying to this letter or contacting us."
    )
    return f"{para1}\n\n{para2}\n\n{para3}\n\n{para4}"


def generate_offer_letter_pdf(data: dict, custom_body: Optional[str] = None) -> bytes:
    """data: name, college, department, start_date, end_date, stipend,
    manager_name, manager_designation. custom_body, if given (from the
    template-editing step), replaces the auto-built paragraphs verbatim."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=50 * mm, bottomMargin=48 * mm, leftMargin=22 * mm, rightMargin=26 * mm)
    styles = _letter_styles()
    elements = []

    elements.append(Paragraph(f"Dear <b>{data['name']}</b>,", styles["TFDBody"]))

    body_text = custom_body if custom_body is not None else build_offer_letter_body(data)
    for para in body_text.split("\n\n"):
        if para.strip():
            elements.append(Paragraph(para.strip(), styles["TFDBody"]))

    _signature_block(elements, styles)
    decorator = make_formal_letter_decorator("INTERNSHIP OFFER LETTER", show_internship_logo=True)
    doc.build(elements, onFirstPage=decorator, onLaterPages=decorator)
    return buf.getvalue()


def build_completion_letter_body(data: dict) -> str:
    from certificate_content import responsibilities_for

    duration = _duration_days(data["start_date"], data["end_date"])
    first_name = data["name"].split()[0]
    college_clause = f", a student at <b>{data['college']}</b>," if data.get("college") else ""
    para1 = (
        f"This is to certify that <b>{data['name']}</b>{college_clause} has successfully completed an internship "
        f"at <b>The Financial Doctor</b> from <b>{_fmt_date(data['start_date'])}</b> to <b>{_fmt_date(data['end_date'])}</b>, "
        f"a duration of <b>{duration} days</b>, in the <b>{data['department']}</b> department, "
        f"under the guidance of <b>{data['manager_name']}</b>, {data['manager_designation']}."
    )
    para2 = f"During this period, {first_name} {responsibilities_for(data['department'])}."
    para3 = (
        f"We found {first_name} to be sincere, dedicated, and a valuable contributor during the internship period. "
        "We wish them the very best in their future endeavours."
    )
    paras = [para1, para2, para3]
    return "\n\n".join(paras)


def generate_completion_letter_pdf(data: dict, custom_body: Optional[str] = None) -> bytes:
    """data: name, college, department, start_date, end_date,
    manager_name, manager_designation"""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=50 * mm, bottomMargin=48 * mm, leftMargin=22 * mm, rightMargin=26 * mm)
    styles = _letter_styles()
    elements = []

    elements.append(Paragraph("TO WHOMSOEVER IT MAY CONCERN", ParagraphStyle("ToWhom", parent=styles["Normal"], alignment=TA_CENTER, fontSize=11, fontName="Helvetica-Bold")))
    elements.append(Spacer(1, 10))

    body_text = custom_body if custom_body is not None else build_completion_letter_body(data)
    for para in body_text.split("\n\n"):
        if para.strip():
            elements.append(Paragraph(para.strip(), styles["TFDBody"]))

    _signature_block(elements, styles)
    decorator = make_formal_letter_decorator("INTERNSHIP COMPLETION LETTER", show_internship_logo=True)
    doc.build(elements, onFirstPage=decorator, onLaterPages=decorator)
    return buf.getvalue()


def default_certificate_detail(cert: dict) -> str:
    if cert["cert_type"] == "internship":
        return f"for successfully completing an internship of {cert['duration_label']} in the {cert['department']} department"
    if cert["cert_type"] == "achievement":
        return cert.get("duration_label") or "in recognition of their outstanding contribution to The Financial Doctor"
    end_label = "present" if cert.get("ongoing") else _fmt_date(cert["issue_date"])
    period = f", from {_fmt_date(cert['start_date'])} to {end_label}" if cert.get("start_date") else ""
    designation = cert.get("designation") or "a team member"
    return (
        f"in recognition of their valuable contribution and dedicated service as {designation} "
        f"in the {cert['department']} department at The Financial Doctor{period}"
    )


def _make_qr_image_reader(verify_url: str):
    img = qrcode.make(verify_url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf




def generate_certificate_pdf(cert: dict, verify_url: str) -> bytes:
    """Decorative certificate — the background (navy/gold ribbon medal,
    corner swirls, navy footer bar with the website URL) is the exact
    provided template image (backend/assets/certificate-template.png),
    not hand-drawn; this function only overlays the dynamic content on
    top of it.
    cert: certificate_number, person_name, cert_type ("internship"|"employee"|"achievement"),
          department, issue_date, duration_label (e.g. "45 days"), college (optional)
    """
    buf = io.BytesIO()
    width, height = A4[1], A4[0]  # landscape: 297mm x 210mm
    c = pdf_canvas.Canvas(buf, pagesize=(width, height))

    if os.path.exists(TEMPLATE_PATH):
        c.drawImage(TEMPLATE_PATH, 0, 0, width=width, height=height)
    _watermark_canvas_direct(c, width, height)

    footer_h = 28 * mm
    ribbon_w = 60 * mm

    content_cx = (ribbon_w + width) / 2  # horizontal center of the text content area (right of the ribbon)

    # Logo + brand name top area
    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, content_cx - 38 * mm, height - 30 * mm, width=76 * mm, height=19.8 * mm, mask="auto", preserveAspectRatio=True)

    # Title
    c.setFont(FONT_SERIF, 44)
    c.setFillColor(TFD_NAVY)
    c.drawCentredString(content_cx, height - 62 * mm, "CERTIFICATE")

    title = "OF INTERNSHIP" if cert["cert_type"] == "internship" else ("OF EXCELLENCE" if cert["cert_type"] == "achievement" else "OF EXPERIENCE")
    c.setFont("Helvetica", 13)
    c.setFillColor(colors.HexColor("#5C677D"))
    c.drawCentredString(content_cx, height - 70 * mm, " ".join(title))

    c.setFont("Helvetica", 11)
    c.setFillColor(colors.HexColor("#333333"))
    c.drawCentredString(content_cx, height - 85 * mm, "T H I S   C E R T I F I C A T E   I S   P R O U D L Y   P R E S E N T E D   T O")

    c.setFont(FONT_SCRIPT, 38)
    c.setFillColor(TFD_NAVY)
    c.drawCentredString(content_cx, height - 100 * mm, cert["person_name"])
    c.setStrokeColor(colors.HexColor("#B8B0A0"))
    c.setLineWidth(0.75)
    c.line(content_cx - 55 * mm, height - 104 * mm, content_cx + 55 * mm, height - 104 * mm)

    detail = cert.get("custom_detail") or default_certificate_detail(cert)
    styles = getSampleStyleSheet()
    detail_style = ParagraphStyle("CertDetail", parent=styles["Normal"], alignment=TA_CENTER, fontSize=11, leading=15, textColor=colors.HexColor("#333333"))
    detail_p = Paragraph(detail, detail_style)
    detail_p.wrapOn(c, 150 * mm, 30 * mm)
    detail_p.drawOn(c, content_cx - 75 * mm, height - 116 * mm - detail_p.height)

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.grey)
    c.drawCentredString(content_cx, height - 122 * mm - detail_p.height, f"Issued on {_fmt_date(cert['issue_date'])}")

    # Bottom row: QR + verify (left) · gold medal (center) · signature (right)
    qr_buf = _make_qr_image_reader(verify_url)
    c.drawImage(ImageReader(qr_buf), ribbon_w + 14 * mm, footer_h + 8 * mm, width=20 * mm, height=20 * mm, mask="auto")
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.grey)
    c.drawCentredString(ribbon_w + 24 * mm, footer_h + 5 * mm, "Scan to verify")
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(TFD_RED)
    c.drawCentredString(ribbon_w + 24 * mm, footer_h + 30 * mm, cert["certificate_number"])

    # Same bottom-center accent-logo slot for every certificate type — just
    # a different logo per type (internship logo for internship certs, TFD
    # Workspace logo for employee/achievement certs) so the overall layout
    # is 100% identical across the board.
    accent_logo = INTERNSHIP_LOGO_PATH if cert.get("cert_type") == "internship" else WORKSPACE_LOGO_PATH
    if os.path.exists(accent_logo):
        c.drawImage(accent_logo, width / 2 - 16 * mm, footer_h + 12 * mm, width=32 * mm, height=22 * mm, mask="auto", preserveAspectRatio=True, anchor="s")

    # Signature + seal sit side-by-side in one band directly above the
    # printed name (previously the seal's y-range overlapped the name text).
    sig_cx = width - 60 * mm
    if os.path.exists(SIGNATURE_PATH):
        c.drawImage(SIGNATURE_PATH, sig_cx - 32 * mm, footer_h + 21 * mm, width=28 * mm, height=10.7 * mm, mask="auto", preserveAspectRatio=True, anchor="s")
    if os.path.exists(SEAL_PATH):
        c.drawImage(SEAL_PATH, sig_cx + 2 * mm, footer_h + 20 * mm, width=16 * mm, height=16 * mm, mask="auto", preserveAspectRatio=True)
    c.setStrokeColor(colors.HexColor("#999999"))
    c.setLineWidth(0.6)
    c.line(sig_cx - 32 * mm, footer_h + 19 * mm, sig_cx + 18 * mm, footer_h + 19 * mm)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#0E1B2C"))
    c.drawCentredString(sig_cx - 7 * mm, footer_h + 13 * mm, "Sagar Chaturvedi")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.grey)
    c.drawCentredString(sig_cx - 7 * mm, footer_h + 9 * mm, "Founder & CEO, The Financial Doctor")

    c.showPage()
    c.save()
    return buf.getvalue()


_CERT_CODE_MAP = {"internship": "INT", "employee": "EMP", "offer_letter": "OL", "completion_letter": "CL"}


def next_certificate_number(cert_type: str, year: int, sequence: int) -> str:
    code = _CERT_CODE_MAP.get(cert_type, "EMP")
    return f"TFD/{code}/{year}/{sequence:04d}"


def new_certificate_id() -> str:
    return str(uuid.uuid4())
