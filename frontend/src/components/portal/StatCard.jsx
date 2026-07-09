import React from "react";
import { cn } from "../../lib/utils";

const GRADIENTS = {
  navy: "from-[#024396] to-[#0356c4]",
  red: "from-[#C7102E] to-[#e0334f]",
  green: "from-emerald-500 to-emerald-600",
  purple: "from-violet-500 to-violet-600",
  amber: "from-amber-500 to-amber-600",
  slate: "from-slate-500 to-slate-600",
};

/**
 * The metric-tile pattern used on every dashboard/list page's stats row:
 * small uppercase label, big gradient-text value, optional icon/trend/click.
 */
export default function StatCard({ label, value, icon, color = "navy", trend, onClick, compact = false, active = false, className = "" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card text-left w-full shadow-sm",
        active ? "border-[#024396] dark:border-[#4C8DFF] ring-2 ring-[#024396]/20 dark:ring-[#4C8DFF]/30" : "border-[#E2D8C2] dark:border-white/10",
        compact ? "p-3" : "p-4",
        onClick && "hover:border-[#024396]/30 dark:hover:border-[#4C8DFF]/40 transition-all cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-[#2A364B]/50 dark:text-[#8E99AC] uppercase tracking-wider mb-1 truncate">{label}</p>
          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold bg-gradient-to-r ${GRADIENTS[color] || GRADIENTS.navy} bg-clip-text text-transparent`}>
            {value}
          </p>
          {trend && <p className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC] mt-0.5">{trend}</p>}
        </div>
        {icon && <span className="text-lg opacity-70 shrink-0" aria-hidden="true">{icon}</span>}
      </div>
    </Tag>
  );
}
