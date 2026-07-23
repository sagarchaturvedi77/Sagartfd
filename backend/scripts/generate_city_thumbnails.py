"""One-off script: generates small, light-weight WebP thumbnails from the
existing 1200x630 city OG share-card PNGs, for use as on-page card images
on LocationsPage.jsx. The full-res PNGs (~144KB avg, 6.8MB for all 47) were
sized/compressed for social-share quality, not for 47-at-once on-page
display — this makes a separate ~480px-wide, heavily-compressed WebP set
so the /locations page doesn't ship 6.8MB of images just for thumbnails.
The original PNGs are untouched and still used as-is for og:image/twitter:image.

Run from repo root:
    python backend/scripts/generate_city_thumbnails.py
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
SRC_DIR = ROOT / "frontend" / "public" / "assets" / "og"
OUT_DIR = ROOT / "frontend" / "public" / "assets" / "og-thumbs"
OUT_DIR.mkdir(parents=True, exist_ok=True)

THUMB_W = 480


def main():
    total_in = 0
    total_out = 0
    n = 0
    for src in sorted(SRC_DIR.glob("city-*.png")):
        img = Image.open(src).convert("RGB")
        thumb_h = round(img.height * (THUMB_W / img.width))
        thumb = img.resize((THUMB_W, thumb_h), Image.LANCZOS)
        out_path = OUT_DIR / f"{src.stem}.webp"
        thumb.save(out_path, "WEBP", quality=68, method=6)
        total_in += src.stat().st_size
        total_out += out_path.stat().st_size
        n += 1
    print(f"{n} thumbnails: {total_in/1024:.1f} KB -> {total_out/1024:.1f} KB")


if __name__ == "__main__":
    sys.exit(main())
