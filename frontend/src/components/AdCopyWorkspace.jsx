import React from "react";

// Marketing-track practice tool — a creative brief for a fictional brand.
// Nothing written here is ever posted or targeted anywhere real; `value`
// is a controlled object: { hooks: [{headline, caption}, ...], audience: {age, income, location} }.

export function buildAdCopySummary(seedData, value) {
    const { company, campaign_brief } = seedData || {};
    const hooks = value?.hooks || [];
    const audience = value?.audience || {};
    const lines = [`Ad Campaign Brief — ${company || "the company"}: ${campaign_brief || ""}`];
    hooks.forEach((h, i) => {
        lines.push(`Hook ${i + 1}: "${(h?.headline || "").trim() || "(not written yet)"}" — ${(h?.caption || "").trim() || "(no caption yet)"}`);
    });
    lines.push(`Target audience: Age ${audience.age || "not selected"}, Income ${audience.income || "not selected"}, Location ${audience.location || "not selected"}.`);
    return lines.join("\n");
}

export default function AdCopyWorkspace({ seedData, value, onChange, disabled }) {
    const { company, campaign_brief, audience_options } = seedData || {};
    const hooks = value?.hooks?.length ? value.hooks : [{}, {}, {}];
    const audience = value?.audience || {};

    const setHook = (idx, patch) => {
        const next = [...hooks];
        next[idx] = { ...next[idx], ...patch };
        onChange({ ...value, hooks: next });
    };
    const setAudience = (patch) => onChange({ ...value, audience: { ...audience, ...patch } });

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 space-y-4">
            <p className="text-[11px] text-white/45">
                {company} — {campaign_brief} This is a practice brief only, nothing gets published anywhere.
            </p>

            <div className="space-y-2.5">
                {hooks.slice(0, 3).map((h, i) => (
                    <div key={i} className="rounded-lg border border-white/10 bg-[#0B1424] p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#14E0A0] mb-1.5">Hook {i + 1}</p>
                        <input
                            value={h?.headline || ""}
                            disabled={disabled}
                            onChange={(e) => setHook(i, { headline: e.target.value })}
                            placeholder="Headline / hook"
                            className="w-full bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60"
                        />
                        <textarea
                            value={h?.caption || ""}
                            disabled={disabled}
                            onChange={(e) => setHook(i, { caption: e.target.value })}
                            placeholder="Caption (1-2 lines)"
                            rows={2}
                            className="w-full mt-1.5 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60 resize-none"
                        />
                    </div>
                ))}
            </div>

            <div className="rounded-lg border border-[#14E0A0]/25 bg-[#14E0A0]/[0.06] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#14E0A0] mb-2">Audience Targeting</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {Object.entries(audience_options || {}).map(([key, options]) => (
                        <label key={key} className="text-[10px] text-white/50 capitalize">
                            {key}
                            <select
                                value={audience[key] || ""}
                                disabled={disabled}
                                onChange={(e) => setAudience({ [key]: e.target.value })}
                                className="w-full mt-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#14E0A0]/60"
                            >
                                <option value="" className="bg-[#0B1424]">Select...</option>
                                {options.map((o) => (
                                    <option key={o} value={o} className="bg-[#0B1424]">{o}</option>
                                ))}
                            </select>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
