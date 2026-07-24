import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/table";
import EmptyState from "./EmptyState";

/**
 * Responsive data table: a real <table> on desktop (md+), a stacked
 * card-per-row list on mobile. This is the fix for the portal's biggest
 * mobile gap — wide tables that only ever got a horizontal-scroll wrapper,
 * unusable on a phone once a table has more than 4-5 columns.
 *
 * columns: [{ key, label, render?(row), hideBelow?: "md"|"lg", className? }]
 * hideBelow controls desktop column visibility only — mobile always shows
 * every column (as label:value rows) unless mobileHide is set on the column.
 */
export default function DataTable({ columns, rows, keyField = "id", onRowClick, empty, emptyIcon, emptyTitle = "Nothing here yet", emptySubtitle, loading, skeletonRows = 5 }) {
  // While the initial fetch is still in flight, `rows` is usually `[]` —
  // indistinguishable from a genuinely empty result. Rendering EmptyState in
  // that window (much shorter than a real table) then swapping to a full
  // table once data lands causes a visible layout jump. Callers that pass
  // `loading` get a same-shaped skeleton instead; callers that don't pass it
  // keep the previous behavior exactly.
  if (loading) {
    return (
      <div className="animate-pulse space-y-2" aria-hidden="true">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-[#F5F1EB] dark:bg-white/5" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return empty || <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle} />;
  }

  const hideClass = (hideBelow) => (hideBelow === "lg" ? "hidden lg:table-cell" : hideBelow === "md" ? "hidden md:table-cell" : "");

  // Rows with onRowClick were mouse/touch-only — no keyboard/screen-reader
  // user could ever activate them (no role, no tabIndex, no key handler).
  // role="button" + tabIndex + Enter/Space handling makes them behave like
  // a real interactive control without changing the visual table markup.
  const rowActivationProps = (row) =>
    onRowClick
      ? {
          role: "button",
          tabIndex: 0,
          onClick: () => onRowClick(row),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onRowClick(row);
            }
          },
        }
      : {};

  return (
    <>
      {/* Desktop / tablet: real table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#E2D8C2] dark:border-white/10 hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key} className={`text-[11px] font-semibold text-[#2A364B]/80 dark:text-[#C7CEDA] uppercase tracking-wider ${hideClass(col.hideBelow)} ${col.className || ""}`}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row[keyField]}
                className={`border-[#E2D8C2]/50 dark:border-white/10 ${onRowClick ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#024396] focus-visible:-outline-offset-2" : ""}`}
                {...rowActivationProps(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={`text-sm text-[#0E1B2C] dark:text-[#F1EDE3] ${hideClass(col.hideBelow)} ${col.className || ""}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards, one per row, every column shown as label:value */}
      <div className="md:hidden divide-y divide-[#E2D8C2]/60 dark:divide-white/10">
        {rows.map((row) => {
          const visibleCols = columns.filter((c) => !c.mobileHide);
          const primary = visibleCols[0];
          const rest = visibleCols.slice(1);
          return (
            <div
              key={row[keyField]}
              className={`py-3 px-1 ${onRowClick ? "cursor-pointer active:bg-[#FBF7EE] dark:active:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#024396] focus-visible:-outline-offset-2" : ""}`}
              {...rowActivationProps(row)}
            >

              {primary && (
                <div className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3] mb-1.5">
                  {primary.render ? primary.render(row) : row[primary.key]}
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {rest.map((col) => (
                  <div key={col.key} className="text-xs">
                    <span className="text-[#2A364B]/40 dark:text-[#8E99AC]">{col.label}: </span>
                    <span className="text-[#2A364B]/80 dark:text-[#C7CEDA]">{col.render ? col.render(row) : row[col.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
