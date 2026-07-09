import React, { useState, useEffect } from 'react';
import PortalLayout from '../components/PortalLayout';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/portal/PageHeader';
import { Button } from '../components/ui/button';

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MAIN_LOGO_URL = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";

export default function EmployeeAgreement() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [uploads, setUploads] = useState({});
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!token || !user) return;
    fetch(`${API_BASE}/api/profile/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : {})
      .then(setProfile)
      .catch(() => {});
    // Photo + signature live in the uploads collection (set during onboarding),
    // not on the profile document — profile.passport_photo/signature never existed.
    fetch(`${API_BASE}/api/uploads/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : {})
      .then(setUploads)
      .catch(() => {});
  }, [token, user]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: "N/A", lng: "N/A" })
      );
    }
  };

  useEffect(() => { getLocation(); }, []);

  const employeeName = profile?.full_name || user?.name || '';
  const fatherName = profile?.father_name || '';
  const address = profile?.address || '';
  const contactNo = profile?.contact_no || user?.phone || '';
  const dob = profile?.dob || '';
  const aadhar = profile?.aadhar_number ? `XXXX-XXXX-${profile.aadhar_number.slice(-4)}` : '';
  const designation = user?.designation || 'Employee';
  const employeeId = user?.id || '';
  const joinDate = user?.join_date || new Date().toISOString().split('T')[0];
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const time = new Date().toLocaleTimeString('en-IN');
  const locationStr = location ? `Lat: ${typeof location.lat === 'number' ? location.lat.toFixed(6) : location.lat}, Lng: ${typeof location.lng === 'number' ? location.lng.toFixed(6) : location.lng}` : 'Fetching...';

  const printAgreement = () => {
    const photoUrl = uploads?.photo?.data || '';
    const signatureUrl = uploads?.signature?.data || '';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Employment Agreement - ${employeeName}</title>
<style>
  @page { size: A4; margin: 15mm 20mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.6; }
  .header { text-align: center; border-bottom: 3px solid #024396; padding-bottom: 15px; margin-bottom: 20px; }
  .logo { height: 60px; margin-bottom: 8px; }
  .company-name { font-size: 22px; font-weight: 700; color: #024396; }
  .company-sub { font-size: 11px; color: #666; }
  .title { text-align: center; font-size: 18px; font-weight: 700; color: #0E1B2C; margin: 20px 0 15px; text-decoration: underline; }
  .hindi { color: #444; font-size: 12px; }
  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin: 15px 0; padding: 12px; background: #f8f9fa; border-radius: 8px; }
  .detail-item { font-size: 12px; }
  .detail-label { font-weight: 600; color: #333; }
  .photo-section { text-align: center; margin: 10px 0; }
  .photo-section img { width: 100px; height: 120px; object-fit: cover; border: 2px solid #024396; border-radius: 4px; }
  .clause { margin-bottom: 12px; padding: 8px 12px; border-left: 3px solid #024396; background: #fafbfc; }
  .clause-title { font-weight: 700; font-size: 13px; color: #024396; margin-bottom: 3px; }
  .clause-hindi { font-size: 11.5px; color: #555; margin-top: 2px; }
  .declaration { margin-top: 20px; padding: 15px; border: 2px solid #024396; border-radius: 8px; background: #f0f4ff; }
  .declaration h4 { color: #024396; margin: 0 0 8px; }
  .sig-section { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
  .sig-box { text-align: center; }
  .sig-box img { height: 50px; margin-bottom: 5px; }
  .sig-line { border-top: 1px solid #333; width: 180px; margin: 0 auto 4px; }
  .sig-label { font-size: 11px; color: #666; }
  .footer-info { margin-top: 20px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #ddd; padding-top: 8px; }
  .seal { position: absolute; right: 80px; bottom: 200px; width: 120px; opacity: 0.15; transform: rotate(-15deg); }
</style>
</head><body>
<div style="position:relative;">

<div class="header">
  <img src="${MAIN_LOGO_URL}" class="logo" alt="TFD" />
  <div class="company-name">The Financial Doctor</div>
  <div class="company-sub">AMFI Registered | ARN-290298 | Mutual Funds & Insurance Advisory</div>
  <div class="company-sub">1st Floor, New Bus Stand, Sekdakhedi Road, Sehore, MP - 466001</div>
</div>

<div class="title">EMPLOYMENT AGREEMENT / कर्मचारी अनुबंध</div>

${photoUrl ? `<div class="photo-section"><img src="${photoUrl}" alt="Employee Photo" /></div>` : ''}

<div class="details-grid">
  <div class="detail-item"><span class="detail-label">Name / नाम:</span> ${employeeName}</div>
  <div class="detail-item"><span class="detail-label">Father's Name / पिता का नाम:</span> ${fatherName}</div>
  <div class="detail-item"><span class="detail-label">Designation / पद:</span> ${designation}</div>
  <div class="detail-item"><span class="detail-label">Date of Birth / जन्मतिथि:</span> ${dob}</div>
  <div class="detail-item"><span class="detail-label">Contact / संपर्क:</span> ${contactNo}</div>
  <div class="detail-item"><span class="detail-label">Aadhar / आधार:</span> ${aadhar}</div>
  <div class="detail-item"><span class="detail-label">Employee ID:</span> ${employeeId.slice(0, 8)}</div>
  <div class="detail-item"><span class="detail-label">Joining Date / कार्यारंभ तिथि:</span> ${joinDate}</div>
  <div class="detail-item" style="grid-column:span 2"><span class="detail-label">Address / पता:</span> ${address}</div>
</div>

<h3 style="color:#024396;margin:20px 0 10px;">TERMS AND CONDITIONS / नियम एवं शर्तें</h3>

<div class="clause">
  <div class="clause-title">1. Confidentiality & Data Protection / गोपनीयता एवं डेटा सुरक्षा</div>
  <div>Employee shall maintain strict confidentiality of all company data, client information, financial records, and proprietary methods. Any breach shall attract legal action under IT Act 2000.</div>
  <div class="clause-hindi">कर्मचारी कंपनी के सभी डेटा, क्लाइंट जानकारी, वित्तीय रिकॉर्ड और मालिकाना तरीकों की सख्त गोपनीयता बनाए रखेगा।</div>
</div>

<div class="clause">
  <div class="clause-title">2. Legal Action for Data Theft & Fraud / डेटा चोरी या धोखाधड़ी पर कानूनी कार्रवाई</div>
  <div>Any data theft, client poaching, or financial fraud will result in immediate termination and legal prosecution under BNS (Bharatiya Nyaya Sanhita) and IT Act.</div>
  <div class="clause-hindi">किसी भी डेटा चोरी, क्लाइंट पोचिंग या वित्तीय धोखाधड़ी पर तत्काल बर्खास्तगी और BNS तथा IT Act के तहत कानूनी कार्रवाई होगी।</div>
</div>

<div class="clause">
  <div class="clause-title">3. SEBI & AMFI Guidelines Compliance / SEBI एवं AMFI नियमों का पालन</div>
  <div>Employee must comply with all SEBI/AMFI regulations. No guaranteed return promises to clients. Misrepresentation will lead to termination and regulatory complaint.</div>
  <div class="clause-hindi">कर्मचारी को SEBI/AMFI के सभी नियमों का पालन करना अनिवार्य है। ग्राहकों को गारंटीड रिटर्न का वादा नहीं किया जाएगा।</div>
</div>

<div class="clause">
  <div class="clause-title">4. Company Assets / कंपनी की संपत्ति</div>
  <div>All company-provided devices (phone, SIM, laptop) remain company property. Must be returned on separation in working condition. Loss/damage will be deducted from final settlement.</div>
  <div class="clause-hindi">कंपनी द्वारा दिए गए सभी उपकरण कंपनी की संपत्ति रहेंगे। नौकरी छोड़ने पर वापस करने होंगे।</div>
</div>

<div class="clause">
  <div class="clause-title">5. Workplace Discipline & Dress Code / अनुशासन एवं ड्रेस कोड</div>
  <div>Professional dress code mandatory. Punctuality expected. Three consecutive unauthorized absences will be treated as voluntary resignation.</div>
  <div class="clause-hindi">प्रोफेशनल ड्रेस कोड अनिवार्य है। समय पर आना अपेक्षित है। तीन लगातार अनधिकृत अनुपस्थिति को स्वैच्छिक इस्तीफा माना जाएगा।</div>
</div>

<div class="clause">
  <div class="clause-title">6. Salary & Payroll Rules / वेतन से जुड़े नियम</div>
  <div>Salary credited to bank account only. No cash advances. Salary date: 7th of every month. Deductions for unauthorized leaves apply as per policy.</div>
  <div class="clause-hindi">वेतन केवल बैंक खाते में जमा होगा। कोई नकद अग्रिम नहीं। वेतन तिथि: हर महीने की 7 तारीख।</div>
</div>

<div class="clause">
  <div class="clause-title">7. Probation & Performance / प्रोबेशन एवं प्रदर्शन</div>
  <div>First 3 months are probation period. Monthly targets must be met. Failure to meet targets for 2 consecutive months may result in termination.</div>
  <div class="clause-hindi">पहले 3 महीने प्रोबेशन पीरियड हैं। मासिक लक्ष्य पूरे करने होंगे।</div>
</div>

<div class="clause">
  <div class="clause-title">8. Notice Period & Exit / नोटिस पीरियड</div>
  <div>30 days written notice required for resignation. Sudden exit without notice will forfeit pending salary and attract recovery of training costs if within 6 months.</div>
  <div class="clause-hindi">इस्तीफे के लिए 30 दिन का लिखित नोटिस आवश्यक है। बिना नोटिस छोड़ने पर बकाया वेतन जब्त होगा।</div>
</div>

<div class="clause">
  <div class="clause-title">9. Non-Compete & Non-Solicitation / प्रतिस्पर्धा निषेध</div>
  <div>For 1 year after leaving, employee shall not join/start a competing financial advisory business within 50km of Sehore or solicit existing clients.</div>
  <div class="clause-hindi">छोड़ने के 1 साल तक कर्मचारी सहोर के 50 किमी के भीतर प्रतिस्पर्धी व्यवसाय नहीं करेगा।</div>
</div>

<div class="clause">
  <div class="clause-title">10. POSH Act Compliance / यौन उत्पीड़न रोकथाम</div>
  <div>Company follows Prevention of Sexual Harassment (POSH) Act 2013. Any misconduct will be dealt with strictly as per law.</div>
  <div class="clause-hindi">कंपनी POSH Act 2013 का पालन करती है। किसी भी दुर्व्यवहार पर कानून के अनुसार सख्त कार्रवाई होगी।</div>
</div>

<div class="declaration">
  <h4>DECLARATION / घोषणा</h4>
  <p>I, <strong>${employeeName}</strong>, S/o D/o <strong>${fatherName}</strong>, hereby declare that I have read, understood, and agree to all the terms and conditions mentioned above. I accept this employment offer voluntarily and commit to abide by company policies.</p>
  <p class="hindi" style="font-size:12px;color:#555;margin-top:8px;">मैं, <strong>${employeeName}</strong>, पुत्र/पुत्री <strong>${fatherName}</strong>, घोषणा करता/करती हूँ कि मैंने उपरोक्त सभी नियम एवं शर्तें पढ़ ली हैं, समझ ली हैं और मैं इनसे सहमत हूँ।</p>
  <p style="font-size:11px;color:#888;margin-top:8px;">
    <strong>Signed at / हस्ताक्षर स्थान:</strong> ${locationStr}<br/>
    <strong>Date & Time / दिनांक एवं समय:</strong> ${date}, ${time}
  </p>
</div>

<div class="sig-section">
  <div class="sig-box">
    ${signatureUrl ? `<img src="${signatureUrl}" alt="Employee Signature" />` : '<div style="height:50px;"></div>'}
    <div class="sig-line"></div>
    <div class="sig-label"><strong>${employeeName}</strong></div>
    <div class="sig-label">Employee / कर्मचारी</div>
  </div>
  <div class="sig-box">
    <img src="/assets/sagar-signature.png" alt="Authorized Signatory" style="height:50px;" onerror="this.style.display='none'" />
    <div class="sig-line"></div>
    <div class="sig-label"><strong>Sagar Chaturvedi</strong></div>
    <div class="sig-label">CEO, The Financial Doctor</div>
    <div class="sig-label">Authorized Signatory / अधिकृत हस्ताक्षरकर्ता</div>
  </div>
</div>

<div class="footer-info">
  This is a computer-generated agreement. Valid without physical stamp if digitally signed.<br/>
  The Financial Doctor | AMFI ARN-290298 | Sehore, MP | Contact: +91 9876543210
</div>

</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 800);
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader icon="📄" title="Employment Agreement" subtitle="View or print your complete employment agreement" />

        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-6 shadow-sm">
          <p className="text-sm text-[#6B7280] dark:text-[#8E99AC]">All terms, conditions, and declarations included below.</p>

          <div className="mt-4 bg-[#F5F1EB] dark:bg-white/5 rounded-xl p-4 text-sm space-y-1.5 text-[#0E1B2C] dark:text-[#F1EDE3]">
            <p><span className="font-medium">Employee:</span> {employeeName}</p>
            <p><span className="font-medium">Designation:</span> {designation}</p>
            <p><span className="font-medium">Date:</span> {date}</p>
            {location && <p><span className="font-medium">Location:</span> {locationStr}</p>}
          </div>

          <div className="mt-4 flex gap-3">
            <Button onClick={printAgreement} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              Print / Save PDF
            </Button>
          </div>

          <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70 mt-3">Agreement includes: Company logo, employee photo, all 10 clauses (Hindi + English), declaration with GPS location & timestamp, employee signature, and authorized signatory.</p>
        </div>
      </div>
    </PortalLayout>
  );
}
