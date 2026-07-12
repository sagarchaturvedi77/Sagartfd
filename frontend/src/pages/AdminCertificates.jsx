import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { Download, Mail, Award, Send, Check, X, Share2, Copy, History } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const DEPARTMENTS = ["HR", "Sales", "Marketing", "Accounts"];

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

export default function AdminCertificates() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [tab, setTab] = useState("interns");
  const [interns, setInterns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const emptyApproveForm = {
    manager_name: "", manager_designation: "", stipend: "", stipend_type: "unpaid",
    department: "Sales", start_date: "", end_date: "", contact_email: "", contact_phone: "",
  };
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveForm, setApproveForm] = useState(emptyApproveForm);
  const [approving, setApproving] = useState(false);

  const [generatingBoth, setGeneratingBoth] = useState(null); // intern id currently generating cert+completion letter

  const [emailTarget, setEmailTarget] = useState(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const [emailInternTarget, setEmailInternTarget] = useState(null);
  const [emailInternAddress, setEmailInternAddress] = useState("");
  const [emailInternCc, setEmailInternCc] = useState("");
  const [emailInternDocs, setEmailInternDocs] = useState([]);
  const [sendingInternEmail, setSendingInternEmail] = useState(false);

  const parseCc = (raw) => raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10);

  const [templateEdit, setTemplateEdit] = useState(null); // { intern, kind: "offer_letter"|"completion_letter"|"certificate" }
  const [templateText, setTemplateText] = useState("");
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  const [personDetail, setPersonDetail] = useState(null); // { type: "intern"|"certificate", intern, cert }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [i, a, c, e] = await Promise.all([
        fetch(`${API_BASE}/api/interns`, { headers }),
        fetch(`${API_BASE}/api/interns/applications`, { headers }),
        fetch(`${API_BASE}/api/certificates`, { headers }),
        fetch(`${API_BASE}/api/auth/employees`, { headers }),
      ]);
      if (i.ok) setInterns(await i.json());
      if (a.ok) setApplications(await a.json());
      if (c.ok) setCertificates(await c.json());
      if (e.ok) setEmployees(await e.json());
    } catch { /* silent */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  const generateCertAndCompletionLetter = async (intern) => {
    if (generatingBoth) return;
    setGeneratingBoth(intern.id);
    try {
      await fetch(`${API_BASE}/api/interns/${intern.id}/completion-letter`, { method: "POST", headers, body: JSON.stringify({}) });
      await load();
    } finally {
      setGeneratingBoth(null);
    }
  };

  const applicationLink = `${window.location.origin}/intern-application`;
  const applicationShareText = `You're invited to apply for an internship at The Financial Doctor! 🎓\n\nFill out the quick application form here:\n${applicationLink}\n\nMake sure to enter accurate details — they'll be used on your official certificate.`;

  const copyApplicationLink = async () => {
    try {
      await navigator.clipboard.writeText(applicationShareText);
      alert("Copied! (message + link, ready to paste)");
    } catch {
      window.prompt("Copy this message:", applicationShareText);
    }
  };

  const shareApplicationLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "TFD Internship Application", text: applicationShareText, url: applicationLink });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    copyApplicationLink();
  };

  const openApprove = (application) => {
    setApproveTarget(application);
    setApproveForm({
      manager_name: "", manager_designation: "", stipend: "", stipend_type: "unpaid",
      department: application.department || "Sales",
      start_date: application.start_date || "", end_date: application.end_date || "",
      contact_email: application.contact_email || "", contact_phone: application.contact_phone || "",
    });
  };

  const submitApproval = async (e) => {
    e.preventDefault();
    if (!approveTarget || approving) return;
    setApproving(true);
    try {
      const res = await fetch(`${API_BASE}/api/interns/${approveTarget.id}/approve`, {
        method: "POST", headers,
        body: JSON.stringify({
          ...approveForm,
          stipend: approveForm.stipend_type === "fixed" && approveForm.stipend ? Number(approveForm.stipend) : null,
          manager_designation: approveForm.manager_designation || null,
        }),
      });
      if (res.ok) {
        setApproveTarget(null);
        setApproveForm(emptyApproveForm);
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to approve");
      }
    } finally {
      setApproving(false);
    }
  };

  const rejectIntern = async (intern) => {
    if (!window.confirm(`Reject ${intern.name}'s application? This cannot be undone.`)) return;
    const res = await fetch(`${API_BASE}/api/interns/${intern.id}/reject`, { method: "DELETE", headers });
    if (res.ok) load();
  };

  const openInternDetail = (intern) => {
    const linkedCert = intern.certificate_id ? certificates.find((c) => c.id === intern.certificate_id) : null;
    setPersonDetail({ type: "intern", intern, cert: linkedCert });
  };

  const openCertificateDetail = (cert) => {
    const linkedIntern = cert.intern_id ? interns.find((i) => i.id === cert.intern_id) : null;
    setPersonDetail({ type: "certificate", intern: linkedIntern, cert });
  };

  const openTemplateEdit = async (intern, kind) => {
    const endpoint = kind === "certificate" ? "certificate/text" : kind === "offer_letter" ? "offer-letter/text" : "completion-letter/text";
    const res = await fetch(`${API_BASE}/api/interns/${intern.id}/${endpoint}`, { headers });
    if (res.ok) {
      const data = await res.json();
      setTemplateText(kind === "certificate" ? data.detail : data.body);
      setTemplateEdit({ intern, kind });
    }
  };

  const confirmGenerateTemplate = async () => {
    if (!templateEdit) return;
    const { intern, kind } = templateEdit;
    setGeneratingTemplate(true);
    try {
      if (kind === "certificate") {
        const res = await fetch(`${API_BASE}/api/interns/${intern.id}/certificate`, {
          method: "POST", headers, body: JSON.stringify({ custom_detail: templateText }),
        });
        if (res.ok) { setTemplateEdit(null); load(); alert("Certificate generated!"); }
        else { const err = await res.json().catch(() => ({})); alert(err.detail || "Failed"); }
      } else {
        const endpoint = kind === "offer_letter" ? "offer-letter" : "completion-letter";
        const res = await fetch(`${API_BASE}/api/interns/${intern.id}/${endpoint}`, {
          method: "POST", headers, body: JSON.stringify({ custom_body: templateText }),
        });
        if (res.ok) {
          await downloadBlob(res, `${kind === "offer_letter" ? "Offer_Letter" : "Completion_Letter"}_${intern.name.replace(/\s+/g, "_")}.pdf`);
          setTemplateEdit(null);
          load();
        }
      }
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const sendEmail = async () => {
    if (!emailAddress.trim() || sendingEmail) return;
    if (!window.confirm(`Send certificate email to ${emailAddress.trim()}?`)) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`${API_BASE}/api/certificates/${emailTarget.id}/email`, {
        method: "POST", headers, body: JSON.stringify({ to_email: emailAddress.trim(), cc_emails: parseCc(emailCc) }),
      });
      if (res.ok) { alert("Emailed!"); setEmailTarget(null); setEmailAddress(""); setEmailCc(""); } else { const err = await res.json().catch(() => ({})); alert(err.detail || "Failed to send"); }
    } finally {
      setSendingEmail(false);
    }
  };

  const toggleInternDoc = (doc) => {
    setEmailInternDocs((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));
  };

  const sendInternEmail = async () => {
    if (!emailInternAddress.trim() || emailInternDocs.length === 0 || sendingInternEmail) return;
    if (!window.confirm(`Send ${emailInternDocs.length === 1 ? "this document" : "these documents"} to ${emailInternAddress.trim()}?`)) return;
    setSendingInternEmail(true);
    try {
      const res = await fetch(`${API_BASE}/api/interns/${emailInternTarget.id}/email`, {
        method: "POST", headers,
        body: JSON.stringify({ to_email: emailInternAddress.trim(), documents: emailInternDocs, cc_emails: parseCc(emailInternCc) }),
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Sent: ${result.documents.join(", ")}`);
        setEmailInternTarget(null); setEmailInternAddress(""); setEmailInternCc(""); setEmailInternDocs([]);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to send");
      }
    } finally {
      setSendingInternEmail(false);
    }
  };

  const filteredInterns = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return interns;
    const certNumbersByIntern = {};
    certificates.forEach((c) => { if (c.intern_id) certNumbersByIntern[c.intern_id] = (certNumbersByIntern[c.intern_id] || []).concat(c.certificate_number || ""); });
    return interns.filter((i) => {
      const haystacks = [
        i.name, i.college, i.aadhar_number, i.pan_number,
        ...(certNumbersByIntern[i.id] || []),
      ];
      return haystacks.some((v) => v && String(v).toLowerCase().includes(q));
    });
  })();

  const pendingApplicationsCount = applications.filter((a) => a.status === "pending").length;

  return (
    <PortalLayout>
      <PageHeader icon="🎓" title="Certificates &amp; Letters" subtitle="Offer letters, completion letters, and verifiable certificates" />

      <div className="space-y-4">
        <div className="flex gap-1 border-b border-[#E2D8C2] dark:border-white/10">
          <button
            onClick={() => setTab("interns")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "interns" ? "border-[#024396] text-[#024396] dark:text-[#7CB0FF] dark:border-[#7CB0FF]" : "border-transparent text-[#2A364B]/50 dark:text-[#8E99AC]"}`}
          >
            Interns
          </button>
          <button
            onClick={() => setTab("applications")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === "applications" ? "border-[#024396] text-[#024396] dark:text-[#7CB0FF] dark:border-[#7CB0FF]" : "border-transparent text-[#2A364B]/50 dark:text-[#8E99AC]"}`}
          >
            Applications
            {pendingApplicationsCount > 0 && (
              <span className="text-[10px] font-bold bg-[#024396]/10 dark:bg-white/10 text-[#024396] dark:text-[#7CB0FF] rounded-full px-1.5 py-0.5">{pendingApplicationsCount}</span>
            )}
          </button>
        </div>

        {tab === "interns" && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center justify-end">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, college, Aadhaar No., PAN No., or certificate No."
                className={`${field} max-w-sm`}
              />
            </div>
            <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">Looking for Employee Certificates or Achievements? Those moved to <a href="/portal/admin/employees" className="text-[#024396] dark:text-[#7CB0FF] underline">Total Employees</a>.</p>

            {loading ? <div className="py-10 text-center"><div className="w-6 h-6 border-2 border-[#024396] border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
              <div className="space-y-3">
                {filteredInterns.map((intern) => (
                  <div key={intern.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <button onClick={() => openInternDetail(intern)} className="text-left">
                        <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3] hover:underline">{intern.name}</p>
                        <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{intern.department} · {intern.start_date} to {intern.end_date}{intern.college && ` · ${intern.college}`}</p>
                      </button>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => openTemplateEdit(intern, "offer_letter")}><Download size={12} className="mr-1" /> Offer Letter</Button>
                        {intern.certificate_id ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-3 py-1.5">Certificate + Completion Letter issued ✓</span>
                        ) : (
                          <Button size="sm" disabled={generatingBoth === intern.id} onClick={() => generateCertAndCompletionLetter(intern)} className="bg-[#024396] hover:bg-[#023580]">
                            <Award size={12} className="mr-1" /> {generatingBoth === intern.id ? "Generating..." : "Certificate + Completion Letter"}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setEmailInternTarget(intern); setEmailInternAddress(intern.contact_email || ""); setEmailInternDocs([]); }}>
                          <Send size={12} className="mr-1" /> Email Documents
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredInterns.length === 0 && <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-8">{searchQuery ? "No matches found." : "No interns added yet."}</p>}
              </div>
            )}
          </div>
        )}

        {tab === "applications" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2A364B]/50 dark:text-[#8E99AC] mb-2">Internship Application Form</p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{pendingApplicationsCount} pending application{pendingApplicationsCount === 1 ? "" : "s"}</h3>
                <div className="flex gap-2">
                  <Button onClick={shareApplicationLink} className="bg-[#024396] hover:bg-[#023580]"><Share2 size={14} className="mr-1.5" /> Share</Button>
                  <Button onClick={copyApplicationLink} variant="outline"><Copy size={14} className="mr-1.5" /> Copy</Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {applications.map((a) => (
                <div key={a.id} className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3] flex items-center gap-2">
                      {a.name}
                      {a.status === "pending" ? (
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">Pending</span>
                      ) : (
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">Approved</span>
                      )}
                      {a.submission_count > 1 && (
                        <span title={(a.submission_history || []).map((t) => new Date(t).toLocaleString("en-IN")).join("\n")} className="text-[9px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-help">
                          <History size={9} /> Submitted {a.submission_count}×
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{a.department} · {a.start_date} to {a.end_date}{a.college && ` · ${a.college}`} · {a.contact_phone}</p>
                    {a.submission_count > 1 && (
                      <p className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/60 mt-0.5">
                        Submissions: {(a.submission_history || []).map((t) => new Date(t).toLocaleDateString("en-IN")).join(", ")}
                      </p>
                    )}
                  </div>
                  {a.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => openApprove(a)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Check size={12} className="mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectIntern(a)} className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                        <X size={12} className="mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {applications.length === 0 && <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-8">No applications received yet.</p>}
            </div>
          </div>
        )}
      </div>

      <PortalModal open={!!approveTarget} onOpenChange={(v) => !v && setApproveTarget(null)} title="Review & Approve Application" maxWidth="max-w-lg">
        {approveTarget && (
          <form onSubmit={submitApproval} className="space-y-3">
            <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2">
              Applied via link on {new Date(approveTarget.created_at).toLocaleDateString("en-IN")}.
            </p>

            <div className="bg-[#F5F1EB] dark:bg-white/5 rounded-xl border border-[#E2D8C2] dark:border-white/10 p-3 space-y-3">
              <p className="text-xs font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] uppercase tracking-wide">
                Declared by applicant &middot; not editable
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <DetailRow label="Name" value={approveTarget.name} />
                <DetailRow label="Applicant Type" value={approveTarget.is_student ? "Student" : "Not a student"} />
                {approveTarget.is_student && <DetailRow label="College" value={approveTarget.college || "—"} />}
                {approveTarget.is_student && <DetailRow label="Subject / Course" value={approveTarget.subject || "—"} />}
                <DetailRow label="Father's Name" value={approveTarget.father_name || "—"} />
                <DetailRow label="Aadhaar No." value={approveTarget.aadhar_number || "—"} />
                <DetailRow label="PAN No." value={approveTarget.pan_number || "—"} />
                <DetailRow label="City" value={approveTarget.city || "—"} />
                <DetailRow label="State" value={approveTarget.state || "—"} />
                <DetailRow label="Pincode" value={approveTarget.pincode || "—"} />
              </div>
              <DetailRow label="Address" value={approveTarget.address || "—"} />
            </div>

            <select value={approveForm.department} onChange={(e) => setApproveForm({ ...approveForm, department: e.target.value })} className={field}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">Start Date</label><input type="date" value={approveForm.start_date} onChange={(e) => setApproveForm({ ...approveForm, start_date: e.target.value })} className={field} /></div>
              <div><label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">End Date</label><input type="date" value={approveForm.end_date} onChange={(e) => setApproveForm({ ...approveForm, end_date: e.target.value })} className={field} /></div>
            </div>
            <p className="text-[11px] text-[#2A364B]/40 dark:text-[#8E99AC]/60 -mt-1">You can set any date here, including backdating — unlike the public application form.</p>

            <div className="grid grid-cols-2 gap-3">
              <input type="email" placeholder="Email" value={approveForm.contact_email} onChange={(e) => setApproveForm({ ...approveForm, contact_email: e.target.value })} className={field} />
              <input placeholder="Contact No." value={approveForm.contact_phone} onChange={(e) => setApproveForm({ ...approveForm, contact_phone: e.target.value })} className={field} />
            </div>

            <div className="border-t border-[#E2D8C2] dark:border-white/10 pt-3 space-y-2">
              <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] block">Monthly Stipend</label>
              <div className="flex gap-2">
                <select value={approveForm.stipend_type} onChange={(e) => setApproveForm({ ...approveForm, stipend_type: e.target.value })} className={field}>
                  <option value="unpaid">Unpaid</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="performance_based">Performance based</option>
                </select>
                {approveForm.stipend_type === "fixed" && (
                  <input type="number" placeholder="₹ / month (optional)" value={approveForm.stipend} onChange={(e) => setApproveForm({ ...approveForm, stipend: e.target.value })} className={field} />
                )}
              </div>
            </div>

            <input required placeholder="Reporting Manager Name *" value={approveForm.manager_name} onChange={(e) => setApproveForm({ ...approveForm, manager_name: e.target.value })} className={field} />
            <input placeholder="Manager Designation (optional)" value={approveForm.manager_designation} onChange={(e) => setApproveForm({ ...approveForm, manager_designation: e.target.value })} className={field} />
            <Button type="submit" disabled={approving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">{approving ? "Approving..." : "Approve"}</Button>
          </form>
        )}
      </PortalModal>


      <PortalModal open={!!emailTarget} onOpenChange={(v) => { if (!v) { setEmailTarget(null); setEmailCc(""); } }} title="Email Certificate" maxWidth="max-w-sm">
        <div className="space-y-3">
          <input type="email" placeholder="recipient@email.com" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className={field} />
          <div>
            <input placeholder="CC (comma-separated, optional)" value={emailCc} onChange={(e) => setEmailCc(e.target.value)} className={field} />
            <p className="text-[11px] text-[#2A364B]/40 dark:text-[#8E99AC]/60 mt-1">Up to 10 addresses, separated by commas</p>
          </div>
          <Button onClick={sendEmail} disabled={sendingEmail || !emailAddress.trim()} className="w-full bg-[#024396] hover:bg-[#023580]">{sendingEmail ? "Sending..." : "Send"}</Button>
        </div>
      </PortalModal>

      <PortalModal open={!!emailInternTarget} onOpenChange={(v) => { if (!v) { setEmailInternTarget(null); setEmailInternAddress(""); setEmailInternCc(""); setEmailInternDocs([]); } }} title="Email Documents" maxWidth="max-w-sm">
        {emailInternTarget && (
          <div className="space-y-3">
            <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2">{emailInternTarget.name}</p>
            <input type="email" placeholder="recipient@email.com" value={emailInternAddress} onChange={(e) => setEmailInternAddress(e.target.value)} className={field} />
            <div>
              <input placeholder="CC (comma-separated, optional)" value={emailInternCc} onChange={(e) => setEmailInternCc(e.target.value)} className={field} />
              <p className="text-[11px] text-[#2A364B]/40 dark:text-[#8E99AC]/60 mt-1">Up to 10 addresses, separated by commas</p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-[#0E1B2C] dark:text-[#F1EDE3] cursor-pointer">
                <input type="checkbox" checked={emailInternDocs.includes("offer_letter")} onChange={() => toggleInternDoc("offer_letter")} className="rounded" />
                Offer Letter
              </label>
              <label className="flex items-center gap-2 text-sm text-[#0E1B2C] dark:text-[#F1EDE3] cursor-pointer">
                <input type="checkbox" checked={emailInternDocs.includes("completion_letter")} onChange={() => toggleInternDoc("completion_letter")} className="rounded" />
                Completion Letter
              </label>
              <label className={`flex items-center gap-2 text-sm ${emailInternTarget.certificate_id ? "text-[#0E1B2C] dark:text-[#F1EDE3] cursor-pointer" : "text-[#2A364B]/30 dark:text-[#8E99AC]/40 cursor-not-allowed"}`}>
                <input type="checkbox" disabled={!emailInternTarget.certificate_id} checked={emailInternDocs.includes("certificate")} onChange={() => toggleInternDoc("certificate")} className="rounded" />
                Certificate {!emailInternTarget.certificate_id && "(not generated yet)"}
              </label>
              {emailInternDocs.includes("certificate") && (
                <p className="text-[11px] text-[#024396] dark:text-[#7CB0FF] pl-6">Completion Letter will be bundled in automatically.</p>
              )}
            </div>

            <Button onClick={sendInternEmail} disabled={sendingInternEmail || !emailInternAddress.trim() || emailInternDocs.length === 0} className="w-full bg-[#024396] hover:bg-[#023580]">
              {sendingInternEmail ? "Sending..." : "Send"}
            </Button>
          </div>
        )}
      </PortalModal>

      <PortalModal
        open={!!templateEdit}
        onOpenChange={(v) => { if (!v) { setTemplateEdit(null); setTemplateText(""); } }}
        title={templateEdit?.kind === "certificate" ? "Edit Certificate Text" : templateEdit?.kind === "offer_letter" ? "Edit Offer Letter" : "Edit Completion Letter"}
        maxWidth="max-w-lg"
      >
        {templateEdit && (
          <div className="space-y-3">
            <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2">
              {templateEdit.intern.name} — review and edit the text below before generating the final PDF.
            </p>
            <textarea
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              rows={templateEdit.kind === "certificate" ? 3 : 10}
              className={`${field} resize-y font-mono text-xs leading-relaxed`}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setTemplateEdit(null); setTemplateText(""); }}>Cancel</Button>
              <Button onClick={confirmGenerateTemplate} disabled={generatingTemplate || !templateText.trim()} className="flex-1 bg-[#024396] hover:bg-[#023580]">
                {generatingTemplate ? "Generating..." : templateEdit.kind === "certificate" ? "Generate Certificate" : "Generate PDF"}
              </Button>
            </div>
          </div>
        )}
      </PortalModal>

      <PortalModal open={!!personDetail} onOpenChange={(v) => !v && setPersonDetail(null)} title={personDetail?.intern?.name || personDetail?.cert?.person_name} maxWidth="max-w-lg">
        {personDetail && (
          <div className="space-y-4 text-sm">
            {personDetail.intern && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[#024396] dark:text-[#7CB0FF] mb-2">Intern Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#F5F1EB] dark:bg-white/5 rounded-xl p-3">
                  <DetailRow label="Name" value={personDetail.intern.name} />
                  <DetailRow label="Applicant Type" value={personDetail.intern.is_student ? "Student" : "Not a student"} />
                  <DetailRow label="College" value={personDetail.intern.college || "—"} />
                  <DetailRow label="Subject / Course" value={personDetail.intern.subject || "—"} />
                  <DetailRow label="Department" value={personDetail.intern.department} />
                  <DetailRow label="Duration" value={`${personDetail.intern.start_date} to ${personDetail.intern.end_date}`} />
                  <DetailRow label="Stipend" value={personDetail.intern.stipend ? `₹${personDetail.intern.stipend}/mo` : "Unpaid"} />
                  <DetailRow label="Reporting Manager" value={`${personDetail.intern.manager_name}, ${personDetail.intern.manager_designation}`} />
                  <DetailRow label="Email" value={personDetail.intern.contact_email || "—"} />
                  <DetailRow label="Contact No." value={personDetail.intern.contact_phone || "—"} />
                  <DetailRow label="Father's Name" value={personDetail.intern.father_name || "—"} />
                  <DetailRow label="Aadhaar No." value={personDetail.intern.aadhar_number || "—"} />
                  <DetailRow label="PAN No." value={personDetail.intern.pan_number || "—"} />
                  <DetailRow label="City" value={personDetail.intern.city || "—"} />
                  <DetailRow label="State" value={personDetail.intern.state || "—"} />
                  <DetailRow label="Pincode" value={personDetail.intern.pincode || "—"} />
                  <DetailRow label="Address" value={personDetail.intern.address || "—"} />
                  <DetailRow label="Offer Letter" value={personDetail.intern.offer_letter_generated_at ? `Generated ${new Date(personDetail.intern.offer_letter_generated_at).toLocaleDateString("en-IN")}` : "Not generated yet"} />
                  <DetailRow label="Completion Letter" value={personDetail.intern.completion_letter_generated_at ? `Generated ${new Date(personDetail.intern.completion_letter_generated_at).toLocaleDateString("en-IN")}` : "Not generated yet"} />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {personDetail.intern.offer_letter_generated_at && (
                    <button
                      onClick={async () => {
                        const res = await fetch(`${API_BASE}/api/interns/${personDetail.intern.id}/offer-letter/download`, { headers });
                        if (res.ok) await downloadBlob(res, `Offer_Letter_${personDetail.intern.name.replace(/\s+/g, "_")}.pdf`);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#024396] dark:text-[#7CB0FF]"
                    >
                      <Download size={12} /> Download Offer Letter
                    </button>
                  )}
                  {personDetail.intern.completion_letter_generated_at && (
                    <button
                      onClick={async () => {
                        const res = await fetch(`${API_BASE}/api/interns/${personDetail.intern.id}/completion-letter/download`, { headers });
                        if (res.ok) await downloadBlob(res, `Completion_Letter_${personDetail.intern.name.replace(/\s+/g, "_")}.pdf`);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#024396] dark:text-[#7CB0FF]"
                    >
                      <Download size={12} /> Download Completion Letter
                    </button>
                  )}
                </div>
              </div>
            )}

            {personDetail.cert && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[#024396] dark:text-[#7CB0FF] mb-2">Certificate Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#F5F1EB] dark:bg-white/5 rounded-xl p-3">
                  <DetailRow label="Certificate No." value={personDetail.cert.certificate_number} />
                  <DetailRow label="Type" value={personDetail.cert.type} />
                  <DetailRow label="Department" value={personDetail.cert.department} />
                  <DetailRow label="Duration" value={personDetail.cert.duration_label} />
                  <DetailRow label="Issued On" value={personDetail.cert.issue_date} />
                  <DetailRow label="Created By" value={personDetail.cert.created_by === user?.id ? "You" : personDetail.cert.created_by} />
                  <DetailRow label="Created At" value={new Date(personDetail.cert.created_at).toLocaleString("en-IN")} />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={async () => {
                      const res = await fetch(`${API_BASE}/api/certificates/${personDetail.cert.id}/download`, { headers });
                      if (res.ok) await downloadBlob(res, `Certificate_${personDetail.cert.certificate_number.replace(/\//g, "_")}.pdf`);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#024396] dark:text-[#7CB0FF]"
                  >
                    <Download size={12} /> Download Certificate PDF
                  </button>
                  <button
                    onClick={() => { setEmailTarget(personDetail.cert); setEmailAddress(personDetail.intern?.contact_email || ""); }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#024396] dark:text-[#7CB0FF]"
                  >
                    <Mail size={12} /> Email Certificate
                  </button>
                </div>
              </div>
            )}

            {personDetail.intern && !personDetail.cert && (
              <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">No certificate generated for this intern yet.</p>
            )}
          </div>
        )}
      </PortalModal>
    </PortalLayout>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC] uppercase tracking-wide">{label}</p>
      <p className="text-[#0E1B2C] dark:text-[#F1EDE3] font-medium">{value}</p>
    </div>
  );
}
