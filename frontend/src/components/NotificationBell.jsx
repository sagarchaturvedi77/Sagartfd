import React from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiSend } from "../portal/api";

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const typeIcon = {
  holiday: "🌴",
  announcement: "📢",
  lead: "🎯",
  employee_lead_added: "🙋",
  task: "✅",
  target: "📈",
  storage_warning: "📦",
  general: "🔔",
};

export default function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [unread, setUnread] = React.useState(0);
  const navigate = useNavigate();
  const ref = React.useRef(null);

  const loadCount = React.useCallback(async () => {
    try {
      const r = await apiGet("/api/notifications/unread-count");
      setUnread(r.unread || 0);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const loadList = React.useCallback(async () => {
    try {
      setItems(await apiGet("/api/notifications/"));
    } catch (e) {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 30000);
    return () => clearInterval(t);
  }, [loadCount]);

  React.useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadList();
  };

  const markAllRead = async () => {
    await apiSend("/api/notifications/mark-all-read", "POST");
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const onItem = async (n) => {
    if (!n.read) {
      await apiSend(`/api/notifications/mark-read/${n.id}`, "POST");
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-[#E2D8C2] overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2D8C2] bg-[#F5F1EB]">
            <span className="font-semibold text-[#0E1B2C] text-sm">Notifications</span>
            {items.some((n) => !n.read) && (
              <button onClick={markAllRead} className="text-xs text-[#024396] hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#2A364B]/50">
                No notifications yet
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onItem(n)}
                  className={`w-full text-left flex gap-3 px-4 py-3 border-b border-[#F0EADD] hover:bg-[#F5F1EB] transition-colors ${
                    n.read ? "" : "bg-[#024396]/5"
                  }`}
                >
                  <span className="text-lg leading-none mt-0.5">{typeIcon[n.type] || "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0E1B2C] truncate">{n.title}</p>
                    <p className="text-xs text-[#2A364B]/70 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-[#2A364B]/40 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#024396] mt-1.5 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
