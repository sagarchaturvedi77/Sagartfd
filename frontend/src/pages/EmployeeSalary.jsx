import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import EmptyState from "../components/portal/EmptyState";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtINR = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function EmployeeSalary() {
  const { token } = useAuth();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewSlip, setViewSlip] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/salary/my-slips`, { headers });
      if (res.ok) setSlips(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const downloadSlip = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Salary Slip - ${viewSlip.employee_name} - ${MONTHS[viewSlip.month - 1]} ${viewSlip.year}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 30px; max-width: 700px; margin: auto; color: #0E1B2C; }
        h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
        .sub { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; font-size: 13px; }
        th { background: #f5f1eb; font-weight: 600; }
        .right { text-align: right; }
        .section { font-size: 14px; font-weight: 600; margin: 20px 0 8px; color: #024396; }
        .net { font-size: 18px; font-weight: bold; text-align: center; padding: 12px; background: #f0fdf4; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; font-size: 11px; color: #999; margin-top: 30px; }
        @media print { body { padding: 10px; } }
      </style></head><body>
        <h1>The Financial Doctor</h1>
        <p class="sub">Salary Slip for ${MONTHS[viewSlip.month - 1]} ${viewSlip.year}</p>
        <table>
          <tr><th>Employee</th><td>${viewSlip.employee_name}</td><th>Designation</th><td>${viewSlip.designation || 'Employee'}</td></tr>
          <tr><th>Working Days</th><td>${viewSlip.working_days}</td><th>Present</th><td>${viewSlip.present_days}P / ${viewSlip.half_days}H / ${viewSlip.absent_days}A</td></tr>
          <tr><th>Target</th><td>${fmtINR(viewSlip.target_amount)}</td><th>Achieved</th><td>${fmtINR(viewSlip.achieved_amount)} (${viewSlip.target_pct}%)</td></tr>
        </table>
        <p class="section">Earnings</p>
        <table>
          <tr><td>Base Salary</td><td class="right">${fmtINR(viewSlip.base_salary)}</td></tr>
          <tr><td>HRA</td><td class="right">${fmtINR(viewSlip.hra)}</td></tr>
          <tr><td>DA</td><td class="right">${fmtINR(viewSlip.da)}</td></tr>
          <tr><td>Other Allowances</td><td class="right">${fmtINR(viewSlip.other_allowances)}</td></tr>
          <tr><td>Incentive</td><td class="right">${fmtINR(viewSlip.incentive)}</td></tr>
          <tr><th>Gross Salary</th><th class="right">${fmtINR(viewSlip.gross_salary)}</th></tr>
        </table>
        <p class="section">Deductions</p>
        <table>
          <tr><td>PF</td><td class="right">${fmtINR(viewSlip.pf_deduction)}</td></tr>
          <tr><td>Tax</td><td class="right">${fmtINR(viewSlip.tax_deduction)}</td></tr>
          <tr><td>Other</td><td class="right">${fmtINR(viewSlip.other_deductions)}</td></tr>
          <tr><th>Total Deductions</th><th class="right">${fmtINR(viewSlip.total_deductions)}</th></tr>
        </table>
        <div class="net">Net Salary: ${fmtINR(viewSlip.net_salary)}</div>
        <p class="footer">This is a system generated salary slip from The Financial Doctor.</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <PageHeader icon="💰" title="My Salary" subtitle="View your salary slips and download them" />

        {/* Slip detail modal */}
        <PortalModal
          open={!!viewSlip}
          onOpenChange={(v) => !v && setViewSlip(null)}
          title="The Financial Doctor"
          description={viewSlip ? `Salary Slip — ${MONTHS[viewSlip.month - 1]} ${viewSlip.year}` : ""}
          maxWidth="max-w-lg"
        >
          {viewSlip && (
            <>
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div><span className="text-[#2A364B]/50 dark:text-[#8E99AC]">Employee:</span> <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{viewSlip.employee_name}</span></div>
                <div><span className="text-[#2A364B]/50 dark:text-[#8E99AC]">Designation:</span> <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{viewSlip.designation || "Employee"}</span></div>
                <div><span className="text-[#2A364B]/50 dark:text-[#8E99AC]">Present:</span> <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{viewSlip.present_days}P / {viewSlip.half_days}H / {viewSlip.absent_days}A</span></div>
                <div><span className="text-[#2A364B]/50 dark:text-[#8E99AC]">Target:</span> <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{viewSlip.target_pct}% achieved</span></div>
              </div>

              <div className="border-t border-[#E2D8C2] dark:border-white/10 pt-3 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-[#024396] dark:text-[#7CB0FF] mb-2">Earnings</p>
                {[["Base Salary", viewSlip.base_salary], ["HRA", viewSlip.hra], ["DA", viewSlip.da],
                  ["Other Allowances", viewSlip.other_allowances], ["Incentive", viewSlip.incentive]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-[#0E1B2C] dark:text-[#F1EDE3]"><span className="text-[#2A364B]/70 dark:text-[#8E99AC]">{l}</span><span>{fmtINR(v)}</span></div>
                ))}
                <div className="flex justify-between font-semibold border-t border-[#E2D8C2] dark:border-white/10 pt-1 text-[#0E1B2C] dark:text-[#F1EDE3]">
                  <span>Gross Salary</span><span>{fmtINR(viewSlip.gross_salary)}</span>
                </div>
              </div>

              <div className="border-t border-[#E2D8C2] dark:border-white/10 pt-3 mt-3 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">Deductions</p>
                {[["PF", viewSlip.pf_deduction], ["Tax", viewSlip.tax_deduction], ["Other", viewSlip.other_deductions]].map(([l, v]) => (
                  <div key={l} className="flex justify-between"><span className="text-[#2A364B]/70 dark:text-[#8E99AC]">{l}</span><span className="text-red-600 dark:text-red-400">{fmtINR(v)}</span></div>
                ))}
                <div className="flex justify-between font-semibold border-t border-[#E2D8C2] dark:border-white/10 pt-1">
                  <span className="text-[#0E1B2C] dark:text-[#F1EDE3]">Total Deductions</span><span className="text-red-600 dark:text-red-400">{fmtINR(viewSlip.total_deductions)}</span>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center py-3 mt-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Net Salary</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{fmtINR(viewSlip.net_salary)}</p>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setViewSlip(null)}>Close</Button>
                <Button className="flex-1 bg-gradient-to-r from-[#024396] to-[#0356c4]" onClick={downloadSlip}>Download / Print</Button>
              </div>
            </>
          )}
        </PortalModal>

        {/* Slips list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slips.length === 0 ? (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm">
            <EmptyState icon="💰" title="No salary slips available yet" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slips.map((s) => (
              <div key={s.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{MONTHS[s.month - 1]} {s.year}</p>
                    <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC]">{s.present_days} Present / {s.working_days} Working days</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${s.status === "finalized" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400"}`}>
                    {s.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#F5F1EB] dark:bg-white/5 rounded-xl py-2">
                    <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC]">Gross</p>
                    <p className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{fmtINR(s.gross_salary)}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl py-2">
                    <p className="text-[10px] text-red-400">Deductions</p>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">{fmtINR(s.total_deductions)}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl py-2">
                    <p className="text-[10px] text-emerald-500">Net</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{fmtINR(s.net_salary)}</p>
                  </div>
                </div>
                <button onClick={() => setViewSlip(s)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-[#024396] dark:text-[#7CB0FF] border border-[#024396]/20 dark:border-[#7CB0FF]/30 hover:bg-[#024396]/5 dark:hover:bg-white/10 transition-all">
                  View Details & Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
