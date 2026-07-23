"""One-off script: generates one branded OG share-card image PER BLOG
TOPIC (12 total) instead of a single generic card reused for all 150
posts. Same founder-photo + logo composition as generate_share_card.py,
but each topic gets its own accent colour, badge label and hook line, so
a SIP article's shared link looks visibly different from a tax-saving or
market-history one instead of all 150 looking identical.

True per-POST unique images (one per article) would need a render-at-
request-time image service — out of scope here; per-topic is the
practical middle ground between "one generic image" and "150 unique
ones", using the same category grouping already shown in the blog's
category filter strip.

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


CENTER_X = W // 2  # 600 — see generate_city_share_cards.py's SAFE_W comment:
# WhatsApp (and most other clients) crop link-preview images to roughly a
# centered square regardless of the declared 1200x630 og:image dimensions,
# so every essential element (logo, hook text, name/ARN, URL) is centered
# here instead of the previous left-aligned-next-to-a-left-side-photo-panel
# layout, which put almost everything in the zone a square crop discards.


def center_text(draw, cx, y, text, font_, fill):
    bbox = draw.textbbox((0, 0), text, font=font_)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=font_, fill=fill)
    return bbox[3] - bbox[1]


def make_card(accent, badge, hook_lines, punch):
    img = Image.new("RGB", (W, H), NAVY)

    glow = Image.new("RGB", (W, H), NAVY)
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([CENTER_X - 420, -260, CENTER_X + 420, 360], fill=accent)
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    img = Image.blend(img, glow, 0.55)

    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 6], fill=accent)

    logo = Image.open(ASSETS / "logos" / "TFD-MAIN-LOGO.png").convert("RGBA")
    logo_w = 220
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    plate = Image.new("RGBA", (logo_w + 26, logo_h + 18), (246, 241, 232, 255))
    plate_mask = Image.new("L", plate.size, 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle([0, 0, plate.size[0], plate.size[1]], radius=12, fill=255)
    plate.putalpha(plate_mask)
    plate.alpha_composite(logo, (13, 9))
    img.paste(plate, (CENTER_X - plate.width // 2, 40), plate)

    f_badge = font(FONTS / "notosans.ttf", 18)
    f_hook = font(FONTS / "playfair.ttf", 42)
    f_punch = font(FONTS / "playfair-italic.ttf", 42)
    f_name = font(FONTS / "notosans.ttf", 24)
    f_small = font(FONTS / "notosans.ttf", 18)
    f_tag = font(FONTS / "notosans.ttf", 21)

    y = 40 + logo_h + 18 + 22
    bbox = draw.textbbox((0, 0), badge, font=f_badge)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rounded_rectangle([CENTER_X - bw / 2 - 14, y, CENTER_X + bw / 2 + 14, y + bh + 20], radius=8, fill=accent)
    center_text(draw, CENTER_X, y + 9, badge, f_badge, CREAM)
    y += bh + 20 + 26

    center_text(draw, CENTER_X, y, hook_lines[0], f_hook, CREAM)
    y += 52
    center_text(draw, CENTER_X, y, hook_lines[1], f_hook, CREAM)
    y += 52
    accent_soft = tuple(min(255, c + 70) for c in accent)
    center_text(draw, CENTER_X, y, punch, f_punch, accent_soft)
    y += 66

    # A small circular founder portrait replaces the old full-height left
    # side panel — it stays inside the centered safe zone alongside the
    # name/credentials instead of occupying crop-vulnerable outer space.
    photo_size = 56
    photo = Image.open(ASSETS / "founder" / "sagar-photo.webp").convert("RGB")
    photo = ImageOps.fit(photo, (photo_size, photo_size), method=Image.LANCZOS, centering=(0.5, 0.15))
    photo_mask = Image.new("L", (photo_size, photo_size), 0)
    ImageDraw.Draw(photo_mask).ellipse([0, 0, photo_size, photo_size], fill=255)
    name_w = draw.textbbox((0, 0), "Sagar Chaturvedi", font=f_name)[2]
    small_w = draw.textbbox((0, 0), "AMFI Registered · ARN-290298", font=f_small)[2]
    text_block_w = max(name_w, small_w)
    group_w = photo_size + 14 + text_block_w
    group_x0 = CENTER_X - group_w / 2
    img.paste(photo, (int(group_x0), int(y)), photo_mask)
    draw.text((group_x0 + photo_size + 14, y - 2), "Sagar Chaturvedi", font=f_name, fill=CREAM)
    draw.text((group_x0 + photo_size + 14, y + 28), "AMFI Registered · ARN-290298", font=f_small, fill=MUTED)

    pill_text = "thefinancialdoctor.in"
    bbox = draw.textbbox((0, 0), pill_text, font=f_tag)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pill_pad_x, pill_pad_y = 22, 11
    pill_w, pill_h = tw + pill_pad_x * 2, th + pill_pad_y * 2
    pill_y = H - 60
    draw.rounded_rectangle([CENTER_X - pill_w / 2, pill_y, CENTER_X + pill_w / 2, pill_y + pill_h], radius=pill_h // 2, outline=accent_soft, width=2)
    center_text(draw, CENTER_X, pill_y + pill_pad_y - 2, pill_text, f_tag, accent_soft)

    return img


def main():
    for topic, (accent, badge, hook_lines, punch) in TOPICS.items():
        img = make_card(accent, badge, hook_lines, punch)
        out_path = OUT_DIR / f"blog-{topic}.png"
        img.save(out_path, "PNG", optimize=True)
        print(f"Saved {out_path.name} ({out_path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    sys.exit(main())
