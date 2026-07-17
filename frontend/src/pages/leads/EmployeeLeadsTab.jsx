import React from "react";
import { Trash2, Download } from "lucide-react";
import DataTable from "../../components/portal/DataTable";
import StatusBadge from "../../components/portal/StatusBadge";
import EmptyState from "../../components/portal/EmptyState";
import { Button } from "../../components/ui/button";

const STATUS_LABELS = {
  new: "New", contacted: "Contacted", follow_up: "Follow Up",
  interested: "Interested", converted: "Converted", lost: "Lost",
};

export default function EmployeeLeadsTab({
  batches, openBatch, batchLeads, batchEmpFilter, batchLoading, employees,
  openBatchDetail, filterBatchByEmp, deleteBatch, deletingBatch, assignLead, assigning,
  setOpenBatch, setBatchLeads, setDetailLead,
  downloadBatchReport, downloadingBatchReport,
}) {
  if (openBatch) {
    const columns = [
      { key: "name", label: "Client", render: (lead) => <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{lead.name}</span> },
      { key: "phone", label: "Phone" },
      {
        key: "employee", label: "Employee",
        render: (lead) => (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={lead.assigned_to || ""}
              onChange={(e) => e.target.value && assignLead(lead.id, e.target.value)}
              disabled={assigning}
              className="text-xs border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2 py-1.5 text-[#024396] dark:text-[#7CB0FF] bg-white max-w-[160px] disabled:opacity-60"
            >
              {!lead.assigned_to && <option value="" disabled>{assigning ? "Assigning..." : "Choose employee"}</option>}
              {employees.filter((emp) => emp.is_active !== false).map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        ),
      },
      { key: "status", label: "Status", render: (lead) => <StatusBadge status={lead.status} label={STATUS_LABELS[lead.status]} /> },
    ];

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <button onClick={() => { setOpenBatch(null); setBatchLeads([]); }} className="text-xs text-[#024396] dark:text-[#7CB0FF] hover:underline mb-1">
              &larr; Back to batches
            </button>
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">
              Batch uploaded on {new Date(openBatch.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </h3>
            <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{openBatch.total} leads total</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={batchEmpFilter} onChange={(e) => filterBatchByEmp(e.target.value)} className="text-xs border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-3 py-1.5">
              <option value="">All Employees</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={() => downloadBatchReport(openBatch.batch_id)} disabled={downloadingBatchReport}>
              <Download size={13} className="mr-1" /> {downloadingBatchReport ? "Preparing..." : "Report"}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => deleteBatch(openBatch.batch_id)} disabled={deletingBatch}>
              <Trash2 size={13} className="mr-1" /> {deletingBatch ? "Deleting..." : "Delete Batch"}
            </Button>
          </div>
        </div>

        {batchLoading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
            <DataTable columns={columns} rows={batchLeads} onRowClick={setDetailLead} emptyTitle="No leads in this batch" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC]">Lead upload batches — click to view details</p>
      {batches.length === 0 ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm">
          <EmptyState icon="📦" title="No lead batches yet" subtitle="Import leads via Excel to see them here." />
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div key={batch.batch_id} className="w-full bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 shadow-sm hover:border-[#024396]/40 dark:hover:border-[#4C8DFF]/40 transition-all">
              <div onClick={() => openBatchDetail(batch)} className="cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{new Date(batch.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{batch.total} leads uploaded</p>
                  </div>
                  <span className="text-xs text-[#024396] dark:text-[#7CB0FF]">View &rarr;</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="text-center"><p className="text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3]">{batch.called}</p><p className="text-[9px] text-[#2A364B]/40 dark:text-[#8E99AC]">Called</p></div>
                  <div className="text-center"><p className="text-sm font-bold text-purple-600 dark:text-purple-400">{batch.interested}</p><p className="text-[9px] text-[#2A364B]/40 dark:text-[#8E99AC]">Interested</p></div>
                  <div className="text-center"><p className="text-sm font-bold text-orange-600 dark:text-orange-400">{batch.follow_up}</p><p className="text-[9px] text-[#2A364B]/40 dark:text-[#8E99AC]">Follow Up</p></div>
                  <div className="text-center"><p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{batch.converted}</p><p className="text-[9px] text-[#2A364B]/40 dark:text-[#8E99AC]">Converted</p></div>
                  <div className="text-center"><p className="text-sm font-bold text-red-600 dark:text-red-400">{batch.lost}</p><p className="text-[9px] text-[#2A364B]/40 dark:text-[#8E99AC]">Lost</p></div>
                </div>
                {(batch.incomplete_count > 0 || batch.duplicate_infile_count > 0 || batch.duplicate_existing_count > 0) && (
                  <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC] mt-3">
                    Skipped at import: {batch.incomplete_count} incomplete, {batch.duplicate_infile_count} duplicate-in-file, {batch.duplicate_existing_count} duplicate-in-database
                    {batch.reassigned_existing_count > 0 && ` (${batch.reassigned_existing_count} of those re-assigned)`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button onClick={() => downloadBatchReport(batch.batch_id)} disabled={downloadingBatchReport} className="text-[11px] font-medium text-[#024396] dark:text-[#7CB0FF] hover:underline disabled:opacity-60">
                  ⬇️ {downloadingBatchReport ? "Preparing..." : "Download report"}
                </button>
                <button onClick={() => deleteBatch(batch.batch_id)} disabled={deletingBatch} className="text-[11px] font-medium text-red-500 dark:text-red-400 hover:underline disabled:opacity-60">
                  🗑️ {deletingBatch ? "Deleting..." : "Delete this batch"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
