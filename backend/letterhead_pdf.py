"""Blank letterhead — same fixed header, watermark, and brand colors as
every other TFD document, but with fully admin-authored middle content.

Content uses a lightweight markdown-lite syntax rather than a full
rich-text-editor dependency on the frontend:
  **bold text**        -> bold
  - bullet line          -> bullet point (a block of consecutive "- " lines
                            becomes one bullet list)
  blank line              -> paragraph break

Auto-pagination, the header, and the watermark are all just reportlab's
normal flowing-document behavior — nothing page-specific needs to be
computed by hand. The signature block is appended after all content, so it
naturally lands on whichever page is last, never mid-document.
"""
import io
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem

from certificate_pdf import _letter_styles, _letterhead, _signature_block, watermark_page


def _parse_inline_bold(text: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)


def _make_page_decorator(letterhead_number: str):
    def _decorate(canvas_obj, doc):
        watermark_page(canvas_obj, doc)
        canvas_obj.saveState()
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.setFillColor(colors.grey)
        canvas_obj.drawCentredString(doc.pagesize[0] / 2, 12 * mm, f"{letterhead_number}  |  The Financial Doctor  |  thefinancialdoctor.in")
        canvas_obj.drawRightString(doc.pagesize[0] - 22 * mm, 12 * mm, f"Page {canvas_obj.getPageNumber()}")
        canvas_obj.restoreState()
    return _decorate


def build_letterhead_pdf(letterhead_number: str, content: str, signature_type: str = "ceo", title: str = "") -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20 * mm, bottomMargin=22 * mm, leftMargin=22 * mm, rightMargin=22 * mm)
    styles = _letter_styles()
    elements = []
    _letterhead(elements, styles, title or "")

    for block in content.split("\n\n"):
        lines = [ln for ln in block.split("\n") if ln.strip()]
        if not lines:
            continue
        if all(ln.strip().startswith("- ") for ln in lines):
            items = [ListItem(Paragraph(_parse_inline_bold(ln.strip()[2:]), styles["TFDBody"])) for ln in lines]
            elements.append(ListFlowable(items, bulletType="bullet", start="•", leftIndent=14))
            elements.append(Spacer(1, 8))
        else:
            elements.append(Paragraph(_parse_inline_bold(" ".join(lines)), styles["TFDBody"]))

    _signature_block(elements, styles, signature_type=signature_type)
    decorator = _make_page_decorator(letterhead_number)
    doc.build(elements, onFirstPage=decorator, onLaterPages=decorator)
    return buf.getvalue()
