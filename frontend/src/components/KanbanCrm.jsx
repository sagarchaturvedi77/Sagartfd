import React from "react";
import { GripVertical } from "lucide-react";

// A real Kanban pipeline UI for Sales-track practice tasks — every lead in
// `seedData.leads` is a fictional prospect invented for the exercise (never
// a real person, never fed anywhere outside this task). `value` is a
// controlled map of { [leadId]: { stage, note } }; `onChange(leadId, patch)`
// merges a partial update for one lead. Grading happens on the text summary
// this tool composes (see buildKanbanSummary below), not on stage placement
// itself — there's no single "correct" board, the point is the reasoning.

export function buildKanbanSummary(seedData, value) {
    const { company, leads = [] } = seedData || {};
    const lines = [`Sales Pipeline — ${company || "the company"}`];
    for (const lead of leads) {
        const v = value?.[lead.id] || {};
        const stage = v.stage || "New Lead";
        const note = (v.note || "").trim();
        lines.push(`- ${lead.name} (${lead.business}) -> ${stage}${note ? `: ${note}` : " (no reason given yet)"}`);
    }
    return lines.join("\n");
}

export default function KanbanCrm({ seedData, value, onChange, disabled }) {
    const { company, stages = [], leads = [] } = seedData || {};

    const leadsByStage = (stage) =>
        leads.filter((l) => (value?.[l.id]?.stage || stages[0]) === stage);

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
            <p className="text-[11px] text-white/45 mb-3">
                {company ? `Practice pipeline for ${company} — ` : ""}all leads below are fictional, invented for this exercise.
            </p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                {stages.map((stage) => (
                    <div key={stage} className="min-w-[220px] w-[220px] shrink-0">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#14E0A0]">{stage}</p>
                            <span className="text-[10px] text-white/35">{leadsByStage(stage).length}</span>
                        </div>
                        <div className="space-y-2 min-h-[60px]">
                            {leadsByStage(stage).map((lead) => {
                                const v = value?.[lead.id] || {};
                                return (
                                    <div key={lead.id} className="rounded-lg border border-white/10 bg-[#0B1424] p-2.5">
                                        <div className="flex items-start gap-1.5">
                                            <GripVertical size={12} className="text-white/20 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{lead.name}</p>
                                                <p className="text-[10px] text-white/45 truncate">{lead.business}</p>
                                            </div>
                                        </div>
                                        <p className="text-[10.5px] text-white/50 mt-1.5 leading-snug">{lead.note}</p>
                                        <select
                                            value={v.stage || stages[0]}
                                            disabled={disabled}
                                            onChange={(e) => onChange(lead.id, { stage: e.target.value })}
                                            className="w-full mt-2 bg-white/5 border border-white/15 rounded-md px-1.5 py-1 text-[10.5px] text-white focus:outline-none focus:border-[#14E0A0]/60"
                                        >
                                            {stages.map((s) => (
                                                <option key={s} value={s} className="bg-[#0B1424]">{s}</option>
                                            ))}
                                        </select>
                                        <textarea
                                            value={v.note || ""}
                                            disabled={disabled}
                                            onChange={(e) => onChange(lead.id, { note: e.target.value })}
                                            placeholder="Why this stage? (your reason)"
                                            rows={2}
                                            className="w-full mt-1.5 bg-white/5 border border-white/15 rounded-md px-1.5 py-1 text-[10.5px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60 resize-none"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
