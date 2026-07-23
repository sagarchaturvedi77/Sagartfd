import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

// Reusable "problem the market has → what TFD does about it" block. Visual
// language (accent colour) is passed in per page so it matches that page's
// own distinct palette instead of looking like a repeated template. Now a
// real two-row <table> (row header = label+icon cell, second cell = the
// copy) instead of two side-by-side cards — reads as a literal problem/
// solution comparison rather than a matched pair of badges. `overflow-x-auto`
// on the wrapper is a safety net only; cell text wraps normally so it
// shouldn't actually need to scroll at any viewport width.
export default function ProblemSolution({ accent = "#024396", problem, solution, problemLabel = "The problem", solutionLabel = "What we do about it" }) {
  return (
    <section className="bg-white py-14 md:py-16 px-6 border-t border-[#E2D8C2]">
      <div className="container-x max-w-4xl mx-auto overflow-x-auto">
        <table className="w-full border-collapse rounded-2xl overflow-hidden text-left">
          <tbody>
            <tr>
              <td
                className="align-top w-[34%] sm:w-[28%] p-4 sm:p-5 border"
                style={{ background: "#FBEAE8", borderColor: "#E8C4C0" }}
              >
                <div className="inline-flex items-center gap-2 text-[10.5px] sm:text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#A33B33" }}>
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{problemLabel}</span>
                </div>
              </td>
              <td
                className="align-top p-4 sm:p-5 border text-sm text-[#3A2E2C] leading-relaxed"
                style={{ background: "#FBEAE8", borderColor: "#E8C4C0" }}
              >
                {problem}
              </td>
            </tr>
            <tr>
              <td
                className="align-top w-[34%] sm:w-[28%] p-4 sm:p-5 border"
                style={{ background: `${accent}0D`, borderColor: `${accent}33` }}
              >
                <div className="inline-flex items-center gap-2 text-[10.5px] sm:text-[11px] uppercase tracking-wider font-semibold" style={{ color: accent }}>
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{solutionLabel}</span>
                </div>
              </td>
              <td
                className="align-top p-4 sm:p-5 border text-sm text-[#2A364B] leading-relaxed"
                style={{ background: `${accent}0D`, borderColor: `${accent}33` }}
              >
                {solution}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
