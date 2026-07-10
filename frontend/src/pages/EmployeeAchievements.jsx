import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import EmptyState from "../components/portal/EmptyState";
import { Download } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const TYPE_LABELS = {
  internship: "Internship Certificate",
  employee: "Employee Certificate",
  achievement: "Achievement",
};

export default function EmployeeAchievements() {
  const { token } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/certificates/mine`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCertificates(await res.json());
    } catch { /* silent */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <PortalLayout>
      <PageHeader icon="🏆" title="My Achievements" subtitle="Your certificates and recognitions from The Financial Doctor" />

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>
      ) : certificates.length === 0 ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm">
          <EmptyState icon="🏆" title="No achievements yet" subtitle="Certificates and recognitions issued to you will appear here." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/10 px-2 py-0.5 rounded">
                {TYPE_LABELS[cert.type] || cert.type}
              </span>
              <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mt-2">{cert.duration_label}</h3>
              <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mt-1">{cert.department} · Issued {cert.issue_date}</p>
              <p className="text-[11px] font-mono text-[#2A364B]/40 dark:text-[#8E99AC]/70 mt-2">{cert.certificate_number}</p>
              {cert.pdf_url && (
                <a href={cert.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/10 px-3 py-1.5 rounded-lg hover:bg-[#024396]/10 dark:hover:bg-white/15">
                  <Download size={12} /> Download
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
