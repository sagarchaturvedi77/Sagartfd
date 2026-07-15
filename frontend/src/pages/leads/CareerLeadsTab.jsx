import React from "react";
import { X, Eye } from "lucide-react";
import EmptyState from "../../components/portal/EmptyState";

export default function CareerLeadsTab({ careerLeads, employees, updateCareerStatus, convertCareerLead, deleteCareerLead, setDetailCareerLead }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC]">Applications from the Career page</p>
      {careerLeads.length === 0 ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm">
          <EmptyState icon="💼" title="No career applications yet" />
        </div>
      ) : (
        <div className="space-y-3">
          {careerLeads.map((cl) => (
            <div key={cl.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <button onClick={() => setDetailCareerLead(cl)} className="space-y-1 text-left cursor-pointer hover:opacity-80">
                  <p className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{cl.full_name}</p>
                  <p className="text-xs text-[#2A364B]/70 dark:text-[#C7CEDA]">{cl.phone} {cl.email && `| ${cl.email}`}</p>
                  {cl.position && <p className="text-xs text-[#024396] dark:text-[#7CB0FF]">Applied for: {cl.position}</p>}
                  <p className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/70">{new Date(cl.created_at).toLocaleDateString("en-IN")}</p>
                </button>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => setDetailCareerLead(cl)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/10 hover:bg-[#024396]/10 dark:hover:bg-white/15 whitespace-nowrap"
                  >
                    <Eye size={13} /> View
                  </button>
                  <select value={cl.status || "new"} onChange={(e) => updateCareerStatus(cl.id, e.target.value)} className="text-xs border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2 py-1.5">
                    <option value="new">New</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {cl.converted ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">In Leads</span>
                  ) : (
                    <>
                      <select
                        defaultValue=""
                        onChange={(e) => convertCareerLead(cl.id, e.target.value || undefined)}
                        className="text-xs border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2 py-1.5 text-[#024396] dark:text-[#7CB0FF] bg-white max-w-[140px]"
                      >
                        <option value="" disabled>Assign to...</option>
                        {employees.filter((emp) => emp.is_active !== false).map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => convertCareerLead(cl.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#024396] hover:bg-[#023580] whitespace-nowrap"
                      >
                        Convert Only
                      </button>
                    </>
                  )}
                  <button onClick={() => deleteCareerLead(cl.id)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
