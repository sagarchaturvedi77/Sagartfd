import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import { enablePush, pushSupported } from "../portal/push";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function EmployeeSettings() {
  const { token } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // {type, text}
  const [pushMsg, setPushMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 6) return setMsg({ type: "err", text: "New password must be at least 6 characters" });
    if (next !== confirm) return setMsg({ type: "err", text: "New passwords do not match" });
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not change password");
      }
      setMsg({ type: "ok", text: "Password changed successfully" });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const turnOnPush = async () => {
    setPushMsg("");
    const r = await enablePush();
    if (r.ok) setPushMsg("Notifications enabled on this device.");
    else if (r.reason === "denied") setPushMsg("Permission denied. Allow notifications in your browser settings.");
    else if (r.reason === "no-vapid") setPushMsg("Push not configured on server yet.");
    else setPushMsg("Could not enable notifications on this device.");
  };

  const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">Settings</h2>
          <p className="text-xs text-[#2A364B]/50">Manage your account & notifications</p>
        </div>

        {/* Password change */}
        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#0E1B2C] mb-4">Change Password</h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Current password</label>
              <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">New password</label>
              <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Confirm new password</label>
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
            </div>
            {msg && (
              <p className={`text-sm ${msg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>
            )}
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] transition-all shadow-lg shadow-[#024396]/25 disabled:opacity-60">
              {saving ? "Saving..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#0E1B2C] mb-1">Push Notifications</h3>
          <p className="text-xs text-[#2A364B]/50 mb-4">
            Get alerts for tasks, leads, holidays and announcements — even when the app is closed.
          </p>
          {pushSupported() ? (
            <button onClick={turnOnPush}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#024396] border border-[#024396]/30 hover:bg-[#024396]/5 transition-all">
              Enable on this device
            </button>
          ) : (
            <p className="text-xs text-amber-600">This browser does not support push notifications.</p>
          )}
          {pushMsg && <p className="text-sm text-[#2A364B]/70 mt-3">{pushMsg}</p>}
        </div>
      </div>
    </PortalLayout>
  );
}
