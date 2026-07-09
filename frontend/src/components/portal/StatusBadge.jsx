import React from "react";
import { cn } from "../../lib/utils";

// Centralizes the status-color mapping that was previously redefined
// per-page (leads, tasks, leave requests, attendance, salary all had their
// own copy of roughly this same switch statement).
const STATUS_STYLES = {
  // Leads
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  follow_up: "bg-purple-50 text-purple-700 border-purple-200",
  interested: "bg-violet-50 text-violet-700 border-violet-200",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-red-50 text-red-700 border-red-200",
  not_interested: "bg-red-50 text-red-700 border-red-200",
  // Tasks / requests
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  // Attendance
  present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  absent: "bg-red-50 text-red-700 border-red-200",
  half_day: "bg-amber-50 text-amber-700 border-amber-200",
  "half-day": "bg-amber-50 text-amber-700 border-amber-200", // attendance stores it hyphenated
  leave: "bg-purple-50 text-purple-700 border-purple-200",
  // Generic
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
};

const DEFAULT_STYLE = "bg-slate-100 text-slate-600 border-slate-200";

export default function StatusBadge({ status, label, className = "" }) {
  if (!status) return null;
  const style = STATUS_STYLES[status] || DEFAULT_STYLE;
  const text = label || String(status).replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize whitespace-nowrap",
        style,
        className
      )}
    >
      {text}
    </span>
  );
}
