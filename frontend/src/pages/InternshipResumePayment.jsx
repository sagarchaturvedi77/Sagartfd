import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Landmark, Megaphone, TrendingUp, Heart } from "lucide-react";
import { toast } from "sonner";
import { openCashfreeCheckout } from "../lib/cashfree";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MAIN_LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.webp";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.webp";

const TRACKS = [
  { value: "finance", label: "Finance", icon: Landmark },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "sales", label: "Sales", icon: TrendingUp },
  { value: "hr", label: "HR", icon: Heart },
];

// Reached from the signup-confirmation and 30-min reminder emails — this is
// the "finish paying without logging in" flow, since login is intentionally
// blocked until payment clears (see backend/internship_routes.py's login()).
export default function InternshipResumePayment() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [form, setForm] = useState({ name: "", college: "", course_year: "", track: "" });
  const [intern, setIntern] = useState(null);

  const field = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60 focus:ring-2 focus:ring-[#14E0A0]/20 transition-shadow";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/internship/resume-payment/${token}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.detail || "This payment link is invalid or has expired.");
        } else {
          setForm({ name: data.name || "", college: data.college || "", course_year: data.course_year || "", track: data.track || "" });
          setIntern(data);
        }
      } catch {
        if (!cancelled) setError("Could not load your details — please check your connection and try again.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      const updateRes = await fetch(`${API_BASE}/api/internship/resume-payment/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const updateData = await updateRes.json().catch(() => ({}));
      if (!updateRes.ok) throw new Error(updateData.detail || "Could not save your details");

      const payRes = await fetch(`${API_BASE}/api/internship/resume-payment/${token}/pay`, { method: "POST" });
      const payData = await payRes.json().catch(() => ({}));
      if (!payRes.ok) throw new Error(payData.detail || "Could not start payment");
      await openCashfreeCheckout(payData.payment_session_id, payData.cashfree_env);
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B16] text-white flex items-center justify-center">
        <p className="text-white/50 text-sm">Loading your details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050B16] text-white px-4 py-10 flex flex-col items-center justify-center text-center">
        <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-10 object-contain mb-6" />
        <p className="text-white/70 text-sm max-w-sm mb-6">{error}</p>
        <button
          onClick={() => navigate("/internship/login")}
          className="inline-flex items-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-sm px-6 py-3 rounded-2xl transition-all"
        >
          Go to Login <ArrowUpRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B16] text-white px-4 py-8 sm:py-14">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <img src={MAIN_LOGO_URL} alt="The Financial Doctor" width={900} height={235} className="h-8 bg-white rounded-lg p-1 object-contain" />
            <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-6 object-contain" />
          </div>
          <button onClick={() => navigate("/internship")} className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <h1 className="font-display text-2xl font-bold mb-1">Complete Your Payment</h1>
        <p className="text-white/50 text-sm mb-8">
          Review your details below — edit anything that's changed — then pay to activate your account.
          {intern?.intern_id && <span className="block mt-1 text-white/35">Intern ID: {intern.intern_id}</span>}
        </p>

        <form onSubmit={handlePay} className="space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-6">
          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Full Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">College</label>
              <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className={field} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Course & Year</label>
              <input placeholder="e.g. BBA 2nd Year" value={form.course_year} onChange={(e) => setForm({ ...form, course_year: e.target.value })} className={field} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-2">Track</label>
            <div className="grid grid-cols-2 gap-2.5">
              {TRACKS.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setForm({ ...form, track: t.value })}
                  className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                    form.track === t.value
                      ? "bg-[#14E0A0]/15 border-[#14E0A0] text-[#14E0A0]"
                      : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25"
                  }`}
                >
                  <t.icon size={14} className="shrink-0" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {intern && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#14E0A0]/40 bg-[#14E0A0]/[0.08]">
              <span className="text-sm font-bold text-white">{intern.duration_days}-Day Program</span>
              <span className="text-sm font-bold text-[#14E0A0]">₹{intern.payment_amount?.toLocaleString("en-IN")}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={paying}
            className="w-full flex items-center justify-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-3 rounded-xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all mt-2"
          >
            {paying ? "Starting payment..." : `Save & Pay ₹${intern?.payment_amount || ""}`} <ArrowUpRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
