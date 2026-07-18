/**
 * Public Verify Page — /verify/:employee_id
 * Shown when someone scans an employee's QR code.
 * No login required. Calls GET /api/verify/{employee_id}
 */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.webp";

export default function PublicVerifyEmployee() {
  const { employee_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/verify/${employee_id}`);
        if (res.ok) setData(await res.json());
        else setNotFound(true);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [employee_id]);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F1EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, maxWidth: 380, width: "100%", overflow: "hidden", boxShadow: "0 8px 32px rgba(2,6,23,0.12)" }}>
        {/* Header bar */}
        <div style={{ background: "#024396", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO_URL} alt="TFD" style={{ height: 36, objectFit: "contain", filter: "brightness(10)" }} />
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>THE FINANCIAL DOCTOR</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>Employee Verification</p>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ width: 36, height: 36, border: "3px solid #024396", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ color: "#5C677D", fontSize: 13 }}>Verifying employee…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {!loading && notFound && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <p style={{ fontWeight: 700, color: "#9B2335", fontSize: 16 }}>Employee Not Found</p>
              <p style={{ color: "#5C677D", fontSize: 13, marginTop: 6 }}>This QR code is invalid or the employee record no longer exists.</p>
              <p style={{ color: "#5C677D", fontSize: 12, marginTop: 4 }}>Do NOT treat this person as a TFD representative.</p>
            </div>
          )}

          {!loading && data && (
            <div>
              {/* Active / Inactive badge */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                {data.active ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#dcfce7", border: "1px solid #86efac", borderRadius: 30, padding: "6px 16px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                    <span style={{ color: "#15803d", fontWeight: 700, fontSize: 13 }}>✅ VERIFIED — Active Employee</span>
                  </div>
                ) : (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 30, padding: "6px 16px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
                    <span style={{ color: "#b91c1c", fontWeight: 700, fontSize: 13 }}>⚠️ Former Employee</span>
                  </div>
                )}
              </div>

              {/* Photo */}
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                {data.photo_url ? (
                  <img src={data.photo_url} alt={data.name} style={{ width: 80, height: 80, borderRadius: 14, objectFit: "cover", border: "3px solid #E2D8C2" }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 14, background: "#EAF1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#024396", margin: "0 auto", border: "3px solid #E2D8C2" }}>
                    {(data.name || "E").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Details */}
              <div style={{ background: "#F5F1EB", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                {[
                  ["Name", data.name],
                  ["Designation", data.designation],
                  ["Employee ID", data.employee_id],
                  ["Department", data.department],
                  ["Blood Group", data.blood_group],
                  ["Contact", data.phone],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(14,27,44,0.06)" }}>
                    <span style={{ fontSize: 11, color: "#5C677D", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 12, color: "#0E1B2C", fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Warning if former employee */}
              {!data.active && data.message && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>{data.message}</p>
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "#9AA5B4" }}>Powered by <b>The Financial Doctor</b></p>
                <a href="https://www.thefinancialdoctor.in" style={{ fontSize: 11, color: "#024396" }}>www.thefinancialdoctor.in</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
