import React, { useState } from "react";
import { Languages, FileEdit, CheckCircle2, Clock3, XCircle } from "lucide-react";

// Shared between StudentMissions.jsx (task list) and TaskWorkspace.jsx (the
// dedicated task page) — kept in one place so both render task chrome
// (difficulty/status badges, the anti-paste textarea, the language toggle)
// identically.

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export const DIFFICULTY_STYLES = {
  easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/10 text-red-400 border-red-500/30",
};

export const STATUS_BADGE = {
  approved: { label: "Verified ✓", icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  pending: { label: "Checking...", icon: Clock3, cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  rejected: { label: "Not Verified — Resubmit", icon: XCircle, cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  draft: { label: "Draft Saved", icon: FileEdit, cls: "bg-white/10 text-white/60 border-white/20" },
};

// Soft, best-effort deterrent only — not real DRM. See PRD notes: a
// determined user can still bypass this by typing pasted text manually.
export function AntiCheatTextarea({ value, onChange, placeholder, rows = 5 }) {
  const block = (e) => e.preventDefault();
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onCopy={block}
      onPaste={block}
      onCut={block}
      onContextMenu={block}
      onDragStart={block}
      rows={rows}
      placeholder={placeholder || "Type your answer here — pasting is disabled, this must be typed live."}
      style={{ userSelect: "text", WebkitUserSelect: "text" }}
      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60 focus:ring-2 focus:ring-[#14E0A0]/20 transition-shadow resize-none"
    />
  );
}

export function Section({ icon: Icon, title, children, tone = "default" }) {
  const toneCls = tone === "warning" ? "text-amber-300" : "text-[#14E0A0]";
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2 ${toneCls}`}>
        <Icon size={13} /> {title}
      </p>
      {children}
    </div>
  );
}

// Text-only English/Hinglish toggle for a task's step-by-step explanation —
// replaces the old text-to-speech widget (removed per product feedback: no
// audio, just a plain-text language switch). Reuses the same backend
// endpoint/cache (GET /tasks/{id}/voice-explain) since it already generates
// a natural-language Hindi/English pair per task via Gemini — only the
// frontend presentation changed, not the underlying content. Locked to
// English-only in Blindfold Mode (see TaskWorkspace.jsx) via `disabled`.
export function LanguageToggle({ taskId, token, englishText, disabled }) {
  const [lang, setLang] = useState("english");
  const [hindiText, setHindiText] = useState(null);
  const [loading, setLoading] = useState(false);

  const showHinglish = async () => {
    if (disabled) return;
    if (hindiText) { setLang("hindi"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/internship/tasks/${taskId}/voice-explain`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setHindiText(data.hindi);
        setLang("hindi");
      }
    } catch {
      // silent — English text is always shown as the fallback either way
    }
    setLoading(false);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => setLang("english")}
          className={`flex items-center gap-1.5 text-[11px] font-bold border rounded-full px-2.5 py-1 transition-colors ${
            lang === "english" ? "bg-[#14E0A0]/20 border-[#14E0A0] text-[#14E0A0]" : "bg-white/5 border-white/15 text-white/60 hover:border-white/30"
          }`}
        >
          <Languages size={11} /> English
        </button>
        <button
          type="button"
          onClick={showHinglish}
          disabled={disabled || loading}
          title={disabled ? "Not available in Blindfold Mode" : undefined}
          className={`flex items-center gap-1.5 text-[11px] font-bold border rounded-full px-2.5 py-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            lang === "hindi" ? "bg-[#14E0A0]/20 border-[#14E0A0] text-[#14E0A0]" : "bg-white/5 border-white/15 text-white/60 hover:border-white/30"
          }`}
        >
          <Languages size={11} /> {loading ? "Loading..." : "हिंग्लिश"}
        </button>
      </div>
      <p className="text-white/75 text-sm leading-relaxed whitespace-pre-line">{lang === "hindi" && hindiText ? hindiText : englishText}</p>
    </div>
  );
}
