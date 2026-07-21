import React, { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Trophy, Medal, RefreshCw } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const RADAR_LABELS = {
  communication: "Communication",
  finance: "Finance",
  technical: "Technical",
  integrity: "Integrity",
  execution_speed: "Execution Speed",
};

const RANK_MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function StudentLeaderboard() {
  const { student, token } = useInternshipAuth();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scope, setScope] = useState("overall"); // "overall" | "track"
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const q = scope === "track" && student?.track ? `?track=${student.track}` : "";
    fetch(`${API_BASE}/api/internship/leaderboard${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load leaderboard");
        return r.json();
      })
      .then((data) => { if (!cancelled) setBoard(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, scope, student?.track, reloadTick]);

  const radarData = Object.keys(RADAR_LABELS).map((key) => ({
    subject: RADAR_LABELS[key],
    value: student?.radar_scores?.[key] ?? 0,
    fullMark: 100,
  }));
  const hasRadarData = student?.radar_scores && Object.keys(student.radar_scores).length > 0;

  return (
    <StudentLayout activeKey="leaderboard">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Your Progress</h1>
          <p className="text-white/45 text-sm mt-1">Skill radar &amp; All-India ranking</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-semibold text-white/45 uppercase tracking-wide mb-2">Skill Radar</p>
          {hasRadarData ? (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} />
                  <Radar dataKey="value" stroke="#14E0A0" fill="#14E0A0" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-white/35 text-xs py-8 text-center">Pass your first quiz to see your skill radar.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-[#14E0A0]" />
              <p className="text-sm font-semibold">{scope === "track" ? "My Track Leaderboard" : "All-India Leaderboard"}</p>
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-full p-0.5">
              <button
                onClick={() => setScope("overall")}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors ${scope === "overall" ? "bg-[#14E0A0] text-[#050B16]" : "text-white/50 hover:text-white"}`}
              >
                Overall
              </button>
              <button
                onClick={() => setScope("track")}
                disabled={!student?.track}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors disabled:opacity-30 ${scope === "track" ? "bg-[#14E0A0] text-[#050B16]" : "text-white/50 hover:text-white"}`}
              >
                My Track
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-white/40 text-sm p-5">Loading...</p>
          ) : error ? (
            <button onClick={() => setReloadTick((t) => t + 1)} className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 p-5">
              <RefreshCw size={13} /> Couldn't load leaderboard — tap to retry
            </button>
          ) : !board?.top?.length ? (
            <p className="text-white/40 text-sm p-5">No ranked interns yet.</p>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                {board.top.map((r) => (
                  <div key={r.student_id} className={`flex items-center justify-between px-5 py-3 ${r.student_id === board.me?.student_id ? "bg-[#14E0A0]/5" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-bold text-white/50">{RANK_MEDALS[r.rank] || r.rank}</span>
                      <div>
                        <p className="text-sm font-medium">{r.name}{r.student_id === board.me?.student_id && <span className="text-[#14E0A0] text-xs ml-1.5">(You)</span>}</p>
                        <p className="text-[10px] text-white/35">{r.track_label}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#14E0A0]">{r.score}</span>
                  </div>
                ))}
              </div>
              {board.me && !board.top.some((r) => r.student_id === board.me.student_id) && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-[#14E0A0]/5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold text-white/50 flex items-center justify-center"><Medal size={13} /></span>
                    <p className="text-sm font-medium">{board.me.name} <span className="text-[#14E0A0] text-xs ml-1.5">(You, Rank #{board.me.rank})</span></p>
                  </div>
                  <span className="text-sm font-bold text-[#14E0A0]">{board.me.score}</span>
                </div>
              )}
              <p className="text-center text-white/25 text-[10px] py-3 border-t border-white/5">{board.total_participants} interns ranked</p>
            </>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
