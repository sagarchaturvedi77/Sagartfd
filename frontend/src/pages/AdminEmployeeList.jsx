import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import DataTable from "../components/portal/DataTable";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { Search, Award, FileText, Download, Mail } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const DEPARTMENTS = ["HR", "Sales", "Marketing", "Accounts"];

export default function AdminEmployeeList() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", designation: "", base_salary: "", training_days: "", training_salary: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewEmp, setViewEmp] = useState(null); // employee detail modal
  const [empDetail, setEmpDetail] = useState(null);
  const [editingEmp, setEditingEmp] = useState(false);
  const [empEditForm, setEmpEditForm] = useState({});
  const [savingEmp, setSavingEmp] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null); // show credentials after creation
  const [emailState, setEmailState] = useState("idle"); // idle | sending | sent | error

  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");

  const [certificates, setCertificates] = useState([]);
  const [showEmpCert, setShowEmpCert] = useState(false);
  const [empCertForm, setEmpCertForm] = useState({ employee_id: "", department: "Sales", start_date: "", end_date: "" });
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementForm, setAchievementForm] = useState({ employee_id: "", title: "", description: "" });
  const [emailCertTarget, setEmailCertTarget] = useState(null);
  const [emailCertAddress, setEmailCertAddress] = useState("");
  const [sendingCertEmail, setSendingCertEmail] = useState(false);

  const fetchCertificates = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/certificates`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const all = await res.json();
      setCertificates(all.filter((c) => c.type === "employee" || c.type === "achievement"));
    }
  }, [token]);

  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  const submitEmpCert = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/certificates/employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...empCertForm, end_date: empCertForm.end_date || null }),
    });
    if (res.ok) {
      setShowEmpCert(false);
      setEmpCertForm({ employee_id: "", department: "Sales", start_date: "", end_date: "" });
      fetchCertificates();
    }
  };

  const submitAchievement = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/certificates/achievement`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(achievementForm),
    });
    if (res.ok) {
      setShowAchievement(false);
      setAchievementForm({ employee_id: "", title: "", description: "" });
      fetchCertificates();
    }
  };

  const sendCertEmail = async () => {
    if (!emailCertAddress.trim() || sendingCertEmail) return;
    if (!window.confirm(`Send certificate email to ${emailCertAddress.trim()}?`)) return;
    setSendingCertEmail(true);
    try {
      const res = await fetch(`${API_BASE}/api/certificates/${emailCertTarget.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to_email: emailCertAddress.trim() }),
      });
      if (res.ok) { alert("Emailed!"); setEmailCertTarget(null); setEmailCertAddress(""); }
      else { const err = await res.json().catch(() => ({})); alert(err.detail || "Failed to send"); }
    } finally {
      setSendingCertEmail(false);
    }
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/auth/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const designations = useMemo(
    () => [...new Set(employees.map((e) => e.designation).filter(Boolean))].sort(),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (designationFilter && e.designation !== designationFilter) return false;
      if (!q) return true;
      return (
        e.name?.toLowerCase().includes(q) ||
        e.phone?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q)
      );
    });
  }, [employees, search, designationFilter]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      role: "employee",
      base_salary: form.base_salary ? Number(form.base_salary) : null,
      training_days: form.training_days ? Number(form.training_days) : null,
    };
    const res = await fetch(`${API_BASE}/api/auth/create-employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.detail || "Could not create employee");
      return;
    }
    const data = await res.json();
    setCreatedCreds({ phone: form.phone, email: form.email, password: data.generated_password, name: form.name });
    setEmailState("idle");
    setForm({ name: "", phone: "", email: "", designation: "", base_salary: "", training_days: "", training_salary: false });
    setShowAddForm(false);
    fetchEmployees();
  };

  const shareCredsText = () => createdCreds
    ? `TFD Workspace — Welcome ${createdCreds.name}!\n\nUser ID: ${createdCreds.phone}\nPassword: ${createdCreds.password}\n\nLogin here: https://thefinancialdoctor.in/portal/login`
    : "";

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/91${createdCreds.phone}?text=${encodeURIComponent(shareCredsText())}`, "_blank");
  };

  const copyCreds = async () => {
    await navigator.clipboard.writeText(shareCredsText());
    alert("Credentials copied!");
  };

  const sendWelcomeEmail = async () => {
    if (!createdCreds?.email) return;
    setEmailState("sending");
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-welcome-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: createdCreds.email, name: createdCreds.name,
          phone: createdCreds.phone, password: createdCreds.password,
        }),
      });
      setEmailState(res.ok ? "sent" : "error");
    } catch {
      setEmailState("error");
    }
  };

  const resetPassword = async (emp) => {
    if (!window.confirm(`Reset password for ${emp.name}?`)) return;
    const res = await fetch(`${API_BASE}/api/auth/employees/${emp.id}/reset-password`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCreatedCreds({ phone: data.phone, password: data.new_password, name: data.name });
    }
  };

  const viewEmployee = async (emp) => {
    setViewEmp(emp);
    setEditingEmp(false);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${emp.id}/full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEmpDetail(await res.json());
    } catch { /* silent */ }
  };

  const startEditEmployee = () => {
    if (!empDetail) return;
    const u = empDetail.user || {};
    const p = empDetail.profile || {};
    setEmpEditForm({
      email: u.email || "", phone: u.phone || "", designation: u.designation || "",
      join_date: u.join_date || "", base_salary: u.base_salary ?? "", training_days: u.training_days ?? "",
      training_salary: !!u.training_salary, training_start_date: u.training_start_date || "",
      dob: p.dob || "", gender: p.gender || "", marital_status: p.marital_status || "",
      contact_no: p.contact_no || "", address: p.address || "", father_name: p.father_name || "",
      mother_name: p.mother_name || "", aadhar_number: p.aadhar_number || "", pan_number: p.pan_number || "",
      bank_name: p.bank_name || "", bank_account_number: p.bank_account_number || "",
      bank_ifsc: p.bank_ifsc || "", bank_branch: p.bank_branch || "",
      emergency_contact_name: p.emergency_contact_name || "", emergency_contact_number: p.emergency_contact_number || "",
    });
    setEditingEmp(true);
  };

  const saveEmployeeEdit = async () => {
    if (!viewEmp || savingEmp) return;
    setSavingEmp(true);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${viewEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(empEditForm),
      });
      if (res.ok) {
        const data = await res.json();
        setEmpDetail((prev) => ({ ...prev, user: data.user, profile: data.profile }));
        setEditingEmp(false);
        fetchEmployees();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to save changes");
      }
    } finally {
      setSavingEmp(false);
    }
  };

  const formatCurrency = (v) => v ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v) : "-";
  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  const columns = [
    {
      key: "name", label: "Name",
      render: (emp) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {emp.name?.charAt(0)}
          </div>
          <div>
            <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{emp.name}</span>
            {emp.profile_completed && <span className="ml-1 text-emerald-500" title="Profile complete">&#10003;</span>}
          </div>
        </div>
      ),
    },
    { key: "id", label: "Employee ID", hideBelow: "md", render: (emp) => <span className="font-mono text-[10px] text-[#2A364B]/60 dark:text-[#C7CEDA]/60">{emp.id}</span> },
    { key: "phone", label: "Phone (User ID)", render: (emp) => <span className="font-mono text-[#2A364B]/70 dark:text-[#C7CEDA]/70">{emp.phone || emp.email}</span> },
    {
      key: "designation", label: "Designation",
      render: (emp) => emp.designation
        ? <span className="bg-[#024396]/10 text-[#024396] text-xs px-2.5 py-1 rounded-full">{emp.designation}</span>
        : <span className="text-[#2A364B]/30 dark:text-[#C7CEDA]/30">-</span>,
    },
    { key: "salary", label: "Salary", hideBelow: "md", render: (emp) => formatCurrency(emp.base_salary) },
    {
      key: "training", label: "Training", hideBelow: "lg",
      render: (emp) => emp.training_days
        ? <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{emp.training_days} days</span>
        : <span className="text-[#2A364B]/30 dark:text-[#C7CEDA]/30 text-xs">No training</span>,
    },
    {
      key: "actions", label: "Actions",
      render: (emp) => (
        <div className="flex items-center gap-3">
          <button onClick={() => viewEmployee(emp)} className="text-xs text-[#024396] hover:underline font-medium">View</button>
          <button onClick={() => resetPassword(emp)} className="text-xs text-orange-600 hover:underline font-medium">Reset PW</button>
        </div>
      ),
    },
  ];

  return (
    <PortalLayout>
      <PageHeader
        icon="👥"
        title="Total Employees"
        subtitle={`${employees.length} employees registered`}
        actions={
          <>
            <Button onClick={() => setShowEmpCert(true)} variant="outline"><FileText size={14} className="mr-1.5" /> Employee Certificate</Button>
            <Button onClick={() => setShowAchievement(true)} variant="outline"><Award size={14} className="mr-1.5" /> Add Achievement</Button>
          </>
        }
      />

      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E2D8C2] dark:border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px] relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2A364B]/40 dark:text-[#8E99AC]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, employee ID or designation..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white"
              />
            </div>
            {designations.length > 0 && (
              <select
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                className="text-sm border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-3 py-2.5 bg-white"
              >
                <option value="">All designations</option>
                {designations.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "secondary" : "default"}
              className={showAddForm ? "bg-[#2A364B]/10 text-[#2A364B] dark:text-[#C7CEDA] hover:bg-[#2A364B]/20" : "bg-[#024396] hover:bg-[#023580] shadow-md shadow-[#024396]/20"}
            >
              {showAddForm ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>Cancel</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>Add Employee</>
              )}
            </Button>
          </div>
        </div>

        {/* Add form with training + salary fields */}
        {showAddForm && (
          <form onSubmit={handleAddEmployee} className="p-6 bg-[#FBF7EE]/50 dark:bg-white/5 border-b border-[#E2D8C2] dark:border-white/10">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormInput required placeholder="Full Name" value={form.name} onChange={v => setForm({...form, name: v})} />
              <FormInput required type="tel" placeholder="Mobile Number (Login ID)" value={form.phone} onChange={v => setForm({...form, phone: v})} />
              <FormInput type="email" placeholder="Email (optional, for welcome email)" value={form.email} onChange={v => setForm({...form, email: v})} />
              <FormInput placeholder="Designation (e.g. Relationship Manager)" value={form.designation} onChange={v => setForm({...form, designation: v})} />
              <FormInput type="number" placeholder="Base Salary (monthly)" value={form.base_salary} onChange={v => setForm({...form, base_salary: v})} />
              <FormInput type="number" placeholder="Training Period (days)" value={form.training_days} onChange={v => setForm({...form, training_days: v})} />
              <div className="flex items-center gap-2 px-4">
                <input type="checkbox" id="training_salary" checked={form.training_salary} onChange={e => setForm({...form, training_salary: e.target.checked})}
                  className="rounded border-[#E2D8C2] dark:border-white/10" />
                <label htmlFor="training_salary" className="text-sm text-[#2A364B]/70 dark:text-[#C7CEDA]/70">Salary during training?</label>
              </div>
            </div>
            <p className="text-xs text-[#2A364B]/50 dark:text-[#C7CEDA]/50 mt-2">Password will be auto-generated and shown after creation.</p>
            {error && (
              <p className="text-sm text-red-600 mt-3 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </p>
            )}
            <Button type="submit" className="mt-4 bg-[#024396] hover:bg-[#023580] shadow-md shadow-[#024396]/20">
              Create Employee Account
            </Button>
          </form>
        )}

        {/* Employee table */}
        {loading ? (
          <div className="p-12 text-center text-[#2A364B]/50 dark:text-[#C7CEDA]/50">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#024396]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Loading team...
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredEmployees}
            emptyIcon="👥"
            emptyTitle={employees.length === 0 ? "No employees added yet" : "No employees match your search"}
            emptySubtitle={employees.length === 0 ? 'Click "Add Employee" to get started.' : "Try a different name, phone, employee ID or designation."}
          />
        )}
      </div>

      {/* Employee Certificates & Achievements */}
      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden mt-6">
        <div className="p-5 border-b border-[#E2D8C2] dark:border-white/10">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Employee Certificates &amp; Achievements</h3>
        </div>
        <div className="p-5 space-y-3">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-[#F5F1EB] dark:bg-white/5 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{cert.person_name}</p>
                <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{cert.certificate_number} · {cert.type} · {cert.department} · {cert.duration_label}</p>
              </div>
              <div className="flex gap-2">
                {cert.pdf_url && <a href={cert.pdf_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><Download size={12} className="mr-1" /> Download</Button></a>}
                <Button size="sm" variant="outline" onClick={() => { setEmailCertTarget(cert); setEmailCertAddress(""); }}><Mail size={12} className="mr-1" /> Email</Button>
              </div>
            </div>
          ))}
          {certificates.length === 0 && <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-6">No employee certificates or achievements yet.</p>}
        </div>
      </div>

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

      <PortalModal open={!!emailCertTarget} onOpenChange={(v) => !v && setEmailCertTarget(null)} title="Email Certificate" maxWidth="max-w-sm">
        <div className="space-y-3">
          <input type="email" placeholder="recipient@email.com" value={emailCertAddress} onChange={(e) => setEmailCertAddress(e.target.value)} className={field} />
          <Button onClick={sendCertEmail} disabled={sendingCertEmail || !emailCertAddress.trim()} className="w-full bg-[#024396] hover:bg-[#023580]">{sendingCertEmail ? "Sending..." : "Send"}</Button>
        </div>
      </PortalModal>

      {/* Credentials popup */}
      <PortalModal open={!!createdCreds} onOpenChange={(v) => !v && setCreatedCreds(null)} maxWidth="max-w-sm">
        {createdCreds && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1">Account Created!</h3>
            <p className="text-sm text-[#2A364B]/60 dark:text-[#C7CEDA]/60 mb-4">{createdCreds.name}</p>
            <div className="bg-[#FBF7EE] dark:bg-white/5 rounded-xl p-4 text-left space-y-2 border border-[#E2D8C2] dark:border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#2A364B]/50 dark:text-[#C7CEDA]/50">User ID:</span>
                <span className="font-mono font-bold text-[#0E1B2C] dark:text-[#F1EDE3]">{createdCreds.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#2A364B]/50 dark:text-[#C7CEDA]/50">Password:</span>
                <span className="font-mono font-bold text-[#024396]">{createdCreds.password}</span>
              </div>
            </div>
            <p className="text-[10px] text-[#2A364B]/40 dark:text-[#C7CEDA]/40 mt-3">Share these credentials with the employee for login.</p>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={shareViaWhatsApp}
                className="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 py-2.5 rounded-xl font-medium text-xs hover:bg-emerald-100 transition-all">
                💬 WhatsApp
              </button>
              <button onClick={copyCreds}
                className="flex items-center justify-center gap-1.5 bg-[#F5F1EB] dark:bg-white/5 text-[#2A364B] dark:text-[#C7CEDA] border border-[#E2D8C2] dark:border-white/10 py-2.5 rounded-xl font-medium text-xs hover:bg-[#E2D8C2] transition-all">
                📋 Copy
              </button>
            </div>

            {createdCreds.email && (
              <button onClick={sendWelcomeEmail} disabled={emailState === "sending" || emailState === "sent"}
                className="w-full mt-2 flex items-center justify-center gap-1.5 bg-blue-50 text-[#024396] border border-blue-200 py-2.5 rounded-xl font-medium text-xs hover:bg-blue-100 transition-all disabled:opacity-60">
                {emailState === "sending" ? "Sending..." : emailState === "sent" ? "✅ Email Sent" : emailState === "error" ? "❌ Failed — Retry" : `✉️ Email to ${createdCreds.email}`}
              </button>
            )}

            <Button onClick={() => setCreatedCreds(null)} className="mt-4 bg-[#024396] hover:bg-[#023580] w-full">
              Done
            </Button>
          </div>
        )}
      </PortalModal>

      {/* Employee Detail Modal */}
      <PortalModal
        open={!!viewEmp}
        onOpenChange={(v) => { if (!v) { setViewEmp(null); setEmpDetail(null); } }}
        title={viewEmp?.name}
        maxWidth="max-w-lg"
      >
        {!empDetail ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {empDetail.uploads?.photo?.data && (
              <div className="text-center">
                <img src={empDetail.uploads.photo.data} alt="Employee" className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-[#024396]/20" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[#2A364B]/40 dark:text-[#C7CEDA]/40">Name and Employee ID ({viewEmp?.id}) can't be edited here.</p>
              {!editingEmp ? (
                <Button size="sm" variant="outline" onClick={startEditEmployee}>Edit Details</Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingEmp(false)} disabled={savingEmp}>Cancel</Button>
                  <Button size="sm" onClick={saveEmployeeEdit} disabled={savingEmp} className="bg-[#024396] hover:bg-[#023580]">{savingEmp ? "Saving..." : "Save"}</Button>
                </div>
              )}
            </div>

            {!editingEmp ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <InfoRow label="Email" value={empDetail.user?.email} />
                  <InfoRow label="Phone" value={empDetail.user?.phone} />
                  <InfoRow label="Designation" value={empDetail.user?.designation} />
                  <InfoRow label="Join Date" value={empDetail.user?.join_date} />
                  <InfoRow label="Base Salary" value={formatCurrency(empDetail.user?.base_salary)} />
                  <InfoRow label="Training" value={empDetail.user?.training_days ? `${empDetail.user.training_days} days` : "None"} />
                  <InfoRow label="Training Salary" value={empDetail.user?.training_salary ? "Yes" : "No"} />
                  <InfoRow label="Profile" value={empDetail.user?.profile_completed ? "Completed" : "Pending"} />
                </div>

                {empDetail.profile?.full_name && (
                  <>
                    <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] pt-2 border-t border-[#E2D8C2] dark:border-white/10">Personal Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <InfoRow label="Full Name" value={empDetail.profile.full_name} />
                      <InfoRow label="DOB" value={empDetail.profile.dob} />
                      <InfoRow label="Gender" value={empDetail.profile.gender} />
                      <InfoRow label="Marital Status" value={empDetail.profile.marital_status} />
                      <InfoRow label="Contact" value={empDetail.profile.contact_no} />
                      <InfoRow label="Father" value={empDetail.profile.father_name} />
                      <InfoRow label="Mother" value={empDetail.profile.mother_name} />
                      <InfoRow label="PAN" value={empDetail.profile.pan_number || "-"} />
                      <InfoRow label="Aadhar" value={empDetail.profile.aadhar_number ? `****${empDetail.profile.aadhar_number.slice(-4)}` : "-"} />
                      <InfoRow label="Emergency Contact" value={empDetail.profile.emergency_contact_name} />
                      <InfoRow label="Emergency No." value={empDetail.profile.emergency_contact_number} />
                    </div>
                    <InfoRow label="Address" value={empDetail.profile.address} />

                    <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] pt-2 border-t border-[#E2D8C2] dark:border-white/10">Bank Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <InfoRow label="Bank" value={empDetail.profile.bank_name} />
                      <InfoRow label="A/C No." value={empDetail.profile.bank_account_number} />
                      <InfoRow label="IFSC" value={empDetail.profile.bank_ifsc} />
                      <InfoRow label="Branch" value={empDetail.profile.bank_branch} />
                    </div>
                  </>
                )}
              </>
            ) : (
              <EmployeeEditForm form={empEditForm} setForm={setEmpEditForm} field={field} />
            )}

            {Object.keys(empDetail.uploads || {}).length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] pt-2 border-t border-[#E2D8C2] dark:border-white/10">Documents</h4>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(empDetail.uploads).map(([key, val]) => (
                    <div key={key} className="text-center">
                      {val.content_type?.startsWith("image/") ? (
                        <img src={val.data} alt={key} className="h-16 mx-auto rounded-lg object-contain border border-[#E2D8C2] dark:border-white/10" />
                      ) : (
                        <div className="h-16 bg-[#FBF7EE] dark:bg-white/5 rounded-lg flex items-center justify-center text-[10px] text-[#2A364B]/50 dark:text-[#C7CEDA]/50">PDF</div>
                      )}
                      <p className="text-[10px] text-[#2A364B]/50 dark:text-[#C7CEDA]/50 mt-1 capitalize">{key.replace(/_/g, " ")}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </PortalModal>
    </PortalLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="text-[#2A364B]/50 dark:text-[#C7CEDA]/50">{label}:</span>{" "}
      <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{value || "-"}</span>
    </div>
  );
}

function FormInput({ className = "", onChange, ...props }) {
  return (
    <input
      {...props}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-[#E2D8C2] dark:border-white/10 rounded-xl px-4 py-2.5 bg-white focus:border-[#024396] focus:ring-2 focus:ring-[#024396]/20 outline-none transition-all text-sm ${className}`}
    />
  );
}

// Everything an admin can edit on an employee — name and employee ID are
// deliberately absent (shown read-only above this form instead), matching
// the backend's PUT /employees/{id}, which silently ignores those two even
// if sent.
function EmployeeEditForm({ form, setForm, field }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const labelCls = "text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC] uppercase tracking-wide mb-1 block";
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">Employment</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Email</label><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Phone</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Designation</label><input value={form.designation} onChange={(e) => set("designation", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Join Date</label><input type="date" value={form.join_date} onChange={(e) => set("join_date", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Base Salary</label><input type="number" value={form.base_salary} onChange={(e) => set("base_salary", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Training Days</label><input type="number" value={form.training_days} onChange={(e) => set("training_days", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Training Start Date</label><input type="date" value={form.training_start_date} onChange={(e) => set("training_start_date", e.target.value)} className={field} /></div>
          <label className="flex items-center gap-2 mt-5">
            <input type="checkbox" checked={form.training_salary} onChange={(e) => set("training_salary", e.target.checked)} className="rounded border-[#E2D8C2]" />
            <span className="text-sm text-[#2A364B]/70 dark:text-[#C7CEDA]/70">Paid during training</span>
          </label>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-2 pt-2 border-t border-[#E2D8C2] dark:border-white/10">Personal Details</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>DOB</label><input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Gender</label><input value={form.gender} onChange={(e) => set("gender", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Marital Status</label><input value={form.marital_status} onChange={(e) => set("marital_status", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Contact No.</label><input value={form.contact_no} onChange={(e) => set("contact_no", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Father's Name</label><input value={form.father_name} onChange={(e) => set("father_name", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Mother's Name</label><input value={form.mother_name} onChange={(e) => set("mother_name", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Aadhar No.</label><input value={form.aadhar_number} onChange={(e) => set("aadhar_number", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>PAN No.</label><input value={form.pan_number} onChange={(e) => set("pan_number", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Emergency Contact Name</label><input value={form.emergency_contact_name} onChange={(e) => set("emergency_contact_name", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Emergency Contact No.</label><input value={form.emergency_contact_number} onChange={(e) => set("emergency_contact_number", e.target.value)} className={field} /></div>
        </div>
        <div className="mt-3"><label className={labelCls}>Address</label><textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} className={`${field} resize-none`} /></div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-2 pt-2 border-t border-[#E2D8C2] dark:border-white/10">Bank Details</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Bank Name</label><input value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>Account No.</label><input value={form.bank_account_number} onChange={(e) => set("bank_account_number", e.target.value)} className={field} /></div>
          <div><label className={labelCls}>IFSC</label><input value={form.bank_ifsc} onChange={(e) => set("bank_ifsc", e.target.value.toUpperCase())} className={field} /></div>
          <div><label className={labelCls}>Branch</label><input value={form.bank_branch} onChange={(e) => set("bank_branch", e.target.value)} className={field} /></div>
        </div>
      </div>
    </div>
  );
}
