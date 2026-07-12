import React, { useState } from 'react';
import PortalLayout from '../components/PortalLayout';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/portal/PageHeader';
import { Button } from '../components/ui/button';

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

async function downloadBlob(res, filename) {
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function EmployeeAgreement() {
  const { user, token } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");

  const filename = `Employment_Agreement_${(user?.name || "Employee").replace(/\s+/g, "_")}.pdf`;
  const headers = { Authorization: `Bearer ${token}` };
  const fetchAgreement = () => fetch(`${API_BASE}/api/employees/${user.id}/agreement/download`, { headers });

  const handleDownload = async () => {
    setError("");
    setDownloading(true);
    try {
      const res = await fetchAgreement();
      if (!res.ok) throw new Error("Could not generate your agreement. Please try again or contact HR.");
      await downloadBlob(res, filename);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setError("");
    setSharing(true);
    try {
      const res = await fetchAgreement();
      if (!res.ok) throw new Error("Could not generate your agreement. Please try again or contact HR.");
      await downloadBlob(res, filename);
      window.open(
        `https://wa.me/?text=${encodeURIComponent("My Employment Agreement with The Financial Doctor — PDF attached (just downloaded to your device, attach it to this chat).")}`,
        "_blank"
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader icon="📄" title="Employment Agreement" subtitle="Download or share your complete employment agreement" />

        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-6 shadow-sm">
          <p className="text-sm text-[#6B7280] dark:text-[#8E99AC]">
            Your agreement is generated on The Financial Doctor's official letterhead — your photo, details, and
            signature, alongside the CEO's signature and company seal.
          </p>

          <div className="mt-4 bg-[#F5F1EB] dark:bg-white/5 rounded-xl p-4 text-sm space-y-1.5 text-[#0E1B2C] dark:text-[#F1EDE3]">
            <p><span className="font-medium">Employee:</span> {user?.name}</p>
            <p><span className="font-medium">Employee ID:</span> {user?.id}</p>
          </div>

          {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleDownload} disabled={downloading} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              {downloading ? "Generating..." : "Download PDF"}
            </Button>
            <Button onClick={handleShare} disabled={sharing} variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
              {sharing ? "Preparing..." : "Share via WhatsApp"}
            </Button>
          </div>

          <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70 mt-3">
            Includes: company letterhead, your photo, all terms &amp; conditions (English + Hindi), Aadhaar/PAN details,
            your signature, and the CEO's signature &amp; seal.
          </p>
        </div>
      </div>
    </PortalLayout>
  );
}
