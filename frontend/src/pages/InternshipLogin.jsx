import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";

const MAIN_LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.png";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";

export default function InternshipLogin() {
  const navigate = useNavigate();
  const { login } = useInternshipAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const field = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60 focus:ring-2 focus:ring-[#14E0A0]/20 transition-shadow";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(phone, password);
      navigate("/portal/student");
    } catch (err) {
      toast.error(err.message || "Login failed");
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

        <h1 className="font-display text-xl font-bold text-center mb-1">Student Login</h1>
        <p className="text-white/45 text-sm text-center mb-8">TFD Internship Portal</p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-6">
          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Mobile Number</label>
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
            <button
              type="button"
              onClick={() => navigate("/internship/forgot-password")}
              className="text-[11px] font-semibold text-[#14E0A0] hover:underline mt-2"
            >
              Forgot Password?
            </button>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-3 rounded-xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all mt-2"
          >
            {submitting ? "Logging in..." : "Log In"} <ArrowUpRight size={16} />
          </button>
        </form>

        <p className="text-center text-white/40 text-xs mt-5">
          New here?{" "}
          <button onClick={() => navigate("/internship/apply")} className="text-[#14E0A0] font-semibold hover:underline">
            Apply for the internship
          </button>
        </p>

        <button
          onClick={() => navigate("/internship")}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white transition-colors mt-8 mx-auto"
        >
          <ArrowLeft size={14} /> Back to Internship Home
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 pt-6">
        <img src={MAIN_LOGO_URL} alt="The Financial Doctor" className="h-6 bg-white rounded-md p-0.5 object-contain" />
        <span className="text-white/30 text-[11px]">Powered by The Financial Doctor</span>
      </div>
    </div>
  );
}
