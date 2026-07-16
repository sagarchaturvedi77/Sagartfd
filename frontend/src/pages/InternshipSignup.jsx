import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, TrendingUp, Heart, Megaphone, Landmark, Video } from "lucide-react";
import { toast } from "sonner";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MAIN_LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.png";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";

const TRACKS = [
  { value: "finance", label: "Finance", icon: Landmark },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "sales", label: "Sales", icon: TrendingUp },
  { value: "hr", label: "HR", icon: Heart },
];

const DURATIONS = [
  { days: 45, price: 2000 },
  { days: 60, price: 3000 },
  { days: 90, price: 5000 },
];

export default function InternshipSignup() {
  const navigate = useNavigate();
  const { setSession } = useInternshipAuth();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", college: "", course_year: "", track: "", duration_days: 45,
  });
  const [videoConsent, setVideoConsent] = useState(null); // null = not yet chosen, forces an explicit answer
  const [submitting, setSubmitting] = useState(false);

  const field = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60 focus:ring-2 focus:ring-[#14E0A0]/20 transition-shadow";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.track) {
      toast.error("Please choose a track to continue.");
      return;
    }
    if (videoConsent === null) {
      toast.error("Please answer the video review consent question to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/internship/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, video_consent: videoConsent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.detail || "Signup failed. Please try again.");
        setSubmitting(false);
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
      toast.success("Welcome to TFD Internship!");
      navigate("/portal/student");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B16] text-white px-4 py-8 sm:py-14">
      <div className="max-w-lg mx-auto">
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

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-6">
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

          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-2">Choose Your Duration *</label>
            <div className="grid grid-cols-3 gap-2.5">
              {DURATIONS.map((d) => (
                <button
                  type="button"
                  key={d.days}
                  onClick={() => setForm({ ...form, duration_days: d.days })}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                    form.duration_days === d.days
                      ? "bg-[#14E0A0]/15 border-[#14E0A0] text-[#14E0A0]"
                      : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25"
                  }`}
                >
                  <span className="font-bold">{d.days} Days</span>
                  <span className="text-[10px] opacity-75">₹{d.price}</span>
                </button>
              ))}
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
            className="w-full flex items-center justify-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-3 rounded-xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all mt-2"
          >
            {submitting
              ? "Creating your account..."
              : `Create Account & Continue — ₹${DURATIONS.find((d) => d.days === form.duration_days)?.price}`} <ArrowUpRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
