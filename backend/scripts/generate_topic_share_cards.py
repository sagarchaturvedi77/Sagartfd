"""One-off script: generates one branded OG share-card image PER BLOG
TOPIC (12 total) instead of a single generic card reused for all 150
posts — each topic gets its own accent colour, badge label and hook line,
so a SIP article's shared link looks visibly different from a tax-saving
or market-history one.

Design iterated through feedback: earlier version made Sagar's photo a
small 56px circle to keep it inside WhatsApp's square-crop safe zone.
Per explicit follow-up ("photo bada, professional dikhna chahiye"), the
photo is now a large, prominent circular portrait — centered, so it still
survives a square crop (unlike the original full-height LEFT-side panel,
which WhatsApp's crop cut off entirely — that's why this isn't simply
reverted to the very first version).

True per-POST unique images (one per article) would need a render-at-
request-time image service — out of scope here; per-topic remains the
practical middle ground.

Run from repo root:
    python backend/scripts/generate_topic_share_cards.py

Outputs to frontend/public/assets/og/blog-{topic}.png (1200x630 each).
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent.parent
FONTS = ROOT / "backend" / "assets" / "fonts"
ASSETS = ROOT / "frontend" / "public" / "assets"
OUT_DIR = ASSETS / "og"
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
NAVY = (14, 27, 44)
CREAM = (246, 241, 232)
MUTED = (176, 189, 209)
CENTER_X = W // 2

# topic -> (accent RGB, badge label, [hook line 1, hook line 2], italic punch line)
TOPICS = {
    "sip": ((2, 67, 150), "SIP GUIDE", ["Small amounts,", "invested on time."], "That's the whole strategy."),
    "lumpsum": ((2, 67, 150), "LUMPSUM", ["One decision,", "made carefully."], "Not one made in a hurry."),
    "swp": ((15, 110, 92), "SWP / INCOME", ["Your money,", "paying you back."], "On a schedule you set."),
    "financial_planning": ((184, 114, 46), "FINANCIAL PLANNING", ["A goal on paper", "beats a hope in your head."], "Let's write yours down."),
    "term_insurance": ((199, 16, 46), "TERM INSURANCE", ["The cover your family", "never has to think about."], "Until they need it most."),
    "health_insurance": ((199, 16, 46), "HEALTH INSURANCE", ["One hospital bill", "shouldn't undo ten years of saving."], "Cover it properly."),
    "elss_tax_saving": ((139, 92, 246), "TAX SAVING", ["Save tax.", "Build wealth."], "One decision, two outcomes."),
    "retirement_planning": ((184, 114, 46), "RETIREMENT", ["The salary stops.", "The plan shouldn't."], "Start the plan today."),
    "general_investing": ((2, 67, 150), "INVESTING BASICS", ["Investing, explained", "without the jargon."], "In plain Hindi, English, or both."),
    "awareness": ((90, 62, 32), "MARKET HISTORY", ["Every crash has a lesson.", "Most investors skip it."], "We don't."),
    "brand_comparison": ((14, 27, 44), "WHY TFD", ["Real advice.", "Real numbers."], "No hidden agenda."),
    "other": ((14, 27, 44), "THE FINANCIAL DOCTOR", ["Real advice.", "Real numbers."], "No hidden agenda."),
}


def font(path, size):
    return ImageFont.truetype(str(path), size)


def center_text(draw, cx, y, text, font_, fill):
    bbox = draw.textbbox((0, 0), text, font=font_)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=font_, fill=fill)
    return bbox[3] - bbox[1]


def make_card(accent, badge, hook_lines, punch):
    accent_soft = tuple(min(255, c + 70) for c in accent)
    img = Image.new("RGB", (W, H), NAVY)

    glow = Image.new("RGB", (W, H), NAVY)
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([CENTER_X - 440, -260, CENTER_X + 440, 340], fill=accent)
    glow = glow.filter(ImageFilter.GaussianBlur(150))
    img = Image.blend(img, glow, 0.5).convert("RGBA")
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 6], fill=accent_soft)

    # Logo, centered top (small — the photo is the star here).
    logo = Image.open(ASSETS / "logos" / "TFD-MAIN-LOGO.png").convert("RGBA")
    logo_w = 158
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    plate = Image.new("RGBA", (logo_w + 20, logo_h + 14), (*CREAM, 255))
    plate_mask = Image.new("L", plate.size, 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle([0, 0, plate.size[0], plate.size[1]], radius=10, fill=255)
    plate.putalpha(plate_mask)
    plate.alpha_composite(logo, (10, 7))
    img.alpha_composite(plate, (CENTER_X - plate.width // 2, 26))

    # Large, professional circular portrait — centered, so (unlike the
    # original full-height left-side panel) it survives a WhatsApp square
    # crop instead of being the exact thing the crop cuts off.
    photo_size = 168
    photo_top = 26 + plate.height + 20
    photo = Image.open(ASSETS / "founder" / "sagar-photo.webp").convert("RGB")
    photo = ImageOps.fit(photo, (photo_size, photo_size), method=Image.LANCZOS, centering=(0.5, 0.18))
    ring_pad = 7
    ring_size = photo_size + ring_pad * 2
    ring = Image.new("RGBA", (ring_size, ring_size), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([0, 0, ring_size, ring_size], fill=(*accent_soft, 255))
    photo_mask = Image.new("L", (photo_size, photo_size), 0)
    ImageDraw.Draw(photo_mask).ellipse([0, 0, photo_size, photo_size], fill=255)
    img.alpha_composite(ring, (CENTER_X - ring_size // 2, photo_top))
    img.paste(photo, (CENTER_X - photo_size // 2, photo_top + ring_pad), photo_mask)
    draw = ImageDraw.Draw(img)

    f_name = font(FONTS / "notosans.ttf", 24)
    f_small = font(FONTS / "notosans.ttf", 16)
    f_badge = font(FONTS / "notosans.ttf", 17)
    f_hook = font(FONTS / "playfair.ttf", 36)
    f_punch = font(FONTS / "playfair-italic.ttf", 36)
    f_tag = font(FONTS / "notosans.ttf", 19)

    y = photo_top + ring_size + 14
    center_text(draw, CENTER_X, y, "Sagar Chaturvedi", f_name, CREAM)
    y += 32
    center_text(draw, CENTER_X, y, "AMFI Registered Mutual Fund Distributor · ARN-290298", f_small, MUTED)
    y += 32

    bbox = draw.textbbox((0, 0), badge, font=f_badge)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rounded_rectangle([CENTER_X - bw / 2 - 14, y, CENTER_X + bw / 2 + 14, y + bh + 18], radius=8, fill=accent)
    center_text(draw, CENTER_X, y + 9, badge, f_badge, CREAM)
    y += bh + 18 + 22

    center_text(draw, CENTER_X, y, hook_lines[0], f_hook, CREAM)
    y += 44
    center_text(draw, CENTER_X, y, hook_lines[1], f_hook, CREAM)
    y += 44
    center_text(draw, CENTER_X, y, punch, f_punch, accent_soft)

    pill_text = "thefinancialdoctor.in"
    bbox = draw.textbbox((0, 0), pill_text, font=f_tag)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pill_pad_x, pill_pad_y = 22, 11
    pill_w, pill_h = tw + pill_pad_x * 2, th + pill_pad_y * 2
    pill_y = H - 56
    draw.rounded_rectangle([CENTER_X - pill_w / 2, pill_y, CENTER_X + pill_w / 2, pill_y + pill_h], radius=pill_h // 2, outline=accent_soft, width=2)
    center_text(draw, CENTER_X, pill_y + pill_pad_y - 2, pill_text, f_tag, accent_soft)

    return img.convert("RGB")


def main():
    for topic, (accent, badge, hook_lines, punch) in TOPICS.items():
        img = make_card(accent, badge, hook_lines, punch)
        out_path = OUT_DIR / f"blog-{topic}.png"
        img.save(out_path, "PNG", optimize=True)
        print(f"Saved {out_path.name} ({out_path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    sys.exit(main())
