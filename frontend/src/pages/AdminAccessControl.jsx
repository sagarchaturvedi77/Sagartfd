import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const SECTION_LABELS = {
  attendance: "🕐 Attendance", leads: "📋 Leads", salary: "💰 Salary",
  tasks: "✅ Tasks", targets: "🎯 Targets", profile: "👤 Profile",
  calculators: "🧮 Calculators", id_card: "🪪 ID & Visiting Card",
  leaves: "🌴 Leaves", chat: "💬 Team Chat", onboarding: "📝 Onboarding",
  documents: "📄 Documents", settings: "⚙️ Settings",
};

export default function AdminAccessControl() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/access/`, { headers });
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  }, [token]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const toggle = async (empId, section, current) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const newAccess = { ...emp.access, [section]: !current };
    setSaving((s) => ({ ...s, [`${empId}_${section}`]: true }));
    await fetch(`${API_BASE}/api/access/${empId}`, {
      method: "PUT", headers,
      body: JSON.stringify({ access: newAccess }),
    });
    setEmployees((prev) => prev.map((e) => e.id === empId ? { ...e, access: newAccess } : e));
    setSaving((s) => { const n = { ...s }; delete n[`${empId}_${section}`]; return n; });
  };

  return (
    <PortalLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-serif text-[#0E1B2C]">🔑 Access Control</h1>
          <p className="text-sm text-[#2A364B]/60 mt-1">Enable or disable portal sections for each employee. Changes apply immediately.</p>
        </div>

        {loading ? (
          <p className="text-sm text-center text-[#2A364B]/50 py-8">Loading…</p>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
            <p className="text-[#2A364B]/50 text-sm">No employees found.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm">
                <p className="font-semibold text-[#0E1B2C] mb-3">{emp.name}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(SECTION_LABELS).map(([key, label]) => {
                    const enabled = emp.access?.[key] !== false;
                    const savingKey = `${emp.id}_${key}`;
                    return (
                      <button
                        key={key}
                        onClick={() => toggle(emp.id, key, enabled)}
                        disabled={!!saving[savingKey]}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                          enabled
                            ? "border-[#024396] bg-[#024396]/5 text-[#024396]"
                            : "border-[#E2D8C2] bg-[#F5F1EB] text-[#2A364B]/40 line-through"
                        } disabled:opacity-50`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${enabled ? "bg-[#024396]" : "bg-[#2A364B]/20"}`} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
