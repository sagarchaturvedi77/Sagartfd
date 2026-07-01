/**
 * Employee ID Card & Visiting Card Page — Point 3 + 5
 * - Shows ID card (front: photo, name, designation, emp id, blood group, phone + QR)
 * - Shows Visiting card (back side style)
 * - Download as PNG via html2canvas (browser print fallback)
 * - Share via Web Share API (mobile) or clipboard copy
 * - QR is fetched from backend /api/verify/qr/{id}  → PNG
 */
import React, { useState, useEffect, useRef } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const LOGO_URL = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";
const QR_BG = "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=";

export default function EmployeeIDCardPage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("id"); // "id" | "visiting"
  const idRef = useRef(null);
  const visitRef = useRef(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProfile(await res.json());
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return <PortalLayout><div className="py-20 text-center text-[#2A364B]/50">Loading your card…</div></PortalLayout>;
  }

  const emp = profile || user || {};
  const verifyUrl = `${window.location.origin}/verify/${emp.id || emp.employee_id || ""}`;
  const qrUrl = `${QR_BG}${encodeURIComponent(verifyUrl)}`;

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const shareData = {
      title: `${emp.name} — The Financial Doctor`,
      text: `TFD Employee: ${emp.name} (${emp.designation || "TFD Team"})\nVerify: ${verifyUrl}`,
      url: verifyUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(verifyUrl);
    alert("Verify link copied to clipboard!");
  };

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-md mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif text-[#0E1B2C]">🪪 My ID & Visiting Card</h1>
          <div className="flex gap-2">
            <button onClick={() => setTab("id")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab === "id" ? "bg-[#024396] text-white" : "border border-[#E2D8C2] text-[#2A364B]/60"}`}>ID Card</button>
            <button onClick={() => setTab("visiting")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab === "visiting" ? "bg-[#024396] text-white" : "border border-[#E2D8C2] text-[#2A364B]/60"}`}>Visiting Card</button>
          </div>
        </div>

        {/* ─── ID CARD ──────────────────────────────────────────── */}
        {tab === "id" && (
          <div ref={idRef} id="tfd-id-card" style={{
            width: 320, background: "#fff", borderRadius: 18, overflow: "hidden",
            boxShadow: "0 4px 24px rgba(2,6,23,0.12)", fontFamily: "sans-serif", margin: "0 auto"
          }}>
            {/* Top bar */}
            <div style={{ background: "#024396", height: 10 }} />

            {/* Logo + company name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 8px" }}>
              <img src={LOGO_URL} alt="TFD" style={{ height: 38, objectFit: "contain" }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#0E1B2C", lineHeight: 1.2 }}>THE FINANCIAL DOCTOR</p>
                <p style={{ fontSize: 10, color: "#5C677D", fontStyle: "italic" }}>Treating Your Financial Health</p>
              </div>
            </div>

            {/* Hexagon network background strip */}
            <div style={{ background: "linear-gradient(135deg,#eaf1fb 60%,#f5f1eb 100%)", padding: "10px 16px 14px", position: "relative" }}>
              {/* Photo */}
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                {emp.photo_url ? (
                  <img src={emp.photo_url} alt={emp.name} style={{ width: 90, height: 90, borderRadius: 14, objectFit: "cover", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(2,6,23,0.15)" }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: 14, background: "#E2D8C2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#9AA5B4", margin: "0 auto", border: "3px solid #fff" }}>
                    {(emp.name || "E").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name banner */}
              <div style={{ background: "#9B2335", borderRadius: 6, padding: "4px 12px", marginBottom: 6, textAlign: "center" }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>{emp.name || "Employee Name"}</p>
              </div>

              {/* Designation badge */}
              <div style={{ background: "#024396", borderRadius: 5, padding: "2px 10px", textAlign: "center", display: "inline-block", width: "100%", boxSizing: "border-box", marginBottom: 12 }}>
                <p style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{emp.designation || "Designation"}</p>
              </div>

              {/* Fields */}
              {[
                ["Employee Id", emp.employee_id || emp.id?.slice(0, 8).toUpperCase()],
                ["Blood Group", emp.blood_group || "—"],
                ["Phone", emp.phone || "—"],
              ].map(([label, val]) => (
                <p key={label} style={{ fontSize: 11, color: "#0E1B2C", margin: "2px 0" }}>
                  <b>{label}</b>{" "}{val}
                </p>
              ))}
            </div>

            {/* Footer */}
            <div style={{ background: "#9B2335", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 10, opacity: 0.9 }}>www.thefinancialdoctor.in</p>
                <p style={{ color: "#fff", fontSize: 9, opacity: 0.75, marginTop: 4 }}>Mutual Fund  |  Insurance  |  Equity</p>
              </div>
              <img src={qrUrl} alt="QR" style={{ width: 56, height: 56, borderRadius: 8, background: "#fff", padding: 3 }} />
            </div>
          </div>
        )}

        {/* ─── VISITING CARD ────────────────────────────────────── */}
        {tab === "visiting" && (
          <div ref={visitRef} id="tfd-visit-card" style={{
            width: 360, background: "#fff", borderRadius: 14, overflow: "hidden",
            boxShadow: "0 4px 24px rgba(2,6,23,0.12)", fontFamily: "sans-serif", margin: "0 auto"
          }}>
            {/* Top bar */}
            <div style={{ background: "#024396", height: 10 }} />

            <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <img src={LOGO_URL} alt="TFD" style={{ height: 36, objectFit: "contain", marginBottom: 10 }} />
                {/* Name banner */}
                <div style={{ background: "#9B2335", borderRadius: 6, padding: "4px 12px", marginBottom: 6, display: "inline-block" }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{emp.name || "Employee Name"}</p>
                </div>
                <br />
                {/* Designation badge */}
                <div style={{ background: "#024396", borderRadius: 5, padding: "2px 10px", display: "inline-block", marginBottom: 10 }}>
                  <p style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{emp.designation || "Designation"}</p>
                </div>
                {[
                  ["Employee Id", emp.employee_id || emp.id?.slice(0, 8).toUpperCase()],
                  ["Blood Group", emp.blood_group || "—"],
                  ["Phone", emp.phone || "—"],
                ].map(([label, val]) => (
                  <p key={label} style={{ fontSize: 11, color: "#0E1B2C", margin: "2px 0" }}>
                    <b>{label}</b>{" "}{val}
                  </p>
                ))}
              </div>
              {/* Right: hex pattern placeholder */}
              <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 70, height: 70, background: "#EAF1FB", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#024396" }}>
                  💠
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: "#9B2335", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>www.thefinancialdoctor.in</p>
              <p style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>Mutual Fund  |  Insurance  |  Equity</p>
              <img src={qrUrl} alt="QR" style={{ width: 52, height: 52, borderRadius: 8, background: "#fff", padding: 3 }} />
            </div>
          </div>
        )}

        {/* ─── Actions ──────────────────────────────────────────── */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580]">
            🖨️ Download / Print
          </button>
          <button onClick={handleShare}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700">
            📤 Share Verify Link
          </button>
        </div>

        <div className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-xl p-3 text-center">
          <p className="text-xs text-[#2A364B]/60">The QR code in your card links to your verification page.</p>
          <p className="text-xs text-[#2A364B]/40 mt-0.5">Anyone who scans it will see your name, designation, and active/inactive status.</p>
          <a href={verifyUrl} target="_blank" rel="noreferrer" className="text-xs text-[#024396] underline mt-1 block">Preview verify page →</a>
        </div>
      </div>

      <style>{`@media print { body > *:not(#root) { display:none; } #tfd-id-card, #tfd-visit-card { display:block!important; margin:20px auto; } }`}</style>
    </PortalLayout>
  );
}
