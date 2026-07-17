import React, { useState } from "react";
import BrandLogo from "../components/BrandLogo";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [handleSubmit, submitting] = useSubmitOnce(async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Something went wrong. Please try again.");
      }
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
  });

  return (
    <div className="min-h-screen flex bg-[#F5F1EB] dark:bg-[#0B1420] transition-colors">
      <div className="hidden lg:flex lg:w-[42%] xl:w-2/5 relative overflow-hidden bg-gradient-to-br from-[#0E1B2C] via-[#162d4a] to-[#0E1B2C] flex-col justify-between p-12">
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#024396]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#024396]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="relative">
          <BrandLogo className="h-16" />
        </div>
        <div className="relative">
          <h1 className="font-serif text-3xl xl:text-4xl text-white leading-tight mb-3">
            Forgot your<br />password?
          </h1>
          <p className="text-white/50 text-sm mb-8 max-w-xs">
            No problem — we'll email a reset link to the address on your account.
          </p>
        </div>
        <p className="relative text-white/30 text-xs">The Financial Doctor &middot; Team Workspace</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden justify-center mb-8">
            <BrandLogo className="h-20" />
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>
              </div>
              <h2 className="font-serif text-2xl text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">Check your email</h2>
              <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC] mb-8">
                We've sent a password reset link to <strong>{email}</strong>. It's valid for 20 minutes.
              </p>
              <a href="/portal/login" className="text-sm font-medium text-[#024396] dark:text-[#7CB0FF] hover:underline">← Back to Sign In</a>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-serif text-2xl text-[#0E1B2C] dark:text-[#F1EDE3]">Reset your password</h2>
                <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] mt-1">Enter your registered email ID to receive a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-xs font-medium text-[#2A364B]/80 dark:text-[#C7CEDA] uppercase tracking-wider mb-2 block">
                    Registered Email ID
                  </Label>
                  <Input
                    id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email ID"
                    className="h-12 px-4 rounded-xl border-[#E2D8C2] dark:border-white/10 bg-[#FBF7EE]/50 dark:bg-white/5 dark:text-[#F1EDE3] focus-visible:bg-white dark:focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#024396]/20 focus-visible:border-[#024396]"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
                )}

                <Button
                  type="submit" disabled={submitting || !email.trim()}
                  className="w-full h-12 bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] hover:to-[#024396] rounded-xl font-semibold text-sm tracking-wide shadow-lg shadow-[#024396]/25"
                >
                  {submitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#E2D8C2]/50 dark:border-white/10 text-center">
                <a href="/portal/login" className="text-xs font-medium text-[#024396] dark:text-[#7CB0FF] hover:underline">← Back to Sign In</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
