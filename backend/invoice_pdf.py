"""Server-side invoice PDF generation — reuses the same letterhead,
watermark, brand colors and signature block as certificate_pdf.py, so
every TFD-issued document (letters, certificates, invoices) looks like
one consistent system rather than several one-off designs.
"""
import io
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from certificate_pdf import TFD_NAVY, _letter_styles, _letterhead, _signature_block, watermark_page

PAYMENT_METHOD_LABELS = {"cash": "Cash", "upi": "UPI", "bank_transfer": "Bank Transfer"}


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


def generate_invoice_pdf(invoice: dict) -> tuple[bytes, float, float, float]:
    """invoice: invoice_number, invoice_date, bill_to_name, bill_to_address,
    bill_to_phone, items ([{description, quantity, rate}]), gst_percent,
    gst_type ("inclusive"|"exclusive"), gst_number, payment_method
    Returns (pdf_bytes, subtotal, gst_amount, total)."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm, leftMargin=22 * mm, rightMargin=22 * mm)
    styles = _letter_styles()
    styles.add(ParagraphStyle("InvMetaRight", parent=styles["TFDMeta"], alignment=TA_RIGHT))

    elements = []
    _letterhead(elements, styles, "TAX INVOICE" if invoice.get("gst_number") else "INVOICE")

    raw_subtotal = sum(item["quantity"] * item["rate"] for item in invoice["items"])
    gst_percent = invoice.get("gst_percent", 0) or 0
    gst_type = invoice.get("gst_type", "exclusive")
    breakdown = gst_calc(raw_subtotal, gst_percent, gst_type) if gst_percent else {"base": raw_subtotal, "gst": 0, "total": raw_subtotal, "half": 0}

    meta_rows = [
        [Paragraph(f"<b>Invoice #:</b> {invoice['invoice_number']}", styles["TFDMeta"]),
         Paragraph(f"<b>Date:</b> {date.fromisoformat(invoice['invoice_date']).strftime('%d %B %Y')}", styles["InvMetaRight"])],
        [Paragraph(f"<b>Bill To:</b> {invoice['bill_to_name']}", styles["TFDMeta"]),
         Paragraph(f"<b>GSTIN:</b> {invoice['gst_number']}" if invoice.get("gst_number") else "", styles["InvMetaRight"])],
    ]
    elements.append(Table(meta_rows, colWidths=[95 * mm, 75 * mm]))
    if invoice.get("bill_to_address"):
        elements.append(Paragraph(invoice["bill_to_address"], styles["TFDMeta"]))
    if invoice.get("bill_to_phone"):
        elements.append(Paragraph(f"Phone: {invoice['bill_to_phone']}", styles["TFDMeta"]))
    elements.append(Spacer(1, 14))

    rows = [["#", "Description", "Qty", "Rate (₹)", "Amount (₹)"]]
    for i, item in enumerate(invoice["items"], start=1):
        amount = item["quantity"] * item["rate"]
        rows.append([str(i), item["description"], str(item["quantity"]), f"{item['rate']:,.2f}", f"{amount:,.2f}"])

    summary_start = len(rows)
    rows.append(["", "", "", "Subtotal" + (" (excl. GST)" if gst_type == "exclusive" or not gst_percent else " (of GST-inclusive total)"), f"{breakdown['base']:,.2f}"])
    if gst_percent:
        rows.append(["", "", "", f"CGST ({gst_percent / 2:.1f}%)", f"{breakdown['half']:,.2f}"])
        rows.append(["", "", "", f"SGST ({gst_percent / 2:.1f}%)", f"{breakdown['half']:,.2f}"])
    rows.append(["", "", "", "Total Payable", f"₹{breakdown['total']:,.2f}"])

    table = Table(rows, colWidths=[10 * mm, 78 * mm, 15 * mm, 32 * mm, 35 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TFD_NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, summary_start - 1), 0.5, colors.HexColor("#E2D8C2")),
        ("FONTNAME", (3, -1), (4, -1), "Helvetica-Bold"),
        ("LINEABOVE", (3, -1), (4, -1), 1, TFD_NAVY),
    ]))
    elements.append(table)

    if invoice.get("payment_method"):
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(f"<b>Payment Method:</b> {PAYMENT_METHOD_LABELS.get(invoice['payment_method'], invoice['payment_method'])}", styles["TFDMeta"]))

    _signature_block(elements, styles)
    doc.build(elements, onFirstPage=watermark_page, onLaterPages=watermark_page)
    return buf.getvalue(), breakdown["base"], breakdown["gst"], breakdown["total"]
