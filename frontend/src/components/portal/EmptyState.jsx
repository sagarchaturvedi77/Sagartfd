import React from "react";

/**
 * The "no X yet" placeholder pattern, standardized — every page previously
 * rolled its own version of this with slightly different spacing/copy.
 */
export default function EmptyState({ icon = "📭", title = "Nothing here yet", subtitle, action }) {
  return (
    <div className="py-12 px-4 text-center">
      <div className="text-3xl mb-2 opacity-60" aria-hidden="true">{icon}</div>
      <p className="text-sm font-medium text-[#2A364B]/70 dark:text-[#C7CEDA]">{title}</p>
      {subtitle && <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC] mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
