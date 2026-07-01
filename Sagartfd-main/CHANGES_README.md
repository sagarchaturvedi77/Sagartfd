# TFD Portal — Changes Guide (Sab 10 Points)

## Files Kahan Dalne Hain — Quick Map

```
Sagartfd-main/
├── backend/
│   ├── requirements.txt          ← UPDATED  (qrcode[pil] add hua)
│   ├── database.py               ← UPDATED  (3 naye collections)
│   ├── server.py                 ← UPDATED  (4 naye routers register)
│   ├── lead_models.py            ← UPDATED  (pipeline_id + pipeline_stage_id fields)
│   ├── lead_routes.py            ← UPDATED  (Career Leads + public capture endpoints, route order fixed)
│   ├── attendance_routes.py      ← UPDATED  (haversine geofence + office-settings endpoints)
│   ├── pipeline_routes.py        ← NO CHANGE (already solid)
│   ├── chat_routes.py            ← NEW
│   ├── leave_routes.py           ← NEW
│   ├── access_routes.py          ← NEW
│   └── qr_routes.py             ← NEW
│
└── frontend/src/
    ├── App.js                    ← UPDATED  (10 nayi routes + imports)
    ├── lib/api.js                ← UPDATED  (contact form → backend bhi save hoti hai ab)
    ├── pages/CareerPage.jsx      ← UPDATED  (career application → backend bhi jaati hai)
    ├── pages/AdminLeads.jsx      ← UPDATED  (Career Leads tab add hua)
    ├── pages/AdminPipelines.jsx  ← NEW      (Point 1)
    ├── pages/AdminChat.jsx       ← NEW      (Point 7)
    ├── pages/AdminLeaveManagement.jsx ← NEW (Point 7)
    ├── pages/AdminAccessControl.jsx  ← NEW  (Point 8)
    ├── pages/EmployeeAttendance.jsx  ← UPDATED (Point 9 — confirmation popup)
    ├── pages/EmployeeCalculators.jsx ← NEW  (Point 2)
    ├── pages/EmployeeChat.jsx    ← NEW      (Point 7)
    ├── pages/EmployeeLeaveRequest.jsx ← NEW (Point 7)
    ├── pages/EmployeeIDCardPage.jsx  ← NEW  (Point 3 + 5)
    ├── pages/PublicVerifyEmployee.jsx ← NEW (Point 3 — QR scan page)
    ├── components/Calculators.jsx    ← UPDATED (Point 10 — Loan EMI + fixed/reducing)
    ├── components/NavigationDrawer.jsx ← UPDATED (Point 4 — 3-dot slider + nayi links)
    ├── components/NavigationDrawer.css ← UPDATED (Point 4 — desktop collapse CSS)
    ├── components/PortalLayout.jsx   ← UPDATED (Point 4 — 3-dot toggle button)
    └── pages/CalculatorsPage.jsx     ← UPDATED (Point 10 — duplicate calculators hataaye)
```

---

## Setup Steps (Pehli Baar Server Chalane Ke Liye)

### Backend
```bash
cd backend
pip install -r requirements.txt        # qrcode[pil] install hoga
```

`.env` file banana padega (agar nahi hai):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=tfd_crm
SECRET_KEY=your_secret_key_here
```

```bash
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
npm install
```

`.env` file banana padega:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

```bash
npm start
```

---

## Point-wise Kya Kya Hua

### Point 1 — Custom Pipeline Builder (Admin)
- **Admin Portal → Pipelines** pe jaao (sidebar mein 🔀 Pipelines)
- "+ New Pipeline" se pipeline banao, naam do
- "If Call Connects" aur "If Call Doesn't Connect" dono sides mein stages banao
- Har stage ke andar "+ Sub-stage" se unlimited nested stages bana sakte ho
- Stage ka colour bhi change kar sakte ho
- "Assign" button se employees ko pipeline assign karo
- Leads mein ab `pipeline_id` aur `pipeline_stage_id` fields hain

### Point 2 — Calculators + Proposal Generator (Employee Portal)
- **Employee Portal → 🧮 Calculators** (sidebar link)
- Wahi saare calculators jo public website pe hain
- "📄 Generate Proposal" button → client ka naam, phone, email, notes bharo
- Print/Download PDF karo — proposal mein employee ka naam + designation automatically aata hai

### Point 3 + 5 — ID Card & Visiting Card + QR Code
- **Employee Portal → 🪪 ID & Visiting Card** (sidebar link)
- ID Card aur Visiting Card exactly use design mein jo tumne photo bheja
- Har employee ka **automatic unique QR** generate hota hai (backend `/api/verify/{id}` pe point karta hai)
- "🖨️ Download / Print" → browser print dialog → Save as PDF karo
- "📤 Share Verify Link" → mobile pe native share, desktop pe clipboard copy

**QR Verify System:**
- Koi bhi QR scan kare → `thefinancialdoctor.in/verify/{employee_id}` khulta hai
- Agar employee active hai: ✅ VERIFIED — Active Employee + saara data dikhta hai
- Agar admin ne employee disable kiya: ⚠️ Former Employee + warning message
- Backend `qr_routes.py` mein `SITE_URL` apna actual domain se badlo

### Point 4 — Sidebar Slider (3-dot button)
- Desktop pe sidebar ke right edge pe **3-dot vertical button** dikh raha hai
- Click karo → sidebar slide out ho jaata hai, content full width le leta hai
- Dobara click karo → wapas aata hai

### Point 6 — Web Leads vs Career Leads
- **Admin Portal → Leads** → ab 4 tabs hain: All Leads | Website Leads | Career Leads | Pipeline Config
- Website contact form / popup → automatically "Website Leads" tab mein aata hai
- Career page ka form → automatically "Career Leads" tab mein aata hai (status: new/shortlisted/interview/hired/rejected)
- Public website se bhi ab backend mein save hota hai (EmailJS backup bhi chalti rehti hai)

### Point 7 — Team Chat + Leave Management
- **Admin Chat:** Admin Portal → 💬 Team Chat
- **Employee Chat:** Employee Portal → 💬 Team Chat
- Dono ek hi "general" room use karte hain — sab ek saath baat kar sakte hain
- Auto-refresh every 4 seconds

- **Leave Apply:** Employee Portal → 🌴 My Leaves → "+ Apply Leave"
  Types: Casual, Sick, Earned, Half Day, WFH, Other
- **Admin Approve/Reject:** Admin Portal → 🌴 Leave Requests
  Filter by status, add admin note, approve ya reject karo

### Point 8 — Access Control (Admin)
- **Admin Portal → 🔑 Access Control**
- Har employee ka naam aur uske saare portal sections dikh rahe hain
- Kisi bhi section pe click karo → immediately enable/disable ho jaata hai (live save)
- Disabled section: strikethrough + grey ho jaata hai
- Ye setting backend mein `portal_access` field mein save hoti hai user record mein

> **Note:** Access control abhi sirf visibility restrict karta hai sidebar se navigation par. Proper page-level access gate ke liye `AuthContext.jsx` mein `portal_access` check add karna hoga — yeh tumhara future enhancement hai.

### Point 9 — Punch-In Confirmation Popup + Auto-Reject
- Employee "Punch In" button dabaye → **popup aata hai**
- Background mein automatically location check hota hai
- Agar location enable hai office settings mein:
  - ✅ Sahi jagah → "Yes, Punch In" button aata hai confirm karne ke liye
  - ❌ Galat jagah → Red popup — "You are Xm away. Punch-in rejected." OK button only
  - 📍 Location denied → Orange popup — location allow karo
- Agar location geofence enable nahi hai → normal confirmation popup

**Office Location Setup (Admin):**
```
PUT /api/attendance/office-settings
{
  "lat": 23.2599,      ← apna office ka latitude
  "lng": 77.4126,      ← apna office ka longitude  
  "radius_m": 200,     ← allowed radius meters mein
  "enforce": true      ← true karo tabhhi enforce hoga
}
```
Abhi koi admin UI nahi hai iske liye — Postman/Thunder Client se set karo, ya AdminAttendance.jsx mein ek small form add kar sakte ho baad mein.

### Point 10 — Website Calculator Cleanup + Loan EMI
- Calculator tab ka naam **"EMI" → "Loan EMI"** ho gaya
- Loan EMI tab mein ab **Interest Type toggle** hai:
  - **Reducing Balance** — standard reducing balance (default)
  - **Fixed Interest** — flat rate on full principal throughout tenure
- Calculator page ke **niche wale saare duplicate calculators hata diye** — sirf upar wala main widget raha

---

## Kya Abhi Nahi Kiya (Payment — Tumne Bola Tha Chodna)
- Education Portal payment gateway — intentionally skip kiya

## Production Mein QR Verify Ke Liye
`backend/qr_routes.py` file mein line 16 update karo:
```python
SITE_URL = "https://www.thefinancialdoctor.in"  # ← already sahi hai, check karo
```

## MongoDB Collections Jo Ab Use Ho Rahe Hain (Naye)
- `web_leads` — website form/popup leads
- `career_leads` — career page applications
- `chat_messages` — team chat
- `leaves` — leave requests
- `settings` — office geofence settings (key: "office")
- All existing collections — unchanged
