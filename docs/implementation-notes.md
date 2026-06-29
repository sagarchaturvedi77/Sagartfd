# Implementation Notes - Admin & Employee Improvements

This folder contains example frontend components, backend routes, utilities and a migration to add support for pipelines, attendance and reminders. Because each project has a different structure, these are added as ready-to-integrate files. Summary of included files:

- frontend/src/components/NavigationDrawer.jsx: React navigation drawer component (admin vs employee views)
- frontend/src/components/NavigationDrawer.css: styles for drawer
- frontend/src/styles/overscroll.css: CSS to prevent mobile pull-to-refresh inside scroll container
- frontend/public/firebase-messaging-sw.js: FCM service worker (replace Firebase config)
- backend/src/utils/haversine.js: server-side distance function
- backend/src/routes/attendance.js: express route for punch in/out with server-side location validation
- migrations/001_add_pipelines_and_attendance.sql: SQL migration to create necessary tables

Environment variables to set on Render / Cloudflare:
- OFFICE_LAT (default 23.1985917)
- OFFICE_LON (default 77.08808)
- OFFICE_RADIUS_METERS (default 50)
- FCM_SERVER_KEY (for server-side FCM sends)
- FCM_SENDER_ID / Firebase config for client
- APP_TIMEZONE (e.g., "Asia/Kolkata")

Quick integration steps
1. Frontend
   - Add the NavigationDrawer component into your main layout (e.g., wrap your routes with a left sidebar).
   - Add the `scroll-container` class to your main content wrapper to stop pull-to-refresh issues on mobile.
   - Add firebase-messaging-sw.js to your public root and configure Firebase in your app. Register service worker and obtain device token to send to backend.

2. Backend
   - Run the SQL migration on your DB (Render).
   - Add the attendance router into your server setup (e.g., app.use('/api/attendance', require('./routes/attendance'))). Ensure `auth` middleware and `db` module are available. Replace DB access (knex/sequelize) calls with your stack's equivalent.
   - Implement pipeline CRUD and assignment routes similarly (not yet included in this initial commit).
   - Implement a scheduled worker to run at 18:00 daily (use node-cron / bull / agenda) to detect open shifts and send FCM notifications. When user acknowledges notification, create a reminders row to send hourly notifications until punch out.

3. Tests
   - Add unit tests for haversineDistance.
   - Test punch flow: inside radius -> success; outside -> failure message.

If you want, I will now:
- wire the attendance router into your existing server entry point (if you tell me the file path),
- update your frontend layout to import and use NavigationDrawer (if you tell me the main layout file), and
- add pipeline CRUD API and admin UI in the next commit.

Next steps I will take after your confirmation:
- Wire these files into the app (frontend + backend) and push further commits; run tests locally if CI is configured.
- Implement pipeline CRUD + assignment + admin UIs.
- Implement scheduler & FCM server integration.
