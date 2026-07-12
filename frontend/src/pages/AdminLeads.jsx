import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import PortalModal from "../components/portal/PortalModal";
import StatusBadge from "../components/portal/StatusBadge";
import { Button } from "../components/ui/button";
import { Upload, Search } from "lucide-react";
import { codeFieldLabel } from "../lib/utils";
import MyLeadsTab from "./leads/MyLeadsTab";
import EmployeeLeadsTab from "./leads/EmployeeLeadsTab";
import WebsiteLeadsTab from "./leads/WebsiteLeadsTab";
import CareerLeadsTab from "./leads/CareerLeadsTab";
import PipelineConfigTab from "./leads/PipelineConfigTab";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_LABELS = {
  new: "New", contacted: "Contacted", follow_up: "Follow Up",
  interested: "Interested", converted: "Converted", lost: "Lost",
};
const SOURCES = ["manual", "website", "referral", "calculator", "whatsapp", "excel"];

export default function AdminLeads() {
  const { token, user } = useAuth();
  const navigate = useNavigate(); // eslint-disable-line no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true); // eslint-disable-line no-unused-vars
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("my_leads");
  const [webLeads, setWebLeads] = useState([]);
  const [careerLeads, setCareerLeads] = useState([]);
  const [importing, setImporting] = useState(false);
  const [pipelineStatuses, setPipelineStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [services, setServices] = useState([]);
  const fileRef = useRef(null);

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [assignMode, setAssignMode] = useState("self");
  const [selectedAssignEmps, setSelectedAssignEmps] = useState([]);
  const [includeExistingDuplicates, setIncludeExistingDuplicates] = useState(false);

  const [batches, setBatches] = useState([]);
  const [openBatch, setOpenBatch] = useState(null);
  const [batchLeads, setBatchLeads] = useState([]);
  const [batchEmpFilter, setBatchEmpFilter] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  const [detailLead, setDetailLead] = useState(null);

  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", source: "manual", service_interest: "", notes: "", assigned_to: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) setForm((f) => (f.assigned_to ? f : { ...f, assigned_to: user.id }));
  }, [user]);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/services/`, { headers });
      if (res.ok) setServices(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (search) params.set("search", search);
      const [leadsRes, empRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/leads/?${params}`, { headers }),
        fetch(`${API_BASE}/api/auth/employees`, { headers }),
        fetch(`${API_BASE}/api/leads/stats`, { headers }),
      ]);
      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token, filter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMyLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/admin-my`, { headers });
      if (res.ok) setMyLeads(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/batches`, { headers });
      if (res.ok) setBatches(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWebLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/website`, { headers });
      if (res.ok) setWebLeads(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCareerLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/career`, { headers });
      if (res.ok) setCareerLeads(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPipeline = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/lead-pipeline`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPipelineStatuses(data.statuses || []);
      }
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); loadMyLeads(); loadBatches(); loadWebLeads(); loadCareerLeads(); loadPipeline(); loadServices(); }, [load, loadMyLeads, loadBatches, loadWebLeads, loadCareerLeads, loadPipeline, loadServices]);

  // Deep-link from a notification: ?leadId=... auto-opens that lead's detail modal.
  useEffect(() => {
    const leadId = searchParams.get("leadId");
    if (!leadId || (!leads.length && !myLeads.length)) return;
    const found = leads.find((l) => l.id === leadId) || myLeads.find((l) => l.id === leadId);
    if (found) {
      setDetailLead(found);
      setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete("leadId"); return next; }, { replace: true });
    }
  }, [searchParams, leads, myLeads, setSearchParams]);

  const addLead = async (e) => {
    e.preventDefault();
    if (!form.assigned_to) {
      alert("Assign this lead to yourself or an employee before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/`, {
        method: "POST", headers,
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ name: "", phone: "", email: "", city: "", source: "manual", service_interest: "", notes: "", assigned_to: user?.id || "" });
        load(); loadMyLeads();
      }
    } catch { /* silent */ }
    setSaving(false);
  };

  const assignLead = async (leadId, empId) => {
    const res = await fetch(`${API_BASE}/api/leads/${leadId}/assign?assigned_to=${empId}`, { method: "POST", headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || "Failed to assign lead");
      return;
    }
    load(); loadMyLeads(); loadBatches();
    if (openBatch) {
      const url = batchEmpFilter
        ? `${API_BASE}/api/leads/batches/${openBatch.batch_id}?employee_filter=${batchEmpFilter}`
        : `${API_BASE}/api/leads/batches/${openBatch.batch_id}`;
      fetch(url, { headers }).then((r) => (r.ok ? r.json() : null)).then((data) => data && setBatchLeads(data));
    }
  };

  const deleteLead = async (leadId) => {
    if (!window.confirm("Delete this lead?")) return;
    await fetch(`${API_BASE}/api/leads/${leadId}`, { method: "DELETE", headers });
    load(); loadMyLeads();
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setImportFile(file);
    setShowAssignDialog(true);
  };

  const executeImport = async () => {
    if (!importFile) return;
    if (assignMode === "selected" && selectedAssignEmps.length === 0) {
      alert("Select at least one employee to assign these leads to.");
      return;
    }
    setImporting(true);
    setShowAssignDialog(false);
    const fd = new FormData();
    fd.append("file", importFile);
    let url = `${API_BASE}/api/leads/import-excel?assign_mode=${assignMode}&include_existing_duplicates=${includeExistingDuplicates}`;
    if (assignMode === "selected" && selectedAssignEmps.length > 0) {
      url += `&employee_ids=${selectedAssignEmps.join(",")}`;
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        alert(
          `${data.count} leads imported successfully` +
          (data.reassigned_existing_count > 0 ? ` (${data.reassigned_existing_count} were existing numbers re-assigned)` : "") + `!\n` +
          `Skipped: ${data.incomplete_count} incomplete, ` +
          `${data.duplicate_infile_count} duplicate within this file, ` +
          `${data.duplicate_existing_count} duplicate already in database` +
          (includeExistingDuplicates ? " (but re-assigned, not skipped)." : ".")
        );
        load(); loadMyLeads(); loadBatches();
      } else {
        const err = await res.json();
        alert(err.detail || "Import failed");
      }
    } catch { alert("Import failed"); }
    setImporting(false);
    setImportFile(null);
    setAssignMode("self");
    setIncludeExistingDuplicates(false);
    setSelectedAssignEmps([]);
  };

  const openBatchDetail = async (batch) => {
    setOpenBatch(batch);
    setBatchLoading(true);
    setBatchEmpFilter("");
    try {
      const res = await fetch(`${API_BASE}/api/leads/batches/${batch.batch_id}`, { headers });
      if (res.ok) setBatchLeads(await res.json());
    } catch { /* silent */ }
    setBatchLoading(false);
  };

  const filterBatchByEmp = async (empId) => {
    setBatchEmpFilter(empId);
    setBatchLoading(true);
    const url = empId
      ? `${API_BASE}/api/leads/batches/${openBatch.batch_id}?employee_filter=${empId}`
      : `${API_BASE}/api/leads/batches/${openBatch.batch_id}`;
    try {
      const res = await fetch(url, { headers });
      if (res.ok) setBatchLeads(await res.json());
    } catch { /* silent */ }
    setBatchLoading(false);
  };

  const convertWebLead = async (id, empId) => {
    const url = `${API_BASE}/api/leads/website/${id}/convert${empId ? `?assign_to=${empId}` : ""}`;
    await fetch(url, { method: "POST", headers });
    loadWebLeads(); load(); loadMyLeads();
  };

  const deleteWebLead = async (id) => {
    if (!window.confirm("Delete this website lead?")) return;
    await fetch(`${API_BASE}/api/leads/website/${id}`, { method: "DELETE", headers });
    loadWebLeads();
  };

  const updateCareerStatus = async (id, status) => {
    await fetch(`${API_BASE}/api/leads/career/${id}/status?status=${status}`, { method: "PUT", headers });
    loadCareerLeads();
  };

  const convertCareerLead = async (id, empId) => {
    const url = `${API_BASE}/api/leads/career/${id}/convert${empId ? `?assign_to=${empId}` : ""}`;
    await fetch(url, { method: "POST", headers });
    loadCareerLeads(); load(); loadMyLeads();
  };

  const deleteCareerLead = async (id) => {
    if (!window.confirm("Delete this career application?")) return;
    await fetch(`${API_BASE}/api/leads/career/${id}`, { method: "DELETE", headers });
    loadCareerLeads();
  };

  const downloadBatchReport = async (batchId) => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/batches/${batchId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("Failed to generate report"); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lead_batch_report_${batchId.slice(0, 8)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert("Failed to generate report"); }
  };

  const deleteBatch = async (batchId) => {
    if (!window.confirm("Delete this entire batch? All leads imported in it will be permanently removed.")) return;
    await fetch(`${API_BASE}/api/leads/batches/${batchId}`, { method: "DELETE", headers });
    setOpenBatch(null); setBatchLeads([]);
    loadBatches(); load();
  };

  const savePipeline = async () => {
    await fetch(`${API_BASE}/api/lead-pipeline`, {
      method: "PUT", headers,
      body: JSON.stringify({ statuses: pipelineStatuses }),
    });
    alert("Pipeline updated!");
  };

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  const TABS = [
    ["my_leads", `My Leads (${myLeads.length})`],
    ["employee_leads", "Employee Leads"],
    ["website", `Website Leads (${webLeads.length})`],
    ["career", `Career (${careerLeads.length})`],
    ["pipeline", "Pipeline Config"],
  ];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <PageHeader
          icon="📋"
          title="Lead Management"
          subtitle="Track, assign & convert leads"
          actions={
            <>
              <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-[#024396] to-[#0356c4] shadow-lg shadow-[#024396]/25">
                + Add Lead
              </Button>
              <label className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer flex items-center gap-1.5 ${importing ? "bg-gray-200 text-gray-500" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"}`}>
                <Upload size={14} /> {importing ? "Importing..." : "Import Excel"}
                <input type="file" className="hidden" accept=".xlsx,.xls" ref={fileRef} onChange={(e) => handleFileSelect(e.target.files[0])} disabled={importing} />
              </label>
            </>
          }
        />

        {/* Search across all leads */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2A364B]/40 dark:text-[#8E99AC]" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all leads by name or phone..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white"
          />
          {search.trim().length > 0 && (
            <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-white dark:bg-[#101D2E] border border-[#E2D8C2] dark:border-white/15 rounded-xl shadow-lg max-h-72 overflow-y-auto">
              {leads.length === 0 ? (
                <p className="text-xs text-center py-4 text-[#2A364B]/40 dark:text-[#8E99AC]">No matching leads</p>
              ) : (
                leads.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => { setDetailLead(r); setSearch(""); }}
                    className="px-4 py-2.5 border-b border-[#E2D8C2] dark:border-white/10 last:border-0 text-xs cursor-pointer hover:bg-[#FBF7EE] dark:hover:bg-white/5"
                  >
                    <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3] flex items-center gap-1.5">
                      {r.name} — {r.phone}
                      {r.source === "employee_added" && (
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-1.5 py-0.5 rounded shrink-0">Self-added</span>
                      )}
                    </p>
                    <p className="text-[#2A364B]/50 dark:text-[#8E99AC]">Status: {STATUS_LABELS[r.status] || r.status} · {r.assigned_to_name || "Unassigned"}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E2D8C2] dark:border-white/10 overflow-x-auto">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === key ? "border-[#024396] dark:border-[#4C8DFF] text-[#024396] dark:text-[#7CB0FF]" : "border-transparent text-[#2A364B]/50 dark:text-[#8E99AC] hover:text-[#2A364B] dark:hover:text-[#C7CEDA]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Import Assign Dialog */}
        <PortalModal open={showAssignDialog} onOpenChange={(v) => { setShowAssignDialog(v); if (!v) setImportFile(null); }} title="Import Leads — Assign To" maxWidth="max-w-md">
          <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2">Every imported lead must go to someone — choose who:</p>
          <div className="space-y-3">
            {[
              ["self", "Assign to myself", "All leads go to My Leads"],
              ["all", "Shuffle to all employees", "Auto-distribute equally among all active employees"],
              ["selected", "Select employees", "Choose specific employees to distribute to"],
            ].map(([mode, title, desc]) => (
              <label key={mode} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${assignMode === mode ? "border-[#024396] dark:border-[#4C8DFF] bg-[#024396]/5 dark:bg-[#4C8DFF]/10" : "border-[#E2D8C2] dark:border-white/15"}`}>
                <input type="radio" name="assign" checked={assignMode === mode} onChange={() => setAssignMode(mode)} />
                <div>
                  <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{title}</p>
                  <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{desc}</p>
                </div>
              </label>
            ))}
            {assignMode === "selected" && (
              <div className="ml-8 space-y-2 max-h-40 overflow-y-auto">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer text-[#0E1B2C] dark:text-[#F1EDE3]">
                    <input
                      type="checkbox"
                      checked={selectedAssignEmps.includes(emp.id)}
                      onChange={() => setSelectedAssignEmps((prev) => prev.includes(emp.id) ? prev.filter((x) => x !== emp.id) : [...prev, emp.id])}
                      className="rounded"
                    />
                    {emp.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 cursor-pointer">
            <input
              type="checkbox"
              checked={includeExistingDuplicates}
              onChange={(e) => setIncludeExistingDuplicates(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div>
              <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">Also include numbers already in the database</p>
              <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">
                Off (default): numbers that already exist as a lead are skipped and reported as duplicates.
                On: those existing leads get re-assigned to whoever this import goes to, instead of being skipped.
                (Numbers repeated within this same file are always deduped either way.)
              </p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setShowAssignDialog(false); setImportFile(null); }}>Cancel</Button>
            <Button className="flex-1 bg-gradient-to-r from-[#024396] to-[#0356c4]" onClick={executeImport}>Import</Button>
          </div>
        </PortalModal>

        {/* Add Lead Modal */}
        <PortalModal open={showAdd} onOpenChange={setShowAdd} title="Add New Lead" maxWidth="max-w-md">
          <form onSubmit={addLead} className="space-y-3">
            <input required placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
            <input required placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={field} />
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={field}>
              {SOURCES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={form.service_interest} onChange={(e) => setForm({ ...form, service_interest: e.target.value })} className={field}>
              <option value="">Service Interest</option>
              {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select required value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className={field}>
              {user?.id && <option value={user.id}>Myself ({user.name})</option>}
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
            <textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${field} resize-none`} />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-[#024396] to-[#0356c4]">
                {saving ? "Saving..." : "Add Lead"}
              </Button>
            </div>
          </form>
        </PortalModal>

        {/* Lead Detail Modal */}
        <PortalModal
          open={!!detailLead}
          onOpenChange={(v) => !v && setDetailLead(null)}
          title={detailLead?.name}
          description={detailLead ? `${detailLead.phone}${detailLead.email ? ` | ${detailLead.email}` : ""}` : ""}
          maxWidth="max-w-lg"
        >
          {detailLead && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={detailLead.status} label={STATUS_LABELS[detailLead.status]} />
                {detailLead.service_interest && (
                  <span className="text-xs text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/10 px-2 py-0.5 rounded">{detailLead.service_interest}</span>
                )}
                {detailLead.source === "employee_added" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded">Self-added by employee</span>
                )}
              </div>
              {detailLead.assigned_to_name && <p className="text-xs text-[#0E1B2C] dark:text-[#F1EDE3]">Assigned to: <strong>{detailLead.assigned_to_name}</strong></p>}
              {detailLead.follow_up_date && <p className="text-xs text-orange-600 dark:text-orange-400">Follow-up: {detailLead.follow_up_date}</p>}
              {(detailLead.code_name || detailLead.service_price || detailLead.service_expires_at) && (
                <div className="bg-[#FBF7EE] dark:bg-white/5 rounded-lg p-2.5 text-xs space-y-1">
                  {detailLead.code_name && <p className="text-[#0E1B2C] dark:text-[#F1EDE3]">{codeFieldLabel(detailLead.service_interest)}: <strong>{detailLead.code_name}</strong></p>}
                  {detailLead.service_price != null && <p className="text-[#0E1B2C] dark:text-[#F1EDE3]">Amount: <strong>₹{detailLead.service_price.toLocaleString("en-IN")}</strong></p>}
                  {detailLead.service_expires_at && <p className="text-[#0E1B2C] dark:text-[#F1EDE3]">Valid until: <strong>{detailLead.service_expires_at}</strong></p>}
                </div>
              )}
              {detailLead.notes && <p className="text-xs text-[#2A364B]/70 dark:text-[#C7CEDA] bg-[#FBF7EE] dark:bg-white/5 p-2 rounded-lg">{detailLead.notes}</p>}
              {detailLead.status_history && detailLead.status_history.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-2 mt-3">Update History</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detailLead.status_history.map((h, i) => (
                      <div key={i} className="bg-[#F5F1EB] dark:bg-white/5 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{h.status || h.outcome || "Update"}</span>
                          <span className="text-[#2A364B]/40 dark:text-[#8E99AC]">{h.at ? new Date(h.at).toLocaleDateString("en-IN") : ""}</span>
                        </div>
                        {h.note && <p className="text-[#2A364B]/60 dark:text-[#8E99AC] mt-1">{h.note}</p>}
                        {h.by_name && <p className="text-[#2A364B]/40 dark:text-[#8E99AC]/70 mt-0.5">by {h.by_name}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </PortalModal>

        {tab === "my_leads" && (
          <MyLeadsTab
            myLeads={myLeads} stats={stats} filter={filter} setFilter={setFilter}
            employees={employees} assignLead={assignLead} deleteLead={deleteLead} setDetailLead={setDetailLead}
          />
        )}

        {tab === "employee_leads" && (
          <EmployeeLeadsTab
            batches={batches} openBatch={openBatch} batchLeads={batchLeads} batchEmpFilter={batchEmpFilter}
            batchLoading={batchLoading} employees={employees} openBatchDetail={openBatchDetail}
            filterBatchByEmp={filterBatchByEmp} deleteBatch={deleteBatch} assignLead={assignLead}
            setOpenBatch={setOpenBatch} setBatchLeads={setBatchLeads} setDetailLead={setDetailLead}
            downloadBatchReport={downloadBatchReport}
          />
        )}

        {tab === "website" && (
          <WebsiteLeadsTab webLeads={webLeads} employees={employees} convertWebLead={convertWebLead} deleteWebLead={deleteWebLead} />
        )}

        {tab === "career" && (
          <CareerLeadsTab
            careerLeads={careerLeads} employees={employees} updateCareerStatus={updateCareerStatus}
            convertCareerLead={convertCareerLead} deleteCareerLead={deleteCareerLead}
          />
        )}

        {tab === "pipeline" && (
          <PipelineConfigTab
            pipelineStatuses={pipelineStatuses} setPipelineStatuses={setPipelineStatuses}
            newStatus={newStatus} setNewStatus={setNewStatus} savePipeline={savePipeline}
          />
        )}
      </div>
    </PortalLayout>
  );
}
