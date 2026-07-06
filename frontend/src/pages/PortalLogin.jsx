import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";
import WelcomeAnimation from "../components/WelcomeAnimation";

export default function PortalLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(phone, password);
      setLoggedInUser(user);
      setShowWelcome(true);
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
      setSubmitting(false);
    }
  };

  const handleWelcomeComplete = () => {
    if (loggedInUser) {
      navigate(loggedInUser.role === "admin" ? "/portal/admin" : "/portal/employee");
    }
  };

  return (
    <>
    {showWelcome && (
      <WelcomeAnimation
        userName={loggedInUser?.name}
        onComplete={handleWelcomeComplete}
      />
    )}
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0E1B2C] via-[#162d4a] to-[#0E1B2C] px-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#024396]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#024396]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <BrandLogo className="h-24" />
          </div>

          {/* Header */}
          <p className="text-sm text-[#2A364B]/60 text-center mb-8">
            Work Smart. Grow Together.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-[#2A364B]/80 uppercase tracking-wider block mb-2">
                User ID (Mobile Number)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2A364B]/40">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </span>
                <input
                  type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-[#E2D8C2] rounded-xl pl-12 pr-4 py-3 bg-[#FBF7EE]/50 focus:bg-white focus:border-[#024396] focus:ring-2 focus:ring-[#024396]/20 outline-none transition-all text-[#0E1B2C]"
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#2A364B]/80 uppercase tracking-wider block mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2A364B]/40">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#E2D8C2] rounded-xl pl-12 pr-12 py-3 bg-[#FBF7EE]/50 focus:bg-white focus:border-[#024396] focus:ring-2 focus:ring-[#024396]/20 outline-none transition-all text-[#0E1B2C]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2A364B]/40 hover:text-[#024396] transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={submitting}
              className="w-full bg-gradient-to-r from-[#024396] to-[#0356c4] text-white py-3.5 rounded-xl font-semibold text-sm tracking-wide hover:from-[#023580] hover:to-[#024396] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#024396]/25 hover:shadow-xl hover:shadow-[#024396]/30 active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#E2D8C2]/50">
            <p className="text-xs text-[#2A364B]/50 text-center">
              Don't have access? Contact your admin to get started.
            </p>
          </div>
        </div>

        {/* Branding below card */}
        <p className="text-center text-xs text-white/30 mt-6">
          The Financial Doctor &middot; Team Workspace
        </p>
      </div>
    </div>
    </>
  );
}
