### PR: Admin & Employee improvements — pipelines, navigation drawer, attendance fixes

This PR implements the first set of changes requested for the admin and employee portals. It includes UI components, backend validation, database migrations, and docs to integrate the changes.

Summary of changes
- Frontend
  - Added NavigationDrawer component with admin/employee menu
  - Added overscroll CSS to prevent mobile pull-to-refresh issues
  - Added firebase-messaging-sw.js scaffold for FCM web push (client config required)

- Backend
  - Added haversine distance util
  - Added /api/attendance/punch route with server-side location validation
  - Added SQL migration to create pipelines, assignments, attendance and reminders tables and portal_enabled flag

- Docs
  - Implementation notes and integration checklist

Environment variables required
- OFFICE_LAT, OFFICE_LON, OFFICE_RADIUS_METERS
- FCM_SERVER_KEY (server), Firebase client config (client)
- APP_TIMEZONE (recommended Asia/Kolkata)

Notes & Next Steps
- This PR contains initial scaffolding and samples; DB calls in routes assume a `db` module — adapt to your DB layer.
- Next commits will wire the routes into the server and add pipeline CRUD + assignment endpoints and admin UI.

Checklist
- [x] Navigation Drawer added
- [x] Overscroll fix added
- [x] Haversine util added
- [x] Attendance route with radius validation added
- [x] Migration for pipelines/attendance/reminders added
- [ ] Wire routers into app
- [ ] Add device token registration & FCM server integration
- [ ] Implement scheduler & reminders
- [ ] Pipeline CRUD & admin UI

