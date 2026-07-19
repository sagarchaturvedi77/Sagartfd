import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useInternshipAuth } from "./InternshipAuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const POLL_MS = 30000;

function timeAgo(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
    const { token } = useInternshipAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [items, setItems] = useState([]);
    const ref = useRef(null);

    const loadUnread = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/internship/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json().catch(() => ({}));
            setUnread(json.unread || 0);
        } catch { /* silent — non-critical polling */ }
    };

    const loadList = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/internship/notifications`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json().catch(() => []);
            setItems(Array.isArray(json) ? json : []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (!token) return;
        loadUnread();
        const id = setInterval(loadUnread, POLL_MS);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const toggleOpen = async () => {
        const next = !open;
        setOpen(next);
        if (next) {
            await loadList();
            await fetch(`${API_BASE}/api/internship/notifications/mark-all-read`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            setUnread(0);
        }
    };

    const onItemClick = (n) => {
        setOpen(false);
        if (n.link) navigate(n.link);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={toggleOpen}
                aria-label="Notifications"
                data-testid="student-notification-bell"
                className="relative text-white/60 hover:text-white transition-colors shrink-0"
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#C7102E] text-white text-[9px] font-bold flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-[#0A0F1A] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
                    <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-bold text-white">Notifications</p>
                    </div>
                    {items.length === 0 ? (
                        <p className="text-white/40 text-xs text-center py-8 px-4">Nothing yet — task updates and manager messages will show up here.</p>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {items.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => onItemClick(n)}
                                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                                >
                                    <p className="text-xs font-semibold text-white">{n.title}</p>
                                    <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{n.body}</p>
                                    <p className="text-[10px] text-white/30 mt-1">{timeAgo(n.created_at)}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
