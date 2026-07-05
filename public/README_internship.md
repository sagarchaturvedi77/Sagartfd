Internship feature files and instructions

Files added on branch: internship-page
- public/internship.html  -> Static landing page (English, professional, subtle animations)
- public/manifest.json    -> PWA manifest (start_url: /internship)
- public/sw.js            -> Basic service worker (caches page shell)
- public/README_internship.md -> This file (instructions)
- navbar-internship-snippet.html -> snippet to add to site navbar
- assets/README_assets.txt  -> instructions for adding logo and icons

Next steps to preview locally:
1) Clone repo and check out branch:
   git fetch origin
   git checkout internship-page

2) Serve the public directory (HTTP server needed for service worker/manifest):
   - Python: python3 -m http.server 8000 (run inside repo root, then open http://localhost:8000/public/internship.html)
   - Or use any static server.

3) PWA & APK:
   - Ensure the page is served over HTTPS in production and manifest + sw.js paths are reachable.
   - Use PWABuilder (https://www.pwabuilder.com) and enter your site URL (https://thrfinancialdoctor.in/internship) to generate an Android package (APK/AAB).

Backend notes:
- The form posts to: POST /internship/apply. You need server-side handling for registration, resume upload, attendance tracking, certificate issuance and verification endpoint (GET /internship/verify?id=CERT_ID).
- If you want, I can scaffold a Node.js + Express + MongoDB backend or provide a Firebase-based serverless implementation.

If you want me to also add sample images and the logo into the repo, provide the image files or allow me to fetch royalty-free images; otherwise add your logo at assets/logo-internship.png and icons at assets/icons/.
