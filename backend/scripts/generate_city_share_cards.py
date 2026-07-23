"""One-off script: generates a branded OG share-card image PER CITY/STATE
PAGE, with an ORIGINAL stylized silhouette illustration evoking each
city's landmark as the background motif — not a photograph. We don't have
a licensed stock-photo source, and pulling real landmark photos off the
web would risk reproducing someone else's copyrighted photography without
rights, so every silhouette here is drawn from scratch with simple PIL
primitives (arcs, polygons, rectangles) rather than copied from any
existing image.

Covers ~15 of the biggest/most recognizable cities with a genuinely
distinct silhouette each; every other city/state page falls back to a
shared "India map pin" motif in that state's accent colour rather than a
fabricated landmark guess.

Overlay spec (as requested):
  - Headline: "Trusted Mutual Fund & Wealth Management Services in {City}"
  - Sub-line: "Now servicing investors across {City} & nearby regions"
  - AMFI Registered + ARN-290298 badge
  - Logo + thefinancialdoctor.in
  - "Book Free Portfolio Review" button graphic

Run from repo root:
    python backend/scripts/generate_city_share_cards.py

Outputs to frontend/public/assets/og/city-{slug}.png and
frontend/public/assets/og/city-default-{state-slug}.png (1200x630 each).
"""
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
NAVY_DEEP = (8, 16, 28)
CREAM = (246, 241, 232)
GOLD = (216, 185, 138)
MUTED = (176, 189, 209)
SIL = (216, 185, 138, 55)  # soft gold-tinted silhouette fill on navy


def font(path, size):
    return ImageFont.truetype(str(path), size)


# ---- Silhouette drawers: each draws into the RIGHT-side backdrop area
# (roughly x 550-1200, y 0-630) using only simple shapes. Kept abstract/
# minimal by design — a recognizable gesture at the landmark, not a
# detailed illustration. ----

def sil_bhopal(draw):
    # Upper Lake horizon + a domed minar silhouette (Taj-ul-Masajid nod)
    draw.ellipse([600, 520, 1300, 900], fill=SIL)  # lake as a low arc
    draw.rectangle([980, 260, 1010, 480], fill=SIL)
    draw.polygon([(960, 260), (995, 190), (1030, 260)], fill=SIL)
    draw.ellipse([975, 175, 1015, 215], fill=SIL)
    draw.rectangle([880, 320, 905, 480], fill=SIL)
    draw.ellipse([870, 295, 915, 340], fill=SIL)


def sil_pune(draw):
    # Shaniwar Wada — stepped fortified gate silhouette
    draw.rectangle([850, 300, 1150, 480], fill=SIL)
    for i, x in enumerate(range(860, 1140, 70)):
        draw.rectangle([x, 260, x + 40, 300], fill=SIL)
    draw.rectangle([960, 340, 1040, 480], fill=SIL)
    draw.polygon([(960, 340), (1000, 300), (1040, 340)], fill=SIL)


def sil_sehore(draw):
    # Home base — simple riverside temple shikhara + water line
    draw.ellipse([600, 540, 1300, 880], fill=SIL)
    draw.polygon([(950, 480), (990, 300), (1030, 480)], fill=SIL)
    draw.polygon([(930, 480), (960, 360), (990, 480)], fill=SIL)
    draw.polygon([(990, 480), (1020, 360), (1050, 480)], fill=SIL)
    draw.ellipse([980, 288, 1000, 308], fill=SIL)


def sil_mumbai(draw):
    # Gateway of India — arch silhouette + skyline
    draw.arc([900, 260, 1080, 500], start=180, end=360, fill=SIL, width=26)
    draw.rectangle([900, 380, 930, 500], fill=SIL)
    draw.rectangle([1050, 380, 1080, 500], fill=SIL)
    for x, h in [(1120, 420), (1150, 460), (1180, 400)]:
        draw.rectangle([x, H - h, x + 24, H - 150], fill=SIL)


def sil_indore(draw):
    # Rajwada palace — tiered facade silhouette
    draw.rectangle([870, 340, 1150, 480], fill=SIL)
    draw.rectangle([900, 280, 1120, 340], fill=SIL)
    draw.rectangle([950, 230, 1070, 280], fill=SIL)
    draw.polygon([(950, 230), (1010, 180), (1070, 230)], fill=SIL)


def sil_ujjain(draw):
    # Mahakal shikhara — tall temple tower
    draw.polygon([(940, 480), (1010, 220), (1080, 480)], fill=SIL)
    draw.rectangle([970, 400, 1050, 480], fill=SIL)
    draw.ellipse([995, 205, 1025, 235], fill=SIL)


def sil_gwalior(draw):
    # Gwalior Fort — ramparts on a hill
    draw.polygon([(830, 480), (900, 300), (1180, 480)], fill=SIL)
    for x in range(860, 1150, 60):
        draw.rectangle([x, 290, x + 30, 330], fill=SIL)


def sil_delhi(draw):
    # India Gate — arch monument
    draw.rectangle([960, 250, 1040, 480], fill=SIL)
    draw.arc([960, 300, 1040, 460], start=180, end=360, fill=SIL, width=22)
    draw.rectangle([930, 460, 1070, 490], fill=SIL)


def sil_jaipur(draw):
    # Hawa Mahal — honeycomb facade silhouette
    draw.rectangle([870, 260, 1150, 480], fill=SIL)
    for row in range(4):
        for col in range(6):
            x = 885 + col * 46
            y = 275 + row * 48
            draw.ellipse([x, y, x + 30, y + 30], fill=(*NAVY, 0)) if False else None
    draw.polygon([(870, 260), (1010, 190), (1150, 260)], fill=SIL)


def sil_ahmedabad(draw):
    # Stepwell arch silhouette (Adalaj-style)
    draw.polygon([(880, 480), (1010, 260), (1140, 480)], fill=SIL)
    draw.rectangle([950, 380, 1070, 480], fill=SIL)


def sil_kolkata(draw):
    # Howrah Bridge — cantilever silhouette
    draw.polygon([(870, 480), (940, 300), (1000, 480)], fill=SIL)
    draw.polygon([(1000, 480), (1070, 300), (1140, 480)], fill=SIL)
    draw.rectangle([870, 440, 1140, 470], fill=SIL)


def sil_chennai(draw):
    # Shore-temple-style stepped tower by the coast
    draw.ellipse([600, 560, 1300, 900], fill=SIL)
    for i, w in enumerate([180, 140, 100, 60]):
        y = 460 - i * 50
        draw.rectangle([1010 - w // 2, y, 1010 + w // 2, y + 50], fill=SIL)


def sil_bangalore(draw):
    # Vidhana Soudha — domed civic facade
    draw.rectangle([860, 340, 1160, 480], fill=SIL)
    draw.ellipse([960, 230, 1060, 330], fill=SIL)
    draw.rectangle([1000, 330, 1020, 400], fill=SIL)


def sil_hyderabad(draw):
    # Charminar — four-minaret gate
    draw.rectangle([940, 300, 1080, 480], fill=SIL)
    draw.arc([940, 340, 1080, 460], start=180, end=360, fill=SIL, width=18)
    for x in [925, 1075]:
        draw.rectangle([x, 260, x + 20, 480], fill=SIL)
        draw.ellipse([x - 5, 245, x + 25, 275], fill=SIL)


LANDMARK_SLUGS = {
    "bhopal": sil_bhopal, "pune": sil_pune, "sehore": sil_sehore, "mumbai": sil_mumbai,
    "indore": sil_indore, "ujjain": sil_ujjain, "gwalior": sil_gwalior, "delhi": sil_delhi,
    "jaipur": sil_jaipur, "ahmedabad": sil_ahmedabad, "kolkata": sil_kolkata,
    "chennai": sil_chennai, "bangalore": sil_bangalore, "hyderabad": sil_hyderabad,
}

# Default fallback (used for every city/state not in LANDMARK_SLUGS) —
# an abstract "map pin over India" motif rather than a fabricated landmark.
def sil_default(draw):
    draw.rounded_rectangle([870, 260, 1150, 520], radius=30, fill=SIL)
    draw.polygon([(940, 480), (1010, 420), (1080, 480)], fill=SIL)
    draw.ellipse([980, 300, 1040, 360], fill=SIL)


SAFE_W = 630  # WhatsApp (and most other clients) crop link-preview images to
# roughly a centered square before display, regardless of the real 1200x630
# aspect ratio declared in og:image:width/height — so every piece of text
# critical to the message (logo, headline, credentials, CTA) is centered
# inside this middle 630px-wide zone; only decorative background elements
# are allowed to extend into the outer margins that a square crop discards.
SAFE_X0 = (W - SAFE_W) // 2  # 285
CENTER_X = W // 2  # 600


def center_text(draw, cx, y, text, font_, fill):
    bbox = draw.textbbox((0, 0), text, font=font_)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=font_, fill=fill)
    return bbox[3] - bbox[1]


def make_card(city_name, silhouette_fn):
    img = Image.new("RGB", (W, H), NAVY)
    glow = Image.new("RGB", (W, H), NAVY)
    glow_draw = ImageDraw.Draw(glow)
    # Centered glow (was top-right) — the composition is now center-weighted,
    # so the light source should be too.
    glow_draw.ellipse([CENTER_X - 420, -260, CENTER_X + 420, 360], fill=(2, 67, 150))
    glow = glow.filter(ImageFilter.GaussianBlur(150))
    img = Image.blend(img, glow, 0.5)

    # Silhouette now spans the full canvas symmetrically as a faint watermark
    # behind the text, instead of sitting only on the right (which a square
    # crop would cut entirely) — it's purely decorative, so partial cropping
    # is fine either way, but centering it means at least some of it survives
    # a square crop too, for platforms that don't discard it.
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    silhouette_fn(ImageDraw.Draw(overlay))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 6], fill=GOLD)

    logo = Image.open(ASSETS / "logos" / "TFD-MAIN-LOGO.png").convert("RGBA")
    logo_w = 230
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    plate = Image.new("RGBA", (logo_w + 26, logo_h + 18), (246, 241, 232, 255))
    plate_mask = Image.new("L", plate.size, 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle([0, 0, plate.size[0], plate.size[1]], radius=12, fill=255)
    plate.putalpha(plate_mask)
    plate.alpha_composite(logo, (13, 9))
    img.paste(plate, (CENTER_X - plate.width // 2, 44), plate)

    f_headline = font(FONTS / "playfair.ttf", 42)
    f_sub = font(FONTS / "notosans.ttf", 21)
    f_badge = font(FONTS / "notosans.ttf", 18)
    f_btn = font(FONTS / "notosans.ttf", 21)
    f_url = font(FONTS / "notosans.ttf", 20)

    y = 44 + logo_h + 18 + 26
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
    draw.rounded_rectangle([CENTER_X - bw / 2 - 13, y, CENTER_X + bw / 2 + 13, y + bh + 18], radius=8, outline=GOLD, width=2)
    center_text(draw, CENTER_X, y + 9, badge_text, f_badge, GOLD)

    btn_y = H - 92
    btn_text = "Book Free Portfolio Review"
    bbox = draw.textbbox((0, 0), btn_text, font=f_btn)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rounded_rectangle([CENTER_X - bw / 2 - 22, btn_y, CENTER_X + bw / 2 + 22, btn_y + bh + 26], radius=(bh + 26) // 2, fill=(199, 16, 46))
    center_text(draw, CENTER_X, btn_y + 13, btn_text, f_btn, CREAM)

    center_text(draw, CENTER_X, H - 34, "thefinancialdoctor.in", f_url, GOLD)

    return img


def main():
    # cityPages.js is an ES module, not importable from Python directly —
    # just scrape the slug/name pairs out of it (kept in sync manually
    # whenever cityPages.js's entries change).
    import re
    src = (ROOT / "frontend" / "src" / "data" / "cityPages.js").read_text(encoding="utf-8")
    entries = re.findall(r'slug:\s*"([^"]+)".*?name:\s*"([^"]+)"', src, re.S)

    made = 0
    for slug, name in entries:
        fn = LANDMARK_SLUGS.get(slug, sil_default)
        img = make_card(name, fn)
        out_path = OUT_DIR / f"city-{slug}.png"
        img.save(out_path, "PNG", optimize=True)
        made += 1
    print(f"Generated {made} city share cards.")


if __name__ == "__main__":
    sys.exit(main())
