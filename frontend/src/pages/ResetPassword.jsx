import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [handleSubmit, submitting] = useSubmitOnce(async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords don't match.");

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "This reset link is invalid or has expired.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
            Choose a new<br />password.
          </h1>
          <p className="text-white/50 text-sm mb-8 max-w-xs">
            Make it something only you'd know.
          </p>
        </div>
        <p className="relative text-white/30 text-xs">The Financial Doctor &middot; Team Workspace</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden justify-center mb-8">
            <BrandLogo className="h-20" />
          </div>

          {!token ? (
            <div className="text-center">
              <h2 className="font-serif text-2xl text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">Invalid link</h2>
              <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC] mb-8">This reset link is missing its token. Please request a new one.</p>
              <a href="/portal/forgot-password" className="text-sm font-medium text-[#024396] dark:text-[#7CB0FF] hover:underline">Request a new link</a>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="font-serif text-2xl text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">Password reset</h2>
              <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC] mb-8">Your password has been changed. Sign in with your new password.</p>
              <a href="/portal/login" className="inline-block h-12 leading-[48px] px-8 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#024396] to-[#0356c4]">Sign In</a>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-serif text-2xl text-[#0E1B2C] dark:text-[#F1EDE3]">Set a new password</h2>
                <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] mt-1">Choose a new password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="password" className="text-xs font-medium text-[#2A364B]/80 dark:text-[#C7CEDA] uppercase tracking-wider mb-2 block">
                    New Password
                  </Label>
                  <Input
                    id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-12 px-4 rounded-xl border-[#E2D8C2] dark:border-white/10 bg-[#FBF7EE]/50 dark:bg-white/5 dark:text-[#F1EDE3] focus-visible:bg-white dark:focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#024396]/20 focus-visible:border-[#024396]"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-[#2A364B]/80 dark:text-[#C7CEDA] uppercase tracking-wider mb-2 block">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="h-12 px-4 rounded-xl border-[#E2D8C2] dark:border-white/10 bg-[#FBF7EE]/50 dark:bg-white/5 dark:text-[#F1EDE3] focus-visible:bg-white dark:focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#024396]/20 focus-visible:border-[#024396]"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {error}
                    {error.toLowerCase().includes("expired") || error.toLowerCase().includes("invalid") ? (
                      <> <a href="/portal/forgot-password" className="underline font-medium">Request a new link</a></>
                    ) : null}
                  </div>
                )}

                <Button
                  type="submit" disabled={submitting}
                  className="w-full h-12 bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] hover:to-[#024396] rounded-xl font-semibold text-sm tracking-wide shadow-lg shadow-[#024396]/25"
                >
                  {submitting ? "Saving..." : "Reset Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
