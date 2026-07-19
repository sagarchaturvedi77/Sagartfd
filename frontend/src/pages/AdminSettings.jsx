import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { DashboardCustomizerPanel } from "../components/DashboardCustomizer";
import PageHeader from "../components/portal/PageHeader";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const GB_CALLBACK_MESSAGES = {
  connected: { text: "✅ Google Business connected!", ok: true },
  denied: { text: "❌ Consent was denied — connect again and approve access to finish.", ok: false },
  invalid_state: { text: "❌ That connection attempt expired or was invalid — try connecting again.", ok: false },
  error: { text: "❌ Something went wrong while connecting — check backend logs.", ok: false },
};

export default function AdminSettings() {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [officeForm, setOfficeForm] = useState({ lat: "", lng: "", radius_m: 200, enforce: false });
  const [officeMsg, setOfficeMsg] = useState("");
  const [officeLoaded, setOfficeLoaded] = useState(false);
  const [gbStatus, setGbStatus] = useState(null);
  const [gbLoading, setGbLoading] = useState(true);
  const [gbConnecting, setGbConnecting] = useState(false);
  const gbCallbackMsg = GB_CALLBACK_MESSAGES[searchParams.get("google_business")];

  const loadGbStatus = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/google-business/status`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGbStatus(await res.json());
    } catch { /* silent */ }
    setGbLoading(false);
  }, [token]);

  useEffect(() => { loadGbStatus(); }, [loadGbStatus]);

  // Clear the ?google_business= query param once shown, so a page refresh
  // doesn't keep re-showing a stale connect/error message.
  useEffect(() => {
    if (!gbCallbackMsg) return;
    loadGbStatus();
    const next = new URLSearchParams(searchParams);
    next.delete("google_business");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectGoogleBusiness = async () => {
    setGbConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/google-business/authorize`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not start connection");
      window.location.href = data.authorize_url;
    } catch (err) {
      setGbConnecting(false);
      alert(err.message || "Could not start connection");
    }
  };

  const disconnectGoogleBusiness = async () => {
    if (!window.confirm("Disconnect Google Business? Reviews/location sync will stop until reconnected.")) return;
    await fetch(`${API_BASE}/api/admin/google-business/disconnect`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    loadGbStatus();
  };

  // Load the currently saved geofence so the form doesn't render blank and
  // silently wipe out an already-configured office location on save.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/attendance/office-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOfficeForm({
            lat: data.lat ?? "",
            lng: data.lng ?? "",
            radius_m: data.radius_m ?? 200,
            enforce: !!data.enforce,
          });
        }
      } catch { /* silent */ }
      setOfficeLoaded(true);
    })();
  }, [token]);

  const [changePassword, saving] = useSubmitOnce(async (e) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    if (pwForm.newPw !== pwForm.confirm) { setPwErr("Passwords don't match!"); return; }
    if (pwForm.newPw.length < 6) { setPwErr("Min 6 characters required."); return; }
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      if (res.ok) { setPwMsg("✅ Password changed!"); setPwForm({ current: "", newPw: "", confirm: "" }); }
      else { const err = await res.json().catch(() => ({})); setPwErr(err.detail || "Failed. Check current password."); }
    } catch { setPwErr("Network error."); }
  });

  const [saveOffice, savingOffice] = useSubmitOnce(async (e) => {
    e.preventDefault();
    setOfficeMsg("");
    const lat = parseFloat(officeForm.lat);
    const lng = parseFloat(officeForm.lng);
    if (officeForm.enforce && (Number.isNaN(lat) || Number.isNaN(lng))) {
      setOfficeMsg("❌ Enter both latitude and longitude before enabling enforcement.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/attendance/office-settings`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: Number.isNaN(lat) ? null : lat,
          lng: Number.isNaN(lng) ? null : lng,
          radius_m: parseInt(officeForm.radius_m) || 200,
          enforce: officeForm.enforce,
        }),
      });
      if (res.ok) setOfficeMsg("✅ Office location saved!");
      else setOfficeMsg("❌ Failed to save.");
    } catch { setOfficeMsg("❌ Network error."); }
  });

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      {showCustomizer && (
        <DashboardCustomizerPanel userId={user?.id} role="admin" onClose={() => setShowCustomizer(false)} />
      )}

      <div className="max-w-xl mx-auto">
        <PageHeader icon="⚙️" title="Admin Settings" subtitle="Dashboard widgets, password, and office geofence" />

        {/* Dashboard Customizer */}
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 mb-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1.5">🛠️ Dashboard Customize Karo</h3>
          <p className="text-xs text-[#5C677D] dark:text-[#8E99AC] mb-3.5">Admin dashboard pe kaunse widgets dikhein, choose karo.</p>
          <Button onClick={() => setShowCustomizer(true)} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
            Open Dashboard Customizer
          </Button>
        </div>

        {/* Password Change */}
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 mb-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1.5">🔒 Password Change Karo</h3>
          <form onSubmit={changePassword} className="flex flex-col gap-2.5">
            {[["current", "Current Password"], ["newPw", "New Password"], ["confirm", "Confirm New Password"]].map(([f, l]) => (
              <div key={f}>
                <label className="text-[11px] text-[#5C677D] dark:text-[#8E99AC] block mb-1">{l}</label>
                <input type="password" value={pwForm[f]} onChange={(e) => setPwForm({ ...pwForm, [f]: e.target.value })} required className={field} />
              </div>
            ))}
            {pwErr && <p className="text-xs text-red-600 dark:text-red-400">{pwErr}</p>}
            {pwMsg && <p className="text-xs text-green-600 dark:text-green-400">{pwMsg}</p>}
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              {saving ? "Saving..." : "Change Password"}
            </Button>
          </form>
        </div>

        {/* Google Business Profile */}
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 mb-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1.5">🏢 Google Business Profile</h3>
          <p className="text-xs text-[#5C677D] dark:text-[#8E99AC] mb-3.5">Connect your Google Business listing to pull location details and reviews into the portal.</p>
          {gbCallbackMsg && (
            <p className={`text-xs mb-3 ${gbCallbackMsg.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{gbCallbackMsg.text}</p>
          )}
          {gbLoading ? (
            <p className="text-xs text-[#5C677D] dark:text-[#8E99AC]">Checking connection status...</p>
          ) : gbStatus?.configured === false ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Not set up yet — the backend can't see: <strong>{(gbStatus.missing_env_vars || []).join(", ") || "GOOGLE_OAUTH_CLIENT_ID/SECRET"}</strong>.
              Check these are set in Render's Environment tab on the exact service serving this API, then redeploy.
            </p>
          ) : gbStatus?.connected ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-green-600 dark:text-green-400">
                ✅ Connected{gbStatus.location_title ? ` — ${gbStatus.location_title}` : ""}
              </p>
              <Button onClick={disconnectGoogleBusiness} variant="outline" className="w-fit">Disconnect</Button>
            </div>
          ) : (
            <Button onClick={connectGoogleBusiness} disabled={gbConnecting} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              {gbConnecting ? "Redirecting to Google..." : "Connect Google Business"}
            </Button>
          )}
        </div>

        {/* Office Location Settings */}
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 mb-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1.5">📍 Office Location (Punch-In Geofence)</h3>
          <p className="text-xs text-[#5C677D] dark:text-[#8E99AC] mb-3.5">Office ka latitude, longitude aur allowed radius set karo. Enforce ON karne se sirf office ke andar hi punch-in hogi.</p>
          <form onSubmit={saveOffice} className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-[#5C677D] dark:text-[#8E99AC] block mb-1">Latitude</label>
                <input type="number" step="any" placeholder="e.g. 23.2599" value={officeForm.lat}
                  onChange={(e) => setOfficeForm({ ...officeForm, lat: e.target.value })} className={field} />
              </div>
              <div>
                <label className="text-[11px] text-[#5C677D] dark:text-[#8E99AC] block mb-1">Longitude</label>
                <input type="number" step="any" placeholder="e.g. 77.4126" value={officeForm.lng}
                  onChange={(e) => setOfficeForm({ ...officeForm, lng: e.target.value })} className={field} />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[#5C677D] dark:text-[#8E99AC] block mb-1">Allowed Radius (meters)</label>
              <input type="number" value={officeForm.radius_m} onChange={(e) => setOfficeForm({ ...officeForm, radius_m: e.target.value })} className={field} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#0E1B2C] dark:text-[#F1EDE3] cursor-pointer">
              <input type="checkbox" checked={officeForm.enforce} onChange={(e) => setOfficeForm({ ...officeForm, enforce: e.target.checked })} />
              Geofence Enforce Karo (OFF karne se sab jagah se punch-in hogi)
            </label>
            {officeMsg && <p className={`text-xs ${officeMsg.includes("✅") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{officeMsg}</p>}
            <Button type="submit" disabled={!officeLoaded || savingOffice} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              {!officeLoaded ? "Loading current settings…" : savingOffice ? "Saving..." : "Save Office Location"}
            </Button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
