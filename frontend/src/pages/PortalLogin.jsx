import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";

export default function PortalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/portal/admin" : "/portal/employee");
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1B2C] px-6">
      <div className="bg-[#F6F1E8] rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="The Financial Doctor" className="h-14 object-contain" />
        </div>
        <h1 className="text-2xl font-serif text-[#0E1B2C] text-center mb-1">Staff Portal</h1>
        <p className="text-sm text-[#2A364B]/70 text-center mb-6">Admin & Employee Login</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-[#2A364B] block mb-1">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#E2D8C2] rounded-lg px-4 py-2.5 bg-white"
              placeholder="you@thefinancialdoctor.in"
            />
          </div>
          <div>
            <label className="text-sm text-[#2A364B] block mb-1">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#E2D8C2] rounded-lg px-4 py-2.5 bg-white"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit" disabled={submitting}
            className="w-full bg-[#024396] text-white py-2.5 rounded-lg font-display hover:bg-[#0356c4] transition-colors disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-[#2A364B]/60 text-center mt-6">
          Don't have access? Contact your admin to get an account created.
        </p>
      </div>
    </div>
  );
}
