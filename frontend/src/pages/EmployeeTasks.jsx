import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

export default function EmployeeTasks({ wrapInLayout = true }) {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // list_tasks() already scopes to the logged-in user — there is no
      // separate "/my" route (that endpoint never existed; this call 404'd
      // and silently left the page empty before).
      const res = await fetch(`${API_BASE}/api/tasks/`, { headers });
      if (res.ok) setTasks(await res.json());
    } catch (e) {}
    setLoading(false);
  }, [token]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    // update_task() is PUT, not POST /status (that route never existed either).
    await fetch(`${API_BASE}/api/tasks/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ status }),
    });
    load();
  };

  const content = (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif text-[#0E1B2C] dark:text-[#F1EDE3]">✅ My Tasks</h1>
        <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC]/60 mt-1">Tasks assigned to you by admin.</p>
      </div>

      {loading ? (
        <p className="text-sm text-center text-[#2A364B]/50 dark:text-[#8E99AC]/50 py-8">Loading...</p>
      ) : tasks.length === 0 ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-10 text-center">
          <p className="text-[#2A364B]/50 dark:text-[#8E99AC]/50 text-sm">No tasks assigned yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{task.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status] || "bg-gray-100 text-gray-600"}`}>
                      {task.status?.replace("_", " ")}
                    </span>
                  </div>
                  {task.description && <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]/60">{task.description}</p>}
                  {task.due_date && <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/40">Due: {task.due_date}</p>}
                </div>
                <select
                  value={task.status || "pending"}
                  onChange={(e) => updateStatus(task.id, e.target.value)}
                  className="text-xs border border-[#E2D8C2] dark:border-white/10 rounded-lg px-2 py-1.5 outline-none shrink-0"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return wrapInLayout ? <PortalLayout>{content}</PortalLayout> : content;
}
