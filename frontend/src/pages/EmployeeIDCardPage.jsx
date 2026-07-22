import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/portal/PageHeader";
import { Button } from "../components/ui/button";
import { LINKS } from "../lib/links";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
// Same-origin asset — the external CDN URL previously here sends no CORS
// headers, so the crossOrigin="anonymous" the <img> tags need for
// html2canvas PDF capture caused the browser to silently refuse to load it.
// The main TFD logo (not the "TFD WorkSpace" staff-portal branding) is what
// belongs on an ID/visiting card that clients and the public will see.
const LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.png";
const QR_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=";

export default function EmployeeIDCardPage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [uploads, setUploads] = useState({});
  const [photoObjectUrl, setPhotoObjectUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("id");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const cardRef = useRef(null);
  // The card DOM (cardRef) is kept at its true 343x600 / 600x343 px size at
  // all times — that's what html2canvas captures for the PDF. This wrapper
  // ref instead gets a CSS transform: scale(...) applied to it (an ancestor
  // of cardRef, not cardRef itself) so only the on-screen *preview* shrinks
  // to fit narrow phones; the underlying DOM used for capture never changes.
  const scaleWrapRef = useRef(null);
  const cardScaleRef = useRef(null);
  const [cardScale, setCardScale] = useState(1);

  const loadAll = async () => {
    try {
      const [meRes, uploadsRes] = await Promise.all([
        fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        user?.id ? fetch(`${API_BASE}/api/uploads/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
      ]);
      let me = null;
      if (meRes.ok) me = await meRes.json();
      if (me?.id) {
        const profRes = await fetch(`${API_BASE}/api/profile/${me.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (profRes.ok) setProfile({ ...me, ...(await profRes.json()) });
        else setProfile(me);
      }
      if (uploadsRes?.ok) {
        const uploadsData = await uploadsRes.json();
        setUploads(uploadsData);
        if (uploadsData.photo && me?.id) {
          // The R2 bucket has no CORS policy, so a direct <img crossOrigin="anonymous">
          // against the presigned URL fails CORS and silently breaks the ID-card PDF
          // download (html2canvas can't read the image's pixels). Fetching the bytes
          // through our own backend and turning them into a same-origin blob: URL
          // sidesteps that entirely.
          const photoRes = await fetch(`${API_BASE}/api/uploads/${me.id}/photo/raw`, { headers: { Authorization: `Bearer ${token}` } });
          if (photoRes.ok) setPhotoObjectUrl(URL.createObjectURL(await photoRes.blob()));
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl); }, [photoObjectUrl]);

  // Measures the space actually available (e.g. a ~375px phone screen) and
  // scales the preview down to fit it, instead of forcing horizontal scroll
  // before the card is even visible. Card is 343x600 (id) or 600x343 (visiting).
  useEffect(() => {
    const computeScale = () => {
      const wrap = scaleWrapRef.current;
      if (!wrap) return;
      const cardWidth = tab === "visiting" ? 600 : 343;
      const available = wrap.clientWidth - 20; // matches wrap's own 10px+10px padding
      const scale = available > 0 && available < cardWidth ? available / cardWidth : 1;
      setCardScale(scale);
      if (cardScaleRef.current) {
        cardScaleRef.current.style.transform = scale < 1 ? `scale(${scale})` : "none";
        cardScaleRef.current.style.transformOrigin = "top left";
      }
    };
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [tab]);

  // useSubmitOnce is a hook (useRef + useState inside), so it must be called
  // unconditionally on every render — declared here, above the `if (loading)
  // return` below, rather than beside the data it touches (like `emp`,
  // computed further down). The action bodies still see `emp`/`tab`
  // correctly once actually invoked, since by click-time this render's full
  // body (including `const emp = ...`) has already run.
  const [savePhone, savingPhone] = useSubmitOnce(async () => {
    if (!phoneInput.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contact_no: phoneInput.trim() }),
      });
      if (res.ok) {
        setProfile((p) => ({ ...p, contact_no: phoneInput.trim() }));
        setEditingPhone(false);
      } else {
        alert("Could not update phone number. Try again.");
      }
    } catch {
      alert("Network error — could not update phone number.");
    }
  });

  const [handleDownload, downloading] = useSubmitOnce(async () => {
    const element = cardRef.current;
    if (!element) return;

    // The preview may currently be visually scaled down for small screens
    // (see cardScaleRef above) — that's an ancestor transform, so it never
    // touches cardRef's own DOM size, but we force it back to full scale
    // during capture anyway, purely to be safe against any renderer that
    // might honor ancestor transforms, then restore the preview after.
    const scaleEl = cardScaleRef.current;
    const previousTransform = scaleEl?.style.transform;

    try {
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);
      if (scaleEl) scaleEl.style.transform = "none";

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      window.scrollTo(0, originalScrollY);
      if (scaleEl) scaleEl.style.transform = previousTransform || "none";

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
      if (scaleEl) scaleEl.style.transform = previousTransform || "none";
      console.error("PDF generation failed:", error);
      alert("Download failed. Please try again.");
    }
  });

  if (loading) return <PortalLayout><div className="py-20 text-center text-[#2A364B]/50 dark:text-[#8E99AC]">Loading...</div></PortalLayout>;

  const emp = profile || user || {};
  // The employee's own login number (emp.phone) is the fallback; contact_no is
  // the number they've chosen to display on the ID/visiting card, editable below.
  const displayPhone = emp.contact_no || emp.phone || "—";
  // Always the real production domain, never window.location.origin — this
  // QR ends up printed on a physical ID/visiting card, so it must stay
  // correct even if generated while browsing a preview/staging deployment.
  const verifyUrl = `${window.location.hostname === "localhost" ? window.location.origin : LINKS.siteUrl}/verify/${emp.id || ""}`;
  const qrUrl = `${QR_BASE}${encodeURIComponent(verifyUrl)}`;
  const empId = emp.employee_id || (emp.id || "").slice(0, 8).toUpperCase();
  const photoUrl = photoObjectUrl;

  const startEditPhone = () => {
    setPhoneInput(displayPhone === "—" ? "" : displayPhone);
    setEditingPhone(true);
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
        <PageHeader icon="🪪" title="My ID & Visiting Card" subtitle="Download or share your official TFD card" className="justify-center text-center" />

        <div className="flex gap-2 justify-center">
          <button onClick={() => setTab("id")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "id" ? "bg-[#024396] dark:bg-[#4C8DFF] text-white" : "border border-[#E2D8C2] dark:border-white/15 text-[#2A364B]/60 dark:text-[#8E99AC]"}`}>
            ID Card
          </button>
          <button onClick={() => setTab("visiting")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "visiting" ? "bg-[#024396] dark:bg-[#4C8DFF] text-white" : "border border-[#E2D8C2] dark:border-white/15 text-[#2A364B]/60 dark:text-[#8E99AC]"}`}>
            Visiting Card
          </button>
        </div>

        {/* Contact number shown on both cards — editable here, applies to both */}
        <div className="max-w-sm mx-auto bg-white dark:bg-[#101D2E] border border-[#E2D8C2] dark:border-white/10 rounded-xl p-3">
          {!editingPhone ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC] uppercase tracking-wider">Phone shown on cards</p>
                <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{displayPhone}</p>
              </div>
              <button onClick={startEditPhone} className="text-xs font-medium text-[#024396] dark:text-[#7CB0FF] hover:underline shrink-0">Change</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="10-digit mobile number"
                className="flex-1 border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30"
              />
              <button onClick={savePhone} disabled={savingPhone || !phoneInput.trim()}
                className="text-xs font-semibold text-white bg-[#024396] dark:bg-[#4C8DFF] rounded-lg px-3 py-1.5 disabled:opacity-50">
                {savingPhone ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditingPhone(false)} className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] px-2">Cancel</button>
            </div>
          )}
        </div>

        <div ref={scaleWrapRef} style={{ display: "flex", justifyContent: "center", padding: "10px", width: "100%", overflowX: "auto" }}>

          {/* Height-compensating wrapper — transform: scale() doesn't shrink
              the layout box, so without this the scaled-down preview would
              leave blank space below/beside it (or still force scroll). */}
          <div style={cardScale < 1 ? {
            width: (tab === "visiting" ? 600 : 343) * cardScale,
            height: (tab === "visiting" ? 343 : 600) * cardScale,
          } : undefined}>
            {/* Visual-only scale wrapper — an ancestor of cardRef, never cardRef
                itself, so the 600px/343px DOM captured for the PDF is untouched. */}
            <div ref={cardScaleRef} style={{ transformOrigin: "top left" }}>
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
                  <img src={LOGO_URL} alt="TFD" style={{ height: 68, margin: "0 auto", display: "block" }} crossOrigin="anonymous" />
                  <div style={{ position: "absolute", right: 12, top: 12, opacity: 0.08, fontSize: 48, color: "#024396", lineHeight: 1 }}>⬡</div>
                </div>

                <div style={{ background: "linear-gradient(135deg, #ddeeff 0%, #f5f1eb 100%)", padding: "16px 24px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box" }}>
                  
                  <div style={{ marginBottom: 14 }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={emp.name} crossOrigin="anonymous"
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
                      ["Phone", displayPhone],
                      ["Email", "wecare@thefinancialdoctor.in"],
                    ].map(([label, val]) => (
                      // Flexbox rows render with baseline shifts in html2canvas's exported
                      // canvas vs. the live DOM (same issue the name/designation badges above
                      // were already fixed for) — inline-block + an explicit line-height instead
                      // of flex keeps every row pinned to the same baseline in the download too.
                      <div key={label} style={{ fontSize: 13, color: "#0E1B2C", lineHeight: "18px" }}>
                        <strong style={{ display: "inline-block", width: "95px", verticalAlign: "top" }}>{label}</strong>
                        <span style={{ display: "inline-block", width: "calc(100% - 95px)", wordBreak: "break-word", verticalAlign: "top" }}>{val}</span>
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
                    <img src={LOGO_URL} alt="TFD" style={{ height: 60, marginBottom: 12 }} crossOrigin="anonymous" />

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
                        ["Phone", displayPhone],
                        ["Email", "wecare@thefinancialdoctor.in"],
                      ].map(([label, val]) => (
                        <div key={label} style={{ fontSize: 13, color: "#0E1B2C", lineHeight: "18px" }}>
                          <strong style={{ display: "inline-block", width: "95px", verticalAlign: "top" }}>{label}</strong>
                          <span style={{ display: "inline-block", verticalAlign: "top" }}>{val}</span>
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap pt-4">
          <Button onClick={handleDownload} disabled={downloading} className="w-full sm:w-auto bg-[#9B2335] hover:bg-[#7a1b29]">
            {downloading ? "Generating…" : "⬇️ Download PDF Card"}
          </Button>
          <Button onClick={handleShare} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
            📤 Share Verify Link
          </Button>
        </div>

        <div className="bg-[#FBF7EE] dark:bg-white/5 border border-[#E2D8C2] dark:border-white/10 rounded-xl p-3 text-center mt-2 max-w-sm mx-auto">
          <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">QR code scan karne se tumhara verification page khulega.</p>
          <a href={verifyUrl} target="_blank" rel="noreferrer"
            className="text-xs text-[#024396] dark:text-[#7CB0FF] underline mt-1 block">
            Preview verify page →
          </a>
        </div>
      </div>
    </PortalLayout>
  );
}