/**
 * DashboardCustomizer — reusable hook + UI for both Admin & Employee dashboards.
 * Each user can add/remove/reorder widgets. Saved in localStorage per user.
 */
import React, { useState } from "react";

export const ALL_ADMIN_WIDGETS = [
  { id: "stats",      label: "📊 Stats Cards",        desc: "Total employees, active, system status" },
  { id: "team",       label: "👥 Team List",           desc: "All employees with details" },
  { id: "attendance", label: "🕐 Today's Attendance",  desc: "Who punched in today" },
  { id: "leads",      label: "📋 Recent Leads",        desc: "Latest leads overview" },
  { id: "tasks",      label: "✅ Pending Tasks",       desc: "Tasks assigned but not done" },
  { id: "targets",    label: "🎯 Target Progress",     desc: "Monthly target vs achievement" },
  { id: "leaves",     label: "🌴 Pending Leaves",      desc: "Leave requests waiting for approval" },
  { id: "salary",     label: "💰 Salary Overview",     desc: "This month salary summary" },
  { id: "chat",       label: "💬 Recent Messages",     desc: "Last few team chat messages" },
  { id: "announce",   label: "📢 Announcements",       desc: "Latest announcements" },
];

export const ALL_EMPLOYEE_WIDGETS = [
  { id: "attendance", label: "🕐 My Attendance",       desc: "Today punch in/out + history" },
  { id: "targets",    label: "🎯 My Targets",          desc: "Monthly target progress" },
  { id: "tasks",      label: "✅ My Tasks",            desc: "Tasks assigned to me" },
  { id: "salary",     label: "💰 My Salary",           desc: "Latest salary info" },
  { id: "leaves",     label: "🌴 My Leaves",           desc: "Leave balance and history" },
  { id: "leads",      label: "📋 My Leads",            desc: "Leads assigned to me" },
  { id: "chat",       label: "💬 Team Chat",           desc: "Recent team messages" },
  { id: "announce",   label: "📢 Announcements",       desc: "Company announcements" },
  { id: "id_card",    label: "🪪 My ID Card",          desc: "Quick access to ID card" },
  { id: "profile",    label: "👤 My Profile",          desc: "Profile summary" },
];

export function useWidgets(userId, role) {
  const storageKey = `dashboard_widgets_${userId}_${role}`;
  const allWidgets = role === "admin" ? ALL_ADMIN_WIDGETS : ALL_EMPLOYEE_WIDGETS;
  const defaultActive = allWidgets.slice(0, 6).map(w => w.id);

  const [activeWidgets, setActiveWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultActive;
    } catch { return defaultActive; }
  });

  const save = (widgets) => {
    setActiveWidgets(widgets);
    localStorage.setItem(storageKey, JSON.stringify(widgets));
  };

  const toggle = (id) => {
    if (activeWidgets.includes(id)) {
      save(activeWidgets.filter(w => w !== id));
    } else {
      save([...activeWidgets, id]);
    }
  };

  const moveUp = (id) => {
    const idx = activeWidgets.indexOf(id);
    if (idx <= 0) return;
    const arr = [...activeWidgets];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    save(arr);
  };

  const moveDown = (id) => {
    const idx = activeWidgets.indexOf(id);
    if (idx >= activeWidgets.length - 1) return;
    const arr = [...activeWidgets];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    save(arr);
  };

  return { activeWidgets, allWidgets, toggle, moveUp, moveDown };
}

export function DashboardCustomizerPanel({ userId, role, onClose }) {
  const { activeWidgets, allWidgets, toggle, moveUp, moveDown } = useWidgets(userId, role);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: 24,
        maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0E1B2C" }}>🛠️ Customize Dashboard</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#5C677D" }}>×</button>
        </div>
        <p style={{ fontSize: 12, color: "#5C677D", marginBottom: 16 }}>
          Jo widgets dashboard pe dikhane hain unhe ON karo, baaki band karo. Order bhi change kar sakte ho.
        </p>

        {allWidgets.map((widget) => {
          const isActive = activeWidgets.includes(widget.id);
          const idx = activeWidgets.indexOf(widget.id);
          return (
            <div key={widget.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 10, marginBottom: 6,
              background: isActive ? "#EAF1FB" : "#F5F1EB",
              border: `1px solid ${isActive ? "#b8d4f0" : "#E2D8C2"}`,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0E1B2C", margin: 0 }}>{widget.label}</p>
                <p style={{ fontSize: 11, color: "#5C677D", margin: 0 }}>{widget.desc}</p>
              </div>
              {isActive && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveUp(widget.id)} style={{ background: "#E2D8C2", border: "none", borderRadius: 4, width: 22, height: 18, cursor: "pointer", fontSize: 10 }}>▲</button>
                  <button onClick={() => moveDown(widget.id)} style={{ background: "#E2D8C2", border: "none", borderRadius: 4, width: 22, height: 18, cursor: "pointer", fontSize: 10 }}>▼</button>
                </div>
              )}
              <button
                onClick={() => toggle(widget.id)}
                style={{
                  padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: isActive ? "#024396" : "#fff",
                  color: isActive ? "#fff" : "#024396",
                  border: isActive ? "none" : "1px solid #024396",
                }}
              >
                {isActive ? "ON" : "OFF"}
              </button>
            </div>
          );
        })}

        <button onClick={onClose} style={{
          width: "100%", marginTop: 12, padding: "10px", borderRadius: 10,
          background: "#024396", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          Save & Close
        </button>
      </div>
    </div>
  );
}
