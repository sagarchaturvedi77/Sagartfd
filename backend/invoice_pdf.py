"""Server-side invoice PDF generation — matches the reference "Invoice
sample.png" design exactly: logo + big "INVOICE" title top-right, a thin
navy/grey double rule, Invoice-to / Invoice-no blocks, an itemised table,
Sub Total / Tax / Grand Total, and a generic "Authorised Signature" line
(deliberately no CEO name or signature image — invoices are the one
document type that stays impersonal/generic, unlike certificates and
letters). Reuses the shared watermark + brand colors + logo from
certificate_pdf.py so it still feels like the same document family.
"""
import io
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from certificate_pdf import TFD_NAVY, LOGO_PATH, watermark_page, ASSETS_DIR

PAYMENT_METHOD_LABELS = {"cash": "Cash", "upi": "UPI", "bank_transfer": "Bank Transfer"}

# Helvetica (reportlab's base14 font) has no glyph for the Indian Rupee sign
# (U+20B9) — it silently renders as a missing-glyph box. Noto Sans covers it,
# so invoice amounts use this font instead. Reused under both names since we
# only have the one (variable-font) weight; reportlab just needs the family
# mapping to exist for <b> tags inside Paragraph text to resolve.
FONT_BODY = "Helvetica"
FONT_BODY_BOLD = "Helvetica-Bold"
try:
    pdfmetrics.registerFont(TTFont("NotoSans", os.path.join(ASSETS_DIR, "fonts", "notosans.ttf")))
    pdfmetrics.registerFontFamily("NotoSans", normal="NotoSans", bold="NotoSans", italic="NotoSans", boldItalic="NotoSans")
    FONT_BODY = "NotoSans"
    FONT_BODY_BOLD = "NotoSans"
except Exception:
    pass

_HEADER_H = 45 * mm
_FOOTER_H = 22 * mm


def gst_calc(amount: float, rate: float, gst_type: str) -> dict:
    """Same formula as the website's GST calculator (Calculators.jsx's
    gstCalc) — exclusive adds GST on top of `amount`; inclusive treats
    `amount` as already GST-inclusive and extracts the base backward."""
    if gst_type == "inclusive":
        total = amount
        base = total * 100 / (100 + rate)
        gst = total - base
    else:  # exclusive
        base = amount
        gst = amount * rate / 100
        total = base + gst
    return {"base": base, "gst": gst, "total": total, "half": gst / 2}


def _invoice_decorator(canvas_obj, doc):
    """Logo + INVOICE title + double rule (header), icon row + website
    (footer), and the shared faint watermark."""
    watermark_page(canvas_obj, doc)
    width, height = doc.pagesize
    c = canvas_obj
    c.saveState()

    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, 22 * mm, height - 32 * mm, width=50 * mm, height=13.1 * mm, mask="auto", preserveAspectRatio=True, anchor="sw")
    c.setFont("Helvetica-Bold", 30)
    c.setFillColor(TFD_NAVY)
    c.drawRightString(width - 22 * mm, height - 26 * mm, "INVOICE")

    c.setStrokeColor(TFD_NAVY)
    c.setLineWidth(2)
    c.line(22 * mm, height - 38 * mm, 60 * mm, height - 38 * mm)
    c.setStrokeColor(colors.HexColor("#C9C9C9"))
    c.setLineWidth(1)
    c.line(61 * mm, height - 38 * mm, width - 22 * mm, height - 38 * mm)

    # Footer: rule + icon row (phone/email left, website right)
    fy = _FOOTER_H
    c.setStrokeColor(TFD_NAVY)
    c.setLineWidth(1.2)
    c.line(22 * mm, fy, width - 22 * mm, fy)

    def icon_dot(x, cy, r=2.4 * mm):
        c.setFillColor(TFD_NAVY)
        c.circle(x, cy, r, fill=1, stroke=0)

    row_y = fy - 8 * mm
    c.setFont("Helvetica", 8.5)
    c.setFillColor(colors.HexColor("#333333"))
    icon_dot(24 * mm, row_y)
    c.drawString(24 * mm + 4.5 * mm, row_y - 2.5, "07562463942")
    icon_dot(70 * mm, row_y)
    c.drawString(70 * mm + 4.5 * mm, row_y - 2.5, "wecare@thefinancialdoctor.in")
    c.drawRightString(width - 22 * mm, row_y - 2.5, "www.thefinancialdoctor.in")

    c.restoreState()


def generate_invoice_pdf(invoice: dict) -> tuple[bytes, float, float, float]:
    """invoice: invoice_number, invoice_date, bill_to_name, bill_to_address,
    bill_to_phone, items ([{description, quantity, rate}]), gst_percent,
    gst_type ("inclusive"|"exclusive"), gst_number, payment_method
    Returns (pdf_bytes, subtotal, gst_amount, total)."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=_HEADER_H + 6 * mm, bottomMargin=_FOOTER_H + 20 * mm, leftMargin=22 * mm, rightMargin=22 * mm)

    base_styles = getSampleStyleSheet()
    normal = ParagraphStyle("InvNormal", parent=base_styles["Normal"], fontName=FONT_BODY, fontSize=10, leading=14)
    bold = ParagraphStyle("InvBold", parent=normal, fontName=FONT_BODY_BOLD, fontSize=11)
    right = ParagraphStyle("InvRight", parent=normal, alignment=TA_RIGHT)
    right_bold = ParagraphStyle("InvRightBold", parent=bold, alignment=TA_RIGHT)

    elements = []

    raw_subtotal = sum(item["quantity"] * item["rate"] for item in invoice["items"])
    gst_percent = invoice.get("gst_percent", 0) or 0
    gst_type = invoice.get("gst_type", "exclusive")
    breakdown = gst_calc(raw_subtotal, gst_percent, gst_type) if gst_percent else {"base": raw_subtotal, "gst": 0, "total": raw_subtotal, "half": 0}

    invoice_date_label = date.fromisoformat(invoice["invoice_date"]).strftime("%d %B %Y")
    meta_left = [Paragraph("Invoice to :", normal), Paragraph(invoice["bill_to_name"], bold)]
    if invoice.get("bill_to_phone"):
        meta_left.append(Paragraph(invoice["bill_to_phone"], normal))
    if invoice.get("bill_to_address"):
        meta_left.append(Paragraph(invoice["bill_to_address"], normal))
    if invoice.get("gst_number"):
        meta_left.append(Paragraph(f"GSTIN: {invoice['gst_number']}", normal))

    meta_right = [
        Paragraph(f"<b>Invoice no : {invoice['invoice_number']}</b>", right),
        Paragraph(invoice_date_label, right),
    ]

    meta_table = Table([[meta_left, meta_right]], colWidths=[100 * mm, 66 * mm])
    meta_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    elements.append(meta_table)
    elements.append(Spacer(1, 16))

    rows = [["NO", "DESCRIPTION", "QTY", "PRICE", "TOTAL"]]
    for i, item in enumerate(invoice["items"], start=1):
        amount = item["quantity"] * item["rate"]
        rows.append([str(i), item["description"], str(item["quantity"]), f"{item['rate']:,.2f}", f"{amount:,.2f}"])

    table = Table(rows, colWidths=[14 * mm, 82 * mm, 18 * mm, 26 * mm, 26 * mm])
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.75, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white]),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 12))

    summary_rows = [[Paragraph("Sub Total :", right), Paragraph(f"₹{breakdown['base']:,.2f}", right)]]
    if gst_percent:
        summary_rows.append([Paragraph(f"Tax {gst_percent:.0f}% :", right), Paragraph(f"₹{breakdown['gst']:,.2f}", right)])
    summary_rows.append([Paragraph("<b>GRAND TOTAL :</b>", right_bold), Paragraph(f"<b>₹{breakdown['total']:,.2f}</b>", right_bold)])
    summary_table = Table(summary_rows, colWidths=[130 * mm, 36 * mm])
    summary_table.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    if invoice.get("payment_method"):
        elements.append(Paragraph(f"<b>PAYMENT METHOD :</b> {PAYMENT_METHOD_LABELS.get(invoice['payment_method'], invoice['payment_method'])}", normal))
        elements.append(Spacer(1, 14))

    elements.append(Paragraph("<b>Thank you for business with us!</b>", normal))
    elements.append(Spacer(1, 36))

    sig_table = Table([[Paragraph("<b>Authorised Signature</b>", right_bold)]], colWidths=[166 * mm])
    elements.append(sig_table)

    doc.build(elements, onFirstPage=_invoice_decorator, onLaterPages=_invoice_decorator)
    return buf.getvalue(), breakdown["base"], breakdown["gst"], breakdown["total"]
