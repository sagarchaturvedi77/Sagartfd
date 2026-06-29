import React from 'react';
import PortalLayout from '../components/PortalLayout';
import { useAuth } from '../context/AuthContext';

export default function EmployeeAgreement() {
  const { user } = useAuth();
  const profile = user || {};
  const photo = profile.photo_url || '/assets/default-avatar.png';
  const employeeId = profile.id || '';
  const date = new Date().toLocaleDateString('en-IN');

  const printAgreement = () => {
    const html = `
      <html><head><meta charset="utf-8"><title>Employment Agreement</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body{font-family:Inter, Arial;color:#0E1B2C}
        .container{position:relative;padding:10mm}
        .photo{width:120px;height:160px;object-fit:cover;border:1px solid #eee}
        .seal{position:absolute;right:60px;bottom:140px;width:260px;opacity:0.10;transform:rotate(-12deg)}
        h1{font-size:20px;text-align:center}
        .section{margin-bottom:12px}
        .sig{margin-top:40px}
      </style>
      </head><body>
      <div class="container">
        <img src="/assets/seal-transparent.png" class="seal" />
        <h1>Employee Agreement / कर्मचारी अनुबंध</h1>
        <div style="text-align:center;margin-bottom:12px"><img src="${photo}" class="photo" /></div>
        <div class="section"><strong>Name / नाम:</strong> ${profile.name || ''}</div>
        <div class="section"><strong>Employee ID / कर्मचारी आईडी:</strong> ${employeeId}</div>
        <div class="section"><strong>Date / दिनांक:</strong> ${date}</div>

        <div class="section">
          <h3>TERMS AND CONDITIONS / नियम और शर्तें</h3>
          <p>1. Confidentiality & Data Use / गोपनीयता और डेटा उपयोग — English: You must strictly maintain the confidentiality... Hindi: आपको कंपनी के सभी डेटा...</p>
          <p>2. Legal Action for Data Theft & Fraud / डेटा चोरी या धोखाधड़ी पर कानूनी कार्रवाई — ...</p>
          <p>3. SEBI & AMFI Guidelines Compliance / SEBI और AMFI नियमों का पालन — ...</p>
          <p>4. Company Assets (Phone and SIM Card) / कंपनी की संपत्ति — ...</p>
          <p>5. Workplace Discipline & Dress Code / अनुशासन और ड्रेस कोड — ...</p>
          <p>6. Salary & Payroll Rules / सैलरी से जुड़े नियम — ...</p>
          <p>7. Probation & Performance Targets / प्रोबेशन और मासिक लक्ष्य — ...</p>
          <p>8. Notice Period & Sudden Exit / नोटिस पीरियड और नौकरी छोड़ना — ...</p>
          <p>9. Non-Compete & Non-Solicitation / प्रतिस्पर्धा निषेध नियम — ...</p>
          <p>10. POSH Act (Prevention of Sexual Harassment) / यौन उत्पीड़न रोकथाम — ...</p>
          <p>11. Statutory Legal Liabilities (BNS & IT Act) / कानूनी कार्रवाई के प्रावधान — ...</p>
        </div>

        <div class="sig">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div>___________________________________</div>
              <div>Employee Signature / कर्मचारी के हस्ताक्षर</div>
            </div>
            <div style="text-align:center">
              <div>___________________________________</div>
              <div>Authorized Signatory / अधिकृत हस्ताक्षरकर्ता</div>
              <div>The Financial Doctor</div>
            </div>
          </div>
        </div>
      </div>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  return (
    <PortalLayout>
      <div className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Employment Agreement</h3>
        <p className="text-sm text-[#6B7280]">View or print your employment agreement (bilingual).</p>
        <div className="mt-4">
          <button onClick={printAgreement} className="px-4 py-2 bg-[#024396] text-white rounded">Print / Save as PDF</button>
        </div>
      </div>
    </PortalLayout>
  );
}
