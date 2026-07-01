import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  const cardRef = useRef(null);

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

  const handleDownload = async () => {
    const element = cardRef.current;
    if (!element) return;

    try {
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);

      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false
      });

      window.scrollTo(0, originalScrollY);

      const imgData = canvas.toDataURL("image/png");
      const isId = tab === "id";
      
      const pdfWidthInches = isId ? 2 : 3.5;
      const pdfHeightInches = isId ? 3.5 : 2;

      const pdf = new jsPDF({
        orientation: isId ? "p" : "l",
        unit: "in",
        format: [pdfWidthInches, pdfHeightInches],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidthInches, pdfHeightInches);
      pdf.save(`${emp.name || "TFD_Employee"}_${isId ? "IDCard" : "VisitingCard"}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Download failed. Please try again.");
    }
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
      <div className="max-w-4xl mx-auto space-y-5 pb-10">
        <h1 className="text-2xl font-serif text-[#0E1B2C] text-center">🪪 My ID & Visiting Card</h1>

        <div className="flex gap-2 justify-center">
          <button onClick={() => setTab("id")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "id" ? "bg-[#024396] text-white" : "border border-[#E2D8C2] text-[#2A364B]/60"}`}>
            ID Card
          </button>
          <button onClick={() => setTab("visiting")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "visiting" ? "bg-[#024396] text-white" : "border border-[#E2D8C2] text-[#2A364B]/60"}`}>
            Visiting Card
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "10px", width: "100%", overflowX: "auto" }}>
          
          <div ref={cardRef} style={{ display: "block", backgroundColor: "#fff" }}>
            
            {/* ── ID CARD ── */}
            {tab === "id" && (
              <div style={{
                boxSizing: "border-box", width: 343, minWidth: 343, height: 600, 
                background: "#fff", borderRadius: 16, overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif",
                border: "1px solid #e2d8c2", display: "flex", flexDirection: "column",
                position: "relative"
              }}>
                <div style={{ background: "#024396", height: 12, flexShrink: 0 }} />

                <div style={{ padding: "16px", background: "#fff", position: "relative", flexShrink: 0, boxSizing: "border-box" }}>
                  <img src={LOGO_URL} alt="TFD" style={{ height: 48, margin: "0 auto", display: "block" }} crossOrigin="anonymous" />
                  <div style={{ position: "absolute", right: 12, top: 12, opacity: 0.08, fontSize: 48, color: "#024396", lineHeight: 1 }}>⬡</div>
                </div>

                <div style={{ background: "linear-gradient(135deg, #ddeeff 0%, #f5f1eb 100%)", padding: "16px 24px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box" }}>
                  
                  <div style={{ marginBottom: 14 }}>
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt={emp.name} crossOrigin="anonymous"
                        style={{ width: 110, height: 110, borderRadius: 12, objectFit: "cover", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "block" }} />
                    ) : (
                      <div style={{
                        width: 110, height: 110, borderRadius: 12, background: "#c8daf0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 45, color: "#024396", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", margin: "0 auto",
                        lineHeight: 1// FIX: Prevents initial character from shifting down
                      }}>
                        {(emp.name || "E").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* FIX: Removed flexbox, used text-align center and exact line-height so text doesn't sink in PDF */}
                  <div style={{ background: "#9B2335", borderRadius: 6, padding: "8px 16px", marginBottom: 6, width: "100%", boxSizing: "border-box", textAlign: "center" }}>
                    <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 18, margin: 0, letterSpacing: 0.3, lineHeight: 1 }}>
                      {emp.name || "Employee Name"}
                    </div>
                  </div>
                  <div style={{ background: "#024396", borderRadius: 5, padding: "6px 16px", marginBottom: 20, width: "100%", boxSizing: "border-box", textAlign: "center" }}>
                    <div style={{ color: "#ffffff", fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1 }}>
                      {emp.designation || "Designation"}
                    </div>
                  </div>

                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      ["Employee Id", empId],
                      ["Blood Group", emp.blood_group || "—"],
                      ["Phone", emp.phone || "—"],
                      ["Email", "wecare@thefinancialdoctor.in"],
                    ].map(([label, val]) => (
                      <div key={label} style={{ fontSize: 13, color: "#0E1B2C", display: "flex" }}>
                        <strong style={{ width: "95px", flexShrink: 0 }}>{label}</strong>
                        <span style={{ flex: 1, wordBreak: "break-word" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#9B2335", height: 75, padding: "8px 16px 0", boxSizing: "border-box" }}>
                  <div style={{ color: "#ffffff", fontSize: 12, fontWeight: 700, marginBottom: "4px" }}>www.thefinancialdoctor.in</div>
                  <div style={{ color: "#ffffff", fontSize: 13, fontWeight: 900, letterSpacing: 0.5 }}>Mutual Fund | Insurance | Equity</div>
                </div>

                {/* 3D FLOATING QR CODE FOR ID CARD - MOVED UP */}
                <img src={qrUrl} alt="QR" crossOrigin="anonymous"
                  style={{
                    position: "absolute",
                    right: 25,
                    bottom: 60, // Moved up for perfect 50-50 overlap
                    width: 75,
                    height: 75,
                    background: "#fff",
                    borderRadius: 8,
                    padding: 4,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.35), 0 6px 6px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)",
                    border: "1px solid #e0e0e0",
                    boxSizing: "border-box"
                  }} />
              </div>
            )}

            {/* ── VISITING CARD ── */}
            {tab === "visiting" && (
              <div style={{
                boxSizing: "border-box", width: 600, minWidth: 600, height: 343, 
                background: "#fff", borderRadius: 14, overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif",
                border: "1px solid #e2d8c2", display: "flex", flexDirection: "column",
                position: "relative"
              }}>
                <div style={{ background: "#024396", height: 12, flexShrink: 0 }} />

                <div style={{ padding: "16px 32px", display: "flex", flex: 1, boxSizing: "border-box" }}>
                  <div style={{ flex: 1, zIndex: 10 }}>
                    <img src={LOGO_URL} alt="TFD" style={{ height: 42, marginBottom: 12 }} crossOrigin="anonymous" />

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px", marginBottom: 16 }}>
                      {/* FIX: Removed flexbox, used exact line-height so text stays centered in PDF */}
                      <div style={{ background: "#9B2335", borderRadius: 5, padding: "6px 16px", display: "inline-block" }}>
                        <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{emp.name || "Employee Name"}</div>
                      </div>
                      <div style={{ background: "#024396", borderRadius: 4, padding: "6px 16px", display: "inline-block" }}>
                        <div style={{ color: "#ffffff", fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{emp.designation || "Designation"}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        ["Employee Id", empId],
                        ["Blood Group", emp.blood_group || "—"],
                        ["Phone", emp.phone || "—"],
                        ["Email", "wecare@thefinancialdoctor.in"],
                      ].map(([label, val]) => (
                        <div key={label} style={{ fontSize: 13, color: "#0E1B2C", display: "flex" }}>
                          <strong style={{ width: "95px", flexShrink: 0 }}>{label}</strong>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ width: 100, flexShrink: 0, textAlign: "right", opacity: 0.1, fontSize: 80, color: "#024396", lineHeight: 0.8 }}>
                    ⬡<br/><span style={{ color: "#9B2335", fontSize: 60 }}>⬡</span>
                  </div>
                </div>

                <div style={{ background: "#9B2335", height: 75, padding: "8px 32px 0", boxSizing: "border-box" }}>
                  <div style={{ color: "#ffffff", fontSize: 13, fontWeight: 700, marginBottom: "4px" }}>www.thefinancialdoctor.in</div>
                  <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 900, letterSpacing: 0.5 }}>Mutual Fund | Insurance | Equity</div>
                </div>

                {/* 3D FLOATING QR CODE FOR VISITING CARD */}
                <img src={qrUrl} alt="QR" crossOrigin="anonymous"
                  style={{
                    position: "absolute",
                    right: 32,
                    bottom: 35, 
                    width: 95, 
                    height: 95,
                    background: "#fff",
                    borderRadius: 10,
                    padding: 4,
                    boxShadow: "0 12px 24px rgba(0,0,0,0.35), 0 8px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)",
                    border: "1px solid #e0e0e0", 
                    boxSizing: "border-box"
                  }} />
              </div>
            )}
            
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap pt-4">
          <button onClick={handleDownload}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#9B2335] hover:bg-[#7a1b29] w-full sm:w-auto flex items-center justify-center gap-2">
            ⬇️ Download PDF Card
          </button>
          <button onClick={handleShare}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 w-full sm:w-auto flex items-center justify-center gap-2">
            📤 Share Verify Link
          </button>
        </div>

        <div className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-xl p-3 text-center mt-2 max-w-sm mx-auto">
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