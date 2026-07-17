import React, { useMemo, useRef } from "react";
import { toast } from "sonner";
import { cellId as makeCellId, indexToColLetter, mergeRawInputs, evaluateSheet } from "../lib/miniSpreadsheet";

// Soft, best-effort deterrent only — not real DRM, same posture as
// AntiCheatTextarea (StudentMissions.jsx / taskUi.jsx): a determined student
// can still retype pasted content by hand.
function blockClipboard(e) { e.preventDefault(); }

// Extra scratch columns/rows appended beyond the task's own defined grid —
// a real spreadsheet always has far more columns than any one task needs;
// students use the empty space for rough/working calculations before
// committing a final value into the actual answer cells. These extra
// cells still participate in the same live formula engine (so a rough
// calculation can be referenced by a real cell, or vice versa), they're
// just never locked/prefilled and never graded (the answer key only ever
// references cells inside the task's own template.rows/cols).
const ROUGH_EXTRA_COLS = 8;
const ROUGH_EXTRA_ROWS = 15;

const HEADER_CLS = "sticky bg-gray-100 text-gray-500 text-sm font-bold text-center border border-gray-300 select-none";

// Controlled spreadsheet grid for finance-style tasks. `template` is the
// admin-authored starter grid (rows/cols/prefilled/locked_cells); `value` is
// the student's own edits, keyed by cellId, editable cells only — locked
// cells always render from `template.prefilled` regardless of `value`.
// Styled to look like a real (white, black-text) Excel sheet rather than
// matching the surrounding dark portal theme — deliberately a visually
// distinct "embedded spreadsheet" island, with real Excel-style
// column-letter (A, B, C...) / row-number (1, 2, 3...) headers, sticky on
// scroll, and a light TFD Internship watermark.
export default function SpreadsheetGrid({ template, value, onChange, disabled }) {
  const { rows: baseRows = 0, cols: baseCols = 0, prefilled = {}, locked_cells = [] } = template || {};
  const rows = baseRows ? baseRows + ROUGH_EXTRA_ROWS : 0;
  const cols = baseCols ? baseCols + ROUGH_EXTRA_COLS : 0;
  const lockedSet = useMemo(() => new Set(locked_cells), [locked_cells]);
  const roughNotedRef = useRef(false);

  const rawInputs = useMemo(
    () => mergeRawInputs({ ...template, rows, cols }, value || {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [template, value, rows, cols],
  );
  const { values } = useMemo(() => evaluateSheet(rawInputs), [rawInputs]);

  if (!template || !baseRows || !baseCols) {
    return <p className="text-white/40 text-xs italic">No spreadsheet template configured for this task.</p>;
  }

  const noteRoughArea = () => {
    if (roughNotedRef.current) return;
    roughNotedRef.current = true;
    toast.info("This is your Rough / Scratch Area — calculate freely here. Your final answers must go in the marked cells, not here.", { duration: 6000 });
  };

  return (
    <div className="rounded-xl border border-white/15 overflow-hidden">
      <p className="text-[11px] text-white/40 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
        Formulas supported: <code className="text-white/60">=SUM(B2:B10)</code>,{" "}
        <code className="text-white/60">=AVERAGE(...)</code>, <code className="text-white/60">=IF(cond,a,b)</code>,
        and +−×÷ with cell references (e.g. <code className="text-white/60">=B2+B3</code>). Column letters and row
        numbers match real spreadsheet cell references (e.g. B15 = column B, row 15). The shaded yellow area is your
        rough/scratch space — final answers go in the white/gray cells only. Not a full spreadsheet — other Excel
        functions aren't supported. Pasting is disabled here too — type formulas live.
      </p>
      <div className="relative overflow-auto max-h-[65vh] bg-white">
        <table className="border-collapse text-sm relative">
          <thead>
            <tr>
              <th className={`${HEADER_CLS} left-0 top-0 z-20 w-11 min-w-[44px]`} />
              {Array.from({ length: cols }).map((_, c) => (
                <th
                  key={c}
                  className={`${HEADER_CLS} top-0 z-10 min-w-[110px] px-3 py-2 ${c >= baseCols ? "bg-amber-100 text-amber-700" : ""}`}
                >
                  {indexToColLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                <th className={`${HEADER_CLS} left-0 z-10 w-11 min-w-[44px] px-1 ${r >= baseRows ? "bg-amber-100 text-amber-700" : ""}`}>
                  {r + 1}
                </th>
                {Array.from({ length: cols }).map((_, c) => {
                  const id = makeCellId(r, c);
                  const isLocked = lockedSet.has(id);
                  const isRough = r >= baseRows || c >= baseCols;
                  const raw = rawInputs[id];
                  const computed = values[id];
                  const isFormula = typeof raw === "string" && raw.trim().startsWith("=");
                  const isError = typeof computed === "string" && computed.startsWith("#");
                  return (
                    <td
                      key={id}
                      className={`border align-top ${
                        isLocked ? "bg-gray-100 border-gray-300" : isRough ? "bg-amber-50/70 border-amber-200" : "bg-white border-gray-200"
                      }`}
                    >
                      {isLocked ? (
                        <div className="px-3 py-2 text-gray-700 whitespace-nowrap min-w-[110px]">
                          {prefilled[id] ?? ""}
                        </div>
                      ) : (
                        <div className="min-w-[110px]">
                          <input
                            type="text"
                            value={raw === undefined || raw === null ? "" : raw}
                            disabled={disabled}
                            onFocus={isRough ? noteRoughArea : undefined}
                            onChange={(e) => onChange(id, e.target.value)}
                            onCopy={blockClipboard}
                            onPaste={blockClipboard}
                            onCut={blockClipboard}
                            onContextMenu={blockClipboard}
                            className={`w-full px-3 py-2 bg-transparent text-right text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#14E0A0]/60 disabled:opacity-50 ${
                              isError ? "text-red-600" : "text-gray-900"
                            }`}
                          />
                          {isFormula && (
                            <div className={`px-3 pb-1.5 text-xs text-right ${isError ? "text-red-600" : "text-gray-500"}`}>
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
        <div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          <span className="text-gray-400/40 text-5xl font-black tracking-widest -rotate-[20deg] whitespace-nowrap select-none">
            TFD INTERNSHIP
          </span>
        </div>
      </div>
    </div>
  );
}
