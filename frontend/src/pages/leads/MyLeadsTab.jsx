import React from "react";
import { Trash2 } from "lucide-react";
import StatCard from "../../components/portal/StatCard";
import DataTable from "../../components/portal/DataTable";
import StatusBadge from "../../components/portal/StatusBadge";

const STATUS_LABELS = {
  new: "New", contacted: "Contacted", follow_up: "Follow Up",
  interested: "Interested", converted: "Converted", lost: "Lost",
};

export default function MyLeadsTab({ myLeads, stats, filter, setFilter, employees, assignLead, deleteLead, setDetailLead }) {
  const countFor = (key) => key === "follow_up"
    ? myLeads.filter((l) => l.follow_up_date && !["lost", "converted"].includes(l.status)).length
    : myLeads.filter((l) => l.status === key).length;

  const filtered = filter
    ? myLeads.filter((l) => (filter === "follow_up"
        ? l.follow_up_date && !["lost", "converted"].includes(l.status)
        : l.status === filter))
    : myLeads;

  const columns = [
    {
      key: "name", label: "Name",
      render: (lead) => (
        <div>
          <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{lead.name}</p>
          {lead.city && <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC]">{lead.city}</p>}
        </div>
      ),
    },
    { key: "phone", label: "Phone" },
    { key: "service_interest", label: "Service", hideBelow: "md", render: (lead) => lead.service_interest || "—" },
    { key: "status", label: "Status", render: (lead) => <StatusBadge status={lead.status} label={STATUS_LABELS[lead.status]} /> },
    {
      key: "actions", label: "Actions",
      render: (lead) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <select
            value=""
            onChange={(e) => e.target.value && assignLead(lead.id, e.target.value)}
            className="text-xs border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2 py-1.5 text-[#024396] dark:text-[#7CB0FF] bg-white max-w-[140px]"
          >
            <option value="">Reassign to...</option>
            {employees.filter((emp) => emp.is_active !== false).map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <button
            onClick={() => deleteLead(lead.id)}
            className="w-8 h-8 shrink-0 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <StatCard
              key={key}
              label={label}
              value={countFor(key)}
              active={filter === key}
              compact
              onClick={() => setFilter(filter === key ? "" : key)}
            />
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          rows={filtered}
          onRowClick={setDetailLead}
          emptyIcon="📋"
          emptyTitle="No leads assigned to you"
          emptySubtitle="Assign leads to yourself during import or manually."
        />
      </div>
    </>
  );
}
