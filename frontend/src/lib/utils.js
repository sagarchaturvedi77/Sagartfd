import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// The lead "code" field means something different depending on what was
// sold — a Demat account needs the Client ID, a course/plan needs its
// name/code. Shared between CallFlowPopup (capture) and the lead detail
// views (display) so the label always matches.
export function codeFieldLabel(serviceInterest) {
  const s = (serviceInterest || "").toLowerCase();
  if (s.includes("demat")) return "Demat Client ID";
  if (s.includes("course")) return "Course Name / Code";
  return "Plan / Code Name";
}

export function timeAgo(isoString) {
  if (!isoString) return "";
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
