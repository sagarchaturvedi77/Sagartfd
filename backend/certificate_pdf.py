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
AUTHORIZED_SIGNATURE_PALAK_PATH = os.path.join(ASSETS_DIR, "authorized-signature-palak.png")
SEAL_PATH = os.path.join(ASSETS_DIR, "tfd-seal.png")
TEMPLATE_PATH = os.path.join(ASSETS_DIR, "certificate-template.png")
LETTERHEAD_TEMPLATE_PATH = os.path.join(ASSETS_DIR, "tfd-letterhead.png")

_FONTS_DIR = os.path.join(ASSETS_DIR, "fonts")
FONT_SCRIPT = "Helvetica-Oblique"
FONT_SERIF = "Times-Bold"
FONT_SERIF_ITALIC = "Times-Italic"
FONT_HINDI = "Helvetica"  # falls back to no Devanagari rendering if NotoSans is missing
try:
    pdfmetrics.registerFont(TTFont("DancingScript", os.path.join(_FONTS_DIR, "dancingscript.ttf")))
    pdfmetrics.registerFont(TTFont("PlayfairDisplay", os.path.join(_FONTS_DIR, "playfair.ttf")))
    pdfmetrics.registerFont(TTFont("PlayfairDisplay-Italic", os.path.join(_FONTS_DIR, "playfair-italic.ttf")))
    FONT_SCRIPT = "DancingScript"
    FONT_SERIF = "PlayfairDisplay"
    FONT_SERIF_ITALIC = "PlayfairDisplay-Italic"
except Exception:
    pass  # falls back to built-in Times/Helvetica if font files are missing
try:
    pdfmetrics.registerFont(TTFont("NotoSans", os.path.join(_FONTS_DIR, "notosans.ttf")))
    FONT_HINDI = "NotoSans"
except Exception:
    pass

COMPANY_ADDRESS = "1st Floor, New Bus Stand, Sekdakhedi Road, Sehore, MP - 466001"
COMPANY_FOOTER = "The Financial Doctor | AMFI Registered | ARN-290298 | www.thefinancialdoctor.in"


def _title_case_name(name: Optional[str]) -> Optional[str]:
    """Auto-capitalizes the first letter of every word in a person's name
    (e.g. 'sagar CHATURVEDI' -> 'Sagar Chaturvedi'), regardless of how it
    was typed on the application form or admin panel."""
    if not name:
        return name
    return " ".join(name.split()).title()


def _upper_text(text: Optional[str]) -> Optional[str]:
    """College/institute names print in full caps on letters, regardless
    of how they were typed."""
    if not text:
        return text
    return " ".join(text.split()).upper()


def _duration_days(start: str, end: str) -> int:
    s = date.fromisoformat(start)
    e = date.fromisoformat(end)
    return (e - s).days + 1


def _fmt_date(d: str) -> str:
    return date.fromisoformat(d).strftime("%d %B %Y")


MUTUAL_FUND_DISCLAIMER = (
    "Disclaimer: Mutual Fund investments are subject to market risks. Please read all scheme related "
    "documents carefully before investing. Past performance is not indicative of future returns. "
    "The Financial Doctor (AMFI-registered Mutual Fund Distributor, ARN-290298) does not guarantee any "
    "returns and is not liable for any investment decision taken on the basis of this communication. "
    "This document is for informational purposes only and does not constitute investment, tax, or legal advice."
)


def _letter_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("TFDTitle", parent=styles["Heading1"], alignment=TA_CENTER, textColor=TFD_NAVY, fontSize=16, spaceAfter=4))
    styles.add(ParagraphStyle("TFDSub", parent=styles["Normal"], alignment=TA_CENTER, textColor=colors.grey, fontSize=9))
    styles.add(ParagraphStyle("TFDBody", parent=styles["Normal"], alignment=TA_JUSTIFY, fontSize=11, leading=16, spaceAfter=10))
    styles.add(ParagraphStyle("TFDMeta", parent=styles["Normal"], fontSize=10, textColor=colors.grey))
    styles.add(ParagraphStyle("TFDDisclaimer", parent=styles["Normal"], alignment=TA_JUSTIFY, fontSize=7, leading=9.5, textColor=colors.grey, fontName="Helvetica-Oblique"))
    styles.add(ParagraphStyle("TFDClauseTitle", parent=styles["Normal"], fontSize=10.5, leading=13, textColor=TFD_NAVY, fontName=FONT_HINDI, spaceBefore=8, spaceAfter=2))
    styles.add(ParagraphStyle("TFDClauseBody", parent=styles["Normal"], alignment=TA_JUSTIFY, fontSize=9, leading=12.5, fontName="Helvetica", spaceAfter=1))
    styles.add(ParagraphStyle("TFDClauseHindi", parent=styles["Normal"], alignment=TA_JUSTIFY, fontSize=9, leading=13.5, textColor=colors.HexColor("#444444"), fontName=FONT_HINDI, spaceAfter=6))
    styles.add(ParagraphStyle("TFDHindiBody", parent=styles["Normal"], alignment=TA_JUSTIFY, fontSize=10, leading=15, fontName=FONT_HINDI, spaceAfter=8))
    styles.add(ParagraphStyle("TFDDetailLabel", parent=styles["Normal"], fontSize=8.5, fontName=FONT_HINDI, textColor=colors.HexColor("#333333")))
    styles.add(ParagraphStyle("TFDMetaHindi", parent=styles["TFDMeta"], fontName=FONT_HINDI))
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
    """signature_type:
      "ceo"              — Sagar Chaturvedi, named, embeds the actual
                            signature + seal images.
      "authorized_palak"  — Palak Mehta's actual signature, named as
                            Authorized Signatory.
      "authorized"        — generic, unnamed, text-only, no image (this is
                            the one that must stay blank — e.g. invoices).
    Used by the blank letterhead tool's signature selector."""
    elements.append(Spacer(1, 22))
    elements.append(Paragraph("For The Financial Doctor,", styles["TFDBody"]))

    if signature_type == "authorized":
        elements.append(Spacer(1, 24))
        elements.append(Paragraph("<b>Authorized Signatory</b>", styles["TFDBody"]))
        elements.append(Paragraph("The Financial Doctor", styles["TFDMeta"]))
        return

    if signature_type == "authorized_palak":
        if os.path.exists(AUTHORIZED_SIGNATURE_PALAK_PATH):
            elements.append(Spacer(1, 4))
            # authorized-signature-palak.png's own aspect ratio is ~1.4:1 —
            # same left-aligned signature+seal table layout as the CEO
            # block, so it sits directly above the name instead of
            # defaulting to reportlab's center alignment for a bare Image.
            sig_row = Table(
                [[Image(AUTHORIZED_SIGNATURE_PALAK_PATH, width=25 * mm, height=18 * mm), Image(SEAL_PATH, width=18 * mm, height=18 * mm)] if os.path.exists(SEAL_PATH) else [Image(AUTHORIZED_SIGNATURE_PALAK_PATH, width=25 * mm, height=18 * mm)]],
                colWidths=[31 * mm, 22 * mm] if os.path.exists(SEAL_PATH) else [31 * mm],
                hAlign="LEFT",
            )
            sig_row.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "LEFT"), ("VALIGN", (0, 0), (-1, -1), "BOTTOM"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
            elements.append(sig_row)
        else:
            elements.append(Spacer(1, 24))
        elements.append(Paragraph("<b>Palak Mehta</b>", styles["TFDBody"]))
        elements.append(Paragraph("(Authorized Signatory, The Financial Doctor)", styles["TFDMeta"]))
        return

    if os.path.exists(SIGNATURE_PATH):
        elements.append(Spacer(1, 4))
        # ceo-signature.png's own aspect ratio is ~3.09:1 (straightened/
        # cropped asset) — width/height here match it directly instead of
        # reportlab's Image() stretching it to an unrelated box.
        sig_row = Table(
            [[Image(SIGNATURE_PATH, width=46 * mm, height=14.9 * mm), Image(SEAL_PATH, width=18 * mm, height=18 * mm)] if os.path.exists(SEAL_PATH) else [Image(SIGNATURE_PATH, width=46 * mm, height=14.9 * mm)]],
            colWidths=[52 * mm, 22 * mm] if os.path.exists(SEAL_PATH) else [52 * mm],
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


def _draw_letterhead_background(c, width, height):
    """Full-page background — the actual provided letterhead template
    (backend/assets/tfd-letterhead.png: logo, dashed rule, watermark, right-
    edge ribbon, and footer contact bar all baked in), not hand-drawn
    shapes. Falls back to a plain white page if the asset is missing."""
    if os.path.exists(LETTERHEAD_TEMPLATE_PATH):
        c.drawImage(LETTERHEAD_TEMPLATE_PATH, 0, 0, width=width, height=height)


def _draw_letter_header(c, width, height, title: str = "", show_internship_logo: bool = False):
    """Bold underlined title, drawn directly on the canvas (not the
    Platypus flow) so it repeats identically on every page of a multi-page
    document. Logo/dashed-rule are part of the template background now, not
    drawn here."""
    c.saveState()
    if title:
        c.setFont("Helvetica-Bold", 15)
        c.setFillColor(colors.HexColor("#0E1B2C"))
        tw = c.stringWidth(title, "Helvetica-Bold", 15)
        tx = width / 2
        ty = height - 42 * mm
        c.drawCentredString(tx, ty, title)
        c.line(tx - tw / 2, ty - 2.5, tx + tw / 2, ty - 2.5)
    c.restoreState()


def _draw_letter_footer(c, width, extra_footer_line: str = None, verify_url: str = None, doc_number: str = None, show_internship_logo: bool = False, show_workspace_logo: bool = False):
    """The template's own footer bar (contact info, dashed rule, right-edge
    ribbon) is part of the background image now — this only draws the
    optional extras that sit *above* it, in the blank space between body
    content and the template's dashed line (~30mm from the bottom):
    a small reference line (blank letterhead's letterhead_number), a QR +
    certificate_number bottom-left (completion letter only, reusing the
    intern's actual certificate's own QR — not a separately minted one),
    and the TFD internship logo bottom-right (offer/completion letters)."""
    c.saveState()
    baseline_y = 37 * mm

    if extra_footer_line:
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.grey)
        c.drawCentredString(width / 2, baseline_y, extra_footer_line)

    if verify_url and doc_number:
        qr_size = 15 * mm
        qr_x = 22 * mm
        qr_y = baseline_y
        qr_buf = _make_qr_image_reader(verify_url)
        c.drawImage(ImageReader(qr_buf), qr_x, qr_y, width=qr_size, height=qr_size, mask="auto")
        c.setFont("Helvetica", 6.5)
        c.setFillColor(colors.grey)
        c.drawCentredString(qr_x + qr_size / 2, qr_y - 3.5, "Scan to verify")
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(TFD_RED)
        c.drawString(qr_x + qr_size + 3.5 * mm, qr_y + qr_size / 2 - 3, doc_number)

    if show_internship_logo and os.path.exists(INTERNSHIP_LOGO_PATH):
        c.drawImage(INTERNSHIP_LOGO_PATH, width - 22 * mm - 32 * mm, baseline_y, width=32 * mm, height=15.8 * mm, mask="auto", preserveAspectRatio=True, anchor="s")
    elif show_workspace_logo and os.path.exists(WORKSPACE_LOGO_PATH):
        # tfd-workspace-logo.png is taller than wide (~1.45:1 portrait), unlike
        # the internship logo it shares this footer slot with — width-driven
        # sizing here would make it huge, so this one is height-driven instead.
        c.drawImage(WORKSPACE_LOGO_PATH, width - 22 * mm - 19 * mm, baseline_y, width=19 * mm, height=15.8 * mm, mask="auto", preserveAspectRatio=True, anchor="s")
    c.restoreState()


def make_formal_letter_decorator(title: str = "", extra_footer_line: str = None, show_internship_logo: bool = False, verify_url: str = None, doc_number: str = None, show_workspace_logo: bool = False):
    """Factory for the combined page decorator shared by every formal TFD
    document (offer letter, completion letter, blank letterhead): the real
    letterhead template as a full-page background + title + any extras
    (internship logo / reference line / QR+number), identically on every
    page — not just the first — so multi-page documents stay fully
    branded throughout."""
    def _decorate(canvas_obj, doc):
        _draw_letterhead_background(canvas_obj, doc.pagesize[0], doc.pagesize[1])
        _draw_letter_header(canvas_obj, doc.pagesize[0], doc.pagesize[1], title)
        _draw_letter_footer(canvas_obj, doc.pagesize[0], extra_footer_line, verify_url, doc_number, show_internship_logo, show_workspace_logo)
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
    if data.get("stipend_type") == "performance_based":
        stipend_clause = " with a performance-based stipend"
        paid_word = "a paid"
    elif data.get("stipend_type") == "unpaid":
        stipend_clause = ""
        paid_word = "an unpaid"
    elif data.get("stipend"):
        stipend_clause = f" with a stipend of Rs. {data['stipend']:,.0f}/month"
        paid_word = "a paid"
    else:
        stipend_clause = ""
        paid_word = "an unpaid"

    para1 = (
        f"We are pleased to offer you an internship position at <b>The Financial Doctor</b>, "
        f"in the <b>{data['department']}</b> department, for a period from "
        f"<b>{_fmt_date(data['start_date'])}</b> to <b>{_fmt_date(data['end_date'])}</b> (<b>{duration_days} days</b>). "
        f"During this internship, you will {offer_duties_for(data['department'])}."
    )
    para2 = f"This is {paid_word} internship{stipend_clause}."
    designation_clause = f", {data['manager_designation']}" if data.get("manager_designation") else ""
    para3 = f"You will be reporting to <b>{_title_case_name(data['manager_name'])}</b>{designation_clause}."
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

    elements.append(Paragraph(f"Dear <b>{_title_case_name(data['name'])}</b>,", styles["TFDBody"]))

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
    name = _title_case_name(data["name"])
    first_name = name.split()[0]
    college_clause = f", a student at <b>{_upper_text(data['college'])}</b>," if data.get("college") else ""
    designation_clause = f", {data['manager_designation']}" if data.get("manager_designation") else ""
    para1 = (
        f"This is to certify that <b>{name}</b>{college_clause} has successfully completed an internship "
        f"at <b>The Financial Doctor</b> from <b>{_fmt_date(data['start_date'])}</b> to <b>{_fmt_date(data['end_date'])}</b>, "
        f"a duration of <b>{duration} days</b>, in the <b>{data['department']}</b> department, "
        f"under the guidance of <b>{_title_case_name(data['manager_name'])}</b>{designation_clause}."
    )
    para2 = f"During this period, {first_name} {responsibilities_for(data['department'])}."
    para3 = (
        f"We found {first_name} to be sincere, dedicated, and a valuable contributor during the internship period. "
        "We wish them the very best in their future endeavours."
    )
    paras = [para1, para2, para3]
    return "\n\n".join(paras)


def generate_completion_letter_pdf(data: dict, custom_body: Optional[str] = None, verify_url: Optional[str] = None, certificate_number: Optional[str] = None) -> bytes:
    """data: name, college, department, start_date, end_date,
    manager_name, manager_designation.

    verify_url/certificate_number, when given, are the intern's *actual*
    certificate's own QR/number (looked up by the caller) — reused here
    as-is, not a separately minted one, so the letter simply points at the
    same already-public, already-verifiable certificate record."""
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
    decorator = make_formal_letter_decorator(
        "INTERNSHIP COMPLETION LETTER", show_internship_logo=True,
        verify_url=verify_url, doc_number=certificate_number,
    )
    doc.build(elements, onFirstPage=decorator, onLaterPages=decorator)
    return buf.getvalue()


def generate_internship_program_letter_pdf(data: dict, verify_url: Optional[str] = None, certificate_number: Optional[str] = None) -> bytes:
    """The TFD Internship gamified program's own completion letter —
    deliberately NOT reusing build_completion_letter_body/generate_completion_letter_pdf,
    which assume a manager_name/manager_designation and a KYC-flow department
    (see certificate_content.py's DEPARTMENTS) that this self-paced,
    automatically-graded program doesn't have. Issued alongside the
    certificate at graduation, reusing that same certificate's QR/number.

    data: name, college (optional), track_label, start_date, end_date,
    duration_days, percentage."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=50 * mm, bottomMargin=48 * mm, leftMargin=22 * mm, rightMargin=26 * mm)
    styles = _letter_styles()
    elements = []

    elements.append(Paragraph("TO WHOMSOEVER IT MAY CONCERN", ParagraphStyle("ToWhom", parent=styles["Normal"], alignment=TA_CENTER, fontSize=11, fontName="Helvetica-Bold")))
    elements.append(Spacer(1, 10))

    name = _title_case_name(data["name"])
    first_name = name.split()[0]
    college_clause = f", a student at <b>{_upper_text(data['college'])}</b>," if data.get("college") else ""
    para1 = (
        f"This is to certify that <b>{name}</b>{college_clause} has successfully completed the "
        f"<b>TFD Internship Program</b> in the <b>{data['track_label']}</b> track, from "
        f"<b>{_fmt_date(data['start_date'])}</b> to <b>{_fmt_date(data['end_date'])}</b>, a duration of "
        f"<b>{data['duration_days']} days</b>, achieving a program score of <b>{data['percentage']}%</b>."
    )
    para2 = (
        f"During this period, {first_name} completed a series of practical, task-based assignments and weekly "
        f"assessments designed to build real-world professional skills in {data['track_label'].lower()} — "
        "skills applicable at any organisation, not specific to any one industry."
    )
    para3 = (
        f"We found {first_name} to be sincere and dedicated throughout the program, and wish them the very "
        "best in their future endeavours."
    )
    for para in (para1, para2, para3):
        elements.append(Paragraph(para, styles["TFDBody"]))

    _signature_block(elements, styles)
    decorator = make_formal_letter_decorator(
        "TFD INTERNSHIP LETTER", show_internship_logo=True,
        verify_url=verify_url, doc_number=certificate_number,
    )
    doc.build(elements, onFirstPage=decorator, onLaterPages=decorator)
    return buf.getvalue()


def generate_internship_report_pdf(data: dict) -> bytes:
    """A compiled PDF of the student's own day-by-day report entries (what
    they logged themselves via the Report page) — a snapshot taken at
    graduation time, not live-synced afterward. Not publicly verifiable
    (no QR) since it's the student's own self-written log, not an
    institutional claim.

    data: name, intern_id, track_label, start_date, end_date,
    entries: [{date, what_learned, what_did}, ...] (already sorted)."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=50 * mm, bottomMargin=48 * mm, leftMargin=22 * mm, rightMargin=26 * mm)
    styles = _letter_styles()
    elements = []

    name = _title_case_name(data["name"])
    elements.append(Paragraph(
        f"<b>{name}</b> ({data['intern_id']}) &middot; {data['track_label']} Track &middot; "
        f"{_fmt_date(data['start_date'])} to {_fmt_date(data['end_date'])}",
        styles["TFDMeta"],
    ))
    elements.append(Spacer(1, 12))

    entry_style = ParagraphStyle("ReportEntryLabel", parent=styles["Normal"], fontSize=9, fontName="Helvetica-Bold", textColor=TFD_NAVY, spaceBefore=2)
    entry_body = ParagraphStyle("ReportEntryBody", parent=styles["Normal"], fontSize=9.5, leading=13, textColor=colors.HexColor("#333333"), spaceAfter=8)
    date_style = ParagraphStyle("ReportEntryDate", parent=styles["Normal"], fontSize=10.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#0E1B2C"), spaceBefore=10, spaceAfter=3)

    entries = data.get("entries") or []
    if not entries:
        elements.append(Paragraph("No report entries were logged during this program.", styles["TFDBody"]))
    for e in entries:
        elements.append(Paragraph(_fmt_date(e["date"]), date_style))
        if e.get("what_learned"):
            elements.append(Paragraph("What I Learned", entry_style))
            elements.append(Paragraph(e["what_learned"].replace("\n", "<br/>"), entry_body))
        if e.get("what_did"):
            elements.append(Paragraph("What I Did", entry_style))
            elements.append(Paragraph(e["what_did"].replace("\n", "<br/>"), entry_body))

    decorator = make_formal_letter_decorator("INTERNSHIP REPORT", show_internship_logo=True)
    doc.build(elements, onFirstPage=decorator, onLaterPages=decorator)
    return buf.getvalue()


def build_experience_letter_body(data: dict) -> str:
    """data: name, employee_id, designation, department, start_date, end_date."""
    name = _title_case_name(data["name"])
    first_name = name.split()[0]
    tenure_months = data.get("tenure_months")
    tenure_clause = f" (a period of {tenure_months} month{'s' if tenure_months != 1 else ''})" if tenure_months else ""
    para1 = (
        f"This is to certify that <b>{name}</b> (Employee ID: <b>{data['employee_id']}</b>) was employed with "
        f"<b>The Financial Doctor</b> as <b>{data['designation'] or 'a team member'}</b> in the "
        f"<b>{data['department'] or 'organization'}</b> department, from <b>{_fmt_date(data['start_date'])}</b> to "
        f"<b>{_fmt_date(data['end_date'])}</b>{tenure_clause}."
    )
    para2 = (
        f"During this period, {first_name} demonstrated professionalism, sincerity, and a strong commitment to their "
        "responsibilities. Their conduct and performance throughout their tenure with us were found to be satisfactory."
    )
    para3 = f"We wish {first_name} the very best in all their future endeavours."
    return f"{para1}\n\n{para2}\n\n{para3}"


def generate_experience_letter_pdf(data: dict, verify_url: Optional[str] = None, certificate_number: Optional[str] = None) -> bytes:
    """data: name, employee_id, designation, department, start_date, end_date,
    tenure_months (optional, for the parenthetical duration clause).

    verify_url here is deliberately the employee-ID public verification page
    (/verify/{employee_id}), not a certificate-number lookup — the QR is
    meant to double as the same verification link already printed on the
    employee's ID/visiting card, showing their active/former-employee
    status rather than just this one document."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=50 * mm, bottomMargin=48 * mm, leftMargin=22 * mm, rightMargin=26 * mm)
    styles = _letter_styles()
    elements = []

    elements.append(Paragraph("TO WHOMSOEVER IT MAY CONCERN", ParagraphStyle("ToWhom", parent=styles["Normal"], alignment=TA_CENTER, fontSize=11, fontName="Helvetica-Bold")))
    elements.append(Spacer(1, 10))

    body_text = build_experience_letter_body(data)
    for para in body_text.split("\n\n"):
        if para.strip():
            elements.append(Paragraph(para.strip(), styles["TFDBody"]))

    _signature_block(elements, styles)
    decorator = make_formal_letter_decorator(
        "EXPERIENCE LETTER", show_internship_logo=False,
        verify_url=verify_url, doc_number=certificate_number,
    )
    doc.build(elements, onFirstPage=decorator, onLaterPages=decorator)
    return buf.getvalue()


# ── Employee Agreement ──────────────────────────────────────────────────
# The 10 bilingual clauses, verbatim from the terms every employee has
# always been shown (previously only as a client-side print page) — moving
# to a server-generated PDF must not silently change what they agreed to.
AGREEMENT_CLAUSES = [
    ("1. Confidentiality &amp; Data Protection / गोपनीयता एवं डेटा सुरक्षा",
     "Employee shall maintain strict confidentiality of all company data, client information, financial records, and proprietary methods. Any breach shall attract legal action under IT Act 2000.",
     "कर्मचारी कंपनी के सभी डेटा, क्लाइंट जानकारी, वित्तीय रिकॉर्ड और मालिकाना तरीकों की सख्त गोपनीयता बनाए रखेगा।"),
    ("2. Legal Action for Data Theft &amp; Fraud / डेटा चोरी या धोखाधड़ी पर कानूनी कार्रवाई",
     "Any data theft, client poaching, or financial fraud will result in immediate termination and legal prosecution under BNS (Bharatiya Nyaya Sanhita) and IT Act.",
     "किसी भी डेटा चोरी, क्लाइंट पोचिंग या वित्तीय धोखाधड़ी पर तत्काल बर्खास्तगी और BNS तथा IT Act के तहत कानूनी कार्रवाई होगी।"),
    ("3. SEBI &amp; AMFI Guidelines Compliance / SEBI एवं AMFI नियमों का पालन",
     "Employee must comply with all SEBI/AMFI regulations. No guaranteed return promises to clients. Misrepresentation will lead to termination and regulatory complaint.",
     "कर्मचारी को SEBI/AMFI के सभी नियमों का पालन करना अनिवार्य है। ग्राहकों को गारंटीड रिटर्न का वादा नहीं किया जाएगा।"),
    ("4. Company Assets / कंपनी की संपत्ति",
     "All company-provided devices (phone, SIM, laptop) remain company property. Must be returned on separation in working condition. Loss/damage will be deducted from final settlement.",
     "कंपनी द्वारा दिए गए सभी उपकरण कंपनी की संपत्ति रहेंगे। नौकरी छोड़ने पर वापस करने होंगे।"),
    ("5. Workplace Discipline &amp; Dress Code / अनुशासन एवं ड्रेस कोड",
     "Professional dress code mandatory. Punctuality expected. Three consecutive unauthorized absences will be treated as voluntary resignation.",
     "प्रोफेशनल ड्रेस कोड अनिवार्य है। समय पर आना अपेक्षित है। तीन लगातार अनधिकृत अनुपस्थिति को स्वैच्छिक इस्तीफा माना जाएगा।"),
    ("6. Salary &amp; Payroll Rules / वेतन से जुड़े नियम",
     "Salary credited to bank account only. No cash advances. Salary date: 7th of every month. Deductions for unauthorized leaves apply as per policy.",
     "वेतन केवल बैंक खाते में जमा होगा। कोई नकद अग्रिम नहीं। वेतन तिथि: हर महीने की 7 तारीख।"),
    ("7. Probation &amp; Performance / प्रोबेशन एवं प्रदर्शन",
     "First 3 months are probation period. Monthly targets must be met. Failure to meet targets for 2 consecutive months may result in termination.",
     "पहले 3 महीने प्रोबेशन पीरियड हैं। मासिक लक्ष्य पूरे करने होंगे।"),
    ("8. Notice Period &amp; Exit / नोटिस पीरियड",
     "30 days written notice required for resignation. Sudden exit without notice will forfeit pending salary and attract recovery of training costs if within 6 months.",
     "इस्तीफे के लिए 30 दिन का लिखित नोटिस आवश्यक है। बिना नोटिस छोड़ने पर बकाया वेतन जब्त होगा।"),
    ("9. Non-Compete &amp; Non-Solicitation / प्रतिस्पर्धा निषेध",
     "For 1 year after leaving, employee shall not join/start a competing financial advisory business within 50km of Sehore or solicit existing clients.",
     "छोड़ने के 1 साल तक कर्मचारी सहोर के 50 किमी के भीतर प्रतिस्पर्धी व्यवसाय नहीं करेगा।"),
    ("10. POSH Act Compliance / यौन उत्पीड़न रोकथाम",
     "Company follows Prevention of Sexual Harassment (POSH) Act 2013. Any misconduct will be dealt with strictly as per law.",
     "कंपनी POSH Act 2013 का पालन करती है। किसी भी दुर्व्यवहार पर कानून के अनुसार सख्त कार्रवाई होगी।"),
]


def _remove_signature_background(img_bytes: bytes) -> bytes:
    """Employee-uploaded signature photos are ordinary photos/scans of ink
    on paper, not pre-cleaned static assets like the CEO/authorized-signatory
    PNGs — so unlike those, background removal happens here, dynamically,
    at generation time. Converts to grayscale and fades brightness above
    ~150 down to fully transparent by 220, keeping dark ink opaque; a linear
    ramp (not a hard cutoff) avoids a jagged cutout edge around the strokes."""
    from PIL import Image as PILImage, ImageOps

    img = PILImage.open(io.BytesIO(img_bytes)).convert("RGBA")
    gray = ImageOps.grayscale(img)
    lo, hi = 150, 220

    def _alpha(p):
        if p <= lo:
            return 255
        if p >= hi:
            return 0
        return int(255 * (hi - p) / (hi - lo))

    mask = gray.point(_alpha)
    img.putalpha(mask)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _fitted_image(img_bytes: bytes, max_width: float, max_height: float, hAlign: str = "LEFT"):
    """An Image flowable sized to fit inside max_width x max_height while
    preserving the source image's own aspect ratio — needed for employee
    photo/signature uploads, which (unlike the fixed static assets elsewhere
    in this file) can be any resolution or orientation."""
    from PIL import Image as PILImage

    src_w, src_h = PILImage.open(io.BytesIO(img_bytes)).size
    ratio = min(max_width / src_w, max_height / src_h)
    w, h = src_w * ratio, src_h * ratio
    img = Image(io.BytesIO(img_bytes), width=w, height=h)
    img.hAlign = hAlign
    return img


class _NumberedCanvas(pdf_canvas.Canvas):
    """Draws "Page X of Y" on every page — reportlab renders pages one at a
    time and doesn't know the final page count until the document is done,
    so this buffers every page (via the reportlab-cookbook showPage/save
    override) and stamps the total in a second pass at save() time. Used
    only for the employee agreement, whose length varies (2-3 pages
    depending on content), unlike the mostly-one-page certificates/letters
    elsewhere in this file."""
    def __init__(self, *args, **kwargs):
        pdf_canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_page_number(total_pages)
            pdf_canvas.Canvas.showPage(self)
        pdf_canvas.Canvas.save(self)

    def _draw_page_number(self, total_pages):
        # Left side of the footer strip — the workspace logo (see
        # show_workspace_logo) already occupies the right side at this
        # same baseline, on the agreement this is used for.
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.grey)
        self.drawString(22 * mm, 37 * mm, f"Page {self.getPageNumber()} of {total_pages}")
        self.restoreState()


def generate_employee_agreement_pdf(
    data: dict, photo_bytes: Optional[bytes] = None, signature_bytes: Optional[bytes] = None,
    aadhar_front_bytes: Optional[bytes] = None, aadhar_back_bytes: Optional[bytes] = None,
) -> bytes:
    """data: name, father_name, designation, dob, contact_no, address,
    aadhar_masked, pan_number, employee_id, join_date, signed_at (GPS string),
    signed_date, signed_time.

    signature_bytes is the employee's own uploaded signature image — passed
    through _remove_signature_background before being placed above their
    printed name, mirroring how _signature_block already places the CEO's
    signature above his. There is no PAN card *image* anywhere in the system
    (onboarding only ever collects a PAN *number*, not a scan) — only the
    Aadhaar front/back scans exist as uploaded files."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=50 * mm, bottomMargin=48 * mm, leftMargin=20 * mm, rightMargin=20 * mm)
    styles = _letter_styles()
    elements = []

    name = _title_case_name(data["name"])

    header_cells = [Paragraph(
        f"<b>Name / नाम:</b> {name}<br/><b>Father's Name / पिता का नाम:</b> {data.get('father_name') or '-'}<br/>"
        f"<b>Designation / पद:</b> {data.get('designation') or 'Employee'}<br/><b>Date of Birth / जन्मतिथि:</b> {data.get('dob') or '-'}<br/>"
        f"<b>Contact / संपर्क:</b> {data.get('contact_no') or '-'}<br/><b>Employee ID:</b> {data['employee_id']}<br/>"
        f"<b>Aadhar / आधार:</b> {data.get('aadhar_masked') or '-'}<br/><b>PAN / पैन:</b> {data.get('pan_number') or '-'}<br/>"
        f"<b>Joining Date / कार्यारंभ तिथि:</b> {data.get('join_date') or '-'}",
        styles["TFDDetailLabel"],
    )]
    if photo_bytes:
        header_cells.append(_fitted_image(photo_bytes, 28 * mm, 34 * mm, hAlign="RIGHT"))
    else:
        header_cells.append(Paragraph("", styles["TFDDetailLabel"]))

    header_table = Table([header_cells], colWidths=[122 * mm, 34 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("BOX", (1, 0), (1, 0), 1, colors.HexColor("#024396")) if photo_bytes else ("BOX", (1, 0), (1, 0), 0, colors.white),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>Address / पता:</b> {data.get('address') or '-'}", styles["TFDDetailLabel"]))
    elements.append(Spacer(1, 10))

    if aadhar_front_bytes or aadhar_back_bytes:
        elements.append(Paragraph("Aadhaar Card / आधार कार्ड", styles["TFDMetaHindi"]))
        elements.append(Spacer(1, 4))
        aadhar_imgs = [img for img in (
            _fitted_image(aadhar_front_bytes, 70 * mm, 44 * mm, hAlign="LEFT") if aadhar_front_bytes else None,
            _fitted_image(aadhar_back_bytes, 70 * mm, 44 * mm, hAlign="LEFT") if aadhar_back_bytes else None,
        ) if img]
        aadhar_row = Table([aadhar_imgs], colWidths=[76 * mm] * len(aadhar_imgs), hAlign="LEFT")
        aadhar_row.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "LEFT"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
        elements.append(aadhar_row)
        elements.append(Spacer(1, 10))

    elements.append(Paragraph("TERMS AND CONDITIONS / नियम एवं शर्तें", ParagraphStyle(
        "AgreementSectionHead", parent=styles["Heading3"], textColor=TFD_NAVY, fontSize=11.5, spaceAfter=6, fontName=FONT_HINDI,
    )))
    for title, body_en, body_hi in AGREEMENT_CLAUSES:
        elements.append(Paragraph(title, styles["TFDClauseTitle"]))
        elements.append(Paragraph(body_en, styles["TFDClauseBody"]))
        elements.append(Paragraph(body_hi, styles["TFDClauseHindi"]))

    elements.append(Spacer(1, 6))
    elements.append(Paragraph("DECLARATION / घोषणा", ParagraphStyle(
        "AgreementSectionHead2", parent=styles["Heading3"], textColor=TFD_NAVY, fontSize=11.5, spaceAfter=6, fontName=FONT_HINDI,
    )))
    father = data.get("father_name") or "-"
    elements.append(Paragraph(
        f"I, <b>{name}</b>, S/o D/o <b>{father}</b>, hereby declare that I have read, understood, and agree to all "
        "the terms and conditions mentioned above. I accept this employment offer voluntarily and commit to abide "
        "by company policies.", styles["TFDBody"],
    ))
    elements.append(Paragraph(
        f"मैं, <b>{name}</b>, पुत्र/पुत्री <b>{father}</b>, घोषणा करता/करती हूँ कि मैंने उपरोक्त सभी नियम एवं शर्तें पढ़ ली हैं, "
        "समझ ली हैं और मैं इनसे सहमत हूँ।", styles["TFDHindiBody"],
    ))
    if data.get("signed_at") or data.get("signed_date"):
        elements.append(Paragraph(
            f"<b>Signed at / हस्ताक्षर स्थान:</b> {data.get('signed_at') or 'N/A'}<br/>"
            f"<b>Date &amp; Time / दिनांक एवं समय:</b> {data.get('signed_date') or ''} {data.get('signed_time') or ''}",
            styles["TFDMetaHindi"],
        ))

    elements.append(Spacer(1, 24))

    # Employee signature (left) and the company's (right), side by side rather
    # than stacked — _signature_block already knows how to build the CEO
    # block, so it's called against a scratch list and dropped into the
    # right-hand table cell instead of appending straight to the page.
    employee_cell = [Paragraph("Employee Signature / कर्मचारी हस्ताक्षर", styles["TFDMetaHindi"])]
    if signature_bytes:
        try:
            cleaned = _remove_signature_background(signature_bytes)
            employee_cell.append(Spacer(1, 4))
            employee_cell.append(_fitted_image(cleaned, 46 * mm, 18 * mm, hAlign="LEFT"))
        except Exception:
            employee_cell.append(Spacer(1, 22))
    else:
        employee_cell.append(Spacer(1, 22))
    employee_cell.append(Paragraph(f"<b>{name}</b>", styles["TFDBody"]))
    employee_cell.append(Paragraph("Employee / कर्मचारी", styles["TFDMetaHindi"]))

    ceo_cell = []
    _signature_block(ceo_cell, styles, "ceo")

    sig_table = Table([[employee_cell, ceo_cell]], colWidths=[78 * mm, 78 * mm])
    sig_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    elements.append(sig_table)

    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        "This is a computer-generated agreement, valid without a physical stamp when digitally issued.",
        ParagraphStyle("AgreementFooterNote", parent=styles["Normal"], alignment=TA_CENTER, fontSize=7.5, textColor=colors.grey),
    ))

    decorator = make_formal_letter_decorator("EMPLOYMENT AGREEMENT", show_workspace_logo=True)
    doc.build(elements, onFirstPage=decorator, onLaterPages=decorator, canvasmaker=_NumberedCanvas)
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
    c.drawCentredString(content_cx, height - 100 * mm, _title_case_name(cert["person_name"]))
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

    # Signature sits directly above the printed name/title (centered on the
    # same x as the text below it, not the sig+seal midpoint); the seal
    # floats to its right as a separate stamp, not sharing the signature's
    # centering. ceo-signature.png was re-processed (straightened, bolded,
    # cropped) so its own aspect ratio now drives SIG_W/SIG_H here.
    sig_cx = width - 75 * mm
    SIG_W, SIG_H = 56 * mm, 18.2 * mm
    SEAL_SIZE = 23 * mm
    sig_left = sig_cx - SIG_W / 2
    seal_left = sig_left + SIG_W + 8 * mm
    line_y = footer_h + 17 * mm
    text_cx = sig_cx
    if os.path.exists(SIGNATURE_PATH):
        c.drawImage(SIGNATURE_PATH, sig_left, line_y + 2 * mm, width=SIG_W, height=SIG_H, mask="auto", preserveAspectRatio=True, anchor="s")
    if os.path.exists(SEAL_PATH):
        c.drawImage(SEAL_PATH, seal_left, line_y + 2 * mm, width=SEAL_SIZE, height=SEAL_SIZE, mask="auto", preserveAspectRatio=True, anchor="s")
    c.setStrokeColor(colors.HexColor("#999999"))
    c.setLineWidth(0.6)
    c.line(sig_left, line_y, sig_left + SIG_W, line_y)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#0E1B2C"))
    c.drawCentredString(text_cx, footer_h + 13 * mm, "Sagar Chaturvedi")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.grey)
    c.drawCentredString(text_cx, footer_h + 9 * mm, "Founder & CEO, The Financial Doctor")

    c.showPage()
    c.save()
    return buf.getvalue()


def new_certificate_id() -> str:
    return str(uuid.uuid4())
