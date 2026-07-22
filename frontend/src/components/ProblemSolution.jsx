import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

// Reusable "problem the market has → what TFD does about it" block. Visual
// language (accent colour, background) is passed in per page so it matches
// that page's own distinct palette instead of looking like a repeated
// template — only the two-column problem/solution structure is shared.
export default function ProblemSolution({ accent = "#024396", problem, solution, problemLabel = "The problem", solutionLabel = "What we do about it" }) {
  return (
    <section className="bg-white py-14 md:py-16 px-6 border-t border-[#E2D8C2]">
      <div className="container-x max-w-4xl mx-auto grid sm:grid-cols-2 gap-5">
        <div className="rounded-2xl p-6 border" style={{ background: "#FBEAE8", borderColor: "#E8C4C0" }}>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A33B33" }}>
            <AlertTriangle size={14} /> {problemLabel}
          </div>
          <p className="text-sm text-[#3A2E2C] mt-3 leading-relaxed">{problem}</p>
        </div>
        <div className="rounded-2xl p-6 border" style={{ background: `${accent}0D`, borderColor: `${accent}33` }}>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: accent }}>
            <CheckCircle2 size={14} /> {solutionLabel}
          </div>
          <p className="text-sm text-[#2A364B] mt-3 leading-relaxed">{solution}</p>
        </div>
      </div>
    </section>
  );
}
