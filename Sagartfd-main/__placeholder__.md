---
***Changes made in this commit:***
1) Backend: auto-generate employee ID on create (admin) and register (signup).
2) Backend: punch-in/out radius validation already present; used defaults for OFFICE_LAT/LON/ RADIUS.
3) Frontend: updated PortalLayout to render mobile slide-in NavigationDrawer and mobile toggle.
4) Frontend: Updated EmployeeIDCard print templates (ID & Visiting card) with improved layout, photo ratio, logo placement and added agreement PDF-ready template with seal placement.

***Files modified/added***
- backend/auth_routes.py (generate employee ID when creating employee)
- backend/auth_models.py (unchanged)
- frontend/src/components/PortalLayout.jsx (mobile drawer toggle + overlay)
- frontend/src/components/NavigationDrawer.css (styles for mobile slide-in)
- frontend/src/pages/EmployeeIDCard.jsx (redesigned print templates and agreement PDF layout)

***Notes***
- Employee ID generation algorithm: 'TFD' + first2 + 5th&6th + last2 digits of phone. Requires 10-digit phone. If phone missing, fallback to UUID suffix.
- Seal image: used BrandLogo component with CSS opacity as a watermark seal on agreement print template.
- Office radius defaults are used as requested: 23.1985917, 77.08808, 50 meters.
- I preserved existing behavior where possible. If any images are missing (logo or uploads), templates fall back gracefully.

***Next steps***
- Commit small refinements on admin create flow to ensure `phone` is validated / normalized on input.
- Update backend tests for create_employee if you want.
---
