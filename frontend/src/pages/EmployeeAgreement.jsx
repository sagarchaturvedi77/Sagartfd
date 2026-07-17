import React, { useState, useEffect, useCallback } from 'react';
import PortalLayout from '../components/PortalLayout';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/portal/PageHeader';
import { Button } from '../components/ui/button';
import { useSubmitOnce } from '../lib/useSubmitOnce';

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
  const headers = { Authorization: `Bearer ${token}` };

  const [status, setStatus] = useState(null); // { signed, signed_at, location } | null while loading
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/employees/${user.id}/agreement/status`, { headers });
      if (res.ok) setStatus(await res.json());
    } catch { /* silent — sign gate below just keeps showing */ }
  }, [user?.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleSign = () => {
    setSignError("");
    if (!navigator.geolocation) {
      setSignError("Your browser doesn't support location access, which is required to sign this agreement. Please try a different browser or device.");
      return;
    }
    setSigning(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`${API_BASE}/api/employees/${user.id}/agreement/sign`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
          if (!res.ok) throw new Error("Could not sign your agreement. Please try again.");
          await loadStatus();
        } catch (e) {
          setSignError(e.message);
        } finally {
          setSigning(false);
        }
      },
      () => {
        setSignError("Location access was denied or unavailable. Enabling location is mandatory to sign your agreement — please allow location access and try again.");
        setSigning(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const filename = `Employment_Agreement_${(user?.name || "Employee").replace(/\s+/g, "_")}.pdf`;
  const fetchAgreement = () => fetch(`${API_BASE}/api/employees/${user.id}/agreement/download`, { headers });

  // useSubmitOnce's ref guard stops a rapid double-click on Download/Share
  // from firing two concurrent PDF-generation requests — the old
  // state-only `disabled={downloading}` guard had a render-timing window
  // where a fast second click could still slip through.
  const [handleDownload, downloading] = useSubmitOnce(async () => {
    setError("");
    try {
      const res = await fetchAgreement();
      if (!res.ok) throw new Error("Could not generate your agreement. Please try again or contact HR.");
      await downloadBlob(res, filename);
    } catch (e) {
      setError(e.message);
    }
  });

  const [handleShare, sharing] = useSubmitOnce(async () => {
    setError("");
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
    }
  });

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader icon="📄" title="Employment Agreement" subtitle="Download or share your complete employment agreement" />

        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-6 shadow-sm">
          {status === null ? (
            <p className="text-sm text-[#6B7280] dark:text-[#8E99AC]">Loading...</p>
          ) : !status.signed ? (
            <>
              <p className="text-sm text-[#6B7280] dark:text-[#8E99AC]">
                Before you can view or download your Employment Agreement, you need to sign it once. Signing
                requires enabling location access — this records where the agreement was signed, alongside your
                own signature already on file. This is a one-time step; you won't be asked again.
              </p>
              {signError && <p className="text-xs text-red-500 mt-3">{signError}</p>}
              <div className="mt-4">
                <Button onClick={handleSign} disabled={signing} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
                  {signing ? "Requesting location..." : "Allow Location & Sign Agreement"}
                </Button>
              </div>
              <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70 mt-3">
                Location access is mandatory to sign — your browser will ask for permission when you click above.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-[#6B7280] dark:text-[#8E99AC]">
                Your agreement is generated on The Financial Doctor's official letterhead — your photo, details, and
                signature, alongside the CEO's signature and company seal.
              </p>

              <div className="mt-4 bg-[#F5F1EB] dark:bg-white/5 rounded-xl p-4 text-sm space-y-1.5 text-[#0E1B2C] dark:text-[#F1EDE3]">
                <p><span className="font-medium">Employee:</span> {user?.name}</p>
                <p><span className="font-medium">Employee ID:</span> {user?.id}</p>
                <p><span className="font-medium">Signed at:</span> {status.location}</p>
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
                Includes: company letterhead, your photo, all terms &amp; conditions (English + Hindi), Aadhaar/PAN
                details, your signature, and the CEO's signature &amp; seal.
              </p>
            </>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
