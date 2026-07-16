import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Camera, CheckCircle2, Clock3, MapPin, XCircle, Send, GraduationCap, ArrowUpRight,
  X, ClipboardList, FileText, UploadCloud, AlertTriangle, Eye, ChevronDown, ChevronUp, Timer,
  Volume2, Square, Sparkles, FileEdit, Save,
} from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { getCurrentLocation } from "../portal/api";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/10 text-red-400 border-red-500/30",
};

const STATUS_BADGE = {
  approved: { label: "Verified ✓", icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  pending: { label: "Checking...", icon: Clock3, cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  rejected: { label: "Not Verified — Resubmit", icon: XCircle, cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  draft: { label: "Draft Saved", icon: FileEdit, cls: "bg-white/10 text-white/60 border-white/20" },
};

// Soft, best-effort deterrent only — not real DRM. See PRD notes: a
// determined user can still bypass this by typing pasted text manually.
function AntiCheatTextarea({ value, onChange }) {
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
      rows={5}
      placeholder="Type your answer here — pasting is disabled, this must be typed live."
      style={{ userSelect: "text", WebkitUserSelect: "text" }}
      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60 focus:ring-2 focus:ring-[#14E0A0]/20 transition-shadow resize-none"
    />
  );
}

function Section({ icon: Icon, title, children, tone = "default" }) {
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

function VoiceExplainButtons({ taskId, token }) {
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

function TaskDetailModal({ task, weekNumber, onClose, onSubmitted }) {
  const { token } = useInternshipAuth();
  const [textAnswer, setTextAnswer] = useState(task.draft_text || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);

  const needsText = task.deliverable_type === "text" || task.deliverable_type === "text_and_photo";
  const needsPhoto = task.deliverable_type === "photo" || task.deliverable_type === "text_and_photo";
  const canSubmit = !task.submission_status || task.submission_status === "rejected" || task.submission_status === "draft";

  const rejectReasons = [
    "Your answer is left empty, is too short, or just repeats the task prompt back",
    "Your answer doesn't genuinely attempt the task — off-topic, copied, or gibberish text",
    ...(needsPhoto ? ["No photo was attached, or the photo field was left empty"] : []),
    ...(task.requires_geotag ? ["Your location wasn't captured — make sure you allow location access when your browser asks"] : []),
  ];

  const handleSubmit = async () => {
    if (needsText && !textAnswer.trim()) {
      toast.error("Please type your answer.");
      return;
    }
    if (needsPhoto && !photoFile) {
      toast.error("Please attach a photo taken live from your camera.");
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading("Getting your location...");
    try {
      const loc = task.requires_geotag ? await getCurrentLocation() : null;
      toast.loading("Submitting...", { id: toastId });

      const form = new FormData();
      form.append("task_id", task.id);
      form.append("week_number", String(weekNumber));
      form.append("text_answer", textAnswer);
      form.append("client_timestamp", new Date().toISOString());
      if (loc) {
        form.append("gps_lat", String(loc.lat));
        form.append("gps_lng", String(loc.lng));
        form.append("gps_accuracy", String(loc.accuracy ?? ""));
      }
      if (photoFile) form.append("photo", photoFile);

      const res = await fetch(`${API_BASE}/api/internship/submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Submission failed");

      if (data.review_status === "approved") {
        toast.success("Verified! Task marked complete.", { id: toastId });
      } else {
        toast.error(data.admin_note || "Not verified — please review and resubmit.", { id: toastId });
      }
      onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.message || "Submission failed", { id: toastId });
    }
    setSubmitting(false);
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const res = await fetch(`${API_BASE}/api/internship/submissions/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: task.id, week_number: weekNumber, text_answer: textAnswer }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not save draft");
      toast.success("Draft saved — come back anytime to finish it.");
      setDraftSavedAt(new Date());
      onSubmitted();
    } catch (err) {
      toast.error(err.message || "Could not save draft");
    }
    setSavingDraft(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-[#0A0F1A] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5 ${DIFFICULTY_STYLES[task.difficulty]}`}>
              {task.difficulty}
            </span>
            {task.estimated_duration && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white/50 border border-white/15 bg-white/5 rounded-full px-2 py-0.5">
                <Timer size={10} /> {task.estimated_duration}
              </span>
            )}
            {task.requires_geotag && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#14E0A0]/80 border border-[#14E0A0]/30 bg-[#14E0A0]/10 rounded-full px-2 py-0.5">
                <MapPin size={10} /> Field Task
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white shrink-0"><X size={18} /></button>
        </div>

        <h2 className="font-display text-lg font-bold mb-3">{task.title}</h2>

        <VoiceExplainButtons taskId={task.id} token={token} />

        <div className="space-y-4">
          <Section icon={ClipboardList} title="What You Need To Do">
            <p className="text-white/75 text-sm leading-relaxed">{task.brief}</p>
          </Section>

          {task.why_it_matters && (
            <div className="rounded-xl bg-[#14E0A0]/[0.06] border border-[#14E0A0]/20 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#14E0A0] mb-1">
                <Sparkles size={13} /> Why This Task Matters
              </p>
              <p className="text-[#14E0A0]/80 text-xs leading-relaxed">{task.why_it_matters}</p>
            </div>
          )}

          {task.instructions && (
            <Section icon={FileText} title="Step-by-Step">
              <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{task.instructions}</p>
            </Section>
          )}

          <Section icon={UploadCloud} title="How To Submit">
            <ul className="text-white/60 text-xs leading-relaxed space-y-1.5 list-disc list-inside">
              {needsText && <li>Type your answer in the text box below — pasting is blocked, so it must be typed live, in your own words.</li>}
              {needsPhoto && <li>Take a live photo using your camera — the camera opens directly, you can't upload from your gallery.</li>}
              {task.requires_geotag && <li>Your current location is captured automatically when you submit — allow location access if your browser asks.</li>}
              <li>Once submitted, our system checks it <strong className="text-white/80">instantly and automatically</strong> — you'll immediately see whether it's verified or not.</li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title="Why This Might Get Rejected" tone="warning">
            <ul className="text-amber-200/70 text-xs leading-relaxed space-y-1.5 list-disc list-inside">
              {rejectReasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
            <p className="text-white/35 text-[11px] mt-2">Rejected tasks can always be resubmitted — no penalty, just try again.</p>
          </Section>

          {task.submission_status === "approved" && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <p className="text-emerald-300 text-xs">This task is verified and marked complete.</p>
            </div>
          )}
          {task.submission_status === "pending" && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-center gap-2">
              <Clock3 size={16} className="text-amber-400 shrink-0" />
              <p className="text-amber-300 text-xs">Your submission is being checked.</p>
            </div>
          )}
          {task.submission_status === "rejected" && task.submission_note && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
              <p className="text-red-300 text-xs font-semibold mb-0.5">Not verified — here's why:</p>
              <p className="text-red-200/70 text-xs">"{task.submission_note}"</p>
            </div>
          )}
          {task.submission_status === "draft" && (
            <div className="rounded-xl bg-white/5 border border-white/15 p-3 flex items-center gap-2">
              <FileEdit size={16} className="text-white/50 shrink-0" />
              <p className="text-white/60 text-xs">You have a saved draft below — pick up where you left off, then hit Confirm Submit when ready.</p>
            </div>
          )}

          {canSubmit && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              {needsText && (
                <>
                  <AntiCheatTextarea value={textAnswer} onChange={setTextAnswer} />
                  <p className="text-[11px] text-white/35 -mt-1.5">
                    No need to finish in one go — type a bit, tap Save Draft, and come back later to continue.
                    {draftSavedAt && <span className="text-[#14E0A0]/70"> Saved just now.</span>}
                  </p>
                </>
              )}
              {needsPhoto && (
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-white/60 mb-1.5">
                    <Camera size={14} /> Live Camera Photo {task.requires_geotag && "(location auto-attached)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    className="w-full text-xs text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white"
                  />
                </div>
              )}
              <div className="flex gap-2.5">
                {needsText && (
                  <button
                    onClick={handleSaveDraft}
                    disabled={savingDraft || submitting}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/15 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors"
                  >
                    <Save size={14} /> {savingDraft ? "Saving..." : "Save Draft"}
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || savingDraft}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] px-4 py-3 rounded-xl transition-colors"
                >
                  <Send size={14} /> {submitting ? "Submitting..." : task.submission_status === "rejected" ? "Resubmit Task" : "Confirm Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, weekNumber, onSubmitted }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const badge = STATUS_BADGE[task.submission_status];

  return (
    <>
      <button
        onClick={() => setDetailOpen(true)}
        className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#14E0A0]/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5 ${DIFFICULTY_STYLES[task.difficulty]}`}>
                {task.difficulty}
              </span>
              {task.estimated_duration && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white/50 border border-white/15 bg-white/5 rounded-full px-2 py-0.5">
                  <Timer size={10} /> {task.estimated_duration}
                </span>
              )}
              {task.requires_geotag && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#14E0A0]/80 border border-[#14E0A0]/30 bg-[#14E0A0]/10 rounded-full px-2 py-0.5">
                  <MapPin size={10} /> Field Task
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm">{task.title}</h3>
          </div>
          {badge && (
            <span className={`flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-2.5 py-1 shrink-0 ${badge.cls}`}>
              <badge.icon size={12} /> {badge.label}
            </span>
          )}
        </div>

        <p className="text-white/45 text-xs leading-relaxed mt-3 line-clamp-2">{task.brief}</p>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14E0A0] mt-3">
          <Eye size={13} /> {task.submission_status ? "View Details" : "View Details & Submit"}
        </span>
      </button>

      {detailOpen && (
        <TaskDetailModal task={task} weekNumber={weekNumber} onClose={() => setDetailOpen(false)} onSubmitted={onSubmitted} />
      )}
    </>
  );
}

function WeekSection({ week, isCurrent, onSubmitted }) {
  const [open, setOpen] = useState(isCurrent);
  const allDone = week.approved_count === week.total_count && week.total_count > 0;

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-3 p-4 text-left transition-colors ${isCurrent ? "bg-[#14E0A0]/10" : "bg-white/[0.02] hover:bg-white/[0.04]"}`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-sm font-bold ${isCurrent ? "text-[#14E0A0]" : "text-white/70"}`}>Week {week.week_number}</span>
          {isCurrent && <span className="text-[10px] font-bold uppercase text-[#14E0A0] bg-[#14E0A0]/15 rounded-full px-2 py-0.5">Current</span>}
          <span className={`text-xs ${allDone ? "text-emerald-400" : "text-white/40"}`}>{week.approved_count}/{week.total_count} verified</span>
        </div>
        {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-black/20">
          {week.tasks.map((task) => (
            <TaskCard key={task.id} task={task} weekNumber={week.week_number} onSubmitted={onSubmitted} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentMissions() {
  const { token } = useInternshipAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/internship/tasks/all`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || "Could not load your missions");
      setData(json);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const hasMissedTasks = data?.weeks?.some((w) => w.week_number < data.current_week && w.approved_count < w.total_count);

  return (
    <StudentLayout activeKey="missions">
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold">Active Missions</h1>
          {data?.current_week ? (
            <p className="text-white/45 text-sm mt-1">Week {data.current_week} &middot; Day {data.current_day}</p>
          ) : (
            <p className="text-white/45 text-sm mt-1">Your weekly tasks</p>
          )}
        </div>

        {data?.weeks?.length > 0 && (
          <div className="rounded-2xl border border-[#14E0A0]/20 bg-[#14E0A0]/5 p-4 flex items-start gap-2.5">
            <Eye size={15} className="text-[#14E0A0] shrink-0 mt-0.5" />
            <p className="text-[#14E0A0]/90 text-xs leading-relaxed">
              Tap any task to see exactly what to do, how to submit it, and why it might get rejected.
              {hasMissedTasks && " Missed something from an earlier week? It's still here — open that week below to catch up any time."}
            </p>
          </div>
        )}

        {loading && <p className="text-white/50 text-sm">Loading your missions...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {data && data.message && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-200 text-sm">{data.message}</div>
        )}

        {data?.weeks?.length === 0 && !data?.message && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40 text-sm">
            No tasks available for your track yet — check back soon.
          </div>
        )}

        <div className="space-y-3">
          {data?.weeks?.slice().reverse().map((week) => (
            <WeekSection key={week.week_number} week={week} isCurrent={week.week_number === data.current_week} onSubmitted={load} />
          ))}
        </div>

        {data?.current_week > 0 && (
          <button
            onClick={() => navigate("/portal/student/quiz")}
            className={`w-full flex items-center justify-between gap-3 rounded-2xl border p-5 text-left transition-colors ${
              data.quiz_passed_this_week
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-[#14E0A0]/30 bg-gradient-to-r from-[#14E0A0]/10 to-transparent hover:border-[#14E0A0]/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${data.quiz_passed_this_week ? "bg-emerald-500/15 text-emerald-400" : "bg-[#14E0A0]/15 text-[#14E0A0]"}`}>
                {data.quiz_passed_this_week ? <CheckCircle2 size={18} /> : <GraduationCap size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold">Week {data.current_week} Quiz {data.quiz_passed_this_week && "— Passed"}</p>
                <p className="text-xs text-white/45 mt-0.5">
                  {data.quiz_passed_this_week ? "Great work — you can retake it anytime." : "Pass this to unlock next week's missions."}
                </p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-[#14E0A0] shrink-0" />
          </button>
        )}
      </div>
    </StudentLayout>
  );
}
