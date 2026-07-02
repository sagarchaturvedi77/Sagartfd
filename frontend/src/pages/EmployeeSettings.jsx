import React, { useState } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { DashboardCustomizerPanel } from "../components/DashboardCustomizer";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function EmployeeSettings() {
  const { user, token } = useAuth();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showPwFields, setShowPwFields] = useState(false); // Controlled View for Password UI
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [saving, setSaving] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    if (pwForm.newPw !== pwForm.confirm) { setPwErr("New passwords don't match!"); return; }
    if (pwForm.newPw.length < 6) { setPwErr("Password must be at least 6 characters."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      if (res.ok) {
        setPwMsg("✅ Password successfully changed!");
        setPwForm({ current: "", newPw: "", confirm: "" });
        setTimeout(() => setShowPwFields(false), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        setPwErr(err.detail || "Failed. Check your current password.");
      }
    } catch { setPwErr("Network error. Try again."); }
    setSaving(false);
  };

  return (
    <PortalLayout>
      {showCustomizer && (
        <DashboardCustomizerPanel
          userId={user?.id}
          role="employee"
          onClose={() => setShowCustomizer(false)}
        />
      )}

      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0E1B2C", marginBottom: 20 }}>⚙️ Settings</h1>

        {/* Dashboard Customization */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2D8C2", padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0E1B2C", marginBottom: 6 }}>🛠️ Dashboard Customize Karo</h3>
          <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 14 }}>Dashboard pe kaunse widgets dikhein, khud decide karo.</p>
          <button onClick={() => setShowCustomizer(true)} style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Open Dashboard Customizer
          </button>
        </div>

        {/* Password Change Redesigned */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2D8C2", padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0E1B2C", marginBottom: 6 }}>🔒 Security Settings</h3>
          <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 14 }}>Apna portal password update ya change karein.</p>
          
          {!showPwFields ? (
            <button 
              onClick={() => setShowPwFields(true)} 
              style={{ background: "#fff", color: "#024396", border: "1px solid #024396", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Change Password Option
            </button>
          ) : (
            <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {[
                ["current", "Current Password"],
                ["newPw", "New Password"],
                ["confirm", "Confirm New Password"],
              ].map(([field, label]) => (
                <div key={field}>
                  <label style={{ fontSize: 11, color: "#5C677D", display: "block", marginBottom: 4 }}>{label}</label>
                  <input
                    type="password"
                    value={pwForm[field]}
                    onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                    required
                    style={{ width: "100%", border: "1px solid #E2D8C2", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none" }}
                  />
                </div>
              ))}
              {pwErr && <p style={{ fontSize: 12, color: "#dc2626" }}>{pwErr}</p>}
              {pwMsg && <p style={{ fontSize: 12, color: "#16a34a" }}>{pwMsg}</p>}
              <div style={{ display: "flex", gap: 10, mt: 4 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, background: "#024396", color: "#fff", border: "none", borderRadius: 10, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving..." : "Update Password"}
                </button>
                <button type="button" onClick={() => setShowPwFields(false)} style={{ background: "#F5F1EB", color: "#5C677D", border: "1px solid #E2D8C2", borderRadius: 10, padding: "9px 15px", fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Screen Lock Native Info / Toggle Section */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2D8C2", padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0E1B2C", marginBottom: 6 }}>🔐 Screen Lock App Authentication</h3>
          <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 10 }}>Portal ko secure rakhne ke liye device password ya system lock synchronise karein.</p>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", fontSize: 13, color: "#0E1B2C", cursor: "pointer", fontWeight: 500 }}>
            <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
            Enable System Passcode / Phone Biometric Lock
          </label>
        </div>

        {/* Notification Settings */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2D8C2", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0E1B2C", marginBottom: 6 }}>🔔 Notifications</h3>
          <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 12 }}>Browser notifications enable karo important alerts ke liye.</p>
          <button
            onClick={() => {
              if (typeof Notification !== "undefined") {
                Notification.requestPermission().then(p => {
                  alert(p === "granted" ? "✅ Notifications enabled!" : "❌ Notifications blocked.");
                });
              }
            }}
            style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Enable Notifications
          </button>
        </div>
      </div>
    </PortalLayout>
  );
}