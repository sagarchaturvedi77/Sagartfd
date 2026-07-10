/**
 * DashboardCustomizer — reusable hook + UI for both Admin & Employee dashboards.
 * Each user can add/remove/reorder widgets. Saved in localStorage per user.
 */
import React, { useState } from "react";

// NOTE: this list is intentionally scoped to widgets that actually exist as
// distinct, independently-hideable sections on AdminDashboard.jsx today. The
// customizer previously listed many more (tasks, leaves, salary, chat...) but
// nothing on either dashboard ever read `activeWidgets` — every toggle was a
// no-op. Only list what genuinely responds to being turned on/off; expand this
// (and wire up the matching section in AdminDashboard.jsx) as new dashboard
// sections are built, rather than promising a toggle that does nothing.
export const ALL_ADMIN_WIDGETS = [
  { id: "stats",      label: "📊 Stats Cards",        desc: "Total employees, active, system status, targets link" },
];

export const ALL_EMPLOYEE_WIDGETS = [
  { id: "attendance", label: "🕐 Punch In/Out",        desc: "Today's attendance card" },
  { id: "targets",    label: "🎯 My Target",           desc: "This month's target progress card" },
  { id: "leads",      label: "📋 My Leads",            desc: "Lead stats, search/filter and lead list" },
];

export function useWidgets(userId, role) {
  const storageKey = `dashboard_widgets_${userId}_${role}`;
  const allWidgets = role === "admin" ? ALL_ADMIN_WIDGETS : ALL_EMPLOYEE_WIDGETS;
  const defaultActive = allWidgets.map(w => w.id);

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
                  padding: "5px 12px", borderRadius: 8, cursor: "pointer",
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
