import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { Download, Mail, Award, FileText, Send, Link2, Check, X } from "lucide-react";

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
  const [pendingInterns, setPendingInterns] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [approveTarget, setApproveTarget] = useState(null);
  const [approveForm, setApproveForm] = useState({ manager_name: "", manager_designation: "", stipend: "" });

  const [showAddIntern, setShowAddIntern] = useState(false);
  const [internForm, setInternForm] = useState({ name: "", college: "", department: "Sales", start_date: "", end_date: "", stipend: "", manager_name: "", manager_designation: "" });

  const [showEmpCert, setShowEmpCert] = useState(false);
  const [empCertForm, setEmpCertForm] = useState({ employee_id: "", department: "Sales", start_date: "", end_date: "" });

  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementForm, setAchievementForm] = useState({ employee_id: "", title: "", description: "" });

  const [emailTarget, setEmailTarget] = useState(null);
  const [emailAddress, setEmailAddress] = useState("");

  const [emailInternTarget, setEmailInternTarget] = useState(null);
  const [emailInternAddress, setEmailInternAddress] = useState("");
  const [emailInternDocs, setEmailInternDocs] = useState([]);
  const [sendingInternEmail, setSendingInternEmail] = useState(false);

  const [templateEdit, setTemplateEdit] = useState(null); // { intern, kind: "offer_letter"|"completion_letter"|"certificate" }
  const [templateText, setTemplateText] = useState("");
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  const [personDetail, setPersonDetail] = useState(null); // { type: "intern"|"certificate", intern, cert }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [i, p, c, e] = await Promise.all([
        fetch(`${API_BASE}/api/interns`, { headers }),
        fetch(`${API_BASE}/api/interns/pending`, { headers }),
        fetch(`${API_BASE}/api/certificates`, { headers }),
        fetch(`${API_BASE}/api/auth/employees`, { headers }),
      ]);
      if (i.ok) setInterns(await i.json());
      if (p.ok) setPendingInterns(await p.json());
      if (c.ok) setCertificates(await c.json());
      if (e.ok) setEmployees(await e.json());
    } catch { /* silent */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  const submitIntern = async (e) => {
    e.preventDefault();
    const payload = { ...internForm, stipend: internForm.stipend ? Number(internForm.stipend) : null };
    const res = await fetch(`${API_BASE}/api/interns`, { method: "POST", headers, body: JSON.stringify(payload) });
    if (res.ok) {
      setShowAddIntern(false);
      setInternForm({ name: "", college: "", department: "Sales", start_date: "", end_date: "", stipend: "", manager_name: "", manager_designation: "" });
      load();
    }
  };

  const copyApplicationLink = async () => {
    const link = `${window.location.origin}/intern-application`;
    try {
      await navigator.clipboard.writeText(link);
      alert(`Link copied!\n${link}`);
    } catch {
      window.prompt("Copy this link:", link);
    }
  };

  const submitApproval = async (e) => {
    e.preventDefault();
    if (!approveTarget) return;
    const res = await fetch(`${API_BASE}/api/interns/${approveTarget.id}/approve`, {
      method: "POST", headers,
      body: JSON.stringify({
        manager_name: approveForm.manager_name, manager_designation: approveForm.manager_designation,
        stipend: approveForm.stipend ? Number(approveForm.stipend) : null,
      }),
    });
    if (res.ok) {
      setApproveTarget(null);
      setApproveForm({ manager_name: "", manager_designation: "", stipend: "" });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || "Failed to approve");
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

  const submitEmpCert = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/certificates/employee`, {
      method: "POST", headers,
      body: JSON.stringify({ ...empCertForm, end_date: empCertForm.end_date || null }),
    });
    if (res.ok) { setShowEmpCert(false); setEmpCertForm({ employee_id: "", department: "Sales", start_date: "", end_date: "" }); load(); }
  };

  const submitAchievement = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/certificates/achievement`, { method: "POST", headers, body: JSON.stringify(achievementForm) });
    if (res.ok) { setShowAchievement(false); setAchievementForm({ employee_id: "", title: "", description: "" }); load(); }
  };

  const sendEmail = async () => {
    if (!emailAddress.trim()) return;
    const res = await fetch(`${API_BASE}/api/certificates/${emailTarget.id}/email`, {
      method: "POST", headers, body: JSON.stringify({ to_email: emailAddress.trim() }),
    });
    if (res.ok) { alert("Emailed!"); setEmailTarget(null); setEmailAddress(""); } else { const err = await res.json().catch(() => ({})); alert(err.detail || "Failed to send"); }
  };

  const toggleInternDoc = (doc) => {
    setEmailInternDocs((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));
  };

  const sendInternEmail = async () => {
    if (!emailInternAddress.trim() || emailInternDocs.length === 0) return;
    setSendingInternEmail(true);
    try {
      const res = await fetch(`${API_BASE}/api/interns/${emailInternTarget.id}/email`, {
        method: "POST", headers,
        body: JSON.stringify({ to_email: emailInternAddress.trim(), documents: emailInternDocs }),
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Sent: ${result.documents.join(", ")}`);
        setEmailInternTarget(null); setEmailInternAddress(""); setEmailInternDocs([]);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to send");
      }
    } finally {
      setSendingInternEmail(false);
    }
  };

  return (
    <PortalLayout>
      <PageHeader icon="🎓" title="Certificates &amp; Letters" subtitle="Offer letters, completion letters, and verifiable certificates" />

      <div className="flex gap-2 border-b border-[#E2D8C2] dark:border-white/10 mb-4">
        {[["interns", "Interns"], ["certificates", "All Certificates"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === key ? "border-[#024396] dark:border-[#4C8DFF] text-[#024396] dark:text-[#7CB0FF]" : "border-transparent text-[#2A364B]/50 dark:text-[#8E99AC]"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "interns" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowAddIntern(true)} className="bg-[#024396] hover:bg-[#023580]">+ Add Intern</Button>
            <Button onClick={copyApplicationLink} variant="outline"><Link2 size={14} className="mr-1.5" /> Generate Intern Form Link</Button>
            <Button onClick={() => setShowEmpCert(true)} variant="outline"><FileText size={14} className="mr-1.5" /> Employee Certificate</Button>
            <Button onClick={() => setShowAchievement(true)} variant="outline"><Award size={14} className="mr-1.5" /> Add Achievement</Button>
          </div>

          {pendingInterns.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">Pending Approval ({pendingInterns.length})</h4>
              <div className="space-y-2">
                {pendingInterns.map((p) => (
                  <div key={p.id} className="bg-white dark:bg-[#101D2E] rounded-xl border border-amber-200 dark:border-amber-800 p-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{p.name}</p>
                      <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{p.department} · {p.start_date} to {p.end_date}{p.college && ` · ${p.college}`} · {p.contact_phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { setApproveTarget(p); setApproveForm({ manager_name: "", manager_designation: "", stipend: "" }); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Check size={12} className="mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectIntern(p)} className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                        <X size={12} className="mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? <div className="py-10 text-center"><div className="w-6 h-6 border-2 border-[#024396] border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
            <div className="space-y-3">
              {interns.map((intern) => (
                <div key={intern.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <button onClick={() => openInternDetail(intern)} className="text-left">
                      <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3] hover:underline">{intern.name}</p>
                      <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{intern.department} · {intern.start_date} to {intern.end_date}{intern.college && ` · ${intern.college}`}</p>
                    </button>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => openTemplateEdit(intern, "offer_letter")}><Download size={12} className="mr-1" /> Offer Letter</Button>
                      <Button size="sm" variant="outline" onClick={() => openTemplateEdit(intern, "completion_letter")}><Download size={12} className="mr-1" /> Completion Letter</Button>
                      {intern.certificate_id ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-3 py-1.5">Certificate issued ✓</span>
                      ) : (
                        <Button size="sm" onClick={() => openTemplateEdit(intern, "certificate")} className="bg-[#024396] hover:bg-[#023580]"><Award size={12} className="mr-1" /> Generate Certificate</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { setEmailInternTarget(intern); setEmailInternDocs([]); }}>
                        <Send size={12} className="mr-1" /> Email Documents
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {interns.length === 0 && <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-8">No interns added yet.</p>}
            </div>
          )}
        </div>
      )}

      {tab === "certificates" && (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-4 flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => openCertificateDetail(cert)} className="text-left">
                <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3] hover:underline">{cert.person_name}</p>
                <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{cert.certificate_number} · {cert.type} · {cert.department} · {cert.duration_label}</p>
              </button>
              <div className="flex gap-2">
                {cert.pdf_url && <a href={cert.pdf_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><Download size={12} className="mr-1" /> Download</Button></a>}
                <Button size="sm" variant="outline" onClick={() => setEmailTarget(cert)}><Mail size={12} className="mr-1" /> Email</Button>
              </div>
            </div>
          ))}
          {certificates.length === 0 && <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-8">No certificates generated yet.</p>}
        </div>
      )}

      <PortalModal open={showAddIntern} onOpenChange={setShowAddIntern} title="Add Intern" maxWidth="max-w-md">
        <form onSubmit={submitIntern} className="space-y-3">
          <input required placeholder="Intern Name *" value={internForm.name} onChange={(e) => setInternForm({ ...internForm, name: e.target.value })} className={field} />
          <input placeholder="College / Institute (optional)" value={internForm.college} onChange={(e) => setInternForm({ ...internForm, college: e.target.value })} className={field} />
          <select value={internForm.department} onChange={(e) => setInternForm({ ...internForm, department: e.target.value })} className={field}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">Start Date</label><input required type="date" value={internForm.start_date} onChange={(e) => setInternForm({ ...internForm, start_date: e.target.value })} className={field} /></div>
            <div><label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">End Date</label><input required type="date" value={internForm.end_date} onChange={(e) => setInternForm({ ...internForm, end_date: e.target.value })} className={field} /></div>
          </div>
          <input type="number" placeholder="Monthly Stipend (optional)" value={internForm.stipend} onChange={(e) => setInternForm({ ...internForm, stipend: e.target.value })} className={field} />
          <input required placeholder="Reporting Manager Name *" value={internForm.manager_name} onChange={(e) => setInternForm({ ...internForm, manager_name: e.target.value })} className={field} />
          <input required placeholder="Manager Designation *" value={internForm.manager_designation} onChange={(e) => setInternForm({ ...internForm, manager_designation: e.target.value })} className={field} />
          <Button type="submit" className="w-full bg-[#024396] hover:bg-[#023580]">Add Intern</Button>
        </form>
      </PortalModal>

      <PortalModal open={!!approveTarget} onOpenChange={(v) => !v && setApproveTarget(null)} title="Approve Intern Application" maxWidth="max-w-md">
        {approveTarget && (
          <form onSubmit={submitApproval} className="space-y-3">
            <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2">
              {approveTarget.name} · {approveTarget.department} · {approveTarget.start_date} to {approveTarget.end_date}
            </p>
            <input required placeholder="Reporting Manager Name *" value={approveForm.manager_name} onChange={(e) => setApproveForm({ ...approveForm, manager_name: e.target.value })} className={field} />
            <input required placeholder="Manager Designation *" value={approveForm.manager_designation} onChange={(e) => setApproveForm({ ...approveForm, manager_designation: e.target.value })} className={field} />
            <input type="number" placeholder="Monthly Stipend (optional)" value={approveForm.stipend} onChange={(e) => setApproveForm({ ...approveForm, stipend: e.target.value })} className={field} />
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Approve</Button>
          </form>
        )}
      </PortalModal>

      <PortalModal open={showEmpCert} onOpenChange={setShowEmpCert} title="Generate Employee Certificate" maxWidth="max-w-md">
        <form onSubmit={submitEmpCert} className="space-y-3">
          <select required value={empCertForm.employee_id} onChange={(e) => setEmpCertForm({ ...empCertForm, employee_id: e.target.value })} className={field}>
            <option value="">Select Employee *</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
          <select value={empCertForm.department} onChange={(e) => setEmpCertForm({ ...empCertForm, department: e.target.value })} className={field}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">Start Date</label><input required type="date" value={empCertForm.start_date} onChange={(e) => setEmpCertForm({ ...empCertForm, start_date: e.target.value })} className={field} /></div>
            <div><label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">End Date (blank = ongoing)</label><input type="date" value={empCertForm.end_date} onChange={(e) => setEmpCertForm({ ...empCertForm, end_date: e.target.value })} className={field} /></div>
          </div>
          <Button type="submit" className="w-full bg-[#024396] hover:bg-[#023580]">Generate Certificate</Button>
        </form>
      </PortalModal>

      <PortalModal open={showAchievement} onOpenChange={setShowAchievement} title="Add Achievement" maxWidth="max-w-md">
        <form onSubmit={submitAchievement} className="space-y-3">
          <select required value={achievementForm.employee_id} onChange={(e) => setAchievementForm({ ...achievementForm, employee_id: e.target.value })} className={field}>
            <option value="">Select Employee *</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
          <input required placeholder="Title (e.g. Employee of the Month — June 2026) *" value={achievementForm.title} onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })} className={field} />
          <textarea placeholder="Description (optional)" rows={2} value={achievementForm.description} onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })} className={`${field} resize-none`} />
          <Button type="submit" className="w-full bg-[#024396] hover:bg-[#023580]">Add Achievement</Button>
        </form>
      </PortalModal>

      <PortalModal open={!!emailTarget} onOpenChange={(v) => !v && setEmailTarget(null)} title="Email Certificate" maxWidth="max-w-sm">
        <div className="space-y-3">
          <input type="email" placeholder="recipient@email.com" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className={field} />
          <Button onClick={sendEmail} className="w-full bg-[#024396] hover:bg-[#023580]">Send</Button>
        </div>
      </PortalModal>

      <PortalModal open={!!emailInternTarget} onOpenChange={(v) => { if (!v) { setEmailInternTarget(null); setEmailInternAddress(""); setEmailInternDocs([]); } }} title="Email Documents" maxWidth="max-w-sm">
        {emailInternTarget && (
          <div className="space-y-3">
            <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2">{emailInternTarget.name}</p>
            <input type="email" placeholder="recipient@email.com" value={emailInternAddress} onChange={(e) => setEmailInternAddress(e.target.value)} className={field} />

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
                  <DetailRow label="College" value={personDetail.intern.college || "—"} />
                  <DetailRow label="Department" value={personDetail.intern.department} />
                  <DetailRow label="Duration" value={`${personDetail.intern.start_date} to ${personDetail.intern.end_date}`} />
                  <DetailRow label="Stipend" value={personDetail.intern.stipend ? `₹${personDetail.intern.stipend}/mo` : "Unpaid"} />
                  <DetailRow label="Reporting Manager" value={`${personDetail.intern.manager_name}, ${personDetail.intern.manager_designation}`} />
                  <DetailRow label="Offer Letter" value={personDetail.intern.offer_letter_generated_at ? `Generated ${new Date(personDetail.intern.offer_letter_generated_at).toLocaleDateString("en-IN")}` : "Not generated yet"} />
                  <DetailRow label="Completion Letter" value={personDetail.intern.completion_letter_generated_at ? `Generated ${new Date(personDetail.intern.completion_letter_generated_at).toLocaleDateString("en-IN")}` : "Not generated yet"} />
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
                {personDetail.cert.pdf_url && (
                  <a href={personDetail.cert.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-[#024396] dark:text-[#7CB0FF]">
                    <Download size={12} /> Download Certificate PDF
                  </a>
                )}
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
