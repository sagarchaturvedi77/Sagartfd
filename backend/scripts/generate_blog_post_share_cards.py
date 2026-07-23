"""Generates ONE branded OG share-card image PER BLOG POST (150 total),
replacing the earlier per-TOPIC approach (generate_topic_share_cards.py,
12 shared images reused across every post in that topic) — every post now
gets its own card with its own actual headline baked in as the hook,
instead of a generic per-topic line reused across 7-57 different articles.

Per explicit feedback, the founder photo is also bigger here (200px vs the
per-topic script's 168px) — still centered so it survives WhatsApp's
square crop.

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

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent.parent
FONTS = ROOT / "backend" / "assets" / "fonts"
ASSETS = ROOT / "frontend" / "public" / "assets"
OUT_DIR = ASSETS / "og"
OUT_DIR.mkdir(parents=True, exist_ok=True)

API_URL = "https://sagartfd.onrender.com/api/internship/public/content?content_type=blog&limit=200"

W, H = 1200, 630
NAVY = (14, 27, 44)
CREAM = (246, 241, 232)
MUTED = (176, 189, 209)
CENTER_X = W // 2

# topic -> (accent RGB, badge label) — same palette as generate_topic_share_cards.py,
# minus the per-topic hook/punch lines, which per-post titles now replace.
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


def center_text(draw, cx, y, text, font_, fill):
    bbox = draw.textbbox((0, 0), text, font=font_)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=font_, fill=fill)
    return bbox[3] - bbox[1]


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
    accent_soft = tuple(min(255, c + 70) for c in accent)
    img = Image.new("RGB", (W, H), NAVY)

    glow = Image.new("RGB", (W, H), NAVY)
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([CENTER_X - 440, -260, CENTER_X + 440, 340], fill=accent)
    glow = glow.filter(ImageFilter.GaussianBlur(150))
    img = Image.blend(img, glow, 0.5).convert("RGBA")
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 6], fill=accent_soft)

    # Logo, centered top.
    logo = Image.open(ASSETS / "logos" / "TFD-MAIN-LOGO.png").convert("RGBA")
    logo_w = 150
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    plate = Image.new("RGBA", (logo_w + 20, logo_h + 14), (*CREAM, 255))
    plate_mask = Image.new("L", plate.size, 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle([0, 0, plate.size[0], plate.size[1]], radius=10, fill=255)
    plate.putalpha(plate_mask)
    plate.alpha_composite(logo, (10, 7))
    img.alpha_composite(plate, (CENTER_X - plate.width // 2, 22))

    # Photo — bigger (200px vs the per-topic script's 168px), still
    # centered so it survives a WhatsApp square crop.
    photo_size = 200
    photo_top = 22 + plate.height + 16
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

    f_name = font(FONTS / "notosans.ttf", 20)
    f_badge = font(FONTS / "notosans.ttf", 16)
    f_tag = font(FONTS / "notosans.ttf", 18)

    y = photo_top + ring_size + 12
    center_text(draw, CENTER_X, y, "Sagar Chaturvedi · The Financial Doctor", f_name, CREAM)
    y += 30

    bbox = draw.textbbox((0, 0), badge, font=f_badge)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rounded_rectangle([CENTER_X - bw / 2 - 13, y, CENTER_X + bw / 2 + 13, y + bh + 16], radius=8, fill=accent)
    center_text(draw, CENTER_X, y + 8, badge, f_badge, CREAM)
    y += bh + 16 + 20

    # Title — the post's own real headline, auto-wrapped/shrunk to fit
    # the remaining space above the URL pill (this is what actually makes
    # each of the 150 cards different from each other, not just per-topic).
    pill_y = H - 56
    max_title_height = pill_y - 16 - y
    f_title, lines, size = fit_title(draw, title, max_width=980, max_lines=4, sizes=[38, 34, 30, 26, 23])
    line_height = size + 12
    while len(lines) * line_height > max_title_height and len(lines) > 1:
        lines = lines[:-1]
        lines[-1] = lines[-1].rstrip() + "…"
    total_h = len(lines) * line_height
    ty = y + max(0, (max_title_height - total_h) // 2)
    for line in lines:
        center_text(draw, CENTER_X, ty, line, f_title, CREAM)
        ty += line_height

    pill_text = "thefinancialdoctor.in"
    bbox = draw.textbbox((0, 0), pill_text, font=f_tag)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pill_pad_x, pill_pad_y = 22, 11
    pill_w, pill_h = tw + pill_pad_x * 2, th + pill_pad_y * 2
    draw.rounded_rectangle([CENTER_X - pill_w / 2, pill_y, CENTER_X + pill_w / 2, pill_y + pill_h], radius=pill_h // 2, outline=accent_soft, width=2)
    center_text(draw, CENTER_X, pill_y + pill_pad_y - 2, pill_text, f_tag, accent_soft)

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
