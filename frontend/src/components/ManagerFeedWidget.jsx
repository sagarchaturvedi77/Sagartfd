import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

// A small, track-specific "message from your manager" — rotates once a day
// from a fixed, pre-written pool (see backend's GET /manager-feed). Purely
// flavour/engagement, fails silently (renders nothing) if it can't load.
export default function ManagerFeedWidget() {
  const { token } = useInternshipAuth();
  const [feed, setFeed] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/internship/manager-feed`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok && !cancelled) setFeed(await res.json());
      } catch {
        // silent — this is a nice-to-have widget, not critical path
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (!feed) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] shrink-0">
        <MessageSquare size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-white/45">
          A note from <span className="text-white/70">{feed.persona_name}</span>, {feed.persona_role}
        </p>
        <p className="text-sm text-white/80 leading-relaxed mt-1 italic">"{feed.message}"</p>
      </div>
    </div>
  );
}
