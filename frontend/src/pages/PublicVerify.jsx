import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, ClipboardList, NotebookPen, Award, Mail } from "lucide-react";
import { openCashfreeCheckout } from "../lib/cashfree";
import SEO from "../components/SEO";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.webp";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.webp";
const PARTNER_LOGO_URL = "/assets/logos/TFD-PARTNERHUB-LOGO.png";
const WORKSPACE_LOGO_URL = "/assets/logos/TFD-WORKSPACE-LOGO.png";

const TYPE_LABELS = {
  internship: "Internship Certificate",
  internship_program: "TFD Internship Program Certificate",
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
      // Certificate numbers print with slashes (e.g. TFD/INTP/2026/123456), but
      // a literal "/" in a URL path segment breaks routing (it gets treated as
      // an extra path separator) — the QR code already encodes it with dashes
      // instead (see certificate_routes.py's _verify_url), so manual entry
      // needs the same conversion or a copy-pasted certificate number silently
      // fails to verify even though it's perfectly valid.
      const path = type === "employee"
        ? `/api/verify/${encodeURIComponent(code.trim())}`
        : `/api/verify/certificate/${encodeURIComponent(code.trim().replace(/\//g, "-"))}`;
      const res = await fetch(`${API_BASE}${path}`);
      if (res.ok) setResult({ ok: true, data: await res.json() });
      else setResult({ ok: false });
    } catch {
      setResult({ ok: false });
    }
    setLoading(false);
  }, []);

  const regenOrderId = searchParams.get("regen_order_id");

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
      <SEO
        title="The Financial Doctor | Verify Certificate / Employee ID"
        description="Verify authenticity of TFD certificates, internship letters, and employee IDs."
        keywords="verify certificate, verify employee ID, TFD certificate verification"
        path="/verify"
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={LOGO_URL} alt="The Financial Doctor" width={900} height={235} className="h-16 w-auto mx-auto rounded-xl object-contain mb-3" />
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

          {tab === "certificate" && (
            <div className="px-5 pb-5">
              {regenOrderId ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2">
                  <Mail size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800">Payment received! Your certificate and internship letter are being emailed to your registered email address now.</p>
                </div>
              ) : (
                <InternshipRegenerateWidget />
              )}
            </div>
          )}

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
          <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-7 w-auto object-contain opacity-80" />
          <img src={PARTNER_LOGO_URL} alt="TFD Partner Hub" className="h-7 object-contain opacity-80" />
          <img src={WORKSPACE_LOGO_URL} alt="TFD Workspace" className="h-7 object-contain opacity-80" />
        </div>
        <p className="text-center text-[10px] text-[#9AA5B4] mt-2.5">Powered by The Financial Doctor</p>

        {tab === "employee" && (
          <p className="text-center text-[10px] text-[#9AA5B4] mt-3">
            AMFI Registered · ARN-290298 · <a href="https://www.thefinancialdoctor.in" className="text-[#024396]">thefinancialdoctor.in</a>
          </p>
        )}
        {tab === "certificate" && (
          <p className="text-center text-[10px] text-[#9AA5B4] mt-3">
            <a href="https://www.thefinancialdoctor.in" className="text-[#024396]">thefinancialdoctor.in</a>
          </p>
        )}
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
  const isInternshipProgram = data.type === "internship_program";
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
        {(data.track_label || data.department) && <div className="flex justify-between"><span className="text-[#5C677D]">{isInternshipProgram ? "Track" : "Department"}</span><span className="font-semibold text-[#0E1B2C]">{data.track_label || data.department}</span></div>}
        {data.college && <div className="flex justify-between"><span className="text-[#5C677D]">College</span><span className="font-semibold text-[#0E1B2C]">{data.college}</span></div>}
        {data.college_id_number && <div className="flex justify-between"><span className="text-[#5C677D]">College ID</span><span className="font-semibold text-[#0E1B2C]">{data.college_id_number}</span></div>}
        {data.father_name && <div className="flex justify-between"><span className="text-[#5C677D]">Father's Name</span><span className="font-semibold text-[#0E1B2C]">{data.father_name}</span></div>}
        {data.start_date && data.end_date ? (
          <div className="flex justify-between"><span className="text-[#5C677D]">Duration</span><span className="font-semibold text-[#0E1B2C]">{data.start_date} to {data.end_date}</span></div>
        ) : data.duration_label && (
          <div className="flex justify-between"><span className="text-[#5C677D]">Duration</span><span className="font-semibold text-[#0E1B2C]">{data.duration_label}</span></div>
        )}
        {data.contact_email_masked && <div className="flex justify-between"><span className="text-[#5C677D]">Email</span><span className="font-semibold text-[#0E1B2C]">{data.contact_email_masked}</span></div>}
        {data.contact_phone_masked && <div className="flex justify-between"><span className="text-[#5C677D]">Phone</span><span className="font-semibold text-[#0E1B2C]">{data.contact_phone_masked}</span></div>}
        <div className="flex justify-between"><span className="text-[#5C677D]">Issued on</span><span className="font-semibold text-[#0E1B2C]">{data.issue_date}</span></div>
      </div>

      {isInternshipProgram && typeof data.percentage === "number" && (
        <div className="mt-3 bg-[#0E1B2C] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/70"><Award size={13} className="text-[#14E0A0]" /> Program Score</span>
            <span className="text-sm font-bold text-[#14E0A0]">{data.percentage}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] rounded-full" style={{ width: `${Math.min(100, data.percentage)}%` }} />
          </div>
          <p className="text-[10px] text-white/40 mt-1.5">{data.earned_points} / {data.total_points} points earned across the full program</p>
        </div>
      )}

      {isInternshipProgram && (data.completed_tasks?.length > 0 || data.daily_report?.length > 0) && (
        <InternshipPortfolio tasks={data.completed_tasks || []} report={data.daily_report || []} />
      )}

      <RegenerateSection certificateNumber={data.certificate_number} />
    </div>
  );
}

function InternshipPortfolio({ tasks, report }) {
  const [expanded, setExpanded] = useState(null); // null | "tasks" | "report"

  return (
    <div className="mt-3 space-y-2">
      {tasks.length > 0 && (
        <div className="border border-[#E2D8C2] rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === "tasks" ? null : "tasks")}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-[#F5F1EB] transition-colors"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0E1B2C]"><ClipboardList size={13} className="text-[#024396]" /> Completed Tasks ({tasks.length})</span>
            {expanded === "tasks" ? <ChevronUp size={14} className="text-[#5C677D]" /> : <ChevronDown size={14} className="text-[#5C677D]" />}
          </button>
          {expanded === "tasks" && (
            <div className="max-h-72 overflow-y-auto divide-y divide-[#E2D8C2] bg-[#FBF9F5]">
              {tasks.map((t, i) => (
                <div key={i} className="px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-[#0E1B2C]">{t.task_title}</p>
                    <span className="text-[10px] font-bold text-[#024396] shrink-0">+{t.points_awarded} pts</span>
                  </div>
                  <p className="text-[10px] text-[#5C677D]">Week {t.week_number}{t.had_photo ? " · Field task with photo" : ""}</p>
                  {t.submitted_answer && <p className="text-[11px] text-[#2A364B]/80 mt-1 leading-relaxed line-clamp-3">{t.submitted_answer}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {report.length > 0 && (
        <div className="border border-[#E2D8C2] rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === "report" ? null : "report")}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-[#F5F1EB] transition-colors"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0E1B2C]"><NotebookPen size={13} className="text-[#024396]" /> Daily Report ({report.length} entries)</span>
            {expanded === "report" ? <ChevronUp size={14} className="text-[#5C677D]" /> : <ChevronDown size={14} className="text-[#5C677D]" />}
          </button>
          {expanded === "report" && (
            <div className="max-h-72 overflow-y-auto divide-y divide-[#E2D8C2] bg-[#FBF9F5]">
              {report.map((r) => (
                <div key={r.date} className="px-3.5 py-2.5">
                  <p className="text-[10px] font-bold text-[#024396] mb-1">{r.date}</p>
                  {r.what_learned && <p className="text-[11px] text-[#2A364B]/80 leading-relaxed"><b className="text-[#5C677D]">Learned:</b> {r.what_learned}</p>}
                  {r.what_did && <p className="text-[11px] text-[#2A364B]/80 leading-relaxed mt-0.5"><b className="text-[#5C677D]">Did:</b> {r.what_did}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RegenerateSection({ certificateNumber }) {
  const [expanded, setExpanded] = useState(false);
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify/certificate/${encodeURIComponent(certificateNumber.replace(/\//g, "-"))}/request-regeneration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      setResultMessage(res.ok ? data.message : (data.detail || "Something went wrong. Please try again."));
    } catch {
      setResultMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (resultMessage) {
    return (
      <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800">
        {resultMessage}
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-dashed border-[#E2D8C2] pt-3.5">
      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[#5C677D] hover:text-[#024396] transition-colors">
          <RefreshCw size={12} /> Lost your certificate or completion letter? Regenerate it
        </button>
      ) : (
        <div className="bg-[#F5F1EB] rounded-xl p-3.5 space-y-2.5">
          <p className="text-xs text-[#2A364B]">
            We'll regenerate and email you a fresh copy of both your <b>Certificate</b> and <b>Completion Letter</b> for a nominal reissue fee of <b>₹499</b>.
          </p>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Best number/email to reach you (optional)"
            className="w-full px-3 py-2 rounded-lg border border-[#E2D8C2] text-xs focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white"
          />
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#024396] text-white text-xs font-semibold hover:bg-[#023580] transition-colors disabled:opacity-50"
          >
            {submitting ? "Sending request..." : "Request Regeneration — ₹499"}
          </button>
          <p className="text-[10px] text-[#5C677D] text-center">Our team will reach out to arrange payment before sending your documents.</p>
        </div>
      )}
    </div>
  );
}

// Instant, self-service regeneration for TFD Internship (gamified program)
// certificates specifically — search by certificate number, or by at least
// 2 of your own KYC details, then pay ₹499 via Cashfree and both the
// certificate and internship letter are emailed automatically on success.
function InternshipRegenerateWidget() {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState("cert"); // "cert" | "details"
  const [certNumber, setCertNumber] = useState("");
  const [details, setDetails] = useState({ college_id_number: "", email: "", phone: "", aadhar_number: "" });
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(null); // {certificate_number, name, masked_email} | null
  const [paying, setPaying] = useState(false);

  const detailsFilledCount = Object.values(details).filter((v) => v.trim()).length;

  const buildSearchBody = () =>
    mode === "cert" ? { certificate_number: certNumber.trim() } : { ...details };

  const search = async () => {
    if (mode === "cert" && !certNumber.trim()) {
      toast.error("Please enter your certificate number.");
      return;
    }
    if (mode === "details" && detailsFilledCount < 2) {
      toast.error("Please fill in at least 2 details to search.");
      return;
    }
    setSearching(true);
    setFound(null);
    try {
      const res = await fetch(`${API_BASE}/api/internship/certificate/regenerate/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSearchBody()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.found) {
        toast.error("No matching certificate found — please double-check your details.");
        return;
      }
      setFound(data);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setSearching(false);
  };

  const payAndRegenerate = async () => {
    setPaying(true);
    try {
      const res = await fetch(`${API_BASE}/api/internship/certificate/regenerate/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSearchBody()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not start payment");
      await openCashfreeCheckout(data.payment_session_id, data.cashfree_env);
    } catch (err) {
      toast.error(err.message || "Could not start payment");
      setPaying(false);
    }
  };

  const smallField = "w-full px-3 py-2 rounded-lg border border-[#E2D8C2] text-xs focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white";

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[#5C677D] hover:text-[#024396] transition-colors py-1">
        <RefreshCw size={12} /> Lost your TFD Internship Certificate? Regenerate it — ₹499
      </button>
    );
  }

  return (
    <div className="bg-[#F5F1EB] rounded-xl p-3.5 space-y-3">
      <p className="text-xs font-semibold text-[#0E1B2C]">Find Your Certificate to Regenerate</p>

      <div className="flex gap-1.5">
        <button onClick={() => { setMode("cert"); setFound(null); }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold ${mode === "cert" ? "bg-[#024396] text-white" : "bg-white text-[#5C677D] border border-[#E2D8C2]"}`}>
          By Certificate No.
        </button>
        <button onClick={() => { setMode("details"); setFound(null); }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold ${mode === "details" ? "bg-[#024396] text-white" : "bg-white text-[#5C677D] border border-[#E2D8C2]"}`}>
          By My Details
        </button>
      </div>

      {mode === "cert" ? (
        <input value={certNumber} onChange={(e) => setCertNumber(e.target.value)} placeholder="e.g. TFD/INTP/2026/123456" className={smallField} />
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-[#5C677D]">Fill in at least 2 to search (helps us confirm it's really you):</p>
          <input value={details.college_id_number} onChange={(e) => setDetails({ ...details, college_id_number: e.target.value })} placeholder="College ID Number" className={smallField} />
          <input value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} placeholder="Email" className={smallField} />
          <input value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} placeholder="Mobile Number" className={smallField} />
          <input value={details.aadhar_number} onChange={(e) => setDetails({ ...details, aadhar_number: e.target.value })} placeholder="Aadhaar Number" className={smallField} />
        </div>
      )}

      {!found ? (
        <button onClick={search} disabled={searching} className="w-full py-2.5 rounded-lg bg-[#024396] text-white text-xs font-semibold hover:bg-[#023580] transition-colors disabled:opacity-50">
          {searching ? "Searching..." : "Search My Certificate"}
        </button>
      ) : (
        <div className="bg-white rounded-lg p-3 space-y-2 border border-emerald-200">
          <p className="text-xs text-emerald-800 flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600 shrink-0" /> Found: <b>{found.name}</b></p>
          <p className="text-[11px] text-[#5C677D] font-mono">{found.certificate_number}</p>
          <p className="text-[10px] text-[#5C677D]">Your certificate + internship letter will be emailed to <b>{found.masked_email}</b>.</p>
          <button onClick={payAndRegenerate} disabled={paying} className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50">
            {paying ? "Starting payment..." : "Pay ₹499 & Email My Documents"}
          </button>
        </div>
      )}
    </div>
  );
}
