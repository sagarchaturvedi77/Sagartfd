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


def make_card(accent, badge, hook_lines, punch):
    img = Image.new("RGB", (W, H), NAVY)

    glow = Image.new("RGB", (W, H), NAVY)
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([W - 520, -260, W + 260, 480], fill=accent)
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    img = Image.blend(img, glow, 0.55)

    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 6], fill=accent)

    photo = Image.open(ASSETS / "founder" / "sagar-photo.webp").convert("RGB")
    panel_w, panel_h = 400, H
    photo = ImageOps.fit(photo, (panel_w, panel_h), method=Image.LANCZOS, centering=(0.5, 0.28))
    fade = Image.new("L", (panel_w, panel_h), 255)
    fade_draw = ImageDraw.Draw(fade)
    fade_w = 140
    for x in range(fade_w):
        alpha = int(255 * (x / fade_w))
        fade_draw.line([(panel_w - fade_w + x, 0), (panel_w - fade_w + x, panel_h)], fill=255 - alpha)
    photo.putalpha(fade)
    canvas = Image.new("RGBA", (W, H), (*NAVY, 255))
    canvas.paste(photo, (0, 0), photo)
    img = canvas.convert("RGB")
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 6, H], fill=accent)

    x0 = 430
    logo = Image.open(ASSETS / "logos" / "TFD-MAIN-LOGO.png").convert("RGBA")
    logo_w = 260
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    plate = Image.new("RGBA", (logo_w + 28, logo_h + 20), (246, 241, 232, 255))
    plate_mask = Image.new("L", plate.size, 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle([0, 0, plate.size[0], plate.size[1]], radius=12, fill=255)
    plate.putalpha(plate_mask)
    plate.alpha_composite(logo, (14, 10))
    img.paste(plate, (x0, 56), plate)

    f_badge = font(FONTS / "notosans.ttf", 20)
    f_hook = font(FONTS / "playfair.ttf", 50)
    f_punch = font(FONTS / "playfair-italic.ttf", 50)
    f_name = font(FONTS / "notosans.ttf", 28)
    f_small = font(FONTS / "notosans.ttf", 20)
    f_tag = font(FONTS / "notosans.ttf", 24)

    badge_y = 56 + logo_h + 30
    bbox = draw.textbbox((0, 0), badge, font=f_badge)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rounded_rectangle([x0, badge_y, x0 + bw + 28, badge_y + bh + 20], radius=8, fill=accent)
    draw.text((x0 + 14, badge_y + 8), badge, font=f_badge, fill=CREAM)

    y = badge_y + bh + 20 + 28
    draw.text((x0, y), hook_lines[0], font=f_hook, fill=CREAM)
    draw.text((x0, y + 60), hook_lines[1], font=f_hook, fill=CREAM)
    accent_soft = tuple(min(255, c + 70) for c in accent)
    draw.text((x0, y + 128), punch, font=f_punch, fill=accent_soft)

    draw.line([(x0, y + 200), (x0 + 420, y + 200)], fill=(255, 255, 255, 40))
    draw.text((x0, y + 222), "Sagar Chaturvedi", font=f_name, fill=CREAM)
    draw.text((x0, y + 260), "AMFI Registered Mutual Fund Distributor · ARN-290298", font=f_small, fill=MUTED)

    pill_text = "thefinancialdoctor.in"
    bbox = draw.textbbox((0, 0), pill_text, font=f_tag)
    tw = bbox[2] - bbox[0]
    pill_pad_x, pill_pad_y = 24, 12
    pill_w, pill_h = tw + pill_pad_x * 2, 22 + pill_pad_y * 2
    pill_x, pill_y = x0, H - 80
    draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=pill_h // 2, outline=accent_soft, width=2)
    draw.text((pill_x + pill_pad_x, pill_y + pill_pad_y - 2), pill_text, font=f_tag, fill=accent_soft)

    return img


def main():
    for topic, (accent, badge, hook_lines, punch) in TOPICS.items():
        img = make_card(accent, badge, hook_lines, punch)
        out_path = OUT_DIR / f"blog-{topic}.png"
        img.save(out_path, "PNG", optimize=True)
        print(f"Saved {out_path.name} ({out_path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    sys.exit(main())
