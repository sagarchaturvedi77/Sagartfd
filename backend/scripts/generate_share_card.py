"""One-off script: generates the branded Open Graph share-card image used
when a blog link is shared on WhatsApp/LinkedIn/Instagram/etc. This is a
SINGLE static card (not per-post dynamic — that would need a render-at-
request-time image service) reused as og:image for every blog post, so
at minimum every shared link shows TFD's name, logo, founder photo and a
hook line instead of a bare link with no preview.

Run from repo root:
    python backend/scripts/generate_share_card.py

Outputs to frontend/public/assets/og/blog-share-card.png (1200x630, the
standard OG image size).
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
NAVY_DEEP = (8, 16, 28)
BLUE = (2, 67, 150)
CREAM = (246, 241, 232)
GOLD = (216, 185, 138)
MUTED = (176, 189, 209)


def font(path, size):
    return ImageFont.truetype(str(path), size)


def main():
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)

    # Soft radial blue glow, top-right — matches the site's hero treatment.
    glow = Image.new("RGB", (W, H), NAVY)
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([W - 520, -260, W + 260, 480], fill=BLUE)
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    img = Image.blend(img, glow, 0.55)
    draw = ImageDraw.Draw(img)

    # Thin gold top rule.
    draw.rectangle([0, 0, W, 6], fill=GOLD)

    # --- Founder photo, left panel, cropped to a rounded portrait ---
    photo = Image.open(ASSETS / "founder" / "sagar-photo.webp").convert("RGB")
    panel_w, panel_h = 400, H
    photo = ImageOps.fit(photo, (panel_w, panel_h), method=Image.LANCZOS, centering=(0.5, 0.28))
    # Fade the photo's right edge into the navy background so it blends
    # rather than showing a hard seam.
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
    # Darken the photo panel bottom slightly for legibility of anything overlapping.
    draw.rectangle([0, 0, 6, H], fill=GOLD)

    # --- Right content column ---
    x0 = 430
    logo = Image.open(ASSETS / "logos" / "TFD-MAIN-LOGO.png").convert("RGBA")
    logo_w = 300
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    # The main logo PNG is dark-on-transparent; composite a cream plate
    # behind it so it reads on the navy background.
    plate = Image.new("RGBA", (logo_w + 32, logo_h + 24), (246, 241, 232, 255))
    plate_mask = Image.new("L", plate.size, 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle([0, 0, plate.size[0], plate.size[1]], radius=14, fill=255)
    plate.putalpha(plate_mask)
    plate.alpha_composite(logo, (16, 12))
    img.paste(plate, (x0, 60), plate)

    f_hook = font(FONTS / "playfair-italic.ttf", 54)
    f_hook2 = font(FONTS / "playfair.ttf", 54)
    f_name = font(FONTS / "notosans.ttf", 30)
    f_tag = font(FONTS / "notosans.ttf", 24)
    f_small = font(FONTS / "notosans.ttf", 22)

    y = 190
    draw.text((x0, y), "Real advice.", font=f_hook2, fill=CREAM)
    draw.text((x0, y + 66), "Real numbers.", font=f_hook2, fill=CREAM)
    draw.text((x0, y + 132), "No hidden agenda.", font=f_hook, fill=GOLD)

    # Divider
    draw.line([(x0, y + 210), (x0 + 420, y + 210)], fill=(255, 255, 255, 40))

    draw.text((x0, y + 234), "Sagar Chaturvedi", font=f_name, fill=CREAM)
    draw.text((x0, y + 274), "AMFI Registered Mutual Fund Distributor · ARN-290298", font=f_small, fill=MUTED)

    # Bottom URL pill.
    pill_text = "thefinancialdoctor.in"
    bbox = draw.textbbox((0, 0), pill_text, font=f_tag)
    tw = bbox[2] - bbox[0]
    pill_pad_x, pill_pad_y = 26, 14
    pill_w, pill_h = tw + pill_pad_x * 2, 24 + pill_pad_y * 2
    pill_x, pill_y = x0, H - 90
    draw.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=pill_h // 2,
        outline=GOLD,
        width=2,
    )
    draw.text((pill_x + pill_pad_x, pill_y + pill_pad_y - 2), pill_text, font=f_tag, fill=GOLD)

    out_path = OUT_DIR / "blog-share-card.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path} ({out_path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    sys.exit(main())
