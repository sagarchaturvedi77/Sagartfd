"""One-off script: generates a branded OG share-card image PER CITY/STATE
PAGE — full-bleed founder photo on the LEFT, all content on the RIGHT.

Redesigned per explicit direction to permanently move away from the
previous cluttered layout (background ghost-text city name, service-tag
pill row, ARN badge, decorative rings) toward large, bold, minimalist
typography with standard padding and no overlapping/messy elements. ARN
number removed from the image entirely (still shown on-page/in footer,
just not needed to clutter a share card).

Known trade-off, accepted per explicit direction: WhatsApp square-crops
link-preview images to the canvas's horizontal center, discarding roughly
the outer 24% on each side — a left-edge photo panel will be partially
cropped there specifically (LinkedIn/Telegram/direct links show the full
1200x630 image untouched). Earlier in this project's history the layout
was moved AWAY from a left photo panel for exactly this reason; this
redesign moves back to it as a deliberate, informed choice.

Run from repo root:
    python backend/scripts/generate_city_share_cards.py
"""
import re
import sys
from pathlib import Path

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

# Identical palette + cycling order to CityLandingPage.jsx's CITY_ACCENTS.
ACCENTS = [(2, 67, 150), (184, 114, 46), (15, 110, 92), (217, 177, 92), (46, 127, 199), (108, 99, 255), (34, 197, 94), (139, 92, 246)]

CONTENT_X = PHOTO_W + 64  # left edge of the right-hand content column
CONTENT_RIGHT = W - 64
CONTENT_CX = CONTENT_X + (CONTENT_RIGHT - CONTENT_X) // 2


def font(path, size):
    return ImageFont.truetype(str(path), size)


def center_text(draw, cx, y, text, font_, fill):
    bbox = draw.textbbox((0, 0), text, font=font_)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=font_, fill=fill)
    return bbox[3] - bbox[1]


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


def make_card(city_name, accent, is_state=False):
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)

    # Full-bleed photo, left third of the canvas — face-safe crop.
    photo = Image.open(ASSETS / "founder" / "sagar-photo.webp").convert("RGB")
    photo = ImageOps.fit(photo, (PHOTO_W, H), method=Image.LANCZOS, centering=(0.5, 0.15))
    img.paste(photo, (0, 0))
    draw.rectangle([PHOTO_W, 0, PHOTO_W + 4, H], fill=accent)

    # Logo, top-left of the content column.
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

    f_eyebrow = font(FONTS / "notosans.ttf", 19)
    f_name = font(FONTS / "playfair.ttf", 72)
    f_tagline = font(FONTS / "notosans.ttf", 22)
    f_url = font(FONTS / "notosans.ttf", 21)

    content_w = CONTENT_RIGHT - CONTENT_X
    y = 56 + plate.height + 48

    eyebrow = "THE FINANCIAL DOCTOR"
    draw.text((CONTENT_X, y), eyebrow, font=f_eyebrow, fill=accent)
    y += 38

    # City name — the dominant element, large bold serif, wrapped rather
    # than shrunk to near-illegible for very long names/state entries.
    name_lines = wrap_text(draw, city_name, f_name, content_w)
    for line in name_lines:
        draw.text((CONTENT_X, y), line, font=f_name, fill=CREAM)
        y += f_name.size + 8
    y += 20

    scope = "across" if is_state else "in"
    tagline = f"Mutual Fund & Wealth Management — now {scope} {city_name}."
    for line in wrap_text(draw, tagline, f_tagline, content_w):
        draw.text((CONTENT_X, y), line, font=f_tagline, fill=MUTED)
        y += 32

    url_text = "thefinancialdoctor.in"
    draw.text((CONTENT_X, H - 72), url_text, font=f_url, fill=accent)

    return img.convert("RGB")


def main():
    src = (ROOT / "frontend" / "src" / "data" / "cityPages.js").read_text(encoding="utf-8")
    objects = re.findall(r'\{\n(?:(?!\n  \},).)*?\n  \},', src, re.S)
    entries = []
    for obj in objects:
        slug_m = re.search(r'slug:\s*"([a-z-]+)"', obj)
        name_m = re.search(r'name:\s*"([^"]+)"', obj)
        kind_m = re.search(r'kind:\s*"(city|state)"', obj)
        if not (slug_m and name_m and kind_m):
            continue
        entries.append((slug_m.group(1), name_m.group(1), kind_m.group(1)))

    made = 0
    for i, (slug, name, kind) in enumerate(entries):
        accent = ACCENTS[i % len(ACCENTS)]
        img = make_card(name, accent, is_state=(kind == "state"))
        out_path = OUT_DIR / f"city-{slug}.png"
        img.save(out_path, "PNG", optimize=True)
        made += 1
    print(f"Generated {made} city share cards.")


if __name__ == "__main__":
    sys.exit(main())
