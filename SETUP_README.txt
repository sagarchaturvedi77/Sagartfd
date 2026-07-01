========================================
TFD STAFF PORTAL — SETUP INSTRUCTIONS
========================================

STEP 1 — Extract this zip and copy folders into your repo
------------------------------------------------------
- Copy everything inside "backend/" → into your repo's existing "backend/" folder
- Copy everything inside "frontend/src/" → into your repo's existing "frontend/src/" folder
  (App.js will OVERWRITE your existing App.js — that's expected, it's the updated version)
- "requirements_ADD_THESE_LINES.txt" → DO NOT replace your real requirements.txt.
  Open your existing backend/requirements.txt and manually add these 3 lines at the end:
      motor
      pyjwt
      passlib[bcrypt]

STEP 2 — backend/.env file
------------------------------------------------------
This zip includes a NEW backend/.env file since you didn't have one.
Open it and replace MONGO_URL with your real MongoDB Atlas connection string.
Keep DB_NAME as is (or rename if you prefer).
Change JWT_SECRET to any long random string of your choice.

If your project already creates a .env automatically during deployment,
just make sure these 3 variables exist somewhere in it:
    MONGO_URL=...
    DB_NAME=tfd_crm
    JWT_SECRET=...

STEP 3 — Register the auth routes in server.py
------------------------------------------------------
Open backend/server.py, find the line where you create the FastAPI app
(something like: app = FastAPI() ), and add these 2 lines right after it:

    from auth_routes import router as auth_router
    app.include_router(auth_router)

STEP 4 — Install new Python packages
------------------------------------------------------
In your backend folder, run:
    pip install -r requirements.txt

STEP 5 — Create your first Admin login
------------------------------------------------------
Open backend/seed_admin.py and change these two lines to your own values:
    ADMIN_EMAIL = "your-email@example.com"
    ADMIN_PASSWORD = "YourStrongPassword123"

Then run it ONCE from the backend folder:
    python seed_admin.py

This creates your Admin account. You only need to run this once.

STEP 6 — Check frontend/.env
------------------------------------------------------
Make sure frontend/.env has:
    REACT_APP_BACKEND_URL=https://your-backend-url.com

STEP 7 — Deploy and test
------------------------------------------------------
1. Go to: https://yourwebsite.com/portal/login
2. Log in with the Admin email/password from Step 5
3. You should land on the Admin Dashboard
4. Click "+ Add Employee" → create a test employee login
5. Logout, then log in again with the employee's email/password
6. You should land on the Employee Dashboard

If anything breaks (blank page, network error, login fails),
send a screenshot of the error and we'll fix it.

========================================
WHAT THIS STAGE INCLUDES
========================================
- Secure login system (Admin + Employee), passwords hashed
- Admin Dashboard: view all employees, add new employee logins
- Employee Dashboard: placeholder cards for Leads, Attendance, Target
  (these become functional in the next stage)
- Role-based protection: employees cannot access admin pages and vice versa

NEXT STAGES (to be built after this is confirmed working):
- Lead management + calling/tracking
- Attendance with location + time
- Client proposals
- Targets & progress tracking
- Salary calculation
