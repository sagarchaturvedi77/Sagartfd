import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const MAIN_LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.png";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";
const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function InternshipResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const field = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60 focus:ring-2 focus:ring-[#14E0A0]/20 transition-shadow";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/internship/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      setDone(true);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#050B16] text-white px-4 py-10 flex flex-col">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" className="h-9 object-contain" />
          <div className="text-left leading-tight">
            <div className="text-base font-bold text-white">TFD Internship</div>
            <div className="text-[10px] text-[#14E0A0] font-semibold tracking-wide">Learn. Build. Launch.</div>
          </div>
        </div>

        <h1 className="font-display text-xl font-bold text-center mb-1">Reset Password</h1>
        <p className="text-white/45 text-sm text-center mb-8">Choose a new password for your account</p>

        {!token ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center">
            <p className="text-sm text-red-300">This reset link is invalid. Please request a new one.</p>
          </div>
        ) : done ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center">
            <CheckCircle2 size={32} className="text-[#14E0A0] mx-auto mb-3" />
            <p className="text-sm text-white/80 mb-4">Your password has been reset. You can now log in.</p>
            <button
              onClick={() => navigate("/internship/login")}
              className="w-full bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-sm py-3 rounded-xl transition-all"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-6">
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">New Password</label>
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Confirm Password</label>
              <input required type="password" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={field} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-3 rounded-xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all mt-2"
            >
              {submitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <button
          onClick={() => navigate("/internship/login")}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white transition-colors mt-8 mx-auto"
        >
          <ArrowLeft size={14} /> Back to Login
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 pt-6">
        <img src={MAIN_LOGO_URL} alt="The Financial Doctor" className="h-6 bg-white rounded-md p-0.5 object-contain" />
        <span className="text-white/30 text-[11px]">Powered by The Financial Doctor</span>
      </div>
    </div>
  );
}
