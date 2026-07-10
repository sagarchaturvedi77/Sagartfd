import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const LOGO_URL = "/tfd-workspace-logo.png";
const DEPARTMENTS = ["HR", "Sales", "Marketing", "Accounts"];

export default function InternApplicationPage() {
  const [form, setForm] = useState({ name: "", college: "", department: "Sales", start_date: "", end_date: "", contact_phone: "", contact_email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/interns/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  if (submitted) {
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
          <img src={LOGO_URL} alt="The Financial Doctor" className="h-16 mx-auto rounded-xl object-contain mb-3" />
          <h1 className="text-lg font-serif font-semibold text-[#0E1B2C]">Internship Application</h1>
          <p className="text-xs text-[#5C677D] mt-1">Fill in your details below to apply for an internship at The Financial Doctor</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg border border-[#E2D8C2] p-6 space-y-3">
          <input required placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
          <input placeholder="College / Institute (optional)" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className={field} />
          <select required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={field}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#5C677D] mb-1 block">Start Date *</label>
              <input required type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={field} />
            </div>
            <div>
              <label className="text-xs text-[#5C677D] mb-1 block">End Date *</label>
              <input required type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={field} />
            </div>
          </div>
          <input required type="tel" placeholder="Contact Phone *" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className={field} />
          <input type="email" placeholder="Email (optional)" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className={field} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-[#024396] text-white text-sm font-semibold hover:bg-[#023580] transition-colors disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#9AA5B4] mt-6">The Financial Doctor · AMFI Registered · ARN-290298</p>
      </div>
    </div>
  );
}
