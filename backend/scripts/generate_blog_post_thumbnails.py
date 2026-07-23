"""One-off script: generates small, light-weight WebP thumbnails from the
150 per-post blog OG share-card PNGs (see generate_blog_post_share_cards.py),
for use as small preview images wherever a few blog posts get embedded on
another page (e.g. 3 posts shown on each of the 47 city/state pages) —
same reasoning as generate_city_thumbnails.py: the full-res 1200x630 PNGs
are sized for social-share quality, not for small on-page thumbnails.

Run from repo root:
    python backend/scripts/generate_blog_post_thumbnails.py
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
    for src in sorted(SRC_DIR.glob("blog-post-*.png")):
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
