import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const MAIN_LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.webp";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.webp";
const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function InternshipForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const field = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60 focus:ring-2 focus:ring-[#14E0A0]/20 transition-shadow";

  // useSubmitOnce's ref guard stops a rapid double-click/laggy re-render
  // from firing two concurrent requests, same pattern as CallFlowPopup /
  // EmployeeAgreement / EmployeeAttendance.
  const [handleSubmit, submitting] = useSubmitOnce(async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/internship/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      setSent(true);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  });

  return (
    <div className="min-h-screen bg-[#050B16] text-white px-4 py-10 flex flex-col">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-9 w-auto object-contain" />
          <div className="text-left leading-tight">
            <div className="text-base font-bold text-white">TFD Internship</div>
            <div className="text-[10px] text-[#14E0A0] font-semibold tracking-wide">Learn. Build. Launch.</div>
          </div>
        </div>

        <h1 className="font-display text-xl font-bold text-center mb-1">Forgot Password</h1>
        <p className="text-white/45 text-sm text-center mb-8">Enter your registered email to reset it</p>

        {sent ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center">
            <Mail size={32} className="text-[#14E0A0] mx-auto mb-3" />
            <p className="text-sm text-white/80">
              A password reset link has been sent to <span className="text-white font-semibold">{email}</span>. It expires in 20 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-6">
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Registered Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="you@example.com" />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-3 rounded-xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all mt-2"
            >
              {submitting ? "Sending..." : "Send Reset Link"}
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
        <img src={MAIN_LOGO_URL} alt="The Financial Doctor" width={900} height={235} className="h-6 w-auto bg-white rounded-md p-0.5 object-contain" />
        <span className="text-white/30 text-[11px]">Powered by The Financial Doctor</span>
      </div>
    </div>
  );
}
