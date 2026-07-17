import React, { useMemo } from "react";
import { cellId as makeCellId, indexToColLetter, mergeRawInputs, evaluateSheet } from "../lib/miniSpreadsheet";

// Soft, best-effort deterrent only — not real DRM, same posture as
// AntiCheatTextarea (StudentMissions.jsx / taskUi.jsx): a determined student
// can still retype pasted content by hand.
function blockClipboard(e) { e.preventDefault(); }

const HEADER_CLS = "sticky bg-[#1A2740] text-white/60 text-sm font-bold text-center border border-white/15 select-none";

// Controlled spreadsheet grid for finance-style tasks. `template` is the
// admin-authored starter grid (rows/cols/prefilled/locked_cells); `value` is
// the student's own edits, keyed by cellId, editable cells only — locked
// cells always render from `template.prefilled` regardless of `value`.
// Renders real Excel-style column-letter (A, B, C...) and row-number (1, 2,
// 3...) headers, sticky on scroll, so a formula like "=B15" is something a
// student can actually locate on the grid instead of counting cells blind.
export default function SpreadsheetGrid({ template, value, onChange, disabled }) {
  const { rows = 0, cols = 0, prefilled = {}, locked_cells = [] } = template || {};
  const lockedSet = useMemo(() => new Set(locked_cells), [locked_cells]);

  const rawInputs = useMemo(
    () => mergeRawInputs(template, value || {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [template, value],
  );
  const { values } = useMemo(() => evaluateSheet(rawInputs), [rawInputs]);

  if (!template || !rows || !cols) {
    return <p className="text-white/40 text-xs italic">No spreadsheet template configured for this task.</p>;
  }

  return (
    <div className="rounded-xl border border-white/15 overflow-hidden">
      <p className="text-[11px] text-white/40 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
        Formulas supported: <code className="text-white/60">=SUM(B2:B10)</code>,{" "}
        <code className="text-white/60">=AVERAGE(...)</code>, <code className="text-white/60">=IF(cond,a,b)</code>,
        and +−×÷ with cell references (e.g. <code className="text-white/60">=B2+B3</code>). Column letters and row
        numbers on the grid below match real spreadsheet cell references (e.g. B15 = column B, row 15). Not a full
        spreadsheet — other Excel functions aren't supported. Pasting is disabled here too — type formulas live.
      </p>
      <div className="overflow-auto max-h-[65vh]">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className={`${HEADER_CLS} left-0 top-0 z-20 w-11 min-w-[44px]`} />
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className={`${HEADER_CLS} top-0 z-10 min-w-[110px] px-3 py-2`}>
                  {indexToColLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                <th className={`${HEADER_CLS} left-0 z-10 w-11 min-w-[44px] px-1`}>{r + 1}</th>
                {Array.from({ length: cols }).map((_, c) => {
                  const id = makeCellId(r, c);
                  const isLocked = lockedSet.has(id);
                  const raw = rawInputs[id];
                  const computed = values[id];
                  const isFormula = typeof raw === "string" && raw.trim().startsWith("=");
                  const isError = typeof computed === "string" && computed.startsWith("#");
                  return (
                    <td
                      key={id}
                      className={`border border-white/10 align-top ${isLocked ? "bg-white/[0.05]" : "bg-transparent"}`}
                    >
                      {isLocked ? (
                        <div className="px-3 py-2 text-white/70 whitespace-nowrap min-w-[110px]">
                          {prefilled[id] ?? ""}
                        </div>
                      ) : (
                        <div className="min-w-[110px]">
                          <input
                            type="text"
                            value={raw === undefined || raw === null ? "" : raw}
                            disabled={disabled}
                            onChange={(e) => onChange(id, e.target.value)}
                            onCopy={blockClipboard}
                            onPaste={blockClipboard}
                            onCut={blockClipboard}
                            onContextMenu={blockClipboard}
                            className={`w-full px-3 py-2 bg-transparent text-right text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#14E0A0]/50 disabled:opacity-50 ${
                              isError ? "text-red-400" : "text-white"
                            }`}
                          />
                          {isFormula && (
                            <div className={`px-3 pb-1.5 text-xs text-right ${isError ? "text-red-400" : "text-[#14E0A0]/70"}`}>
                              = {String(computed)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
