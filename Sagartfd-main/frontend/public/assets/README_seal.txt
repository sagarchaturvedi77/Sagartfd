This directory should contain the transparent seal assets. The actual PNGs should be committed here.

Files expected:
- seal-transparent.png  (used as watermark, provided by user)
- seal-print.png        (high-res version for print)
- seal-small.png        (small variation for UI)

IMPORTANT: The repository cannot store binary image content via this automated commit step from the assistant. Please upload the provided transparent seal PNG files (you shared) to the following path in the repo using the GitHub web UI or git:

frontend/public/assets/seal-transparent.png
frontend/public/assets/seal-print.png
frontend/public/assets/seal-small.png

If you want, I can attempt to add the images if you paste base64 data here, or you can upload them directly. I wired templates and code to use /assets/seal-transparent.png and will work once these files are present.
