import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

// HR-track practice tool — every candidate in `seedData.candidates` is a
// fictional profile invented for the exercise (never scraped from
// LinkedIn/Indeed or any real person). `value` is a controlled object:
// { decisions: { [candidateId]: { decision, reason } }, salary: { gross, basicPct, hraPct, bonusPct } }.

export function buildRosterSummary(seedData, value) {
    const { company, role, budget, candidates = [] } = seedData || {};
    const decisions = value?.decisions || {};
    const salary = value?.salary || {};
    const lines = [`Hiring Roster — ${role || "the role"} at ${company || "the company"} (budget: ${budget || "n/a"})`];
    for (const c of candidates) {
        const d = decisions[c.id] || {};
        const decision = d.decision || "Not decided yet";
        const reason = (d.reason || "").trim();
        lines.push(`- ${c.name}: ${decision}${reason ? ` — ${reason}` : ""}`);
    }
    if (salary.gross) {
        const gross = Number(salary.gross) || 0;
        const basic = Math.round((gross * (Number(salary.basicPct) || 0)) / 100);
        const hra = Math.round((gross * (Number(salary.hraPct) || 0)) / 100);
        const bonus = Math.round((gross * (Number(salary.bonusPct) || 0)) / 100);
        const other = gross - basic - hra - bonus;
        lines.push(`Salary breakup at Rs ${gross}/month: Basic Rs ${basic}, HRA Rs ${hra}, Bonus Rs ${bonus}, Other allowances Rs ${other}.`);
    }
    return lines.join("\n");
}

export default function RosterProcessor({ seedData, value, onChange, disabled }) {
    const { company, role, budget, candidates = [], salary_breakup_defaults } = seedData || {};
    const decisions = value?.decisions || {};
    const salary = value?.salary || {
        gross: "", basicPct: salary_breakup_defaults?.basic_pct ?? 50,
        hraPct: salary_breakup_defaults?.hra_pct ?? 20, bonusPct: salary_breakup_defaults?.bonus_pct ?? 10,
    };

    const setDecision = (id, patch) =>
        onChange({ ...value, decisions: { ...decisions, [id]: { ...decisions[id], ...patch } } });
    const setSalary = (patch) => onChange({ ...value, salary: { ...salary, ...patch } });

    const gross = Number(salary.gross) || 0;
    const basic = Math.round((gross * (Number(salary.basicPct) || 0)) / 100);
    const hra = Math.round((gross * (Number(salary.hraPct) || 0)) / 100);
    const bonus = Math.round((gross * (Number(salary.bonusPct) || 0)) / 100);
    const other = gross - basic - hra - bonus;

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 space-y-4">
            <p className="text-[11px] text-white/45">
                {role} at {company} — budget {budget}. All candidates below are fictional, invented for this exercise.
            </p>

            <div className="space-y-2">
                {candidates.map((c) => {
                    const d = decisions[c.id] || {};
                    return (
                        <div key={c.id} className="rounded-lg border border-white/10 bg-[#0B1424] p-2.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-white">{c.name}</p>
                                    <p className="text-[10.5px] text-white/50 mt-0.5 leading-snug">{c.summary}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => setDecision(c.id, { decision: "Screen In" })}
                                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${
                                            d.decision === "Screen In" ? "bg-[#14E0A0] text-[#050B16] border-[#14E0A0]" : "text-white/50 border-white/15 hover:border-white/30"
                                        }`}
                                    >
                                        <CheckCircle2 size={11} /> In
                                    </button>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => setDecision(c.id, { decision: "Reject" })}
                                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${
                                            d.decision === "Reject" ? "bg-red-500/80 text-white border-red-400" : "text-white/50 border-white/15 hover:border-white/30"
                                        }`}
                                    >
                                        <XCircle size={11} /> Reject
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={d.reason || ""}
                                disabled={disabled}
                                onChange={(e) => setDecision(c.id, { reason: e.target.value })}
                                placeholder="Why this decision? (tie it to budget/experience/fit)"
                                rows={2}
                                className="w-full mt-2 bg-white/5 border border-white/15 rounded-md px-1.5 py-1 text-[10.5px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60 resize-none"
                            />
                        </div>
                    );
                })}
            </div>

            <div className="rounded-lg border border-[#14E0A0]/25 bg-[#14E0A0]/[0.06] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#14E0A0] mb-2">Salary Breakup Calculator</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <label className="text-[10px] text-white/50">
                        Gross / month (Rs)
                        <input
                            type="number" min="0" disabled={disabled} value={salary.gross}
                            onChange={(e) => setSalary({ gross: e.target.value })}
                            className="w-full mt-1 bg-white/5 border border-white/15 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#14E0A0]/60"
                        />
                    </label>
                    <div />
                    {[["basicPct", "Basic %"], ["hraPct", "HRA %"], ["bonusPct", "Bonus %"]].map(([key, label]) => (
                        <label key={key} className="text-[10px] text-white/50">
                            {label}
                            <input
                                type="number" min="0" max="100" disabled={disabled} value={salary[key]}
                                onChange={(e) => setSalary({ [key]: e.target.value })}
                                className="w-full mt-1 bg-white/5 border border-white/15 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#14E0A0]/60"
                            />
                        </label>
                    ))}
                </div>
                {gross > 0 && (
                    <div className="grid grid-cols-4 gap-1.5 text-center mt-2">
                        <div className="rounded bg-white/5 py-1.5"><p className="text-[11px] font-bold text-white">{basic}</p><p className="text-[9px] text-white/40">Basic</p></div>
                        <div className="rounded bg-white/5 py-1.5"><p className="text-[11px] font-bold text-white">{hra}</p><p className="text-[9px] text-white/40">HRA</p></div>
                        <div className="rounded bg-white/5 py-1.5"><p className="text-[11px] font-bold text-white">{bonus}</p><p className="text-[9px] text-white/40">Bonus</p></div>
                        <div className="rounded bg-white/5 py-1.5"><p className="text-[11px] font-bold text-white">{other}</p><p className="text-[9px] text-white/40">Other</p></div>
                    </div>
                )}
            </div>
        </div>
    );
}
