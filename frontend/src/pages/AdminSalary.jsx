import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtINR = (n) => `\u20B9${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function AdminSalary() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [slips, setSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // config modal
  const [configEmp, setConfigEmp] = useState(null);
  const [cfg, setCfg] = useState({});
  const [savingCfg, setSavingCfg] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    try {
      const [slipRes, empRes] = await Promise.all([
        fetch(`${API_BASE}/api/salary/slips?month=${month}&year=${year}`, { headers }),
        fetch(`${API_BASE}/api/auth/employees`, { headers }),
      ]);
      if (slipRes.ok) setSlips(await slipRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token, month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const generateSlips = async () => {
    setGenerating(true);
    await fetch(`${API_BASE}/api/salary/generate`, {
      method: "POST", headers,
      body: JSON.stringify({ month, year }),
    });
    await load();
    setGenerating(false);
  };

  const finalizeSlip = async (slipId) => {
    await fetch(`${API_BASE}/api/salary/slips/${slipId}/finalize`, { method: "POST", headers });
    load();
  };

  const openConfig = async (emp) => {
    setConfigEmp(emp);
    try {
      const res = await fetch(`${API_BASE}/api/salary/config/${emp.id}`, { headers });
      if (res.ok) setCfg(await res.json());
      else setCfg({});
    } catch { setCfg({}); }
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    setSavingCfg(true);
    await fetch(`${API_BASE}/api/salary/config/${configEmp.id}`, {
      method: "POST", headers, body: JSON.stringify(cfg),
    });
    setSavingCfg(false);
    setConfigEmp(null);
  };

  const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif text-[#0E1B2C]">Salary Management</h2>
            <p className="text-xs text-[#2A364B]/50">Configure salaries, generate monthly slips</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={month} onChange={(e) => setMonth(+e.target.value)} className="border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(+e.target.value)} className="border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={generateSlips} disabled={generating}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] disabled:opacity-60 whitespace-nowrap">
              {generating ? "Generating..." : "Generate Slips"}
            </button>
          </div>
        </div>

        {/* Employee salary configs */}
        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#0E1B2C] mb-3">Employee Salary Config</h3>
          <div className="flex flex-wrap gap-2">
            {employees.map(emp => (
              <button key={emp.id} onClick={() => openConfig(emp)}
                className="px-3 py-1.5 rounded-lg text-xs border border-[#E2D8C2] hover:border-[#024396] hover:text-[#024396] transition-all">
                {emp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Config modal */}
        {configEmp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="font-semibold text-[#0E1B2C] mb-1">Salary Config: {configEmp.name}</h3>
              <p className="text-xs text-[#2A364B]/50 mb-4">{configEmp.designation || "Employee"}</p>
              <form onSubmit={saveConfig} className="space-y-3">
                {[
                  ["base_salary", "Base Salary"], ["hra", "HRA"], ["da", "DA"],
                  ["other_allowances", "Other Allowances"], ["pf_deduction", "PF Deduction"],
                  ["tax_deduction", "Tax Deduction"], ["other_deductions", "Other Deductions"],
                  ["incentive_per_target_pct", "Incentive per Target %"],
                ].map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">{label}</label>
                    <input type="number" step="any" value={cfg[k] || ""} onChange={(e) => setCfg({ ...cfg, [k]: +e.target.value || 0 })} className={field} />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setConfigEmp(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
                  <button type="submit" disabled={savingCfg}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] disabled:opacity-60">
                    {savingCfg ? "Saving..." : "Save Config"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Slips table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slips.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
            <p className="text-[#2A364B]/50 text-sm">No salary slips for {MONTHS[month - 1]} {year}. Configure employee salaries and click "Generate Slips".</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F1EB] border-b border-[#E2D8C2]">
                    <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Employee</th>
                    <th className="text-right px-4 py-3 font-medium text-[#2A364B]/70">Gross</th>
                    <th className="text-right px-4 py-3 font-medium text-[#2A364B]/70 hidden sm:table-cell">Deductions</th>
                    <th className="text-right px-4 py-3 font-medium text-[#2A364B]/70">Net</th>
                    <th className="text-center px-4 py-3 font-medium text-[#2A364B]/70 hidden md:table-cell">Attendance</th>
                    <th className="text-center px-4 py-3 font-medium text-[#2A364B]/70">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-[#2A364B]/70">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {slips.map((s) => (
                    <tr key={s.id} className="border-b border-[#F0EADD] hover:bg-[#FBF7EE] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#0E1B2C]">{s.employee_name}</p>
                        <p className="text-[10px] text-[#2A364B]/50">{s.designation}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#0E1B2C]">{fmtINR(s.gross_salary)}</td>
                      <td className="px-4 py-3 text-right text-red-600 hidden sm:table-cell">{fmtINR(s.total_deductions)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmtINR(s.net_salary)}</td>
                      <td className="px-4 py-3 text-center text-xs text-[#2A364B]/60 hidden md:table-cell">
                        {s.present_days}P / {s.half_days}H / {s.absent_days}A
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${s.status === "finalized" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.status !== "finalized" && (
                          <button onClick={() => finalizeSlip(s.id)}
                            className="text-xs text-[#024396] hover:underline">Finalize</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
