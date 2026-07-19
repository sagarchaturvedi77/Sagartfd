import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Maximize, Clock3, ShieldAlert } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function formatCountdown(ms) {
    if (ms <= 0) return "0:00:00";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StudentQuiz() {
    const { token } = useInternshipAuth();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [started, setStarted] = useState(false);
    const [remainingMs, setRemainingMs] = useState(0);
    const violationsRef = useRef(0);
    const submittedRef = useRef(false);

    const load = useCallback(async (reset = false) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/internship/quiz/current${reset ? "?reset=true" : ""}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || "Could not load quiz");
            setQuiz(data);
            setAnswers({});
        } catch (e) {
            toast.error(e.message);
        }
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (quiz?.study_material_required) navigate("/portal/student/study-material");
    }, [quiz, navigate]);

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
            if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
            if (autoFailed) toast.error("Quiz auto-submitted — anti-cheat triggered or time ran out.");
        } catch (e) {
            toast.error(e.message);
            submittedRef.current = false;
        }
        setSubmitting(false);
    }, [quiz, answers, token]);

    // Any exit from the "locked-in" state (tab hidden, or fullscreen
    // exited) fails the CURRENT attempt immediately and restarts with a
    // freshly generated set of questions — this only catches the browser
    // tab itself, not a second device, so it's a real deterrent, not
    // literal proctoring (screenshots/photos of the screen can't be
    // blocked by any website, on any device).
    const restartOnViolation = useCallback((reason) => {
        if (submittedRef.current || !started) return;
        violationsRef.current += 1;
        toast.error(`${reason} — quiz restarted with a fresh set of questions.`);
        setStarted(false);
        setResult(null);
        load(true);
    }, [started, load]);

    useEffect(() => {
        if (!started || result) return;
        const onVisibility = () => { if (document.hidden) restartOnViolation("Tab switch detected"); };
        const onFullscreenChange = () => { if (!document.fullscreenElement) restartOnViolation("Fullscreen exited"); };
        document.addEventListener("visibilitychange", onVisibility);
        document.addEventListener("fullscreenchange", onFullscreenChange);
        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            document.removeEventListener("fullscreenchange", onFullscreenChange);
        };
    }, [started, result, restartOnViolation]);

    // Live 2-hour countdown from quiz.expires_at — server enforces the real
    // limit at submit time regardless, this is just so the student sees it.
    useEffect(() => {
        if (!started || !quiz?.expires_at || result) return;
        const expiresAt = new Date(quiz.expires_at).getTime();
        const tick = () => {
            const left = expiresAt - Date.now();
            setRemainingMs(left);
            if (left <= 0 && !submittedRef.current) submit(true);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [started, quiz, result, submit]);

    const beginQuiz = async () => {
        try {
            const el = document.documentElement;
            if (el.requestFullscreen) await el.requestFullscreen();
        } catch {
            toast.error("Couldn't enter fullscreen — continuing anyway, but try to stay on this tab.");
        }
        setStarted(true);
    };

    if (loading) {
        return (
            <StudentLayout activeKey="missions">
                <div className="text-white/50 text-sm">Loading quiz...</div>
            </StudentLayout>
        );
    }

    if (quiz?.study_material_required) {
        return (
            <StudentLayout activeKey="missions">
                <div className="text-white/50 text-sm">Redirecting to this week's study material...</div>
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
                    {result.auto_failed && <p className="text-amber-400 text-xs mt-2 flex items-center justify-center gap-1"><AlertTriangle size={12} /> Auto-failed — anti-cheat triggered or time ran out</p>}
                    {!passed && !result.auto_failed && <p className="text-white/40 text-xs mt-2">You can retake this quiz anytime — new questions, no limit on attempts.</p>}
                    <div className="flex gap-3 justify-center mt-6">
                        <button onClick={() => navigate("/portal/student/missions")} className="text-sm font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl px-5 py-2.5">
                            Back to Missions
                        </button>
                        {!passed && (
                            <button
                                onClick={() => { setResult(null); setAnswers({}); violationsRef.current = 0; submittedRef.current = false; setStarted(false); load(true); }}
                                className="text-sm font-semibold text-[#050B16] bg-[#14E0A0] hover:bg-[#0FCB8F] rounded-xl px-5 py-2.5"
                            >
                                Retake Quiz
                            </button>
                        )}
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (!started) {
        return (
            <StudentLayout activeKey="missions">
                <div className="max-w-lg mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                    <h1 className="font-display text-xl font-bold mb-1">Week {quiz.week_number} Quiz</h1>
                    <p className="text-white/50 text-sm mb-5">{quiz.questions?.length || 0} questions, based on this week's actual tasks.</p>
                    <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-2.5 text-xs text-white/60">
                            <Clock3 size={14} className="text-[#14E0A0] shrink-0 mt-0.5" /> {quiz.time_limit_minutes} minutes once you start — a live countdown will show.
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-white/60">
                            <Maximize size={14} className="text-[#14E0A0] shrink-0 mt-0.5" /> Runs in fullscreen — exiting it restarts the quiz with fresh questions.
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-white/60">
                            <ShieldAlert size={14} className="text-[#14E0A0] shrink-0 mt-0.5" /> Switching tabs/apps also restarts it — stay on this screen the whole time.
                        </div>
                    </div>
                    <button
                        onClick={beginQuiz}
                        className="w-full bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-sm py-3 rounded-xl transition-colors"
                    >
                        Start Quiz
                    </button>
                </div>
            </StudentLayout>
        );
    }

    const answeredCount = quiz.questions.filter((q) => answers[q.id] !== undefined).length;
    const allAnswered = answeredCount === quiz.questions.length;
    const timeLow = remainingMs > 0 && remainingMs < 5 * 60 * 1000;

    return (
        <StudentLayout activeKey="missions">
            <div className="max-w-xl mx-auto space-y-5 pb-24">
                <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#050B16]/95 backdrop-blur border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <h1 className="font-display text-lg font-bold">Week {quiz.week_number} Quiz</h1>
                        <span className={`flex items-center gap-1.5 text-sm font-bold ${timeLow ? "text-red-400" : "text-[#14E0A0]"}`}>
                            <Clock3 size={14} /> {formatCountdown(remainingMs)}
                        </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                        <div className="h-full bg-[#14E0A0] rounded-full transition-all" style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }} />
                    </div>
                    <p className="text-[11px] text-white/40 mt-1">{answeredCount} / {quiz.questions.length} answered</p>
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

                <div className="fixed bottom-0 inset-x-0 md:sticky md:bottom-3 p-4 md:p-0 bg-[#050B16] md:bg-transparent border-t md:border-0 border-white/10 z-10">
                    <div className="max-w-xl mx-auto">
                        <button
                            onClick={() => submit(false)}
                            disabled={!allAnswered || submitting}
                            className="w-full bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-40 text-[#050B16] font-bold text-sm py-3 rounded-xl transition-colors"
                        >
                            {submitting ? "Submitting..." : allAnswered ? "Submit Quiz" : `Answer all ${quiz.questions.length} questions to submit`}
                        </button>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
