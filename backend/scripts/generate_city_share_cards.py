"""One-off script: generates a branded OG share-card image PER CITY/STATE
PAGE.

An earlier version of this script tried literal landmark silhouettes
(Gateway of India, Hawa Mahal, etc.) drawn from simple PIL shapes at low
opacity so a square WhatsApp crop wouldn't lose real information. In
practice, low-opacity fills of small overlapping rectangles/polygons on a
dark navy background just blend into one indistinct grey blob — none of
the 15 hand-drawn "landmarks" were actually recognisable, and worse, they
all looked the same regardless of which city. Replaced with a more
reliable design: each city/state gets its own accent colour (the exact
same palette + assignment CityLandingPage.jsx uses for the live page, so
the shared card and the page it links to are visually consistent) and a
large, soft, city-initial letterform watermark instead of a failed
micro-illustration — legible, elegant, and genuinely different per city
without needing hand-tuned artwork per landmark.

Overlay spec (as requested):
  - Headline: "Trusted Mutual Fund & Wealth Management Services in {City}"
  - Sub-line: "Now servicing investors across {City} & nearby regions"
  - AMFI Registered + ARN-290298 badge
  - Logo + thefinancialdoctor.in
  - "Book Free Portfolio Review" button graphic
  - Everything centered in a safe zone a square crop won't cut off

Run from repo root:
    python backend/scripts/generate_city_share_cards.py

Outputs to frontend/public/assets/og/city-{slug}.png (1200x630 each).
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
FONTS = ROOT / "backend" / "assets" / "fonts"
ASSETS = ROOT / "frontend" / "public" / "assets"
OUT_DIR = ASSETS / "og"
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
NAVY = (14, 27, 44)
CREAM = (246, 241, 232)
MUTED = (176, 189, 209)

# Identical palette + cycling order to CityLandingPage.jsx's CITY_ACCENTS /
# accentFor() — keeps the shared card and the live page it links to
# visually consistent instead of picking an unrelated colour.
ACCENTS = [(2, 67, 150), (184, 114, 46), (15, 110, 92), (217, 177, 92), (46, 127, 199), (108, 99, 255), (34, 197, 94), (139, 92, 246)]

CENTER_X = W // 2


def font(path, size):
    return ImageFont.truetype(str(path), size)


def center_text(draw, cx, y, text, font_, fill):
    bbox = draw.textbbox((0, 0), text, font=font_)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=font_, fill=fill)
    return bbox[3] - bbox[1]


def make_card(city_name, accent):
    accent_soft = tuple(min(255, c + 60) for c in accent)
    img = Image.new("RGB", (W, H), NAVY)

    # Centered colour glow, tuned to this city's accent.
    glow = Image.new("RGB", (W, H), NAVY)
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([CENTER_X - 460, -280, CENTER_X + 460, 340], fill=accent)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    img = Image.blend(img, glow, 0.5)

    # Large, soft city-initial letterform watermark — sits low/behind
    # everything, well clear of the text column, so it reads as a design
    # flourish rather than competing content (and can't create the
    # "overlapping" look the previous silhouette attempt had).
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    initial = (city_name[0] or "T").upper()
    f_watermark = font(FONTS / "playfair.ttf", 520)
    wm_draw = ImageDraw.Draw(overlay)
    bbox = wm_draw.textbbox((0, 0), initial, font=f_watermark)
    ww, wh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    wm_draw.text((W - ww - 40, H - wh - 20), initial, font=f_watermark, fill=(*accent_soft, 40))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 6], fill=accent_soft)

    logo = Image.open(ASSETS / "logos" / "TFD-MAIN-LOGO.png").convert("RGBA")
    logo_w = 230
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    plate = Image.new("RGBA", (logo_w + 26, logo_h + 18), (*CREAM, 255))
    plate_mask = Image.new("L", plate.size, 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle([0, 0, plate.size[0], plate.size[1]], radius=12, fill=255)
    plate.putalpha(plate_mask)
    plate.alpha_composite(logo, (13, 9))
    img.paste(plate, (CENTER_X - plate.width // 2, 40), plate)

    f_headline = font(FONTS / "playfair.ttf", 42)
    f_sub = font(FONTS / "notosans.ttf", 21)
    f_badge = font(FONTS / "notosans.ttf", 18)
    f_btn = font(FONTS / "notosans.ttf", 21)
    f_url = font(FONTS / "notosans.ttf", 20)

    y = 40 + logo_h + 18 + 26
    headline_lines = ["Trusted Mutual Fund &", "Wealth Management", f"Services in {city_name}"]
    for line in headline_lines:
        center_text(draw, CENTER_X, y, line, f_headline, CREAM)
        y += 50
    y += 10
    center_text(draw, CENTER_X, y, f"Now servicing investors across {city_name} & nearby regions.", f_sub, MUTED)
    y += 44

    badge_text = "AMFI REGISTERED · ARN-290298"
    bbox = draw.textbbox((0, 0), badge_text, font=f_badge)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rounded_rectangle([CENTER_X - bw / 2 - 13, y, CENTER_X + bw / 2 + 13, y + bh + 18], radius=8, outline=accent_soft, width=2)
    center_text(draw, CENTER_X, y + 9, badge_text, f_badge, accent_soft)

    btn_y = H - 92
    btn_text = "Book Free Portfolio Review"
    bbox = draw.textbbox((0, 0), btn_text, font=f_btn)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rounded_rectangle([CENTER_X - bw / 2 - 22, btn_y, CENTER_X + bw / 2 + 22, btn_y + bh + 26], radius=(bh + 26) // 2, fill=(199, 16, 46))
    center_text(draw, CENTER_X, btn_y + 13, btn_text, f_btn, CREAM)

    center_text(draw, CENTER_X, H - 34, "thefinancialdoctor.in", f_url, accent_soft)

    return img


def main():
    src = (ROOT / "frontend" / "src" / "data" / "cityPages.js").read_text(encoding="utf-8")
    entries = re.findall(r'slug:\s*"([^"]+)".*?name:\s*"([^"]+)"', src, re.S)

    made = 0
    for i, (slug, name) in enumerate(entries):
        accent = ACCENTS[i % len(ACCENTS)]
        img = make_card(name, accent)
        out_path = OUT_DIR / f"city-{slug}.png"
        img.save(out_path, "PNG", optimize=True)
        made += 1
    print(f"Generated {made} city share cards.")


if __name__ == "__main__":
    sys.exit(main())
