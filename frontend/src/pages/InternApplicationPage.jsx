import React, { useMemo, useState } from "react";
import {
  CheckCircle2, AlertTriangle, ChevronLeft, Star, User, GraduationCap, FileCheck2, Check,
  Briefcase, Award, Users, CalendarDays,
} from "lucide-react";
import LINKS from "../lib/links";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.webp";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.webp";
const DEPARTMENTS = ["HR", "Sales", "Marketing", "Accounts"];
const DURATIONS = [45, 60, 90];
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh",
  "Puducherry", "Other",
];

const BENEFITS = [
  { icon: Briefcase, text: "Hands-on client interaction and real financial-sales exposure" },
  { icon: Award, text: "Verifiable Certificate & Completion Letter, QR-code certified" },
  { icon: Users, text: "Direct mentorship from industry professionals" },
  { icon: CalendarDays, text: "Flexible 45, 60, or 90-day programs" },
];

const emptyForm = {
  name: "", is_student: true, college: "", subject: "", department: "Sales",
  duration_days: 45, start_date: "", contact_phone: "", contact_email: "",
  father_name: "", address: "", city: "", state: "", pincode: "", aadhar_number: "", pan_number: "",
};

const STEPS = [
  { key: "form", label: "Your Details" },
  { key: "review", label: "Review & Confirm" },
  { key: "done", label: "Submitted" },
];

function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days - 1);
  return d.toISOString().split("T")[0];
}

function StepIndicator({ step }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i < activeIndex
                  ? "bg-[#024396] border-[#024396] text-white"
                  : i === activeIndex
                  ? "bg-white border-[#024396] text-[#024396]"
                  : "bg-white border-[#E2D8C2] text-[#9AA5B4]"
              }`}
            >
              {i < activeIndex ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium tracking-wide ${i <= activeIndex ? "text-[#0E1B2C]" : "text-[#9AA5B4]"}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-10 sm:w-16 h-[2px] mb-4 mx-1.5 transition-colors ${i < activeIndex ? "bg-[#024396]" : "bg-[#E2D8C2]"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="text-[11px] font-semibold text-[#2A364B]/70 uppercase tracking-wide mb-1.5 block">
      {children} {required && <span className="text-[#C7102E]">*</span>}
    </label>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 mb-1">
      <div className="w-8 h-8 rounded-lg bg-[#024396]/8 flex items-center justify-center text-[#024396] shrink-0">
        <Icon size={15} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#0E1B2C]">{title}</p>
        {subtitle && <p className="text-[11px] text-[#5C677D]">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function InternApplicationPage() {
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState("form"); // "form" | "review" | "done"
  const [declared, setDeclared] = useState(false);
  const [rated, setRated] = useState(false);
  const [ratingClicked, setRatingClicked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const endDate = useMemo(() => addDays(form.start_date, form.duration_days), [form.start_date, form.duration_days]);

  const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm text-[#0E1B2C] focus:outline-none focus:ring-2 focus:ring-[#024396]/25 focus:border-[#024396] bg-white transition-shadow placeholder:text-[#9AA5B4]";

  const goToReview = (e) => {
    e.preventDefault();
    setError("");
    if (form.is_student && (!form.college.trim() || !form.subject.trim())) {
      setError("Please enter your college name and subject/course.");
      return;
    }
    if (!form.father_name.trim() || !form.address.trim() || !form.aadhar_number.trim()) {
      setError("Father's name, address, and Aadhaar number are required.");
      return;
    }
    if (!form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      setError("City, state, and pincode are required.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Pincode must be a 6-digit number.");
      return;
    }
    if (!form.contact_email.trim() || !form.contact_email.includes("@")) {
      setError("A valid email address is required.");
      return;
    }
    setStep("review");
    setDeclared(false);
    setRated(false);
    setRatingClicked(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!declared || !rated || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/interns/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pan_number: form.pan_number || null }),
      });
      if (res.ok) {
        setStep("done");
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Something went wrong. Please try again.");
        setStep("form");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
    setSubmitting(false);
  };

  const BrandPanel = (
    <div className="hidden lg:flex lg:w-[38%] xl:w-[35%] relative overflow-hidden bg-gradient-to-br from-[#0E1B2C] via-[#162d4a] to-[#0E1B2C] flex-col justify-between p-10 xl:p-12 shrink-0">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#024396]/25 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C7102E]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="relative flex items-center gap-3">
        <img src={LOGO_URL} alt="The Financial Doctor" width={900} height={235} className="h-11 bg-white rounded-lg p-1.5 object-contain" />
        <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-8 object-contain" />
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">TFD Internship</div>
          <div className="text-[9px] text-[#14E0A0] font-semibold tracking-wide">Learn. Build. Launch.</div>
        </div>
      </div>

      <div className="relative">
        <h1 className="font-display text-3xl xl:text-4xl text-white leading-tight mb-4">Launch Your Career.<br />Gain Real Experience.</h1>
        <p className="text-white/60 text-sm mb-8 max-w-xs leading-relaxed">
          Join The Financial Doctor's internship program and get hands-on exposure to the world of financial services.
        </p>
        <ul className="space-y-4">
          {BENEFITS.map((b) => (
            <li key={b.text} className="flex items-start gap-3 text-white/80 text-sm leading-snug">
              <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><b.icon size={15} /></span>
              <span className="pt-1.5">{b.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-white/30 text-xs">The Financial Doctor · AMFI Registered · ARN-290298</p>
    </div>
  );

  if (step === "done") {
    return (
      <div className="min-h-screen flex bg-[#F5F1EB]">
        {BrandPanel}
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E2D8C2] p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h1 className="font-display text-2xl font-medium text-[#0E1B2C] mb-2">Thank You for Applying!</h1>
            <p className="text-sm text-[#5C677D] leading-relaxed">
              Thank you, <b>{form.name}</b>. Your application has been submitted successfully. Our team at The Financial
              Doctor will carefully review your details, and we'll reach out to you on <b>{form.contact_email}</b> with
              the next steps once your internship is confirmed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F5F1EB]">
      {BrandPanel}

      <div className="flex-1 flex flex-col items-center px-4 sm:px-8 py-8 lg:py-10">
        <div className="w-full max-w-xl">
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={LOGO_URL} alt="The Financial Doctor" width={900} height={235} className="h-12 rounded-xl object-contain" />
              <div className="w-px h-8 bg-[#D8CDB0]" />
              <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-9 object-contain" />
              <div className="text-left leading-tight">
                <div className="text-sm font-bold text-[#0E1B2C]">TFD Internship</div>
                <div className="text-[9px] text-[#0E7A55] font-semibold tracking-wide">Learn. Build. Launch.</div>
              </div>
            </div>
            <h1 className="font-display text-2xl font-medium text-[#0E1B2C]">Internship Application</h1>
            <p className="text-sm text-[#5C677D] mt-1.5">Apply for an internship at The Financial Doctor</p>
          </div>
          <h2 className="hidden lg:block font-display text-2xl font-medium text-[#0E1B2C] mb-1">Apply for an Internship</h2>
          <p className="hidden lg:block text-sm text-[#5C677D] mb-6">Fill in your details below — it only takes a few minutes.</p>

          <StepIndicator step={step} />

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex gap-3">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <b>Please read before filling:</b> the details you enter here will appear directly on your official Internship Certificate and Completion Letter. Fill everything accurately and in English — these details will be verified, and any incorrect information means your internship will not be considered valid.
            </p>
          </div>

          {step === "form" && (
            <form onSubmit={goToReview} className="bg-white rounded-3xl shadow-lg border border-[#E2D8C2] p-6 sm:p-8 space-y-6">
              <div>
                <SectionHeader icon={User} title="Basic Information" />
                <div className="space-y-3.5">
                  <div>
                    <FieldLabel required>Full Name</FieldLabel>
                    <input required placeholder="As it should appear on your certificate" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
                  </div>

                  <div>
                    <FieldLabel required>Are you currently a student?</FieldLabel>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setForm({ ...form, is_student: true })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.is_student ? "bg-[#024396] text-white border-[#024396]" : "border-[#E2D8C2] text-[#5C677D] hover:border-[#024396]/40"}`}>Yes, I'm a student</button>
                      <button type="button" onClick={() => setForm({ ...form, is_student: false, college: "", subject: "" })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${!form.is_student ? "bg-[#024396] text-white border-[#024396]" : "border-[#E2D8C2] text-[#5C677D] hover:border-[#024396]/40"}`}>No</button>
                    </div>
                  </div>

                  {form.is_student && (
                    <div className="grid sm:grid-cols-2 gap-3.5">
                      <div>
                        <FieldLabel required>College / Institute</FieldLabel>
                        <input required placeholder="Full college name" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className={field} />
                      </div>
                      <div>
                        <FieldLabel required>Subject / Course</FieldLabel>
                        <input required placeholder="e.g. B.Com, BBA" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={field} />
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <FieldLabel required>Email</FieldLabel>
                      <input required type="email" placeholder="you@example.com" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className={field} />
                    </div>
                    <div>
                      <FieldLabel required>Contact Phone</FieldLabel>
                      <input required type="tel" placeholder="10-digit mobile number" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className={field} />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#5C677D] -mt-2.5 flex items-center gap-1">
                    <FileCheck2 size={11} className="shrink-0" /> Your Certificate and Completion Letter will be sent to this email address — please double-check it's correct.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#F0EADD] pt-5">
                <SectionHeader icon={GraduationCap} title="Internship Details" />
                <div className="space-y-3.5">
                  <div>
                    <FieldLabel required>Department</FieldLabel>
                    <select required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={field}>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <FieldLabel required>Duration</FieldLabel>
                      <select value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} className={field}>
                        {DURATIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
                      </select>
                    </div>
                    <div>
                      <FieldLabel required>Start Date</FieldLabel>
                      <input required type="date" min={todayStr} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={field} />
                    </div>
                  </div>
                  {form.start_date && (
                    <p className="text-xs text-[#024396] bg-[#024396]/5 rounded-lg px-3 py-2">Your internship will run until <b>{endDate}</b> — {form.duration_days} days total.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-[#F0EADD] pt-5">
                <SectionHeader icon={FileCheck2} title="Personal / KYC Details" subtitle="Required for certificate verification" />
                <div className="space-y-3.5">
                  <div>
                    <FieldLabel required>Father's Name</FieldLabel>
                    <input required value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} className={field} />
                  </div>
                  <div>
                    <FieldLabel required>Address</FieldLabel>
                    <textarea required placeholder="House/street/locality" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${field} resize-none`} />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3.5">
                    <div>
                      <FieldLabel required>City</FieldLabel>
                      <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={field} />
                    </div>
                    <div>
                      <FieldLabel required>State</FieldLabel>
                      <select required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={field}>
                        <option value="">Select</option>
                        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <FieldLabel required>Pincode</FieldLabel>
                      <input required inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} className={field} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <FieldLabel required>Aadhaar No.</FieldLabel>
                      <input required value={form.aadhar_number} onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })} className={field} />
                    </div>
                    <div>
                      <FieldLabel>PAN No. (optional)</FieldLabel>
                      <input value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} className={field} />
                    </div>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-[#C7102E] bg-[#C7102E]/5 rounded-lg px-3.5 py-2.5">{error}</p>}

              <button type="submit" className="w-full py-3.5 rounded-xl bg-[#024396] text-white text-sm font-semibold hover:bg-[#023580] shadow-md shadow-[#024396]/20 transition-colors">
                Review & Continue
              </button>
            </form>
          )}

          {step === "review" && (
            <div className="bg-white rounded-3xl shadow-lg border border-[#E2D8C2] p-6 sm:p-8 space-y-5">
              <button onClick={() => setStep("form")} className="flex items-center gap-1 text-xs text-[#024396] font-semibold hover:underline">
                <ChevronLeft size={14} /> Back to edit
              </button>
              <div>
                <h2 className="font-display text-lg font-medium text-[#0E1B2C]">Please review your details</h2>
                <p className="text-xs text-[#5C677D] mt-0.5">Take a moment to check everything is correct before submitting.</p>
              </div>
              <div className="bg-[#F5F1EB] rounded-2xl p-4 text-xs space-y-2">
                <Row label="Name" value={form.name} />
                <Row label="Student?" value={form.is_student ? "Yes" : "No"} />
                {form.is_student && <Row label="College" value={form.college} />}
                {form.is_student && <Row label="Subject / Course" value={form.subject} />}
                <Row label="Department" value={form.department} />
                <Row label="Duration" value={`${form.start_date} to ${endDate} (${form.duration_days} days)`} />
                <Row label="Father's Name" value={form.father_name} />
                <Row label="Address" value={`${form.address}, ${form.city}, ${form.state} - ${form.pincode}`} />
                <Row label="Aadhaar No." value={form.aadhar_number} />
                {form.pan_number && <Row label="PAN No." value={form.pan_number} />}
                <Row label="Phone" value={form.contact_phone} />
                <Row label="Email" value={form.contact_email} />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-[#024396]" />
                <span className="text-xs text-[#2A364B] leading-relaxed">
                  I declare that all the details entered above are true and correct to the best of my knowledge. I understand these details will appear on my official certificate and will be verified — if any information is found to be incorrect, my internship will not be considered valid.
                </span>
              </label>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs text-amber-900 font-semibold flex items-center gap-1.5"><Star size={14} className="text-amber-500 fill-amber-500" /> One last thing before you submit</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Please take a moment to rate us and share a short review on Google — it genuinely helps us reach more students like you.
                </p>
                <a
                  href={LINKS.googleReviews}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setRatingClicked(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg px-3.5 py-2 transition-colors"
                >
                  <Star size={12} className="fill-white" /> Rate us on Google
                </a>
                <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                  <input type="checkbox" checked={rated} onChange={(e) => setRated(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-amber-500" />
                  <span className="text-xs text-amber-900 leading-relaxed">
                    {ratingClicked ? "I've rated and written a short review on Google." : "I've already rated The Financial Doctor on Google, or I will right now before submitting."}
                  </span>
                </label>
              </div>

              {error && <p className="text-sm text-[#C7102E] bg-[#C7102E]/5 rounded-lg px-3.5 py-2.5">{error}</p>}

              <button
                onClick={submit}
                disabled={!declared || !rated || submitting}
                className="w-full py-3.5 rounded-xl bg-[#024396] text-white text-sm font-semibold hover:bg-[#023580] shadow-md shadow-[#024396]/20 transition-colors disabled:opacity-50 disabled:shadow-none"
              >
                {submitting ? "Submitting..." : "Confirm & Submit Application"}
              </button>
            </div>
          )}

          <p className="text-center text-[10px] text-[#9AA5B4] mt-6">Powered by The Financial Doctor</p>
          <p className="text-center text-[10px] text-[#9AA5B4] mt-1 mb-6">
            AMFI Registered · ARN-290298 · <a href="https://www.thefinancialdoctor.in" className="text-[#024396]">thefinancialdoctor.in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#5C677D] shrink-0">{label}</span>
      <span className="text-[#0E1B2C] font-medium text-right">{value}</span>
    </div>
  );
}
