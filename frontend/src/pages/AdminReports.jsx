import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import StatCard from "../components/portal/StatCard";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtINR = (n) => {
  if (!n) return "₹0";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
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
        <PageHeader
          icon="📊"
          title="Business Reports"
          subtitle="Revenue, performance, leads & salary overview"
          actions={
            <>
              <select value={month} onChange={(e) => setMonth(+e.target.value)} className="border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-3 py-2 text-sm">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(+e.target.value)} className="border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-3 py-2 text-sm">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !report ? (
          <p className="text-center text-[#2A364B]/50 dark:text-[#8E99AC] py-10">Could not load report data.</p>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="💵" label="Monthly Revenue" value={fmtINR(report.totalRevenue)} color="green" trend="From target achievements" />
              <StatCard icon="💰" label="Salary Cost" value={fmtINR(report.totalSalaryCost)} color="navy" trend={`${report.slips.length} employee(s)`} />
              <StatCard icon="📋" label="Total Leads" value={report.totalLeads} color="navy" trend={`${report.convertedLeads} converted (${report.conversionRate}%)`} />
              <StatCard icon="👥" label="Team Size" value={report.totalEmployees} color="slate" trend="Active employees" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top performers */}
              <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Top Performers — {MONTHS[month - 1]} {year}</h3>
                {report.empPerformance.length > 0 ? (
                  <div className="space-y-3">
                    {report.empPerformance.map((emp, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            {i === 0 && <span className="text-yellow-500">&#9733;</span>}
                            <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{emp.name}</span>
                          </span>
                          <span className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">
                            {fmtINR(emp.achieved)} / {fmtINR(emp.target)} ({emp.pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 bg-[#F5F1EB] dark:bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${emp.pct >= 100 ? "bg-emerald-500" : emp.pct >= 50 ? "bg-[#024396] dark:bg-[#4C8DFF]" : "bg-orange-400"}`}
                            style={{ width: `${Math.min(100, emp.pct)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70">No target data for this month</p>
                )}
              </div>

              {/* Lead sources */}
              <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Lead Sources</h3>
                {report.leadSources.length > 0 ? (
                  <div className="space-y-2">
                    {report.leadSources.map((ls, i) => {
                      const maxCount = Math.max(...report.leadSources.map(x => x.count), 1);
                      const pct = Math.round((ls.count / maxCount) * 100);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs text-[#2A364B]/70 dark:text-[#8E99AC] mb-0.5">
                            <span className="capitalize">{ls.source}</span>
                            <span className="font-semibold">{ls.count}</span>
                          </div>
                          <div className="h-2 bg-[#F5F1EB] dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#024396] to-[#0356c4] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70">No lead data yet</p>
                )}
              </div>

              {/* Salary breakdown */}
              <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Salary Breakdown — {MONTHS[month - 1]} {year}</h3>
                {report.slips.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F5F1EB] dark:bg-white/5 border-b border-[#E2D8C2] dark:border-white/10">
                          <th className="text-left px-3 py-2 font-medium text-[#2A364B]/70 dark:text-[#8E99AC]">Employee</th>
                          <th className="text-right px-3 py-2 font-medium text-[#2A364B]/70 dark:text-[#8E99AC]">Gross</th>
                          <th className="text-right px-3 py-2 font-medium text-[#2A364B]/70 dark:text-[#8E99AC]">Deductions</th>
                          <th className="text-right px-3 py-2 font-medium text-[#2A364B]/70 dark:text-[#8E99AC]">Net</th>
                          <th className="text-center px-3 py-2 font-medium text-[#2A364B]/70 dark:text-[#8E99AC]">Attendance</th>
                          <th className="text-center px-3 py-2 font-medium text-[#2A364B]/70 dark:text-[#8E99AC]">Target %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.slips.map(s => (
                          <tr key={s.id} className="border-b border-[#F0EADD] dark:border-white/5">
                            <td className="px-3 py-2 font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{s.employee_name}</td>
                            <td className="px-3 py-2 text-right text-[#0E1B2C] dark:text-[#F1EDE3]">{fmtINR(s.gross_salary)}</td>
                            <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">{fmtINR(s.total_deductions)}</td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-700 dark:text-emerald-400">{fmtINR(s.net_salary)}</td>
                            <td className="px-3 py-2 text-center text-xs text-[#0E1B2C] dark:text-[#C7CEDA]">{s.present_days}P/{s.half_days}H/{s.absent_days}A</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.target_pct >= 100 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : s.target_pct >= 50 ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" : "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400"}`}>
                                {s.target_pct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#F5F1EB] dark:bg-white/5 font-semibold">
                          <td className="px-3 py-2 text-[#0E1B2C] dark:text-[#F1EDE3]">Total</td>
                          <td className="px-3 py-2 text-right text-[#0E1B2C] dark:text-[#F1EDE3]">{fmtINR(report.slips.reduce((s, x) => s + (x.gross_salary || 0), 0))}</td>
                          <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">{fmtINR(report.slips.reduce((s, x) => s + (x.total_deductions || 0), 0))}</td>
                          <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-400">{fmtINR(report.totalSalaryCost)}</td>
                          <td className="px-3 py-2" colSpan={2}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70">No salary data for this month. Generate slips first.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
