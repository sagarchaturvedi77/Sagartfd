import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.png";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";
const PARTNER_LOGO_URL = "/assets/logos/TFD-PARTNERHUB-LOGO.png";
const WORKSPACE_LOGO_URL = "/assets/logos/TFD-WORKSPACE-LOGO.png";

const TYPE_LABELS = {
  internship: "Internship Certificate",
  employee: "Employee Certificate",
  achievement: "Achievement",
  letterhead: "Official Letter",
};

export default function PublicVerify() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("employee");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null); // {ok: true, data} | {ok: false} | null
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (type, code) => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const path = type === "employee" ? `/api/verify/${encodeURIComponent(code.trim())}` : `/api/verify/certificate/${encodeURIComponent(code.trim())}`;
      const res = await fetch(`${API_BASE}${path}`);
      if (res.ok) setResult({ ok: true, data: await res.json() });
      else setResult({ ok: false });
    } catch {
      setResult({ ok: false });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const cert = searchParams.get("certificate");
    const emp = searchParams.get("employee");
    if (cert) { setTab("certificate"); setQuery(cert); runSearch("certificate", cert); }
    else if (emp) { setTab("employee"); setQuery(emp); runSearch("employee", emp); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(tab, query);
  };

  const switchTab = (t) => {
    setTab(t);
    setQuery("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={LOGO_URL} alt="The Financial Doctor" className="h-16 mx-auto rounded-xl object-contain mb-3" />
          <h1 className="text-lg font-serif font-semibold text-[#0E1B2C]">Public Verification</h1>
          <p className="text-xs text-[#5C677D] mt-1">Verify an employee's association or a certificate issued by The Financial Doctor</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#E2D8C2] overflow-hidden">
          <div className="flex border-b border-[#E2D8C2]">
            <button
              onClick={() => switchTab("employee")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === "employee" ? "text-[#024396] border-b-2 border-[#024396] bg-[#024396]/5" : "text-[#5C677D]"}`}
            >
              Verify Employee
            </button>
            <button
              onClick={() => switchTab("certificate")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === "certificate" ? "text-[#024396] border-b-2 border-[#024396] bg-[#024396]/5" : "text-[#5C677D]"}`}
            >
              Verify Certificate
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C677D]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "employee" ? "Enter Employee Code" : "Enter Certificate Number (e.g. TFD/INT/2026/0001)"}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2D8C2] text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white"
              />
            </div>
            <button type="submit" disabled={loading || !query.trim()} className="w-full py-3 rounded-xl bg-[#024396] text-white text-sm font-semibold hover:bg-[#023580] transition-colors disabled:opacity-50">
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>

          {result && (
            <div className="px-5 pb-5">
              {!result.ok ? (
                <div className="text-center py-6 border-t border-[#E2D8C2]">
                  <XCircle size={40} className="text-red-400 mx-auto mb-2" />
                  <p className="font-semibold text-red-700 text-sm">
                    {tab === "employee" ? "No record found" : "Certificate not found / Invalid"}
                  </p>
                  <p className="text-xs text-[#5C677D] mt-1">Please double-check the code and try again.</p>
                </div>
              ) : tab === "employee" ? (
                <EmployeeResult data={result.data} />
              ) : (
                <CertificateResult data={result.data} />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" className="h-7 object-contain opacity-80" />
          <img src={PARTNER_LOGO_URL} alt="TFD Partner Hub" className="h-7 object-contain opacity-80" />
          <img src={WORKSPACE_LOGO_URL} alt="TFD Workspace" className="h-7 object-contain opacity-80" />
        </div>
        <p className="text-center text-[10px] text-[#9AA5B4] mt-2.5">Powered by The Financial Doctor</p>

        <p className="text-center text-[10px] text-[#9AA5B4] mt-3">
          AMFI Registered · ARN-290298 · <a href="https://www.thefinancialdoctor.in" className="text-[#024396]">thefinancialdoctor.in</a>
        </p>
      </div>
    </div>
  );
}

function EmployeeResult({ data }) {
  return (
    <div className="border-t border-[#E2D8C2] pt-4">
      <div className="text-center mb-4">
        {data.active ? (
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="text-emerald-700 text-xs font-bold">Active Employee</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5">
            <XCircle size={14} className="text-orange-600" />
            <span className="text-orange-700 text-xs font-bold">Former Employee</span>
          </div>
        )}
      </div>

      <h3 className="text-center font-serif font-semibold text-lg text-[#0E1B2C]">{data.name}</h3>
      {data.designation && <p className="text-center text-xs text-[#5C677D] mb-3">{data.designation}</p>}

      {!data.active && data.message && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800 mb-3">
          {data.message}
        </div>
      )}

      <div className="bg-[#F5F1EB] rounded-xl p-3 text-xs space-y-1.5">
        {data.certificates_earned > 0 && (
          <div className="flex justify-between"><span className="text-[#5C677D]">Certificates earned</span><span className="font-semibold text-[#0E1B2C]">{data.certificates_earned}</span></div>
        )}
      </div>
    </div>
  );
}

function CertificateResult({ data }) {
  return (
    <div className="border-t border-[#E2D8C2] pt-4">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span className="text-emerald-700 text-xs font-bold uppercase tracking-wide">Valid Certificate</span>
        </div>
      </div>
      <h3 className="text-center font-serif font-semibold text-lg text-[#0E1B2C]">{data.person_name}</h3>
      <p className="text-center text-xs text-[#5C677D] mb-3 font-mono">{data.certificate_number}</p>
      <div className="bg-[#F5F1EB] rounded-xl p-3 text-xs space-y-1.5">
        <div className="flex justify-between"><span className="text-[#5C677D]">Type</span><span className="font-semibold text-[#0E1B2C]">{TYPE_LABELS[data.type] || data.type}</span></div>
        {data.department && <div className="flex justify-between"><span className="text-[#5C677D]">Department</span><span className="font-semibold text-[#0E1B2C]">{data.department}</span></div>}
        {data.duration_label && <div className="flex justify-between"><span className="text-[#5C677D]">Duration</span><span className="font-semibold text-[#0E1B2C]">{data.duration_label}</span></div>}
        <div className="flex justify-between"><span className="text-[#5C677D]">Issued on</span><span className="font-semibold text-[#0E1B2C]">{data.issue_date}</span></div>
      </div>
    </div>
  );
}
