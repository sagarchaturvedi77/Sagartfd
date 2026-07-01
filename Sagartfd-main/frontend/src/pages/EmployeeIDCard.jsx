import React from 'react';
import PortalLayout from '../components/PortalLayout';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

const services = ['Mutual Funds', 'Insurance', 'Equity', 'Share Recovery'];

export default function EmployeeIDCard() {
  const { user } = useAuth();
  const profile = user || {};

  const downloadCard = (type = 'id') => {
    // open a print window with the card HTML for user to Save as PDF
    const html = renderCardHTML(type);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 600);
  };

  const renderCardHTML = (type) => {
    const employeeId = profile.id || '';
    const joinDate = profile.join_date || '';
    const phone = profile.phone || '';
    const blood = profile.blood_group || '';
    const photo = profile.photo_url || '/assets/default-avatar.png';
    const arn = 'ARN-290298';

    if (type === 'visiting') {
      return `
        <html><head><meta charset="utf-8"><title>Visiting Card</title>
        <style>
          body{font-family:Inter, Arial;}
          .card{width:350px;height:200px;border:1px solid #E8E8E8;border-radius:12px;padding:12px;box-sizing:border-box;position:relative}
          .photo{width:76px;height:76px;object-fit:cover;border-radius:8px}
          .logo{position:absolute;right:12px;bottom:12px;opacity:0.08;width:160px}
        </style></head><body>
        <div class="card">
          <div style="display:flex;gap:12px;align-items:center">
            <img src="${photo}" class="photo" />
            <div>
              <div style="font-size:16px;font-weight:700">${profile.name || ''}</div>
              <div style="font-size:12px;color:#334">${profile.designation || ''}</div>
              <div style="font-size:12px;margin-top:8px">${phone}</div>
            </div>
          </div>
          <div style="position:absolute;right:12px;bottom:12px;opacity:0.08;transform:rotate(-12deg)"><svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><text x="0" y="15" fill="#024396" style="font-weight:700;font-size:18px">THE FINANCIAL DOCTOR</text></svg></div>
        </div></body></html>`;
    }

    // ID card
    return `
      <html><head><meta charset="utf-8"><title>ID Card</title>
      <style>
        @page { size: A6; margin: 6mm; }
        body{font-family:Inter, Arial;margin:0;padding:0}
        .card{width:340px;min-height:500px;background:white;border-radius:12px;padding:16px;box-sizing:border-box;position:relative}
        .header{background:linear-gradient(90deg,#024396,#0356c4);color:white;padding:12px;border-radius:8px;display:flex;gap:12px;align-items:center}
        .photo{width:96px;height:120px;object-fit:cover;border-radius:8px}
        .watermark{position:absolute;right:20px;bottom:20px;opacity:0.08;transform:rotate(-12deg)}
      </style></head><body>
      <div class="card">
        <div class="header">
          <img src="${photo}" class="photo" />
          <div>
            <h2 style="margin:0">${profile.name || ''}</h2>
            <div style="font-size:13px">${profile.designation || ''}</div>
            <div style="margin-top:8px;font-size:12px">${phone}</div>
          </div>
        </div>
        <div style="padding:12px;font-size:13px">
          <div>Employee ID: <strong>${employeeId}</strong></div>
          <div>Joining Date: ${joinDate}</div>
          <div>Blood Group: ${blood}</div>
          <hr style="margin:12px 0" />
          <div style="font-size:12px">ARN: ${arn}</div>
          <div style="font-size:12px;margin-top:6px">Services: ${services.join(', ')}</div>
        </div>
        <div class="watermark"><img src="/assets/seal-transparent.png" style="width:220px" /></div>
      </div>
      </body></html>`;
  };

  return (
    <PortalLayout>
      <div className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">My Documents</h3>
        <p className="text-sm text-[#6B7280]">Download your ID card, Visiting card or Employment Agreement (A4 PDF).</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => downloadCard('id')} className="px-4 py-2 bg-[#024396] text-white rounded">Download ID Card</button>
          <button onClick={() => downloadCard('visiting')} className="px-4 py-2 bg-[#10B981] text-white rounded">Download Visiting Card</button>
        </div>
      </div>
    </PortalLayout>
  );
}
