import React, { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, ChevronLeft, Star } from "lucide-react";
import LINKS from "../lib/links";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.png";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";
const DEPARTMENTS = ["HR", "Sales", "Marketing", "Accounts"];
const DURATIONS = [45, 60, 90];

const emptyForm = {
  name: "", is_student: true, college: "", subject: "", department: "Sales",
  duration_days: 45, start_date: "", contact_phone: "", contact_email: "",
  father_name: "", address: "", aadhar_number: "", pan_number: "",
};

function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days - 1);
  return d.toISOString().split("T")[0];
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

  const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white";

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
    setStep("review");
    setDeclared(false);
    setRated(false);
    setRatingClicked(false);
  };

  const submit = async () => {
    if (!declared || !rated || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/interns/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pan_number: form.pan_number || null, contact_email: form.contact_email || null }),
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

  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#E2D8C2] p-8 text-center">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <h1 className="text-lg font-serif font-semibold text-[#0E1B2C] mb-2">Aapka form submit ho gaya hai!</h1>
          <p className="text-sm text-[#5C677D]">
            Thank you, {form.name}. Your internship application has been received and is pending admin review.
            You'll be contacted once it's approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={LOGO_URL} alt="The Financial Doctor" className="h-14 rounded-xl object-contain" />
            <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" className="h-10 object-contain" />
          </div>
          <h1 className="text-lg font-serif font-semibold text-[#0E1B2C]">Internship Application</h1>
          <p className="text-xs text-[#5C677D] mt-1">Fill in your details below to apply for an internship at The Financial Doctor</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 flex gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <b>Please read before filling:</b> The details you enter here will appear directly on your official Internship Certificate and Completion Letter. Fill everything accurately and in English. These details will be verified — if anything is found incorrect, your internship will not be considered valid.
          </p>
        </div>

        {step === "form" && (
          <form onSubmit={goToReview} className="bg-white rounded-2xl shadow-lg border border-[#E2D8C2] p-6 space-y-3">
            <input required placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />

            <div>
              <label className="text-xs text-[#5C677D] mb-1 block">Are you currently a student? *</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, is_student: true })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${form.is_student ? "bg-[#024396] text-white border-[#024396]" : "border-[#E2D8C2] text-[#5C677D]"}`}>Yes, I'm a student</button>
                <button type="button" onClick={() => setForm({ ...form, is_student: false, college: "", subject: "" })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${!form.is_student ? "bg-[#024396] text-white border-[#024396]" : "border-[#E2D8C2] text-[#5C677D]"}`}>No</button>
              </div>
            </div>

            {form.is_student && (
              <>
                <input required placeholder="College / Institute Name *" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className={field} />
                <input required placeholder="Subject / Course you're studying *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={field} />
              </>
            )}

            <select required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={field}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#5C677D] mb-1 block">Duration *</label>
                <select value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} className={field}>
                  {DURATIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#5C677D] mb-1 block">Start Date *</label>
                <input required type="date" min={todayStr} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={field} />
              </div>
            </div>
            {form.start_date && (
              <p className="text-xs text-[#5C677D] -mt-1.5 px-1">Your internship will run until <b>{endDate}</b> ({form.duration_days} days).</p>
            )}

            <div className="border-t border-[#E2D8C2] pt-3">
              <p className="text-xs font-semibold text-[#5C677D] mb-2 uppercase tracking-wide">Personal Details</p>
              <div className="space-y-3">
                <input required placeholder="Father's Name *" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} className={field} />
                <textarea required placeholder="Address *" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${field} resize-none`} />
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Aadhaar No. *" value={form.aadhar_number} onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })} className={field} />
                  <input placeholder="PAN No. (optional)" value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} className={field} />
                </div>
                <input required type="tel" placeholder="Contact Phone *" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className={field} />
                <input type="email" placeholder="Email (optional)" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className={field} />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="w-full py-3 rounded-xl bg-[#024396] text-white text-sm font-semibold hover:bg-[#023580] transition-colors">
              Review & Continue
            </button>
          </form>
        )}

        {step === "review" && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E2D8C2] p-6 space-y-4">
            <button onClick={() => setStep("form")} className="flex items-center gap-1 text-xs text-[#024396] font-medium">
              <ChevronLeft size={14} /> Back to edit
            </button>
            <h2 className="text-sm font-semibold text-[#0E1B2C]">Please review your details</h2>
            <div className="bg-[#F5F1EB] rounded-xl p-3.5 text-xs space-y-1.5">
              <Row label="Name" value={form.name} />
              <Row label="Student?" value={form.is_student ? "Yes" : "No"} />
              {form.is_student && <Row label="College" value={form.college} />}
              {form.is_student && <Row label="Subject / Course" value={form.subject} />}
              <Row label="Department" value={form.department} />
              <Row label="Duration" value={`${form.start_date} to ${endDate} (${form.duration_days} days)`} />
              <Row label="Father's Name" value={form.father_name} />
              <Row label="Address" value={form.address} />
              <Row label="Aadhaar No." value={form.aadhar_number} />
              {form.pan_number && <Row label="PAN No." value={form.pan_number} />}
              <Row label="Phone" value={form.contact_phone} />
              {form.contact_email && <Row label="Email" value={form.contact_email} />}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-[#024396]" />
              <span className="text-xs text-[#2A364B] leading-relaxed">
                I declare that all the details entered above are true and correct to the best of my knowledge. I understand these details will appear on my official certificate and will be verified — if any information is found to be incorrect, my internship will not be considered valid.
              </span>
            </label>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
              <p className="text-xs text-amber-900 font-medium flex items-center gap-1.5"><Star size={14} className="text-amber-500 fill-amber-500" /> One last thing before you submit</p>
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={submit}
              disabled={!declared || !rated || submitting}
              className="w-full py-3 rounded-xl bg-[#024396] text-white text-sm font-semibold hover:bg-[#023580] transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Confirm & Submit Application"}
            </button>
          </div>
        )}

        <p className="text-center text-[10px] text-[#9AA5B4] mt-6">Powered by The Financial Doctor</p>
        <p className="text-center text-[10px] text-[#9AA5B4] mt-1">
          AMFI Registered · ARN-290298 · <a href="https://www.thefinancialdoctor.in" className="text-[#024396]">thefinancialdoctor.in</a>
        </p>
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
