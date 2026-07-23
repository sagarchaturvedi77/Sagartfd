"""Generates ONE branded OG share-card image PER BLOG POST (150 total) —
full-bleed founder photo on the LEFT, all content on the RIGHT.

Redesigned per explicit direction, same layout language as
generate_city_share_cards.py: large bold minimalist typography, standard
padding, no clutter (dropped the circular-photo/badge-pill/glow-blend
layout, and the ARN number is not shown anywhere on the image).

Known trade-off, accepted per explicit direction: WhatsApp square-crops
link-preview images to the canvas's horizontal center, discarding roughly
the outer 24% on each side — a left-edge photo panel will be partially
cropped there specifically (LinkedIn/Telegram/direct links show the full
1200x630 image untouched).

Run from repo root:
    python backend/scripts/generate_blog_post_share_cards.py

Fetches the live post list from the deployed backend (same endpoint
PublicBlog.jsx uses) rather than hitting Mongo directly, so this can run
from any machine with just internet access, no DB credentials.

Outputs to frontend/public/assets/og/blog-post-{id}.png (1200x630 each).
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent.parent
FONTS = ROOT / "backend" / "assets" / "fonts"
ASSETS = ROOT / "frontend" / "public" / "assets"
OUT_DIR = ASSETS / "og"
OUT_DIR.mkdir(parents=True, exist_ok=True)

API_URL = "https://sagartfd.onrender.com/api/internship/public/content?content_type=blog&limit=200"

W, H = 1200, 630
PHOTO_W = 480
NAVY = (14, 27, 44)
CREAM = (246, 241, 232)
MUTED = (176, 189, 209)

CONTENT_X = PHOTO_W + 64
CONTENT_RIGHT = W - 64

# topic -> accent RGB + badge label — same palette as before, minus the
# per-topic hook/punch lines (the post's own real title is the hook now).
TOPIC_STYLE = {
    "sip": ((2, 67, 150), "SIP GUIDE"),
    "lumpsum": ((2, 67, 150), "LUMPSUM"),
    "swp": ((15, 110, 92), "SWP / INCOME"),
    "financial_planning": ((184, 114, 46), "FINANCIAL PLANNING"),
    "term_insurance": ((199, 16, 46), "TERM INSURANCE"),
    "health_insurance": ((199, 16, 46), "HEALTH INSURANCE"),
    "elss_tax_saving": ((139, 92, 246), "TAX SAVING"),
    "retirement_planning": ((184, 114, 46), "RETIREMENT"),
    "general_investing": ((2, 67, 150), "INVESTING BASICS"),
    "awareness": ((90, 62, 32), "MARKET HISTORY"),
    "brand_comparison": ((14, 27, 44), "WHY TFD"),
    "other": ((14, 27, 44), "THE FINANCIAL DOCTOR"),
}


def font(path, size):
    return ImageFont.truetype(str(path), size)


def clean_title(title):
    # A handful of posts have "| The Financial Doctor" baked into the
    # title itself — redundant here since the logo/name already carry the
    # brand — and a few have a stray U+FFFD replacement char from a lost
    # em-dash in the source data; swap it for a plain hyphen so the image
    # doesn't render a visible tofu box.
    t = re.sub(r"\s*\|\s*The Financial Doctor\s*$", "", title).strip()
    return t.replace("�", "-")


def wrap_text(draw, text, font_, max_width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        bbox = draw.textbbox((0, 0), trial, font=font_)
        if bbox[2] - bbox[0] <= max_width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_title(draw, text, max_width, max_lines, sizes):
    for size in sizes:
        f = font(FONTS / "playfair.ttf", size)
        lines = wrap_text(draw, text, f, max_width)
        if len(lines) <= max_lines:
            return f, lines, size
    f = font(FONTS / "playfair.ttf", sizes[-1])
    lines = wrap_text(draw, text, f, max_width)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while last and draw.textbbox((0, 0), last + "…", font=f)[2] > max_width:
            last = last[:-1]
        lines[-1] = last.rstrip() + "…"
    return f, lines, sizes[-1]


def make_card(accent, badge, title):
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

    f_badge = font(FONTS / "notosans.ttf", 19)
    f_url = font(FONTS / "notosans.ttf", 21)

    content_w = CONTENT_RIGHT - CONTENT_X
    y = 56 + plate.height + 44

    draw.text((CONTENT_X, y), badge, font=f_badge, fill=accent)
    y += 40

    # Title — the post's own real headline, auto-wrapped/shrunk to fit the
    # remaining space above the URL (what makes each of the 150 cards
    # actually different from each other, not just the topic accent).
    url_y = H - 72
    max_title_height = url_y - 24 - y
    f_title, lines, size = fit_title(draw, title, max_width=content_w, max_lines=5, sizes=[54, 46, 40, 34, 29])
    line_height = size + 12
    while len(lines) * line_height > max_title_height and len(lines) > 1:
        lines = lines[:-1]
        lines[-1] = lines[-1].rstrip() + "…"
    for line in lines:
        draw.text((CONTENT_X, y), line, font=f_title, fill=CREAM)
        y += line_height

    draw.text((CONTENT_X, url_y), "thefinancialdoctor.in", font=f_url, fill=accent)

    return img.convert("RGB")


def main():
    with urllib.request.urlopen(API_URL, timeout=30) as resp:
        posts = json.loads(resp.read().decode("utf-8"))

    print(f"Fetched {len(posts)} posts")
    for i, post in enumerate(posts):
        topic = post.get("topic") or "other"
        accent, badge = TOPIC_STYLE.get(topic, TOPIC_STYLE["other"])
        # post["title"] is the default/primary (Hinglish) title shown to
        # everyone unless ?lang=en is in the URL — matches what most
        # sharers will actually be looking at, so the image uses the same
        # one title regardless of viewer language (same simplification the
        # old per-topic cards already made).
        title = clean_title(post["title"] or post.get("title_en") or "The Financial Doctor")
        img = make_card(accent, badge, title)
        out_path = OUT_DIR / f"blog-post-{post['id']}.png"
        img.save(out_path, "PNG", optimize=True)
        if (i + 1) % 25 == 0 or i + 1 == len(posts):
            print(f"  {i + 1}/{len(posts)} done")

    print(f"Saved {len(posts)} cards to {OUT_DIR}")


if __name__ == "__main__":
    sys.exit(main())
