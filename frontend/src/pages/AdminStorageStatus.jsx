import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { RefreshCw, ChevronDown, ChevronUp, ExternalLink, Pencil, FileDown, Trash2 } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const UPGRADE_LINKS = {
  mongodb: "https://cloud.mongodb.com/",
  r2: "https://dash.cloudflare.com/?to=/:account/r2/overview",
  render: "https://dashboard.render.com/billing",
  netlify: "https://app.netlify.com/user/billing",
};

function fmtSize(mb) {
  if (mb == null) return "—";
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function tierColor(tier) {
  if (tier === "critical") return { bar: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" };
  if (tier === "warning") return { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" };
  return { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" };
}

function tierFor(percent) {
  if (percent >= 95) return "critical";
  if (percent >= 80) return "warning";
  return "ok";
}

function ServiceCard({ svc, onEdit, onMarkUpgraded }) {
  const [expanded, setExpanded] = useState(false);
  const tier = tierFor(svc.percent || 0);
  const colors = tierColor(tier);
  const freeMb = Math.max((svc.limit_mb || 0) - (svc.used_mb || 0), 0);

  return (
    <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{svc.label}</h3>
          {svc.account_email && <p className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC]">{svc.account_email}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!svc.live && (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#2A364B]/50 dark:text-[#8E99AC] bg-[#F5F1EB] dark:bg-white/5 px-1.5 py-0.5 rounded">Estimated</span>
          )}
          {tier !== "ok" && (
            <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${colors.badge}`}>
              {tier === "critical" ? "Critical" : "Warning"}
            </span>
          )}
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-[#F0EADD] dark:bg-white/10 overflow-hidden mb-2">
        <div className={`h-full ${colors.bar} transition-all`} style={{ width: `${Math.min(svc.percent || 0, 100)}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-3">
        <span>{fmtSize(svc.used_mb)} used</span>
        <span>{svc.percent || 0}%</span>
        <span>{fmtSize(freeMb)} free</span>
      </div>

      {svc.breakdown?.length > 0 && (
        <div className="mb-3">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-[#024396] dark:text-[#7CB0FF] font-medium">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Breakdown
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {svc.breakdown.map((b) => (
                <div key={b.category} className="flex items-center justify-between text-[11px] text-[#2A364B]/70 dark:text-[#8E99AC]">
                  <span>{b.category}</span>
                  <span className="font-mono">{fmtSize(b.size_mb)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-[#E2D8C2]/60 dark:border-white/10">
        <a
          href={UPGRADE_LINKS[svc.service]} target="_blank" rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/10 rounded-lg py-2 hover:bg-[#024396]/10 dark:hover:bg-white/15 transition-colors"
        >
          <ExternalLink size={12} /> Upgrade Plan
        </a>
        {!svc.live && (
          <button onClick={() => onEdit(svc.service)} className="w-8 h-8 rounded-lg bg-[#F5F1EB] dark:bg-white/5 flex items-center justify-center text-[#2A364B] dark:text-[#C7CEDA]" title="Edit figures">
            <Pencil size={13} />
          </button>
        )}
        <button onClick={() => onMarkUpgraded(svc)} className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC] hover:underline shrink-0">
          Mark as Upgraded
        </button>
      </div>
    </div>
  );
}

export default function AdminStorageStatus() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [editService, setEditService] = useState(null);
  const [editForm, setEditForm] = useState({ account_email: "", plan: "", limit_mb: "", used_mb: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/storage/status`, { headers });
      if (res.ok) setStatus(await res.json());
    } catch { /* silent */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/storage/refresh`, { method: "POST", headers });
      if (res.ok) setStatus(await res.json());
    } finally {
      setRefreshing(false);
    }
  };

  const openEdit = (service) => {
    const svc = status.services[service];
    setEditForm({
      account_email: svc.account_email || "",
      plan: svc.plan || "",
      limit_mb: svc.limit_mb || "",
      used_mb: svc.used_mb || "",
    });
    setEditService(service);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/storage/settings/${editService}`, {
      method: "PUT", headers,
      body: JSON.stringify({
        account_email: editForm.account_email || null,
        plan: editForm.plan || null,
        limit_mb: editForm.limit_mb ? Number(editForm.limit_mb) : null,
        used_mb: editForm.used_mb ? Number(editForm.used_mb) : null,
      }),
    });
    if (res.ok) {
      setStatus(await res.json());
      setEditService(null);
    }
  };

  const downloadReport = async () => {
    setDownloadingReport(true);
    try {
      const res = await fetch(`${API_BASE}/api/storage/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("Failed to generate report"); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tfd_storage_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate report");
    } finally {
      setDownloadingReport(false);
    }
  };

  const markUpgraded = async (svc) => {
    const newLimit = window.prompt(`New limit for ${svc.label} in MB (e.g. 1024 for 1 GB):`, svc.limit_mb || "");
    if (!newLimit || isNaN(Number(newLimit))) return;
    const res = await fetch(`${API_BASE}/api/storage/mark-upgraded/${svc.service}?new_limit_mb=${Number(newLimit)}`, {
      method: "POST", headers,
    });
    if (res.ok) setStatus(await res.json());
  };

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      <PageHeader
        icon="📦"
        title="Storage Status"
        subtitle={status ? `Last updated ${new Date(status.updated_at).toLocaleString("en-IN")}` : "Infrastructure usage across every service"}
        actions={
          <>
            <Link to="/portal/admin/data-cleanup">
              <Button variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                <Trash2 size={14} className="mr-1.5" /> Data Cleanup Tool
              </Button>
            </Link>
            <Button onClick={downloadReport} disabled={downloadingReport} variant="outline">
              <FileDown size={14} className="mr-1.5" /> {downloadingReport ? "Generating..." : "Generate Report"}
            </Button>
            <Button onClick={refresh} disabled={refreshing} className="bg-[#024396] hover:bg-[#023580]">
              <RefreshCw size={14} className={`mr-1.5 ${refreshing ? "animate-spin" : ""}`} /> {refreshing ? "Refreshing..." : "Refresh Now"}
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>
      ) : status ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.values(status.services).map((svc) => (
            <ServiceCard key={svc.service} svc={svc} onEdit={openEdit} onMarkUpgraded={markUpgraded} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC]">Could not load storage status.</p>
      )}

      <PortalModal open={!!editService} onOpenChange={(v) => !v && setEditService(null)} title={`Edit ${status?.services?.[editService]?.label || ""} figures`} maxWidth="max-w-sm">
        <form onSubmit={saveEdit} className="space-y-3">
          <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2">No billing API is connected for this service — enter what you see on its dashboard.</p>
          <input placeholder="Account email" value={editForm.account_email} onChange={(e) => setEditForm({ ...editForm, account_email: e.target.value })} className={field} />
          <input placeholder="Plan (e.g. Free, Starter)" value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })} className={field} />
          <input type="number" placeholder="Limit (MB)" value={editForm.limit_mb} onChange={(e) => setEditForm({ ...editForm, limit_mb: e.target.value })} className={field} />
          <input type="number" placeholder="Used (MB)" value={editForm.used_mb} onChange={(e) => setEditForm({ ...editForm, used_mb: e.target.value })} className={field} />
          <Button type="submit" className="w-full bg-[#024396] hover:bg-[#023580]">Save</Button>
        </form>
      </PortalModal>
    </PortalLayout>
  );
}
