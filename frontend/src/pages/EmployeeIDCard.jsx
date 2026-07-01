import React, { useState, useEffect, useRef } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const LOGO_URL = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";
const QR_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=";

export default function EmployeeIDCardPage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("id");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setProfile(await res.json());
      } catch (e) {}
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <PortalLayout><div className="py-20 text-center text-[#2A364B]/50">Loading...</div></PortalLayout>;

  const emp = profile || user || {};
  const verifyUrl = `${window.location.origin}/verify/${emp.id || ""}`;
  const qrUrl = `${QR_BASE}${encodeURIComponent(verifyUrl)}`;
  const empId = emp.employee_id || (emp.id || "").slice(0, 8).toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: emp.name, url: verifyUrl });
        return;
      } catch (e) {}
    }
    await navigator.clipboard.writeText(verifyUrl);
    alert("Verify link copied!");
  };

  return (
    <PortalLayout>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #tfd-card-print, #tfd-card-print * { visibility: visible !important; }
          #tfd-card-print { position: fixed; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="max-w-sm mx-auto space-y-5">
        <h1 className="text-2xl font-serif text-[#0E1B2C]">🪪 My ID & Visiting Card</h1>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab("id")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "id" ? "bg-[#024396] text-white" : "border border-[#E2D8C2] text-[#2A364B]/60"}`}>
            ID Card
          </button>
          <button onClick={() => setTab("visiting")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "visiting" ? "bg-[#024396] text-white" : "border border-[#E2D8C2] text-[#2A364B]/60"}`}>
            Visiting Card
          </button>
        </div>

        {/* Card wrapper — this is what prints */}
        <div id="tfd-card-print">

          {/* ── ID CARD ── */}
          {tab === "id" && (
            <div style={{
              width: 300,
              background: "#fff",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              fontFamily: "Arial, sans-serif",
              margin: "0 auto",
              border: "1px solid #e2d8c2",
            }}>
              {/* Top blue bar */}
              <div style={{ background: "#024396", height: 12 }} />

              {/* Logo only — no text */}
              <div style={{ padding: "12px 14px 6px", background: "#fff", position: "relative" }}>
                <img src={LOGO_URL} alt="TFD" style={{ height: 44, objectFit: "contain" }} />
                {/* Hex pattern dots — decorative */}
                <div style={{ position: "absolute", right: 10, top: 8, opacity: 0.08, fontSize: 40, color: "#024396" }}>⬡</div>
              </div>

              {/* Light blue hex background area */}
              <div style={{ background: "linear-gradient(135deg, #ddeeff 0%, #f5f1eb 100%)", padding: "10px 14px 14px" }}>
                {/* Photo */}
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  {emp.photo_url ? (
                    <img src={emp.photo_url} alt={emp.name}
                      style={{ width: 88, height: 88, borderRadius: 12, objectFit: "cover", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "inline-block" }} />
                  ) : (
                    <div style={{
                      width: 88, height: 88, borderRadius: 12, background: "#c8daf0",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 36, color: "#024396", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}>
                      {(emp.name || "E").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name banner — dark red */}
                <div style={{ background: "#9B2335", borderRadius: 6, padding: "5px 10px", marginBottom: 5, textAlign: "center" }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0, letterSpacing: 0.3 }}>
                    {emp.name || "Employee Name"}
                  </p>
                </div>

                {/* Designation — blue */}
                <div style={{ background: "#024396", borderRadius: 5, padding: "3px 10px", marginBottom: 12, textAlign: "center" }}>
                  <p style={{ color: "#fff", fontSize: 11, fontWeight: 600, margin: 0 }}>
                    {emp.designation || "Designation"}
                  </p>
                </div>

                {/* Details */}
                {[
                  ["Employee Id", empId],
                  ["Blood Group", emp.blood_group || "—"],
                  ["Phone", emp.phone || "—"],
                ].map(([label, val]) => (
                  <p key={label} style={{ fontSize: 11, color: "#0E1B2C", margin: "3px 0" }}>
                    <b>{label}</b>{"  "}{val}
                  </p>
                ))}
              </div>

              {/* Footer — dark red */}
              <div style={{ background: "#9B2335", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: "#fff", fontSize: 10, fontWeight: 700, margin: 0 }}>www.thefinancialdoctor.in</p>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 9, margin: "4px 0 0" }}>Mutual Fund  |  Insurance  |  Equity</p>
                </div>
                <img src={qrUrl} alt="QR"
                  style={{ width: 54, height: 54, background: "#fff", borderRadius: 6, padding: 3 }} />
              </div>
            </div>
          )}

          {/* ── VISITING CARD ── */}
          {tab === "visiting" && (
            <div style={{
              width: 340,
              background: "#fff",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              fontFamily: "Arial, sans-serif",
              margin: "0 auto",
              border: "1px solid #e2d8c2",
            }}>
              {/* Top blue bar */}
              <div style={{ background: "#024396", height: 10 }} />

              <div style={{ padding: "12px 16px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
                <div style={{ flex: 1 }}>
                  {/* Logo only */}
                  <img src={LOGO_URL} alt="TFD" style={{ height: 38, objectFit: "contain", marginBottom: 10 }} />

                  {/* Name banner */}
                  <div style={{ background: "#9B2335", borderRadius: 5, padding: "4px 10px", display: "inline-block", marginBottom: 5 }}>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>{emp.name || "Employee Name"}</p>
                  </div>
                  <br />

                  {/* Designation */}
                  <div style={{ background: "#024396", borderRadius: 4, padding: "2px 10px", display: "inline-block", marginBottom: 10 }}>
                    <p style={{ color: "#fff", fontSize: 11, fontWeight: 600, margin: 0 }}>{emp.designation || "Designation"}</p>
                  </div>

                  {/* Fields */}
                  {[
                    ["Employee Id", empId],
                    ["Blood Group", emp.blood_group || "—"],
                    ["Phone", emp.phone || "—"],
                  ].map(([label, val]) => (
                    <p key={label} style={{ fontSize: 11, color: "#0E1B2C", margin: "2px 0" }}>
                      <b>{label}</b>{"  "}{val}
                    </p>
                  ))}
                </div>

                {/* Right side hex decoration */}
                <div style={{ width: 80, flexShrink: 0, textAlign: "center", paddingTop: 8, opacity: 0.12 }}>
                  <div style={{ fontSize: 60, color: "#024396", lineHeight: 1 }}>⬡</div>
                  <div style={{ fontSize: 40, color: "#9B2335", lineHeight: 1, marginTop: -10 }}>⬡</div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ background: "#9B2335", padding: "7px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ color: "#fff", fontSize: 10, fontWeight: 700, margin: 0 }}>www.thefinancialdoctor.in</p>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 10, margin: 0 }}>Mutual Fund  |  Insurance  |  Equity</p>
                <img src={qrUrl} alt="QR"
                  style={{ width: 48, height: 48, background: "#fff", borderRadius: 6, padding: 2 }} />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
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
          <p className="text-xs text-[#2A364B]/60">QR code scan karne se tumhara verification page khulega.</p>
          <a href={verifyUrl} target="_blank" rel="noreferrer"
            className="text-xs text-[#024396] underline mt-1 block">
            Preview verify page →
          </a>
        </div>
      </div>
    </PortalLayout>
  );
}
