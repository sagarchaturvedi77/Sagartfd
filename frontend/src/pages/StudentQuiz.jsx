import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Eye } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MAX_TAB_VIOLATIONS = 2;

export default function StudentQuiz() {
  const { token } = useInternshipAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const violationsRef = useRef(0);
  const submittedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/internship/quiz/current`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not load quiz");
      setQuiz(data);
    } catch (e) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submit = useCallback(async (autoFailed = false) => {
    if (submittedRef.current || !quiz?.questions?.length) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        week_number: quiz.week_number,
        answers: quiz.questions.map((q) => ({ question_id: q.id, selected_index: answers[q.id] ?? -1 })),
        tab_switch_violations: violationsRef.current,
        auto_failed: autoFailed,
      };
      const res = await fetch(`${API_BASE}/api/internship/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Submit failed");
      setResult(data);
      if (autoFailed) toast.error("Quiz auto-submitted — too many tab switches detected.");
    } catch (e) {
      toast.error(e.message);
      submittedRef.current = false;
    }
    setSubmitting(false);
  }, [quiz, answers, token]);

  // Anti-cheat: detect the browser tab losing focus during an active quiz.
  // This only catches the tab itself losing focus — it can't detect a
  // second device/monitor — so it's a deterrent, not real proctoring.
  useEffect(() => {
    if (!quiz?.questions?.length || result) return;
    const onVisibility = () => {
      if (document.hidden && !submittedRef.current) {
        violationsRef.current += 1;
        if (violationsRef.current >= MAX_TAB_VIOLATIONS) {
          submit(true);
        } else {
          toast.error(`Tab switch detected (${violationsRef.current}/${MAX_TAB_VIOLATIONS}) — one more and your quiz auto-fails.`);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [quiz, result, submit]);

  if (loading) {
    return (
      <StudentLayout activeKey="missions">
        <div className="text-white/50 text-sm">Loading quiz...</div>
      </StudentLayout>
    );
  }

  if (!quiz || quiz.week_number === 0) {
    return (
      <StudentLayout activeKey="missions">
        <div className="max-w-lg mx-auto text-center rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <p className="text-white/50 text-sm">Your program hasn't started yet.</p>
        </div>
      </StudentLayout>
    );
  }

  if (quiz.already_passed && !result) {
    return (
      <StudentLayout activeKey="missions">
        <div className="max-w-lg mx-auto text-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8">
          <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
          <h1 className="font-display text-lg font-bold mb-1">Week {quiz.week_number} Quiz — Already Passed</h1>
          <p className="text-white/50 text-sm mb-4">You've cleared this week's quiz. Keep going with your missions.</p>
          <button onClick={() => navigate("/portal/student/missions")} className="text-sm font-semibold text-[#050B16] bg-[#14E0A0] hover:bg-[#0FCB8F] rounded-xl px-5 py-2.5">
            Back to Missions
          </button>
        </div>
      </StudentLayout>
    );
  }

  if (result) {
    const passed = result.passed;
    return (
      <StudentLayout activeKey="missions">
        <div className="max-w-lg mx-auto text-center rounded-2xl border p-8" style={{ borderColor: passed ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)", background: passed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)" }}>
          {passed ? <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" /> : <XCircle size={40} className="text-red-400 mx-auto mb-3" />}
          <h1 className="font-display text-xl font-bold mb-1">{passed ? "Quiz Passed!" : "Quiz Not Passed"}</h1>
          <p className="text-white/60 text-sm mb-1">Score: <span className="font-bold text-white">{result.score_percent}%</span> (need {quiz.pass_threshold}% to pass)</p>
          {result.auto_failed && <p className="text-amber-400 text-xs mt-2 flex items-center justify-center gap-1"><AlertTriangle size={12} /> Auto-failed due to tab-switching</p>}
          {!passed && !result.auto_failed && <p className="text-white/40 text-xs mt-2">You can retake this quiz anytime.</p>}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate("/portal/student/missions")} className="text-sm font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl px-5 py-2.5">
              Back to Missions
            </button>
            {!passed && (
              <button onClick={() => { setResult(null); setAnswers({}); violationsRef.current = 0; submittedRef.current = false; load(); }} className="text-sm font-semibold text-[#050B16] bg-[#14E0A0] hover:bg-[#0FCB8F] rounded-xl px-5 py-2.5">
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      </StudentLayout>
    );
  }

  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);

  return (
    <StudentLayout activeKey="missions">
      <div className="max-w-xl mx-auto space-y-5">
        <div>
          <h1 className="font-display text-xl font-bold">Week {quiz.week_number} Quiz</h1>
          <p className="text-white/45 text-sm mt-1 flex items-center gap-1.5">
            <Eye size={13} /> Keep this tab focused — switching tabs twice auto-submits your quiz.
          </p>
        </div>

        {quiz.questions.map((q, qi) => (
          <div key={q.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-semibold mb-3">{qi + 1}. {q.question_text}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                  className={`w-full text-left text-sm px-4 py-2.5 rounded-xl border transition-colors ${
                    answers[q.id] === oi ? "bg-[#14E0A0]/15 border-[#14E0A0] text-[#14E0A0]" : "bg-white/[0.02] border-white/10 text-white/70 hover:border-white/25"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => submit(false)}
          disabled={!allAnswered || submitting}
          className="w-full bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-40 text-[#050B16] font-bold text-sm py-3 rounded-xl transition-colors"
        >
          {submitting ? "Submitting..." : allAnswered ? "Submit Quiz" : `Answer all ${quiz.questions.length} questions to submit`}
        </button>
      </div>
    </StudentLayout>
  );
}
