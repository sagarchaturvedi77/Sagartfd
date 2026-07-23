"""One-off script: generates a branded OG share-card image PER CITY/STATE
PAGE. Centered logo, a big dominant city name, service tags, and decorative
accent-coloured rings filling the side margins.

Earlier iterations tried a map inset (hand-drawn landmark silhouettes,
then a city-initial letterform watermark, then a small India-map-with-pin
inset) — removed per explicit follow-up feedback asking for no map
anywhere, on the card or on the /locations page. Kept: the per-city accent
colour (consistent with CityLandingPage.jsx's own accentFor()).

Overlay spec:
  - Big, dominant city name
  - "The Financial Doctor — Mutual Fund & Wealth Management Services"
  - "Now available in {City} — with full transparency & full guidance."
  - Service tags: Mutual Funds / SIP / Insurance / Digital Proposal
  - AMFI Registered + ARN-290298 badge
  - Logo (centered top) + thefinancialdoctor.in
  - "Book Free Portfolio Review" button graphic
  - Everything critical centered in the WhatsApp-crop-safe zone

Run from repo root:
    python backend/scripts/generate_city_share_cards.py
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

# Identical palette + cycling order to CityLandingPage.jsx's CITY_ACCENTS.
ACCENTS = [(2, 67, 150), (184, 114, 46), (15, 110, 92), (217, 177, 92), (46, 127, 199), (108, 99, 255), (34, 197, 94), (139, 92, 246)]

CENTER_X = W // 2


def font(path, size):
    return ImageFont.truetype(str(path), size)


def center_text(draw, cx, y, text, font_, fill):
    bbox = draw.textbbox((0, 0), text, font=font_)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=font_, fill=fill)
    return bbox[3] - bbox[1]


def make_card(city_name, accent, is_state=False):
    accent_soft = tuple(min(255, c + 60) for c in accent)
    img = Image.new("RGB", (W, H), NAVY)

    glow = Image.new("RGB", (W, H), NAVY)
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([CENTER_X - 460, -280, CENTER_X + 460, 340], fill=accent)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    img = Image.blend(img, glow, 0.5).convert("RGBA")

    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 6], fill=accent_soft)

    # Decorative rings in the left/right margins — outside the WhatsApp
    # crop-safe zone, so purely ornamental content belongs exactly here
    # instead of being left empty. Large, faint, off-canvas-centered circles
    # in the city's own accent colour.
    ring_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(ring_overlay)
    for cx, r, w_ in [(-40, 260, 3), (-160, 160, 2), (W + 40, 300, 3), (W + 180, 170, 2)]:
        ring_draw.ellipse([cx - r, H / 2 - r, cx + r, H / 2 + r], outline=(*accent_soft, 55), width=w_)
    img.alpha_composite(ring_overlay)
    draw = ImageDraw.Draw(img)

    # Full city name repeated large in the background, low-left in the
    # card, at 60% transparency (alpha ~102/255) — sits fully BEHIND the
    # foreground text (drawn after this). Capped to roughly the left half
    # of the canvas so it can never reach into the button/URL column on
    # the right, however long the city name is.
    bg_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg_overlay)
    bg_font = font(FONTS / "playfair.ttf", 130)
    bg_w = bg_draw.textbbox((0, 0), city_name, font=bg_font)[2]
    while bg_w > 560 and bg_font.size > 32:
        bg_font = font(FONTS / "playfair.ttf", bg_font.size - 6)
        bg_w = bg_draw.textbbox((0, 0), city_name, font=bg_font)[2]
    bg_draw.text((40, H - 175), city_name, font=bg_font, fill=(*accent_soft, 102))
    img.alpha_composite(bg_overlay)
    draw = ImageDraw.Draw(img)

    # Logo, centered at the very top.
    logo = Image.open(ASSETS / "logos" / "TFD-MAIN-LOGO.png").convert("RGBA")
    logo_w = 210
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    plate = Image.new("RGBA", (logo_w + 24, logo_h + 18), (*CREAM, 255))
    plate_mask = Image.new("L", plate.size, 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle([0, 0, plate.size[0], plate.size[1]], radius=12, fill=255)
    plate.putalpha(plate_mask)
    plate.alpha_composite(logo, (12, 9))
    img.alpha_composite(plate, (CENTER_X - plate.width // 2, 32))

    f_service = font(FONTS / "notosans.ttf", 22)
    f_name = font(FONTS / "playfair.ttf", 88)
    f_tagline = font(FONTS / "playfair-italic.ttf", 29)
    f_badge = font(FONTS / "notosans.ttf", 19)
    f_btn = font(FONTS / "notosans.ttf", 22)
    f_url = font(FONTS / "notosans.ttf", 21)

    y = 32 + logo_h + 18 + 26
    center_text(draw, CENTER_X, y, "THE FINANCIAL DOCTOR — MUTUAL FUND & WEALTH MANAGEMENT", f_service, MUTED)
    y += 40

    # City name — the dominant visual element, per request, sized to use
    # the full safe-zone width rather than a conservative default.
    name_font = f_name
    name_w = draw.textbbox((0, 0), city_name, font=name_font)[2]
    while name_w > 620 and name_font.size > 48:
        name_font = font(FONTS / "playfair.ttf", name_font.size - 4)
        name_w = draw.textbbox((0, 0), city_name, font=name_font)[2]
    center_text(draw, CENTER_X, y, city_name, name_font, CREAM)
    y += name_font.size + 24

    tagline = f"Now available across {city_name} — full transparency, full guidance." if is_state else f"Now available in {city_name} — full transparency, full guidance."
    center_text(draw, CENTER_X, y, tagline, f_tagline, accent_soft)
    y += 50

    # Service tags — the top-notch services actually available in this city.
    f_tag = font(FONTS / "notosans.ttf", 18)
    services = ["Mutual Funds", "SIP", "Insurance", "Digital Proposal"]
    tag_gap = 12
    tag_boxes = []
    total_w = 0
    for s in services:
        bbox = draw.textbbox((0, 0), s, font=f_tag)
        tw = bbox[2] - bbox[0]
        tag_boxes.append((s, tw))
        total_w += tw + 32
    total_w += tag_gap * (len(services) - 1)
    tx = CENTER_X - total_w / 2
    tag_bg = tuple(min(255, c + 18) for c in NAVY)
    for s, tw in tag_boxes:
        box_w = tw + 32
        draw.rounded_rectangle([tx, y, tx + box_w, y + 34], radius=17, fill=tag_bg, outline=(70, 82, 100))
        center_text(draw, tx + box_w / 2, y + 8, s, f_tag, CREAM)
        tx += box_w + tag_gap
    y += 54

    badge_text = "AMFI REGISTERED · ARN-290298"
    bbox = draw.textbbox((0, 0), badge_text, font=f_badge)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rounded_rectangle([CENTER_X - bw / 2 - 14, y, CENTER_X + bw / 2 + 14, y + bh + 20], radius=9, outline=accent_soft, width=2)
    center_text(draw, CENTER_X, y + 10, badge_text, f_badge, accent_soft)
    y += bh + 20 + 22

    f_expertise = font(FONTS / "notosans.ttf", 17)
    center_text(draw, CENTER_X, y, "Our Expertise: Fund Selection — Not Just Fund Sales", f_expertise, MUTED)

    # Button + URL anchored to the right edge, so they never collide with
    # the background city name over on the left.
    right_edge = W - 60
    btn_y = H - 92
    btn_text = "Book Free Portfolio Review"
    bbox = draw.textbbox((0, 0), btn_text, font=f_btn)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    btn_right = right_edge
    btn_left = btn_right - (bw + 44)
    draw.rounded_rectangle([btn_left, btn_y, btn_right, btn_y + bh + 26], radius=(bh + 26) // 2, fill=(199, 16, 46))
    draw.text((btn_left + 22, btn_y + 13), btn_text, font=f_btn, fill=CREAM)

    url_text = "thefinancialdoctor.in"
    url_bbox = draw.textbbox((0, 0), url_text, font=f_url)
    url_w = url_bbox[2] - url_bbox[0]
    draw.text((right_edge - url_w, H - 34), url_text, font=f_url, fill=accent_soft)

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
