import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Camera, CheckCircle2, Clock3, MapPin, XCircle, Send, ArrowLeft, ClipboardList, FileText,
  UploadCloud, AlertTriangle, Sparkles, FileEdit, Save, Table2,
} from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { getCurrentLocation } from "../portal/api";
import { useSubmitOnce } from "../lib/useSubmitOnce";
import { DIFFICULTY_STYLES, AntiCheatTextarea, Section, LanguageToggle, NO_COPY_PROPS } from "../portal/student/taskUi";
import SpreadsheetGrid from "../components/SpreadsheetGrid";
import { buildSubmissionPayload } from "../lib/miniSpreadsheet";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const AUTOSAVE_DEBOUNCE_MS = 3000;
const AUTOSAVE_INTERVAL_MS = 20000;

// A dedicated, full-page workspace for one task — replaces the old popup
// modal so there's room for a real spreadsheet grid plus a text answer side
// by side, and so a student can leave (back button, tab close, crash) and
// come back to the exact same in-progress state via auto-save.
export default function TaskWorkspace() {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const weekHint = searchParams.get("week");
  const navigate = useNavigate();
  const { token } = useInternshipAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [task, setTask] = useState(null);
  const [weekNumber, setWeekNumber] = useState(null);

  const [textAnswer, setTextAnswer] = useState("");
  const [spreadsheetValue, setSpreadsheetValue] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/internship/tasks/all`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || "Could not load this task");

      const matches = (json.weeks || []).flatMap((w) => w.tasks.filter((t) => t.id === taskId).map((t) => ({ ...t, __week: w.week_number })));
      if (!matches.length) {
        setError("This task isn't in your assigned list — it may have rotated out. Head back to Missions.");
        setLoading(false);
        return;
      }
      const chosen = matches.find((t) => String(t.__week) === String(weekHint)) || matches[matches.length - 1];
      setTask(chosen);
      setWeekNumber(chosen.__week);

      if (!hydratedRef.current) {
        hydratedRef.current = true;
        setTextAnswer(chosen.draft_text || "");
        const seedSheet = {};
        if (chosen.draft_spreadsheet_data) {
          for (const [cellId, cell] of Object.entries(chosen.draft_spreadsheet_data)) {
            seedSheet[cellId] = cell?.input ?? "";
          }
        }
        setSpreadsheetValue(seedSheet);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, taskId, weekHint]);

  useEffect(() => { load(); }, [load]);

  const needsText = task && (task.deliverable_type === "text" || task.deliverable_type === "text_and_photo" || task.deliverable_type === "text_and_spreadsheet");
  const needsPhoto = task && (task.deliverable_type === "photo" || task.deliverable_type === "text_and_photo");
  const needsSpreadsheet = task && (task.deliverable_type === "spreadsheet" || task.deliverable_type === "text_and_spreadsheet");
  const canSubmit = task && (!task.submission_status || task.submission_status === "rejected" || task.submission_status === "draft");

  const buildSpreadsheetDataString = useCallback(() => {
    if (!needsSpreadsheet || !task?.spreadsheet_template) return "";
    return JSON.stringify(buildSubmissionPayload(task.spreadsheet_template, spreadsheetValue));
  }, [needsSpreadsheet, task, spreadsheetValue]);

  // Auto-save: extends the existing draft endpoint (SubmissionDraftIn),
  // no new persistence layer — see backend/internship_routes.py's
  // PUT /submissions/draft. Guarded against overlap with a plain ref flag
  // (not useSubmitOnce, since this runs on a timer, not a click).
  const saveDraft = useCallback(async (silent) => {
    if (!task || !canSubmit || savingRef.current) return;
    savingRef.current = true;
    if (!silent) setSaveState("saving");
    try {
      const res = await fetch(`${API_BASE}/api/internship/submissions/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          task_id: task.id, week_number: weekNumber, text_answer: textAnswer,
          spreadsheet_data: needsSpreadsheet ? buildSpreadsheetDataString() : undefined,
        }),
      });
      if (res.ok) {
        dirtyRef.current = false;
        setSaveState("saved");
      } else {
        setSaveState("error");
      }
    } catch {
      setSaveState("error");
    }
    savingRef.current = false;
  }, [task, canSubmit, token, weekNumber, textAnswer, needsSpreadsheet, buildSpreadsheetDataString]);

  // Debounced save a few seconds after the last edit...
  useEffect(() => {
    if (!hydratedRef.current || !task || !canSubmit) return;
    dirtyRef.current = true;
    setSaveState("idle");
    const t = setTimeout(() => saveDraft(false), AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textAnswer, spreadsheetValue]);

  // ...plus a periodic fallback so a student who never pauses typing for
  // 3 seconds still gets saved regularly.
  useEffect(() => {
    if (!task || !canSubmit) return;
    const id = setInterval(() => { if (dirtyRef.current) saveDraft(true); }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [task, canSubmit, saveDraft]);

  // Save on the way out too, so navigating away right after typing doesn't
  // lose the last few seconds of edits.
  useEffect(() => () => { if (dirtyRef.current) saveDraft(true); }, [saveDraft]);

  const rejectReasons = useMemo(() => {
    if (!task) return [];
    return [
      "Your answer is left empty, is too short, or just repeats the task prompt back",
      "Your answer doesn't genuinely attempt the task — off-topic, copied, or gibberish text",
      ...(needsSpreadsheet ? ["Your spreadsheet numbers don't check out against the expected figures"] : []),
      ...(needsPhoto ? ["No photo was attached, or the photo field was left empty"] : []),
      ...(task.requires_geotag ? ["Your location wasn't captured — make sure you allow location access when your browser asks"] : []),
    ];
  }, [task, needsSpreadsheet, needsPhoto]);

  const [handleSubmit, submitting] = useSubmitOnce(async () => {
    if (needsText && !textAnswer.trim()) {
      toast.error(needsSpreadsheet ? "Please justify your numbers in the Reasoning box." : "Please type your answer.");
      return;
    }
    if (needsPhoto && !photoFile) {
      toast.error("Please attach a photo taken live from your camera.");
      return;
    }
    const toastId = toast.loading(task.requires_geotag ? "Getting your location..." : "Submitting...");
    try {
      const loc = task.requires_geotag ? await getCurrentLocation() : null;
      toast.loading("Submitting...", { id: toastId });

      const form = new FormData();
      form.append("task_id", task.id);
      form.append("week_number", String(weekNumber));
      form.append("text_answer", textAnswer);
      form.append("client_timestamp", new Date().toISOString());
      if (needsSpreadsheet) form.append("spreadsheet_data", buildSpreadsheetDataString());
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
      navigate("/portal/student/missions");
    } catch (err) {
      toast.error(err.message || "Submission failed", { id: toastId });
    }
  });

  const [handleSaveDraftClick, savingDraftClick] = useSubmitOnce(async () => {
    await saveDraft(false);
    if (saveState !== "error") toast.success("Draft saved — come back anytime to finish it.");
  });

  if (loading) {
    return (
      <StudentLayout activeKey="missions">
        <div className="max-w-3xl mx-auto py-10 text-center text-white/50 text-sm">Loading task...</div>
      </StudentLayout>
    );
  }

  if (error || !task) {
    return (
      <StudentLayout activeKey="missions">
        <div className="max-w-3xl mx-auto py-10 text-center space-y-4">
          <p className="text-red-400 text-sm">{error || "Task not found."}</p>
          <button onClick={() => navigate("/portal/student/missions")} className="text-[#14E0A0] text-sm font-semibold">
            &larr; Back to Missions
          </button>
        </div>
      </StudentLayout>
    );
  }

  const saveIndicator = { idle: null, saving: "Saving...", saved: "All changes saved", error: "Couldn't save — check your connection" }[saveState];

  return (
    <StudentLayout activeKey="missions">
      <div className="max-w-3xl mx-auto space-y-5 pb-10 select-none" {...NO_COPY_PROPS}>
        <button onClick={() => navigate("/portal/student/missions")} className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to Missions
        </button>

        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5 ${DIFFICULTY_STYLES[task.difficulty]}`}>
              {task.difficulty}
            </span>
            {task.estimated_duration && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white/50 border border-white/15 bg-white/5 rounded-full px-2 py-0.5">
                <Clock3 size={10} /> {task.estimated_duration}
              </span>
            )}
            {task.requires_geotag && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#14E0A0]/80 border border-[#14E0A0]/30 bg-[#14E0A0]/10 rounded-full px-2 py-0.5">
                <MapPin size={10} /> Field Task
              </span>
            )}
            {saveIndicator && (
              <span className={`ml-auto flex items-center gap-1 text-[10px] font-semibold ${saveState === "error" ? "text-red-400" : "text-white/40"}`}>
                <Save size={10} /> {saveIndicator}
              </span>
            )}
          </div>
          <h1 className="font-display text-xl font-bold">{task.title}</h1>
        </div>

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
              <LanguageToggle
                taskId={task.id}
                token={token}
                englishText={task.instructions}
                disabled={task.is_blindfold}
              />
            </Section>
          )}

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

          {canSubmit && (
            <div className="space-y-4 border-t border-white/10 pt-4">
              {needsSpreadsheet && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#14E0A0] mb-2">
                    <Table2 size={13} /> Financial Workbook
                  </p>
                  <SpreadsheetGrid
                    template={task.spreadsheet_template}
                    value={spreadsheetValue}
                    onChange={(cellId, v) => setSpreadsheetValue((prev) => ({ ...prev, [cellId]: v }))}
                    disabled={submitting}
                  />
                </div>
              )}

              {needsText && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#14E0A0] mb-2">
                    <FileEdit size={13} /> {needsSpreadsheet ? "Reasoning / Analysis — justify your numbers" : "Your Answer"}
                  </p>
                  <AntiCheatTextarea
                    value={textAnswer}
                    onChange={setTextAnswer}
                    rows={needsSpreadsheet ? 6 : 5}
                    placeholder={
                      needsSpreadsheet
                        ? "Explain your numbers — what did you conclude, and why? What would you flag or recommend?"
                        : undefined
                    }
                  />
                  <p className="text-[11px] text-white/35 mt-1.5">
                    No need to finish in one go — your work saves automatically as you type, or tap Save Draft.
                  </p>
                </div>
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

              <Section icon={UploadCloud} title="How To Submit">
                <ul className="text-white/60 text-xs leading-relaxed space-y-1.5 list-disc list-inside">
                  {needsText && <li>Type your answer/reasoning above — pasting is blocked, so it must be typed live, in your own words.</li>}
                  {needsSpreadsheet && <li>Fill in the unlocked spreadsheet cells — formulas like =SUM(...) are supported.</li>}
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

              <div className="flex gap-2.5 sticky bottom-3">
                {needsText && (
                  <button
                    onClick={handleSaveDraftClick}
                    disabled={savingDraftClick || submitting}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/15 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors"
                  >
                    <Save size={14} /> {savingDraftClick ? "Saving..." : "Save Draft"}
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || savingDraftClick}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] px-4 py-3 rounded-xl transition-colors"
                >
                  <Send size={14} /> {submitting ? "Submitting..." : task.submission_status === "rejected" ? "Resubmit Task" : "Confirm Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
