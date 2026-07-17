import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-600", medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700",
};
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700", in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-gray-100 text-gray-500",
};
const CATEGORIES = ["general", "client_meeting", "follow_up", "documentation", "other"];

export default function AdminTasks({ wrapInLayout = true }) {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("active"); // active, completed, all
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", due_date: "", category: "general", assigned_to: "" });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    try {
      const [taskRes, statsRes, empRes] = await Promise.all([
        fetch(`${API_BASE}/api/tasks/`, { headers }),
        fetch(`${API_BASE}/api/tasks/stats`, { headers }),
        fetch(`${API_BASE}/api/auth/employees`, { headers }),
      ]);
      if (taskRes.ok) setTasks(await taskRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const [addTask, saving] = useSubmitOnce(async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/tasks/`, {
      method: "POST", headers,
      body: JSON.stringify({ ...form, due_date: form.due_date || null, assigned_to: form.assigned_to || null }),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ title: "", description: "", priority: "medium", due_date: "", category: "general", assigned_to: "" });
      load();
    }
  });

  const [updateStatus, updatingStatus] = useSubmitOnce(async (taskId, status) => {
    await fetch(`${API_BASE}/api/tasks/${taskId}`, {
      method: "PUT", headers,
      body: JSON.stringify({ status }),
    });
    load();
  });

  const [deleteTask, deletingTask] = useSubmitOnce(async (taskId) => {
    await fetch(`${API_BASE}/api/tasks/${taskId}`, { method: "DELETE", headers });
    load();
  });

  const filtered = tasks.filter(t => {
    if (filter === "active") return !["completed", "cancelled"].includes(t.status);
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const today = new Date().toISOString().slice(0, 10);
  const field = "w-full border border-[#E2D8C2] dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  const content = (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif text-[#0E1B2C] dark:text-[#F1EDE3]">My Tasks & Reminders</h2>
            <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]/50">Personal task manager — meetings, follow-ups, deadlines</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] transition-all shadow-lg shadow-[#024396]/25">
            + New Task
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-[#0E1B2C] dark:text-[#F1EDE3]">{stats.by_status?.pending || 0}</p>
              <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC]/50 uppercase">Pending</p>
            </div>
            <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.by_status?.in_progress || 0}</p>
              <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC]/50 uppercase">In Progress</p>
            </div>
            <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.by_status?.completed || 0}</p>
              <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC]/50 uppercase">Done</p>
            </div>
            <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overdue || 0}</p>
              <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC]/50 uppercase">Overdue</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {["active", "completed", "all"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f ? "bg-[#024396] text-white" : "bg-white dark:bg-[#101D2E] border border-[#E2D8C2] dark:border-white/10 text-[#2A364B]/60 dark:text-[#8E99AC]/60"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Add modal */}
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-[#101D2E] rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-4">New Task</h3>
              <form onSubmit={addTask} className="space-y-3">
                <input required placeholder="Task title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} />
                <textarea placeholder="Description (optional)" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${field} resize-none`} />
                <div>
                  <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]/60 block mb-1">Assign to (optional)</label>
                  <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className={field}>
                    <option value="">Myself (personal task)</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={field}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </div>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={field} placeholder="Due date" />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 dark:text-[#8E99AC]/70 border border-[#E2D8C2] dark:border-white/10">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] disabled:opacity-60">
                    {saving ? "Saving..." : "Add Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#024396] dark:border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-10 text-center">
            <p className="text-[#2A364B]/50 dark:text-[#8E99AC]/50 text-sm">{filter === "active" ? "No active tasks. Add one!" : "No tasks found."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => {
              const isOverdue = task.due_date && task.due_date < today && !["completed", "cancelled"].includes(task.status);
              // Assigned-out tasks belong to the employee (user_id = their
              // id) — the backend only lets the actual owner update/delete,
              // so surfacing interactive controls for someone else's task
              // here would just silently no-op on click.
              const readOnly = task.assigned_by_name && task.user_id !== user?.id;
              return (
                <div key={task.id} className={`bg-white dark:bg-[#101D2E] rounded-2xl border shadow-sm p-4 flex items-start gap-4 ${isOverdue ? "border-red-300" : "border-[#E2D8C2] dark:border-white/10"}`}>
                  {/* Checkbox */}
                  <button onClick={() => !readOnly && updateStatus(task.id, task.status === "completed" ? "pending" : "completed")}
                    disabled={readOnly || updatingStatus}
                    title={readOnly ? "Only the assigned employee can update this" : undefined}
                    className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-all ${task.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" : "border-[#E2D8C2] dark:border-white/10 hover:border-[#024396] dark:border-[#4C8DFF]"} ${readOnly ? "opacity-40 cursor-not-allowed" : ""}`}>
                    {task.status === "completed" && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-[#0E1B2C] dark:text-[#F1EDE3] ${task.status === "completed" ? "line-through opacity-50" : ""}`}>{task.title}</p>
                    {task.description && <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]/50 mt-0.5 line-clamp-2">{task.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>{task.status.replace("_", " ")}</span>
                      {task.due_date && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isOverdue ? "bg-red-100 text-red-700 font-semibold" : "bg-gray-100 text-gray-600"}`}>
                          {isOverdue ? "OVERDUE: " : ""}{task.due_date}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F1EB] dark:bg-white/5 text-[#2A364B]/50 dark:text-[#8E99AC]/50">{task.category.replace(/_/g, " ")}</span>
                      {task.assigned_by_name && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                          Assigned to {employees.find((e) => e.id === task.user_id)?.name || "employee"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {task.status === "pending" && !readOnly && (
                      <button onClick={() => updateStatus(task.id, "in_progress")} disabled={updatingStatus}
                        className="text-[10px] text-blue-600 hover:underline px-2 py-1 disabled:opacity-50">Start</button>
                    )}
                    {!readOnly && (
                      <button onClick={() => deleteTask(task.id)} disabled={deletingTask}
                        className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );

  return wrapInLayout ? <PortalLayout>{content}</PortalLayout> : content;
}
