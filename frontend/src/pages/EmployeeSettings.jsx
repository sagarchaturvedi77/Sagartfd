import React, { useState } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { DashboardCustomizerPanel } from "../components/DashboardCustomizer";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2D8C2", marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0E1B2C" }}>{title}</span>
        <span style={{ fontSize: 18, color: "#5C677D", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
      </button>
      {open && <div style={{ padding: "0 18px 18px", borderTop: "1px solid #F5F1EB" }}>{children}</div>}
    </div>
  );
}

export default function EmployeeSettings() {
  const { user, token } = useAuth();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem("portal_lang") || "en");

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    if (pwForm.newPw !== pwForm.confirm) { setPwErr("New passwords don't match!"); return; }
    if (pwForm.newPw.length < 6) { setPwErr("Minimum 6 characters required."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      if (res.ok) { setPwMsg("✅ Password changed successfully!"); setPwForm({ current: "", newPw: "", confirm: "" }); }
      else { const err = await res.json().catch(() => ({})); setPwErr(err.detail || "Failed. Check current password."); }
    } catch { setPwErr("Network error. Try again."); }
    setSaving(false);
  };

  const saveLang = (l) => {
    setLang(l);
    localStorage.setItem("portal_lang", l);
    alert("Language preference saved! Refresh to apply.");
  };

  const enableAppLock = async () => {
    if (window.PublicKeyCredential) {
      alert("To enable app lock, use your device's screen lock (PIN/Fingerprint/Face ID). Your browser session will require re-login after the device is locked.");
    } else {
      alert("Your browser does not support biometric lock. Please use your device's built-in screen lock for security.");
    }
  };

  return (
    <PortalLayout>
      {showCustomizer && (
        <DashboardCustomizerPanel userId={user?.id} role="employee" onClose={() => setShowCustomizer(false)} />
      )}

      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0E1B2C", marginBottom: 20 }}>⚙️ Settings</h1>

        <Section title="🛠️ Customize Dashboard">
          <p style={{ fontSize: 12, color: "#5C677D", margin: "12px 0" }}>Choose which widgets appear on your dashboard.</p>
          <button onClick={() => setShowCustomizer(true)} style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Open Dashboard Customizer
          </button>
        </Section>

        <Section title="🔒 Change Password">
          <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {[["current","Current Password"],["newPw","New Password"],["confirm","Confirm New Password"]].map(([f, l]) => (
              <div key={f}>
                <label style={{ fontSize: 11, color: "#5C677D", display: "block", marginBottom: 4 }}>{l}</label>
                <input type="password" value={pwForm[f]} onChange={(e) => setPwForm({ ...pwForm, [f]: e.target.value })} required
                  style={{ width: "100%", border: "1px solid #E2D8C2", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none" }} />
              </div>
            ))}
            {pwErr && <p style={{ fontSize: 12, color: "#dc2626" }}>{pwErr}</p>}
            {pwMsg && <p style={{ fontSize: 12, color: "#16a34a" }}>{pwMsg}</p>}
            <button type="submit" disabled={saving} style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 10, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Change Password"}
            </button>
          </form>
        </Section>

        <Section title="📱 App Lock">
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 12 }}>Enable your device's biometric lock (fingerprint/face/PIN) to secure the portal when not in use.</p>
            <button onClick={enableAppLock} style={{ background: "#0E1B2C", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              🔐 Enable App Lock
            </button>
            <p style={{ fontSize: 11, color: "#9AA5B4", marginTop: 8 }}>Note: This uses your device's built-in security. Your portal session will require re-login after lock.</p>
          </div>
        </Section>

        <Section title="🌐 Language / Translator">
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 10 }}>Choose portal default language:</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {[["en","English"],["hi","Hindi"],["hinglish","Hinglish"]].map(([code, label]) => (
                <button key={code} onClick={() => saveLang(code)} style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                  background: lang === code ? "#024396" : "#F5F1EB",
                  color: lang === code ? "#fff" : "#2A364B",
                }}>
                  {label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#9AA5B4" }}>💡 Translator is available in Team Chat — translate any message to English/Hindi/Hinglish with one click.</p>
          </div>
        </Section>

        <Section title="🔔 Notifications">
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 12 }}>Enable browser notifications for important alerts.</p>
            <button onClick={() => {
              if (typeof Notification !== "undefined") {
                Notification.requestPermission().then(p => alert(p === "granted" ? "✅ Notifications enabled!" : "❌ Notifications blocked by browser."));
              }
            }} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Enable Notifications
            </button>
          </div>
        </Section>
      </div>
    </PortalLayout>
  );
}
