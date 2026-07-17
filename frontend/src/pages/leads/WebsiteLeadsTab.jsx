import React from "react";
import { X } from "lucide-react";
import EmptyState from "../../components/portal/EmptyState";

export default function WebsiteLeadsTab({ webLeads, employees, convertWebLead, convertingWebLead, deleteWebLead, deletingWebLead }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC]">Leads from website contact form & popup</p>
      {webLeads.length === 0 ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm">
          <EmptyState icon="🌐" title="No website leads yet" />
        </div>
      ) : (
        <div className="space-y-3">
          {webLeads.map((wl) => (
            <div key={wl.id} className={`bg-white dark:bg-[#101D2E] rounded-2xl border p-5 shadow-sm ${wl.converted ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10" : "border-[#E2D8C2] dark:border-white/10"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{wl.full_name || wl.name}</p>
                  <p className="text-xs text-[#2A364B]/70 dark:text-[#C7CEDA]">{wl.phone} {wl.email && `| ${wl.email}`}</p>
                  {wl.service && <p className="text-xs text-[#024396] dark:text-[#7CB0FF]">Service: {wl.service}</p>}
                  {wl.message && <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] mt-1">{wl.message}</p>}
                  <p className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/70">{wl.source || "website"} | {new Date(wl.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {wl.converted ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">Converted</span>
                  ) : (
                    <>
                      <select
                        defaultValue=""
                        onChange={(e) => convertWebLead(wl.id, e.target.value || undefined)}
                        disabled={convertingWebLead}
                        className="text-xs border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2 py-1.5 text-[#024396] dark:text-[#7CB0FF] bg-white max-w-[140px] disabled:opacity-60"
                      >
                        <option value="" disabled>Assign to...</option>
                        {employees.filter((emp) => emp.is_active !== false).map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => convertWebLead(wl.id)}
                        disabled={convertingWebLead}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#024396] hover:bg-[#023580] whitespace-nowrap disabled:opacity-60"
                      >
                        {convertingWebLead ? "Converting..." : "Convert Only"}
                      </button>
                    </>
                  )}
                  <button onClick={() => deleteWebLead(wl.id)} disabled={deletingWebLead} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-400 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-60">
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
