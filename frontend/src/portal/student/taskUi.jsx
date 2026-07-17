import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Volume2, Square, FileEdit, CheckCircle2, Clock3, XCircle } from "lucide-react";

// Shared between StudentMissions.jsx (task list) and TaskWorkspace.jsx (the
// dedicated task page) — kept in one place so both render task chrome
// (difficulty/status badges, the anti-paste textarea, the voice-explain
// widget) identically.

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

// Reads the task's brief/instructions aloud in Hindi or Indian English using
// the browser's built-in Web Speech API — no audio files, no TTS API cost.
// Text is generated once per task server-side (Gemini) and cached, then
// spoken client-side with the device's own hi-IN/en-IN voice.
// Common Indian TTS voice names across Chrome/Android/Windows/iOS, used as
// a name-based fallback when a device doesn't expose a clean "hi-IN"/"en-IN"
// lang tag but does have an Indian-accented voice installed under a
// different label.
const INDIAN_VOICE_NAME_HINTS = ["india", "hindi", "lekha", "veena", "rishi", "swara", "neerja", "priya", "kajal", "heera", "google हिन्दी", "google uk english"];

function waitForVoices() {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) return resolve(existing);
    const onChange = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onChange);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1200);
  });
}

function pickBestVoice(voices, lang) {
  const prefix = lang.split("-")[0].toLowerCase();
  const sameLangFamily = voices.filter((v) => v.lang?.toLowerCase().startsWith(prefix));
  if (!sameLangFamily.length) return null;
  const exact = sameLangFamily.find((v) => v.lang?.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const byName = sameLangFamily.find((v) => INDIAN_VOICE_NAME_HINTS.some((h) => v.name?.toLowerCase().includes(h)));
  if (byName) return byName;
  return sameLangFamily[0];
}

export function VoiceExplainButtons({ taskId, token }) {
  const [texts, setTexts] = useState(null);
  const [loadingLang, setLoadingLang] = useState(null);
  const [speakingLang, setSpeakingLang] = useState(null);

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const fetchTexts = async () => {
    if (texts) return texts;
    const res = await fetch(`${API_BASE}/api/internship/tasks/${taskId}/voice-explain`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Could not load voice explanation");
    const data = await res.json();
    setTexts(data);
    return data;
  };

  const speak = async (lang) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Voice playback isn't supported on this device/browser.");
      return;
    }
    if (speakingLang === lang) {
      window.speechSynthesis.cancel();
      setSpeakingLang(null);
      return;
    }
    window.speechSynthesis.cancel();
    setLoadingLang(lang);
    try {
      const data = await fetchTexts();
      const text = lang === "hindi" ? data.hindi : data.english;
      const targetLang = lang === "hindi" ? "hi-IN" : "en-IN";
      const voices = await waitForVoices();
      const voiceMatch = pickBestVoice(voices, targetLang);

      if (lang === "hindi" && !voices.some((v) => v.lang?.toLowerCase().startsWith("hi"))) {
        toast.error("This device doesn't have a Hindi voice installed. Try the Chrome browser on Android for Hindi playback.");
        setLoadingLang(null);
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = voiceMatch?.lang || targetLang;
      utter.rate = 0.9;
      utter.pitch = 1;
      if (voiceMatch) utter.voice = voiceMatch;
      utter.onend = () => setSpeakingLang(null);
      utter.onerror = () => setSpeakingLang(null);
      setSpeakingLang(lang);
      window.speechSynthesis.speak(utter);
    } catch (e) {
      toast.error(e.message || "Could not load voice explanation");
    }
    setLoadingLang(null);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <button
        type="button"
        onClick={() => speak("hindi")}
        className={`flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1.5 transition-colors ${
          speakingLang === "hindi" ? "bg-[#14E0A0]/20 border-[#14E0A0] text-[#14E0A0]" : "bg-white/5 border-white/15 text-white/70 hover:border-white/30"
        }`}
      >
        {speakingLang === "hindi" ? <Square size={12} /> : <Volume2 size={12} />}
        {loadingLang === "hindi" ? "Loading..." : speakingLang === "hindi" ? "Stop" : "हिंदी में सुनें"}
      </button>
      <button
        type="button"
        onClick={() => speak("english")}
        className={`flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1.5 transition-colors ${
          speakingLang === "english" ? "bg-[#14E0A0]/20 border-[#14E0A0] text-[#14E0A0]" : "bg-white/5 border-white/15 text-white/70 hover:border-white/30"
        }`}
      >
        {speakingLang === "english" ? <Square size={12} /> : <Volume2 size={12} />}
        {loadingLang === "english" ? "Loading..." : speakingLang === "english" ? "Stop" : "Listen in English"}
      </button>
    </div>
  );
}
