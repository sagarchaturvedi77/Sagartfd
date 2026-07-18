import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, TrendingUp, Heart, Megaphone, Landmark, Video } from "lucide-react";
import { toast } from "sonner";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { openCashfreeCheckout } from "../lib/cashfree";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MAIN_LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.png";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";

const TRACKS = [
  { value: "finance", label: "Finance", icon: Landmark },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "sales", label: "Sales", icon: TrendingUp },
  { value: "hr", label: "HR", icon: Heart },
];

// Only one program length now (90 days, ₹5,000) — the backend's
// DurationDays type narrowed from Literal[45,60,90] to Literal[90], so any
// signup sent with 45/60 would now be rejected. Kept as a small array (not
// a bare constant) since the price lookup below still reads from it.
const DURATIONS = [{ days: 90, price: 5000 }];

const TRACK_VALUES = TRACKS.map((t) => t.value);

export default function InternshipSignup() {
  const navigate = useNavigate();
  const { setSession } = useInternshipAuth();
  const [searchParams] = useSearchParams();
  const preselectedTrack = searchParams.get("track");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", college: "", course_year: "",
    track: TRACK_VALUES.includes(preselectedTrack) ? preselectedTrack : "",
    duration_days: 90,
  });
  const [videoConsent, setVideoConsent] = useState(null); // null = not yet chosen, forces an explicit answer

  const field = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60 focus:ring-2 focus:ring-[#14E0A0]/20 transition-shadow";

  // useSubmitOnce's ref-based guard is critical here — this handler both
  // creates the student account AND creates a Cashfree payment order, so a
  // duplicate call from a double-click/laggy re-render risks a duplicate
  // account or a duplicate pending payment order (real money on the line),
  // same concern as StudentDashboard's startPayment.
  const [handleSubmit, submitting] = useSubmitOnce(async (e) => {
    e.preventDefault();
    if (!form.track) {
      toast.error("Please choose a track to continue.");
      return;
    }
    if (videoConsent === null) {
      toast.error("Please answer the video review consent question to continue.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/internship/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, video_consent: videoConsent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.detail || "Signup failed. Please try again.");
        return;
      }
      // Signup returns a token directly; lock in the chosen track right after.
      setSession(data.access_token, data.student);
      try {
        await fetch(`${API_BASE}/api/internship/track`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.access_token}` },
          body: JSON.stringify({ track: form.track }),
        });
      } catch {
        // Non-fatal — student can still pick a track from their dashboard.
      }
      toast.success("Account created — let's secure your seat.");

      try {
        const orderRes = await fetch(`${API_BASE}/api/internship/payment/create-order`, {
          method: "POST",
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const orderData = await orderRes.json().catch(() => ({}));
        if (!orderRes.ok) throw new Error(orderData.detail || "Could not start payment");
        // Navigates the browser to Cashfree's hosted checkout — nothing
        // after this line runs in this page load on success. On return,
        // /portal/student picks up ?order_id=... and confirms the status.
        await openCashfreeCheckout(orderData.payment_session_id, orderData.cashfree_env);
      } catch (payErr) {
        toast.error((payErr && payErr.message) || "Payment could not be started — you can retry from your dashboard.");
        navigate("/portal/student");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <div className="min-h-screen bg-[#050B16] text-white px-4 py-8 sm:py-14">
      <div className="max-w-lg lg:max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <img src={MAIN_LOGO_URL} alt="The Financial Doctor" className="h-8 bg-white rounded-lg p-1 object-contain" />
            <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" className="h-6 object-contain" />
            <div className="leading-tight hidden sm:block">
              <div className="text-xs font-bold text-white">TFD Internship</div>
              <div className="text-[8px] text-[#14E0A0] font-semibold">Learn. Build. Launch.</div>
            </div>
          </div>
          <button onClick={() => navigate("/internship")} className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <h1 className="font-display text-2xl font-bold mb-1">Apply for TFD Internship</h1>
        <p className="text-white/50 text-sm mb-8">Create your student account and pick a track — takes under 2 minutes.</p>

        {/* Landscape on desktop: two columns side by side (account details
            left, track/duration/consent/submit right) so the whole form
            fits on a typical desktop screen without scrolling. Below the
            lg breakpoint it collapses to the original single column. */}
        <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Full Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Mobile Number *</label>
                <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Set a Password *</label>
              <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={field} />
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
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-2">Choose Your Track *</label>
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
          </div>

          <div className="space-y-4 flex flex-col">
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-2">Program Duration</label>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#14E0A0]/40 bg-[#14E0A0]/[0.08]">
                <span className="text-sm font-bold text-white">90-Day Program</span>
                <span className="text-sm font-bold text-[#14E0A0]">₹5,000</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#14E0A0]/25 bg-[#14E0A0]/[0.04] p-4">
              <div className="flex items-start gap-2.5">
                <Video size={16} className="text-[#14E0A0] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Heads up — a video review at the end</p>
                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                    Near the end of your internship, we'll ask you to share a short review video of your experience —
                    feel free to include small clips from wherever you were working. It's just a link (YouTube,
                    Instagram, Google Drive — wherever you've already uploaded it), no file upload needed here.
                  </p>
                </div>
              </div>

              <div className="mt-3.5">
                <label className="block text-[11px] font-semibold text-white/60 mb-2">
                  Can TFD feature your review video on our social media (Instagram / YouTube / LinkedIn)? *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setVideoConsent(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      videoConsent === true ? "bg-[#14E0A0]/15 border-[#14E0A0] text-[#14E0A0]" : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25"
                    }`}
                  >
                    Yes, you can feature it
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoConsent(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      videoConsent === false ? "bg-white/10 border-white/30 text-white" : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25"
                    }`}
                  >
                    No, keep it private
                  </button>
                </div>
                <p className="text-[10px] text-white/35 mt-1.5">You can change your answer later, right when you submit the actual video.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-3 rounded-xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all mt-auto"
            >
              {submitting
                ? "Setting things up..."
                : `Create Account & Pay ₹${DURATIONS.find((d) => d.days === form.duration_days)?.price}`} <ArrowUpRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
