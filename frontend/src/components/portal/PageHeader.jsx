import React from "react";

/**
 * Standard page header: icon/title/subtitle on the left, actions on the right.
 * Replaces the `<div className="flex justify-between"><h2>...` pattern
 * copy-pasted at the top of every portal page.
 */
export default function PageHeader({ icon, title, subtitle, actions, className = "" }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-serif text-[#0E1B2C] dark:text-[#F1EDE3] flex items-center gap-2">
          {icon && <span aria-hidden="true">{icon}</span>}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
