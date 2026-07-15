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

  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [colMap, setColMap] = useState({ name: "", phone: "", email: "", source: "", service_interest: "", city: "" });

  const [batches, setBatches] = useState([]);
  const [openBatch, setOpenBatch] = useState(null);
  const [batchLeads, setBatchLeads] = useState([]);
  const [batchEmpFilter, setBatchEmpFilter] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  const [detailLead, setDetailLead] = useState(null);
  const [detailCareerLead, setDetailCareerLead] = useState(null);

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

  const handleFileSelect = async (file) => {
    if (!file) return;
    setImportFile(file);
    setPreviewLoading(true);
    setShowMappingDialog(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/leads/import-excel/preview`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setImportPreview(data);
        setColMap({
          name: data.auto_map.name ?? "",
          phone: data.auto_map.phone ?? "",
          email: data.auto_map.email ?? "",
          source: data.auto_map.source ?? "",
          service_interest: data.auto_map.service_interest ?? "",
          city: data.auto_map.city ?? "",
        });
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Could not read this Excel file.");
        setShowMappingDialog(false);
        setImportFile(null);
      }
    } catch {
      alert("Could not read this Excel file.");
      setShowMappingDialog(false);
      setImportFile(null);
    }
    setPreviewLoading(false);
  };

  const confirmMapping = () => {
    if (colMap.phone === "") {
      alert("Select which column has the phone number — every lead needs at least a phone number.");
      return;
    }
    setShowMappingDialog(false);
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
    // Column mapping confirmed on the previous screen — always sent explicitly
    // (blank -> -1, "not present in this file") so the import uses exactly
    // what was shown/confirmed rather than re-guessing from headers.
    for (const [field, idx] of Object.entries(colMap)) {
      url += `&${field}_col=${idx === "" ? -1 : idx}`;
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
    setImportPreview(null);
    setColMap({ name: "", phone: "", email: "", source: "", service_interest: "", city: "" });
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

        {/* Import Column Mapping */}
        <PortalModal
          open={showMappingDialog}
          onOpenChange={(v) => { setShowMappingDialog(v); if (!v) { setImportFile(null); setImportPreview(null); } }}
          title="Import Leads — Match Columns"
          maxWidth="max-w-lg"
        >
          {previewLoading ? (
            <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC]">Reading file...</p>
          ) : importPreview ? (
            <>
              <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2">
                {importPreview.total_rows} rows found. Tell us which column is which — only Phone is required.
              </p>
              <div className="space-y-2.5">
                {[
                  ["phone", "Phone Number *"],
                  ["name", "Name"],
                  ["email", "Email"],
                  ["city", "City"],
                  ["service_interest", "Service / Interest"],
                  ["source", "Source"],
                ].map(([field, label]) => (
                  <div key={field} className="flex items-center gap-3">
                    <label className="text-xs font-medium text-[#0E1B2C] dark:text-[#F1EDE3] w-36 shrink-0">{label}</label>
                    <select
                      value={colMap[field]}
                      onChange={(e) => setColMap((prev) => ({ ...prev, [field]: e.target.value === "" ? "" : Number(e.target.value) }))}
                      className="flex-1 border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30"
                    >
                      <option value="">— Not in this file —</option>
                      {importPreview.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {importPreview.sample_rows.length > 0 && (
                <div className="bg-[#FBF7EE] dark:bg-white/5 rounded-lg p-2.5 overflow-x-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2A364B]/50 dark:text-[#8E99AC] mb-1.5">Preview (first rows)</p>
                  <table className="text-xs w-full">
                    <thead>
                      <tr>{importPreview.headers.map((h, i) => <th key={i} className="text-left font-medium text-[#2A364B]/60 dark:text-[#8E99AC] pr-3 whitespace-nowrap">{h || `Col ${i + 1}`}</th>)}</tr>
                    </thead>
                    <tbody>
                      {importPreview.sample_rows.map((row, ri) => (
                        <tr key={ri}>{row.map((c, ci) => <td key={ci} className="pr-3 text-[#0E1B2C] dark:text-[#F1EDE3] whitespace-nowrap">{c}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowMappingDialog(false); setImportFile(null); setImportPreview(null); }}>Cancel</Button>
                <Button className="flex-1 bg-gradient-to-r from-[#024396] to-[#0356c4]" onClick={confirmMapping}>Next: Assign →</Button>
              </div>
            </>
          ) : null}
        </PortalModal>

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

        {/* Career Application Detail Modal */}
        <PortalModal
          open={!!detailCareerLead}
          onOpenChange={(v) => !v && setDetailCareerLead(null)}
          title={detailCareerLead?.full_name}
          description={detailCareerLead ? `${detailCareerLead.phone}${detailCareerLead.email ? ` | ${detailCareerLead.email}` : ""}` : ""}
          maxWidth="max-w-lg"
        >
          {detailCareerLead && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 flex-wrap">
                {detailCareerLead.photo_url && (
                  <img src={detailCareerLead.photo_url} alt={detailCareerLead.full_name} className="w-14 h-14 rounded-xl object-cover border border-[#E2D8C2] dark:border-white/10" />
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={detailCareerLead.status || "new"} />
                  {detailCareerLead.position && (
                    <span className="text-xs text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/10 px-2 py-0.5 rounded">{detailCareerLead.position}</span>
                  )}
                  {detailCareerLead.converted && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">In Leads</span>
                  )}
                </div>
              </div>

              <DetailSection title="Personal Details">
                <DetailRow label="Full Name" value={detailCareerLead.full_name} />
                <DetailRow label="Father's Name" value={detailCareerLead.father_name} />
                <DetailRow label="Mother's Name" value={detailCareerLead.mother_name} />
                <DetailRow label="Date of Birth" value={detailCareerLead.dob} />
                <DetailRow label="Gender" value={detailCareerLead.gender} />
                <DetailRow label="Marital Status" value={detailCareerLead.marital_status} />
              </DetailSection>

              <DetailSection title="Contact Details">
                <DetailRow label="Mobile Number" value={detailCareerLead.phone} />
                <DetailRow label="Alternate Mobile" value={detailCareerLead.alt_mobile} />
                <DetailRow label="Email ID" value={detailCareerLead.email} />
                <DetailRow label="City" value={detailCareerLead.city} />
                <DetailRow label="State" value={detailCareerLead.state} />
                <DetailRow label="Address" value={detailCareerLead.address} />
              </DetailSection>

              <DetailSection title="Position & Professional Info">
                <DetailRow label="Position Applying For" value={detailCareerLead.position} />
                <DetailRow label="Total Experience" value={detailCareerLead.experience} />
                <DetailRow label="Current Company" value={detailCareerLead.current_company} />
                <DetailRow label="Current Designation" value={detailCareerLead.current_designation} />
                <DetailRow label="Current Salary" value={detailCareerLead.current_salary} />
                <DetailRow label="Expected Salary" value={detailCareerLead.expected_salary} />
              </DetailSection>

              <DetailSection title="Education">
                <DetailRow label="Highest Qualification" value={detailCareerLead.qualification} />
                <DetailRow label="College/University" value={detailCareerLead.college} />
                <DetailRow label="Passing Year" value={detailCareerLead.passing_year} />
              </DetailSection>

              <DetailSection title="Skills">
                <DetailRow label="Selected Skills" value={(detailCareerLead.skills || []).join(", ")} />
                <DetailRow label="Other Skills" value={detailCareerLead.other_skills} />
              </DetailSection>

              <DetailSection title="Documents & Reference">
                {detailCareerLead.resume_url && (
                  <a href={detailCareerLead.resume_url} target="_blank" rel="noreferrer" className="text-xs text-[#024396] dark:text-[#7CB0FF] font-medium hover:underline block">View Resume ↗</a>
                )}
                {detailCareerLead.photo_url && (
                  <a href={detailCareerLead.photo_url} target="_blank" rel="noreferrer" className="text-xs text-[#024396] dark:text-[#7CB0FF] font-medium hover:underline block">View Photo ↗</a>
                )}
                <DetailRow label="Reference Name" value={detailCareerLead.ref_name} />
              </DetailSection>

              <DetailSection title="Additional Information">
                <DetailRow
                  label="How did you hear about us?"
                  value={detailCareerLead.hear_about_us === "Other" ? `Other — ${detailCareerLead.hear_about_us_other || ""}` : detailCareerLead.hear_about_us}
                />
                <DetailRow label="Why join TFD?" value={detailCareerLead.why_join} />
                <DetailRow label="Anything else?" value={detailCareerLead.additional_info} />
                <DetailRow label="Applied On" value={detailCareerLead.created_at ? new Date(detailCareerLead.created_at).toLocaleString("en-IN") : ""} />
              </DetailSection>
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
            convertCareerLead={convertCareerLead} deleteCareerLead={deleteCareerLead} setDetailCareerLead={setDetailCareerLead}
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

function DetailSection({ title, children }) {
  const hasContent = React.Children.toArray(children).some((c) => c?.props?.value ?? true);
  if (!hasContent) return null;
  return (
    <div className="pt-2 border-t border-[#E2D8C2] dark:border-white/10 first:border-t-0 first:pt-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#024396] dark:text-[#7CB0FF] mb-1.5">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-[#2A364B]/60 dark:text-[#8E99AC] shrink-0">{label}</span>
      <span className="text-[#0E1B2C] dark:text-[#F1EDE3] font-medium text-right">{value}</span>
    </div>
  );
}
