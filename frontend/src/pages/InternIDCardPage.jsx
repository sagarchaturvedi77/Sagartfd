import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Share2 } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
// Same-origin assets — an external CDN URL sends no CORS headers, which
// breaks the crossOrigin="anonymous" the <img> tags need for html2canvas's
// PDF capture (same fix already applied to the staff Employee ID Card).
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.webp";
const MAIN_LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.webp";
const QR_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=";

const TRACK_LABELS = {
  finance: "Finance",
  marketing: "Marketing",
  sales: "Sales",
  hr: "HR",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InternIDCardPage() {
  const { student, token } = useInternshipAuth();
  const [photoObjectUrl, setPhotoObjectUrl] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    let revoke = null;
    (async () => {
      if (!student?.photo_url || !token) return;
      try {
        // Proxy through our own backend into a same-origin blob: URL — the R2
        // bucket has no CORS policy, so a direct <img> against the presigned
        // URL fails CORS and silently breaks html2canvas's PDF capture.
        const res = await fetch(`${API_BASE}/api/internship/me/photo/raw`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const url = URL.createObjectURL(await res.blob());
          revoke = url;
          setPhotoObjectUrl(url);
        }
      } catch {
        // no photo yet — card falls back to an initial-letter avatar
      }
    })();
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [student?.photo_url, token]);

  // useSubmitOnce is a hook, so it must be called unconditionally on every
  // render — declared here, above the `if (!student) return` below, rather
  // than beside `verifyUrl`/`qrUrl` further down. The action body still
  // sees `student` correctly once actually invoked (by click-time this
  // render has already finished and `student` is loaded, since the button
  // that triggers this doesn't render until then anyway). No guard existed
  // before this — added fresh since this fires html2canvas + PDF
  // generation, and a rapid double-click could otherwise fire it twice
  // concurrently.
  const [handleDownload, downloading] = useSubmitOnce(async () => {
    const element = cardRef.current;
    if (!element) return;
    try {
      // Loaded on demand — html2canvas/jsPDF are only needed when the intern
      // actually clicks download, not on every ID-card page visit.
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: "#050B16", logging: false });
      window.scrollTo(0, originalScrollY);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "in", format: [2, 3.5] });
      pdf.addImage(imgData, "PNG", 0, 0, 2, 3.5);
      pdf.save(`${student?.name || "TFD_Intern"}_IDCard.pdf`);
    } catch (err) {
      console.error(err);
      toast.error("Download failed. Please try again.");
    }
  });

  if (!student) {
    return (
      <StudentLayout activeKey="profile">
        <div className="text-white/50 text-sm">Loading...</div>
      </StudentLayout>
    );
  }

  const verifyUrl = `${window.location.origin}/verify/intern/${student.intern_id}`;
  const qrUrl = `${QR_BASE}${encodeURIComponent(verifyUrl)}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: student.name, url: verifyUrl });
        return;
      } catch {
        // user cancelled the share sheet — fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(verifyUrl);
    toast.success("Verify link copied!");
  };

  return (
    <StudentLayout activeKey="profile">
      <div className="max-w-lg mx-auto space-y-5 pb-10">
        <div className="text-center">
          <h1 className="font-display text-xl font-bold">My Intern ID Card</h1>
          <p className="text-white/45 text-sm mt-1">Download or share your official TFD Internship ID</p>
        </div>

        {!student.photo_url && (
          <div className="max-w-sm mx-auto bg-amber-400/10 border border-amber-400/30 rounded-xl p-3 text-center">
            <p className="text-amber-300 text-xs">Add a photo from your Profile page for a complete ID card.</p>
          </div>
        )}
        {!student.dob && (
          <div className="max-w-sm mx-auto bg-amber-400/10 border border-amber-400/30 rounded-xl p-3 text-center">
            <p className="text-amber-300 text-xs">Add your date of birth from your Profile page for a complete ID card.</p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", padding: "10px", width: "100%", overflowX: "auto" }}>
          <div ref={cardRef} style={{
            boxSizing: "border-box", width: 343, minWidth: 343, height: 600,
            background: "#050B16", borderRadius: 16, overflow: "hidden",
            boxShadow: "0 4px 24px rgba(20,224,160,0.15)", fontFamily: "Arial, sans-serif",
            border: "1px solid rgba(20,224,160,0.25)", display: "flex", flexDirection: "column",
            position: "relative",
          }}>
            <div style={{ background: "linear-gradient(90deg, #14E0A0, #5EEAD4)", height: 12, flexShrink: 0 }} />

            <div style={{ padding: "16px", position: "relative", flexShrink: 0, boxSizing: "border-box" }}>
              <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} style={{ height: 56, width: "auto", margin: "0 auto", display: "block" }} crossOrigin="anonymous" />
              <div style={{ textAlign: "center", marginTop: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", letterSpacing: 0.3 }}>TFD Internship</div>
                <div style={{ fontSize: 8.5, fontWeight: 600, color: "#14E0A0", letterSpacing: 0.5, marginTop: 1 }}>LEARN. BUILD. LAUNCH.</div>
              </div>
              <div style={{ position: "absolute", right: 12, top: 12, opacity: 0.1, fontSize: 44, color: "#14E0A0", lineHeight: 1 }}>⬡</div>
            </div>

            <div style={{ background: "linear-gradient(160deg, rgba(20,224,160,0.08) 0%, rgba(5,11,22,0) 60%)", padding: "8px 24px 16px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box" }}>
              <div style={{ marginBottom: 14 }}>
                {photoObjectUrl ? (
                  <img src={photoObjectUrl} alt={student.name} crossOrigin="anonymous"
                    style={{ width: 110, height: 110, borderRadius: 12, objectFit: "cover", border: "3px solid #14E0A0", boxShadow: "0 2px 12px rgba(20,224,160,0.3)", display: "block" }} />
                ) : (
                  <div style={{
                    width: 110, height: 110, borderRadius: 12, background: "rgba(20,224,160,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 45, color: "#14E0A0", border: "3px solid #14E0A0", boxShadow: "0 2px 12px rgba(20,224,160,0.3)", margin: "0 auto", lineHeight: 1,
                  }}>
                    {(student.name || "T").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ background: "#14E0A0", borderRadius: 6, padding: "8px 16px", marginBottom: 6, width: "100%", boxSizing: "border-box", textAlign: "center" }}>
                <div style={{ color: "#050B16", fontWeight: 700, fontSize: 17, letterSpacing: 0.3, lineHeight: 1 }}>{student.name || "Intern Name"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(20,224,160,0.3)", borderRadius: 5, padding: "6px 16px", marginBottom: 18, width: "100%", boxSizing: "border-box", textAlign: "center" }}>
                <div style={{ color: "#14E0A0", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1 }}>
                  {TRACK_LABELS[student.track] || "Track"} Intern
                </div>
              </div>

              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "7px" }}>
                {[
                  ["Intern ID", student.intern_id],
                  ["Duration", `${student.duration_days} Days`],
                  ["Start", fmtDate(student.program_start_date)],
                  ["End", fmtDate(student.program_end_date)],
                  ["DOB", student.dob || "—"],
                ].map(([label, val]) => (
                  <div key={label} style={{ fontSize: 12.5, color: "#F1EDE3", lineHeight: "18px" }}>
                    <strong style={{ display: "inline-block", width: "78px", verticalAlign: "top", color: "rgba(241,237,227,0.5)", fontWeight: 600 }}>{label}</strong>
                    <span style={{ display: "inline-block", width: "calc(100% - 78px)", wordBreak: "break-word", verticalAlign: "top" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#0A0F1A", borderTop: "1px solid rgba(20,224,160,0.2)", height: 75, padding: "10px 16px 0", boxSizing: "border-box" }}>
              <div style={{ color: "#14E0A0", fontSize: 11, fontWeight: 700, marginBottom: "4px" }}>Powered by The Financial Doctor</div>
              <div style={{ color: "rgba(241,237,227,0.4)", fontSize: 10.5, fontWeight: 600, letterSpacing: 0.3 }}>www.thefinancialdoctor.in</div>
            </div>

            <img src={qrUrl} alt="QR" crossOrigin="anonymous"
              style={{
                position: "absolute", right: 25, bottom: 60, width: 72, height: 72,
                background: "#fff", borderRadius: 8, padding: 4,
                boxShadow: "0 10px 20px rgba(0,0,0,0.5)", border: "1px solid rgba(20,224,160,0.4)", boxSizing: "border-box",
              }} />
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap pt-2">
          <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
            <Download size={15} /> {downloading ? "Downloading..." : "Download PDF"}
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
            <Share2 size={15} /> Share Verify Link
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}
