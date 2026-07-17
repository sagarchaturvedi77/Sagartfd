import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Clock3, MapPin, Eye, ChevronDown, ChevronUp, Timer,
  GraduationCap, ArrowUpRight,
} from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { DIFFICULTY_STYLES, STATUS_BADGE } from "../portal/student/taskUi";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function TaskCard({ task, weekNumber }) {
  const navigate = useNavigate();
  const badge = STATUS_BADGE[task.submission_status];

  return (
    <button
      onClick={() => navigate(`/portal/student/task/${task.id}?week=${weekNumber}`)}
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
  );
}

function WeekSection({ week, isCurrent }) {
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
            <TaskCard key={task.id} task={task} weekNumber={week.week_number} />
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
              Tap any task to open it on its own page — see exactly what to do, how to submit it, and why it might get rejected.
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
            <WeekSection key={week.week_number} week={week} isCurrent={week.week_number === data.current_week} />
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
