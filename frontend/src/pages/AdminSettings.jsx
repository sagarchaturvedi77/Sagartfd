import React, { useState } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { DashboardCustomizerPanel } from "../components/DashboardCustomizer";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminSettings() {
  const { user, token } = useAuth();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [officeForm, setOfficeForm] = useState({ lat: "", lng: "", radius_m: 200, enforce: false });
  const [officeMsg, setOfficeMsg] = useState("");

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    if (pwForm.newPw !== pwForm.confirm) { setPwErr("Passwords don't match!"); return; }
    if (pwForm.newPw.length < 6) { setPwErr("Min 6 characters required."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      if (res.ok) { setPwMsg("✅ Password changed!"); setPwForm({ current: "", newPw: "", confirm: "" }); }
      else { const err = await res.json().catch(() => ({})); setPwErr(err.detail || "Failed. Check current password."); }
    } catch { setPwErr("Network error."); }
    setSaving(false);
  };

  const saveOffice = async (e) => {
    e.preventDefault();
    setOfficeMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/attendance/office-settings`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ lat: parseFloat(officeForm.lat), lng: parseFloat(officeForm.lng), radius_m: parseInt(officeForm.radius_m), enforce: officeForm.enforce }),
      });
      if (res.ok) setOfficeMsg("✅ Office location saved!");
      else setOfficeMsg("❌ Failed to save.");
    } catch { setOfficeMsg("❌ Network error."); }
  };

  return (
    <PortalLayout>
      {showCustomizer && (
        <DashboardCustomizerPanel userId={user?.id} role="admin" onClose={() => setShowCustomizer(false)} />
      )}

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0E1B2C", marginBottom: 20 }}>⚙️ Admin Settings</h1>

        {/* Dashboard Customizer */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2D8C2", padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0E1B2C", marginBottom: 6 }}>🛠️ Dashboard Customize Karo</h3>
          <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 14 }}>Admin dashboard pe kaunse widgets dikhein, choose karo.</p>
          <button onClick={() => setShowCustomizer(true)} style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Open Dashboard Customizer
          </button>
        </div>

        {/* Password Change */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2D8C2", padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0E1B2C", marginBottom: 6 }}>🔒 Password Change Karo</h3>
          <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["current","Current Password"],["newPw","New Password"],["confirm","Confirm New Password"]].map(([f, l]) => (
              <div key={f}>
                <label style={{ fontSize: 11, color: "#5C677D", display: "block", marginBottom: 4 }}>{l}</label>
                <input type="password" value={pwForm[f]} onChange={(e) => setPwForm({ ...pwForm, [f]: e.target.value })} required
                  style={{ width: "100%", border: "1px solid #E2D8C2", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none" }} />
              </div>
            ))}
            {pwErr && <p style={{ fontSize: 12, color: "#dc2626" }}>{pwErr}</p>}
            {pwMsg && <p style={{ fontSize: 12, color: "#16a34a" }}>{pwMsg}</p>}
            <button type="submit" disabled={saving} style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 10, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Saving..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Office Location Settings */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2D8C2", padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0E1B2C", marginBottom: 6 }}>📍 Office Location (Punch-In Geofence)</h3>
          <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 14 }}>Office ka latitude, longitude aur allowed radius set karo. Enforce ON karne se sirf office ke andar hi punch-in hogi.</p>
          <form onSubmit={saveOffice} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#5C677D", display: "block", marginBottom: 4 }}>Latitude</label>
                <input type="number" step="any" placeholder="e.g. 23.2599" value={officeForm.lat}
                  onChange={(e) => setOfficeForm({ ...officeForm, lat: e.target.value })}
                  style={{ width: "100%", border: "1px solid #E2D8C2", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#5C677D", display: "block", marginBottom: 4 }}>Longitude</label>
                <input type="number" step="any" placeholder="e.g. 77.4126" value={officeForm.lng}
                  onChange={(e) => setOfficeForm({ ...officeForm, lng: e.target.value })}
                  style={{ width: "100%", border: "1px solid #E2D8C2", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#5C677D", display: "block", marginBottom: 4 }}>Allowed Radius (meters)</label>
              <input type="number" value={officeForm.radius_m} onChange={(e) => setOfficeForm({ ...officeForm, radius_m: e.target.value })}
                style={{ width: "100%", border: "1px solid #E2D8C2", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#0E1B2C", cursor: "pointer" }}>
              <input type="checkbox" checked={officeForm.enforce} onChange={(e) => setOfficeForm({ ...officeForm, enforce: e.target.checked })} />
              Geofence Enforce Karo (OFF karne se sab jagah se punch-in hogi)
            </label>
            {officeMsg && <p style={{ fontSize: 12, color: officeMsg.includes("✅") ? "#16a34a" : "#dc2626" }}>{officeMsg}</p>}
            <button type="submit" style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 10, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Save Office Location
            </button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
