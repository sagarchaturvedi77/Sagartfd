import React, { useEffect, useState, useCallback } from "react";
import { UserPlus, FileSpreadsheet, Download, CheckSquare, Activity } from "lucide-react";
import { timeAgo } from "../../lib/utils";
import EmptyState from "./EmptyState";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const ACTION_ICON = {
  lead_added: UserPlus,
  lead_imported: FileSpreadsheet,
  report_downloaded: Download,
  task_added: CheckSquare,
};

/** Admin's own recent actions (leads added/imported, reports downloaded,
 * tasks added, ...) — replaces a raw list of lead phone numbers with what
 * the admin actually *did*. */
export default function AdminActivityLog({ token, limit = 8 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/activity/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setItems(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (items.length === 0) {
    return <EmptyState icon="🕓" title="No recent activity yet" subtitle="Actions you take — adding leads, imports, reports, tasks — will show up here." />;
  }

  return (
    <div className="divide-y divide-[#E2D8C2]/60 dark:divide-white/10">
      {items.slice(0, limit).map((item) => {
        const Icon = ACTION_ICON[item.action] || Activity;
        return (
          <div key={item.id} className="flex items-center gap-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#024396] dark:text-[#7CB0FF] flex items-center justify-center shrink-0">
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3] truncate">{item.description}</p>
              <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] truncate">{item.actor_name} · {timeAgo(item.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
