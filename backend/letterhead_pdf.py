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

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem

from certificate_pdf import _letter_styles, _signature_block, make_formal_letter_decorator, MUTUAL_FUND_DISCLAIMER


def _parse_inline_bold(text: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)


def build_letterhead_pdf(letterhead_number: str, content: str, signature_type: str = "ceo", title: str = "", include_disclaimer: bool = False) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=50 * mm, bottomMargin=48 * mm, leftMargin=22 * mm, rightMargin=26 * mm)
    styles = _letter_styles()
    elements = []

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

    if include_disclaimer:
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(MUTUAL_FUND_DISCLAIMER, styles["TFDDisclaimer"]))

    decorator = make_formal_letter_decorator(title or "", extra_footer_line=letterhead_number)
    doc.build(elements, onFirstPage=decorator, onLaterPages=decorator)
    return buf.getvalue()
