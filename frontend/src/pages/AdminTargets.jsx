import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminTargets() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [targets, setTargets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: "", target_amount: "", target_type: "SIP" });
  const [editId, setEditId] = useState(null);
  const [editAmt, setEditAmt] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/targets/all?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTargets(await res.json());
    setLoading(false);
  }, [token, month, year]);

  const fetchEmployees = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/auth/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEmployees(await res.json());
  }, [token]);

  useEffect(() => { fetchTargets(); }, [fetchTargets]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleSetTarget = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/targets/set`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, month, year, target_amount: Number(form.target_amount) }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ employee_id: "", target_amount: "", target_type: "SIP" });
      fetchTargets();
    }
  };

  const handleUpdateProgress = async (targetId) => {
    const res = await fetch(`${API_BASE}/api/targets/${targetId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ achieved_amount: Number(editAmt) }),
    });
    if (res.ok) {
      setEditId(null);
      setEditAmt("");
      fetchTargets();
    }
  };

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formatCurrency = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  return (
    <PortalLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">Monthly Targets</h2>
          <p className="text-xs text-[#2A364B]/50">Set and track employee sales targets</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-[#E2D8C2] rounded-lg px-3 py-2 text-sm bg-white">
            {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-[#E2D8C2] rounded-lg px-3 py-2 text-sm bg-white">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showForm ? "bg-[#2A364B]/10 text-[#2A364B]" : "bg-[#024396] text-white shadow-md shadow-[#024396]/20"
            }`}
          >
            {showForm ? "Cancel" : "+ Set Target"}
          </button>
        </div>
      </div>

      {/* Set target form */}
      {showForm && (
        <form onSubmit={handleSetTarget} className="bg-white rounded-2xl border border-[#E2D8C2] p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0E1B2C] mb-4">Set Target for {monthNames[month - 1]} {year}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <select required value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}
              className="border border-[#E2D8C2] rounded-xl px-4 py-2.5 bg-white text-sm">
              <option value="">Select Employee</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
            <input required type="number" placeholder="Target Amount (e.g. 1000000)" value={form.target_amount}
              onChange={e => setForm({...form, target_amount: e.target.value})}
              className="border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm" />
            <select value={form.target_type} onChange={e => setForm({...form, target_type: e.target.value})}
              className="border border-[#E2D8C2] rounded-xl px-4 py-2.5 bg-white text-sm">
              <option value="SIP">SIP</option>
              <option value="Lumpsum">Lumpsum</option>
              <option value="Insurance">Insurance</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
          <button type="submit" className="mt-4 bg-[#024396] text-white py-2.5 px-8 rounded-xl text-sm font-medium hover:bg-[#023580] shadow-md shadow-[#024396]/20">
            Set Target
          </button>
        </form>
      )}

      {/* Targets grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E2D8C2] p-12 text-center text-[#2A364B]/50 shadow-sm">
          <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#024396]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Loading...
        </div>
      ) : targets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2D8C2] p-12 text-center text-[#2A364B]/40 text-sm shadow-sm">
          No targets set for {monthNames[month - 1]} {year}. Click "+ Set Target" to add one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {targets.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white text-xs font-bold">
                    {t.employee_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0E1B2C]">{t.employee_name}</p>
                    <p className="text-[10px] text-[#2A364B]/50 uppercase">{t.target_type}</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#2A364B]/60">Progress</span>
                  <span className={`font-bold ${t.progress_pct >= 100 ? "text-emerald-600" : t.progress_pct >= 50 ? "text-[#024396]" : "text-amber-600"}`}>
                    {t.progress_pct}%
                  </span>
                </div>
                <div className="h-2.5 bg-[#E2D8C2]/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      t.progress_pct >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                      t.progress_pct >= 50 ? "bg-gradient-to-r from-[#024396] to-[#0356c4]" :
                      "bg-gradient-to-r from-amber-400 to-amber-500"
                    }`}
                    style={{ width: `${Math.min(t.progress_pct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-[#2A364B]/70 mb-3">
                <span>Achieved: <b className="text-[#0E1B2C]">{formatCurrency(t.achieved_amount)}</b></span>
                <span>Target: <b className="text-[#0E1B2C]">{formatCurrency(t.target_amount)}</b></span>
              </div>

              {/* Update progress */}
              {editId === t.id ? (
                <div className="flex gap-2">
                  <input type="number" placeholder="Achieved amount" value={editAmt} onChange={e => setEditAmt(e.target.value)}
                    className="flex-1 border border-[#E2D8C2] rounded-lg px-3 py-1.5 text-sm" />
                  <button onClick={() => handleUpdateProgress(t.id)} className="bg-[#024396] text-white px-3 py-1.5 rounded-lg text-xs font-medium">Save</button>
                  <button onClick={() => setEditId(null)} className="text-[#2A364B]/50 text-xs">Cancel</button>
                </div>
              ) : (
                <button onClick={() => { setEditId(t.id); setEditAmt(String(t.achieved_amount)); }}
                  className="w-full text-center text-xs text-[#024396] hover:underline font-medium py-1">
                  Update Progress
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
