import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function EmployeeIDCard() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [uploads, setUploads] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        fetch(`${API_BASE}/api/profile/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/uploads/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (uRes.ok) setUploads(await uRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const printCard = (type) => {
    const el = document.getElementById(type);
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${type === "id-card" ? "ID Card" : "Visiting Card"} - ${profile?.full_name || user?.name}</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f1eb;font-family:'Segoe UI',sans-serif;}
      .card{${type === "id-card" ? "width:340px;min-height:500px;" : "width:400px;min-height:230px;"}background:white;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.12);print-color-adjust:exact;-webkit-print-color-adjust:exact;}
      @media print{body{background:white;}.card{box-shadow:none;}}</style></head><body>`);
    w.document.write(el.outerHTML);
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const printAgreement = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const photoData = uploads?.photo?.data || "";
    const signatureData = uploads?.signature?.data || "";
    w.document.write(`<html><head><title>Employment Agreement - ${profile?.full_name || user?.name}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;max-width:700px;margin:auto;padding:30px;color:#0E1B2C;font-size:13px;line-height:1.7;}
      h1{text-align:center;font-size:20px;margin-bottom:2px;}
      .sub{text-align:center;font-size:11px;color:#666;margin-bottom:20px;}
      .logo{text-align:center;margin-bottom:10px;}
      .logo img{height:60px;}
      table{width:100%;border-collapse:collapse;margin:16px 0;}
      th,td{padding:6px 10px;border:1px solid #ddd;text-align:left;font-size:12px;}
      th{background:#f5f1eb;}
      .clause{margin:10px 0;}
      .clause strong{color:#024396;}
      .sig-row{display:flex;justify-content:space-between;margin-top:40px;align-items:flex-end;}
      .sig-box{text-align:center;width:45%;}
      .sig-box img{height:50px;object-fit:contain;}
      .sig-box p{border-top:1px solid #000;padding-top:4px;font-size:11px;margin-top:4px;}
      .seal{text-align:center;margin-top:20px;padding:8px;border:2px solid #024396;border-radius:8px;font-size:10px;color:#024396;font-weight:bold;}
      @media print{body{padding:15px;}}
    </style></head><body>
    <div class="logo"><img src="/tfd-logo.png" alt="TFD" /></div>
    <h1>THE FINANCIAL DOCTOR</h1>
    <p class="sub">Employment Agreement / रोज़गार अनुबंध<br/>Website: thefinancialdoctor.in | Contact: +91 77738 05794</p>
    <table>
      <tr><th>Employee Name</th><td>${profile?.full_name || ""}</td><th>Date</th><td>${new Date().toLocaleDateString("en-IN")}</td></tr>
      <tr><th>Father's Name</th><td>${profile?.father_name || ""}</td><th>DOB</th><td>${profile?.dob || ""}</td></tr>
      <tr><th>Contact</th><td>${profile?.contact_no || ""}</td><th>Email</th><td>${profile?.email || ""}</td></tr>
      <tr><th>Address</th><td colspan="3">${profile?.address || ""}</td></tr>
      <tr><th>Aadhar No.</th><td>${profile?.aadhar_number || ""}</td><th>PAN</th><td>${profile?.pan_number || "-"}</td></tr>
      <tr><th>Designation</th><td>${user?.designation || "Employee"}</td><th>Join Date</th><td>${user?.join_date || "-"}</td></tr>
    </table>
    <p style="font-weight:bold;text-align:center;margin:16px 0;">Terms & Conditions / नियम और शर्तें</p>
    <div class="clause"><strong>1. Training Period / प्रशिक्षण अवधि:</strong> No salary will be given for the training days. प्रशिक्षण के दिनों की कोई सैलरी नहीं दी जाएगी।</div>
    <div class="clause"><strong>2. Confidentiality & Data Use / गोपनीयता:</strong> You must not misuse any client or company data. Do not ask clients for their ID/password. आप किसी भी क्लाइंट या कंपनी के डेटा का दुरुपयोग नहीं कर सकते।</div>
    <div class="clause"><strong>3. Legal Action for Fraud / धोखाधड़ी:</strong> If you misuse data or commit fraud, the company can remove you and take legal action. यदि आप धोखा करते हैं, तो कंपनी कानूनी कार्रवाई कर सकती है।</div>
    <div class="clause"><strong>4. Client Rules / क्लाइंट नियम:</strong> (a) No collecting money in personal account. (b) No returns guarantee. (c) No asking client login details.</div>
    <div class="clause"><strong>5. Company Phone & SIM / फोन और सिम:</strong> Company will provide phone and SIM for official use only. Must return when leaving.</div>
    <div class="clause"><strong>6. Discipline & Dress Code / अनुशासन:</strong> Come on time, behave respectfully, wear formal clothes.</div>
    <div class="clause"><strong>7. Salary Rules / सैलरी नियम:</strong> Salary between 1st-10th. No advance. Leave days deducted. Mid-month leaving = no salary.</div>
    <div class="clause"><strong>8. Targets / लक्ष्य:</strong> Monthly targets mandatory. First 2 months relaxation.</div>
    <div class="clause"><strong>9. Notice Period / नोटिस:</strong> 15 days or 1 month notice required. Sudden leaving = salary cancelled.</div>
    <div class="clause"><strong>10. Legal Action (BNS & IT Act):</strong> BNS 2023 — Sec 316 (Fraud), Sec 73 (Data Theft), Sec 64 (Breach of Trust). IT Act 2000 — Sec 43A, Sec 66.</div>
    <p style="margin-top:20px;font-size:11px;">I, <strong>${profile?.full_name || ""}</strong>, hereby declare that all the information provided above is true and correct. I have read and understood all the terms and conditions mentioned above and I agree to abide by them.</p>
    <p style="font-size:11px;">मैं, <strong>${profile?.full_name || ""}</strong>, घोषणा करता/करती हूं कि ऊपर दी गई सभी जानकारी सत्य और सही है। मैंने उपरोक्त सभी नियम और शर्तें पढ़ और समझ ली हैं और मैं उनका पालन करने के लिए सहमत हूं।</p>
    <div class="sig-row">
      <div class="sig-box">${signatureData ? `<img src="${signatureData}" alt="Employee Signature" />` : ""}<p>Employee Signature<br/>${profile?.full_name || ""}</p></div>
      <div class="sig-box"><img src="/sagar-signature.png" alt="Sagar Chaturvedi" /><p>Authorized Signatory<br/>Sagar Chaturvedi, CEO</p></div>
    </div>
    <div class="seal">THE FINANCIAL DOCTOR — COMPANY SEAL<br/>Sehore, Madhya Pradesh | AMFI Reg: ARN-290298</div>
    ${photoData ? `<div style="text-align:center;margin-top:16px;"><img src="${photoData}" alt="Employee Photo" style="height:80px;border-radius:8px;border:1px solid #ddd;" /></div>` : ""}
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  if (loading) {
    return <PortalLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div></PortalLayout>;
  }

  if (!profile || !profile.full_name) {
    return (
      <PortalLayout>
        <div className="text-center py-16">
          <p className="text-[#2A364B]/50 text-sm">Please complete your profile first to generate ID Card and Agreement.</p>
        </div>
      </PortalLayout>
    );
  }

  const photoSrc = uploads?.photo?.data;

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">My Documents</h2>
          <p className="text-xs text-[#2A364B]/50">Digital ID Card, Visiting Card & Employment Agreement</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Digital ID Card */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0E1B2C]">Digital ID Card</h3>
              <button onClick={() => printCard("id-card")} className="text-xs text-[#024396] hover:underline">Download / Print</button>
            </div>
            <div id="id-card" className="card bg-white rounded-2xl overflow-hidden shadow-lg border border-[#E2D8C2]" style={{maxWidth: 340}}>
              <div className="bg-gradient-to-r from-[#0E1B2C] to-[#162d4a] text-white p-4 text-center">
                <img src="/tfd-logo.png" alt="TFD" className="h-10 mx-auto mb-1 brightness-0 invert" />
                <p className="text-[10px] text-white/60">The Financial Doctor</p>
              </div>
              <div className="p-5 text-center">
                {photoSrc ? (
                  <img src={photoSrc} alt="Photo" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-[#024396]/20 mb-3" />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white text-3xl font-bold mb-3">
                    {profile.full_name?.charAt(0)}
                  </div>
                )}
                <p className="text-lg font-bold text-[#0E1B2C]">{profile.full_name}</p>
                <p className="text-xs text-[#024396] font-medium">{user?.designation || "Employee"}</p>
                <div className="mt-4 text-left space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-[#2A364B]/50">Employee ID:</span><span className="font-medium">{user?.id?.slice(0, 8).toUpperCase()}</span></div>
                  <div className="flex justify-between"><span className="text-[#2A364B]/50">Contact:</span><span className="font-medium">{profile.contact_no}</span></div>
                  <div className="flex justify-between"><span className="text-[#2A364B]/50">Join Date:</span><span className="font-medium">{user?.join_date || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-[#2A364B]/50">Blood Group:</span><span className="font-medium">-</span></div>
                </div>
              </div>
              <div className="bg-[#024396] text-white text-center py-2 text-[10px]">
                thefinancialdoctor.in | +91 77738 05794
              </div>
            </div>
          </div>

          {/* Visiting Card */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0E1B2C]">Visiting Card</h3>
              <button onClick={() => printCard("visiting-card")} className="text-xs text-[#024396] hover:underline">Download / Print</button>
            </div>
            <div id="visiting-card" className="card bg-white rounded-2xl overflow-hidden shadow-lg border border-[#E2D8C2]" style={{maxWidth: 400}}>
              <div className="bg-gradient-to-r from-[#0E1B2C] to-[#162d4a] text-white p-4 flex items-center gap-3">
                <img src="/tfd-logo.png" alt="TFD" className="h-8 brightness-0 invert" />
                <div>
                  <p className="text-sm font-bold">The Financial Doctor</p>
                  <p className="text-[9px] text-white/50">Treating Your Financial Health</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                {photoSrc ? (
                  <img src={photoSrc} alt="Photo" className="w-16 h-16 rounded-xl object-cover border-2 border-[#E2D8C2]" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white text-2xl font-bold">
                    {profile.full_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-[#0E1B2C]">{profile.full_name}</p>
                  <p className="text-xs text-[#024396]">{user?.designation || "Financial Advisor"}</p>
                  <p className="text-[10px] text-[#2A364B]/50 mt-1">{profile.contact_no} | {profile.email}</p>
                </div>
              </div>
              <div className="bg-[#024396] text-white text-center py-1.5 text-[9px]">
                thefinancialdoctor.in | Sehore, MP | AMFI: ARN-290298
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Download */}
        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0E1B2C]">Employment Agreement</h3>
              <p className="text-xs text-[#2A364B]/50">Bilingual Hindi + English agreement with all terms, your details & signature</p>
            </div>
            <button onClick={printAgreement}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4]">
              Download Agreement PDF
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
