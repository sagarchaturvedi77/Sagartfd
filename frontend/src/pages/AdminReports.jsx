import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtINR = (n) => {
  if (!n) return "\u20B90";
  if (n >= 1e7) return `\u20B9${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `\u20B9${(n / 1e5).toFixed(2)} L`;
  return `\u20B9${Math.round(n).toLocaleString("en-IN")}`;
};

export default function AdminReports() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch employees, targets, attendance, leads, salary all at once
      const [empRes, leadsRes, salaryRes] = await Promise.all([
        fetch(`${API_BASE}/api/auth/employees`, { headers }),
        fetch(`${API_BASE}/api/leads/?limit=500`, { headers }),
        fetch(`${API_BASE}/api/salary/slips?month=${month}&year=${year}`, { headers }),
      ]);

      const employees = empRes.ok ? await empRes.json() : [];
      const leads = leadsRes.ok ? await leadsRes.json() : [];
      const slips = salaryRes.ok ? await salaryRes.json() : [];

      // Total salary cost
      const totalSalaryCost = slips.reduce((sum, s) => sum + (s.net_salary || 0), 0);

      // Lead stats
      const totalLeads = leads.length;
      const convertedLeads = leads.filter(l => l.status === "converted").length;
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      // Top performers by target achievement
      const empPerformance = slips
        .filter(s => s.target_amount > 0)
        .map(s => ({
          name: s.employee_name,
          target: s.target_amount,
          achieved: s.achieved_amount,
          pct: s.target_pct,
          present: s.present_days,
        }))
        .sort((a, b) => b.pct - a.pct);

      // Total revenue (sum of achieved amounts)
      const totalRevenue = slips.reduce((sum, s) => sum + (s.achieved_amount || 0), 0);

      // Lead source breakdown
      const leadSources = {};
      leads.forEach(l => { leadSources[l.source || "unknown"] = (leadSources[l.source || "unknown"] || 0) + 1; });

      setReport({
        totalEmployees: employees.length,
        totalLeads,
        convertedLeads,
        conversionRate,
        totalRevenue,
        totalSalaryCost,
        empPerformance,
        leadSources: Object.entries(leadSources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
        slips,
      });
    } catch { /* silent */ }
    setLoading(false);
  }, [token, month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif text-[#0E1B2C]">Business Reports</h2>
            <p className="text-xs text-[#2A364B]/50">Revenue, performance, leads & salary overview</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={month} onChange={(e) => setMonth(+e.target.value)} className="border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(+e.target.value)} className="border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !report ? (
          <p className="text-center text-[#2A364B]/50 py-10">Could not load report data.</p>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
                <p className="text-[10px] text-[#2A364B]/50 uppercase">Monthly Revenue</p>
                <p className="text-2xl font-bold text-emerald-700">{fmtINR(report.totalRevenue)}</p>
                <p className="text-[10px] text-[#2A364B]/40">From target achievements</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
                <p className="text-[10px] text-[#2A364B]/50 uppercase">Salary Cost</p>
                <p className="text-2xl font-bold text-[#0E1B2C]">{fmtINR(report.totalSalaryCost)}</p>
                <p className="text-[10px] text-[#2A364B]/40">{report.slips.length} employee(s)</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
                <p className="text-[10px] text-[#2A364B]/50 uppercase">Total Leads</p>
                <p className="text-2xl font-bold text-[#024396]">{report.totalLeads}</p>
                <p className="text-[10px] text-[#2A364B]/40">{report.convertedLeads} converted ({report.conversionRate}%)</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
                <p className="text-[10px] text-[#2A364B]/50 uppercase">Team Size</p>
                <p className="text-2xl font-bold text-[#0E1B2C]">{report.totalEmployees}</p>
                <p className="text-[10px] text-[#2A364B]/40">Active employees</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top performers */}
              <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
                <h3 className="text-sm font-semibold text-[#0E1B2C] mb-3">Top Performers — {MONTHS[month - 1]} {year}</h3>
                {report.empPerformance.length > 0 ? (
                  <div className="space-y-3">
                    {report.empPerformance.map((emp, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            {i === 0 && <span className="text-yellow-500">&#9733;</span>}
                            <span className="font-medium text-[#0E1B2C]">{emp.name}</span>
                          </span>
                          <span className="text-xs text-[#2A364B]/60">
                            {fmtINR(emp.achieved)} / {fmtINR(emp.target)} ({emp.pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 bg-[#F5F1EB] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${emp.pct >= 100 ? "bg-emerald-500" : emp.pct >= 50 ? "bg-[#024396]" : "bg-orange-400"}`}
                            style={{ width: `${Math.min(100, emp.pct)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#2A364B]/40">No target data for this month</p>
                )}
              </div>

              {/* Lead sources */}
              <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
                <h3 className="text-sm font-semibold text-[#0E1B2C] mb-3">Lead Sources</h3>
                {report.leadSources.length > 0 ? (
                  <div className="space-y-2">
                    {report.leadSources.map((ls, i) => {
                      const maxCount = Math.max(...report.leadSources.map(x => x.count), 1);
                      const pct = Math.round((ls.count / maxCount) * 100);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs text-[#2A364B]/70 mb-0.5">
                            <span className="capitalize">{ls.source}</span>
                            <span className="font-semibold">{ls.count}</span>
                          </div>
                          <div className="h-2 bg-[#F5F1EB] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#024396] to-[#0356c4] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#2A364B]/40">No lead data yet</p>
                )}
              </div>

              {/* Salary breakdown */}
              <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-[#0E1B2C] mb-3">Salary Breakdown — {MONTHS[month - 1]} {year}</h3>
                {report.slips.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F5F1EB] border-b border-[#E2D8C2]">
                          <th className="text-left px-3 py-2 font-medium text-[#2A364B]/70">Employee</th>
                          <th className="text-right px-3 py-2 font-medium text-[#2A364B]/70">Gross</th>
                          <th className="text-right px-3 py-2 font-medium text-[#2A364B]/70">Deductions</th>
                          <th className="text-right px-3 py-2 font-medium text-[#2A364B]/70">Net</th>
                          <th className="text-center px-3 py-2 font-medium text-[#2A364B]/70">Attendance</th>
                          <th className="text-center px-3 py-2 font-medium text-[#2A364B]/70">Target %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.slips.map(s => (
                          <tr key={s.id} className="border-b border-[#F0EADD]">
                            <td className="px-3 py-2 font-medium">{s.employee_name}</td>
                            <td className="px-3 py-2 text-right">{fmtINR(s.gross_salary)}</td>
                            <td className="px-3 py-2 text-right text-red-600">{fmtINR(s.total_deductions)}</td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-700">{fmtINR(s.net_salary)}</td>
                            <td className="px-3 py-2 text-center text-xs">{s.present_days}P/{s.half_days}H/{s.absent_days}A</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.target_pct >= 100 ? "bg-emerald-100 text-emerald-700" : s.target_pct >= 50 ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                                {s.target_pct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#F5F1EB] font-semibold">
                          <td className="px-3 py-2">Total</td>
                          <td className="px-3 py-2 text-right">{fmtINR(report.slips.reduce((s, x) => s + (x.gross_salary || 0), 0))}</td>
                          <td className="px-3 py-2 text-right text-red-600">{fmtINR(report.slips.reduce((s, x) => s + (x.total_deductions || 0), 0))}</td>
                          <td className="px-3 py-2 text-right text-emerald-700">{fmtINR(report.totalSalaryCost)}</td>
                          <td className="px-3 py-2" colSpan={2}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#2A364B]/40">No salary data for this month. Generate slips first.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
