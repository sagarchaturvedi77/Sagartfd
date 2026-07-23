"""Generates one branded OG share-card image PER BLOG TOPIC (12 total) —
now mostly a fallback: generate_blog_post_share_cards.py generates a real
per-POST card for every actual article, so this only still matters for
blog-other.png (the sitewide static og:image fallback in index.html and
DEFAULT_SHARE_IMAGE) and any post whose topic doesn't match a known key.

Same left-photo/right-content layout as generate_city_share_cards.py and
generate_blog_post_share_cards.py — large bold minimalist typography,
standard padding, no clutter, no ARN number on the image.

Run from repo root:
    python backend/scripts/generate_topic_share_cards.py

Outputs to frontend/public/assets/og/blog-{topic}.png (1200x630 each).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent.parent
FONTS = ROOT / "backend" / "assets" / "fonts"
ASSETS = ROOT / "frontend" / "public" / "assets"
OUT_DIR = ASSETS / "og"
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
PHOTO_W = 480
NAVY = (14, 27, 44)
CREAM = (246, 241, 232)
MUTED = (176, 189, 209)

CONTENT_X = PHOTO_W + 64
CONTENT_RIGHT = W - 64

# topic -> (accent RGB, badge label, hook line)
TOPICS = {
    "sip": ((2, 67, 150), "SIP GUIDE", "Small amounts, invested on time."),
    "lumpsum": ((2, 67, 150), "LUMPSUM", "One decision, made carefully."),
    "swp": ((15, 110, 92), "SWP / INCOME", "Your money, paying you back."),
    "financial_planning": ((184, 114, 46), "FINANCIAL PLANNING", "A goal on paper beats a hope in your head."),
    "term_insurance": ((199, 16, 46), "TERM INSURANCE", "The cover your family never has to think about."),
    "health_insurance": ((199, 16, 46), "HEALTH INSURANCE", "One hospital bill shouldn't undo ten years of saving."),
    "elss_tax_saving": ((139, 92, 246), "TAX SAVING", "Save tax. Build wealth."),
    "retirement_planning": ((184, 114, 46), "RETIREMENT", "The salary stops. The plan shouldn't."),
    "general_investing": ((2, 67, 150), "INVESTING BASICS", "Investing, explained without the jargon."),
    "awareness": ((90, 62, 32), "MARKET HISTORY", "Every crash has a lesson. Most investors skip it."),
    # Was (14, 27, 44) — identical to NAVY, making the badge/URL text
    # invisible against the navy background. Gold accent instead.
    "brand_comparison": ((216, 185, 138), "WHY TFD", "Real advice. Real numbers."),
    "other": ((216, 185, 138), "THE FINANCIAL DOCTOR", "Real advice. Real numbers."),
}


def font(path, size):
    return ImageFont.truetype(str(path), size)


def wrap_text(draw, text, font_, max_width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textbbox((0, 0), trial, font=font_)[2] <= max_width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def gradient_bg(w, h, color1, color2):
    x = np.linspace(0.0, 1.0, w, dtype=np.float32)
    y = np.linspace(0.0, 1.0, h, dtype=np.float32)
    t = (x[None, :] + y[:, None]) / 2.0
    arr = np.empty((h, w, 3), dtype=np.uint8)
    for c in range(3):
        arr[:, :, c] = (color1[c] * (1 - t) + color2[c] * t).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def make_card(accent, badge, hook):
    deep_navy = tuple(max(0, c - 8) for c in NAVY)
    warm_corner = tuple(round(NAVY[i] * 0.82 + accent[i] * 0.18) for i in range(3))
    img = gradient_bg(W, H, deep_navy, warm_corner)
    draw = ImageDraw.Draw(img)

    photo = Image.open(ASSETS / "founder" / "sagar-photo.webp").convert("RGB")
    photo = ImageOps.fit(photo, (PHOTO_W, H), method=Image.LANCZOS, centering=(0.5, 0.15))
    img.paste(photo, (0, 0))
    draw.rectangle([PHOTO_W, 0, PHOTO_W + 4, H], fill=accent)

    logo = Image.open(ASSETS / "logos" / "TFD-MAIN-LOGO.png").convert("RGBA")
    logo_w = 150
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    plate = Image.new("RGBA", (logo_w + 18, logo_h + 14), (*CREAM, 255))
    plate_mask = Image.new("L", plate.size, 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle([0, 0, plate.size[0], plate.size[1]], radius=10, fill=255)
    plate.putalpha(plate_mask)
    plate.alpha_composite(logo, (9, 7))
    img.paste(plate, (CONTENT_X, 56), plate)
    draw = ImageDraw.Draw(img)

    f_badge = font(FONTS / "notosans.ttf", 19)
    f_hook = font(FONTS / "playfair.ttf", 46)
    f_url = font(FONTS / "notosans.ttf", 21)

    content_w = CONTENT_RIGHT - CONTENT_X
    y = 56 + plate.height + 44

    draw.text((CONTENT_X, y), badge, font=f_badge, fill=accent)
    y += 40

    for line in wrap_text(draw, hook, f_hook, content_w):
        draw.text((CONTENT_X, y), line, font=f_hook, fill=CREAM)
        y += f_hook.size + 12

    draw.text((CONTENT_X, H - 72), "thefinancialdoctor.in", font=f_url, fill=accent)

    return img.convert("RGB")


def main():
    for topic, (accent, badge, hook) in TOPICS.items():
        img = make_card(accent, badge, hook)
        out_path = OUT_DIR / f"blog-{topic}.png"
        img.save(out_path, "PNG", optimize=True)
        print(f"Saved {out_path.name} ({out_path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    sys.exit(main())
