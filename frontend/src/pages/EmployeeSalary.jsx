import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtINR = (n) => `\u20B9${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function EmployeeSalary() {
  const { token } = useAuth();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewSlip, setViewSlip] = useState(null);
  const slipRef = useRef(null);

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
    if (!slipRef.current) return;
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
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">My Salary</h2>
          <p className="text-xs text-[#2A364B]/50">View your salary slips and download them</p>
        </div>

        {/* Slip detail modal */}
        {viewSlip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div ref={slipRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-4">
                <h3 className="font-serif text-lg text-[#0E1B2C]">The Financial Doctor</h3>
                <p className="text-xs text-[#2A364B]/50">Salary Slip — {MONTHS[viewSlip.month - 1]} {viewSlip.year}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div><span className="text-[#2A364B]/50">Employee:</span> <span className="font-medium">{viewSlip.employee_name}</span></div>
                <div><span className="text-[#2A364B]/50">Designation:</span> <span className="font-medium">{viewSlip.designation || "Employee"}</span></div>
                <div><span className="text-[#2A364B]/50">Present:</span> <span className="font-medium">{viewSlip.present_days}P / {viewSlip.half_days}H / {viewSlip.absent_days}A</span></div>
                <div><span className="text-[#2A364B]/50">Target:</span> <span className="font-medium">{viewSlip.target_pct}% achieved</span></div>
              </div>

              <div className="border-t border-[#E2D8C2] pt-3 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-[#024396] mb-2">Earnings</p>
                {[["Base Salary", viewSlip.base_salary], ["HRA", viewSlip.hra], ["DA", viewSlip.da],
                  ["Other Allowances", viewSlip.other_allowances], ["Incentive", viewSlip.incentive]].map(([l, v]) => (
                  <div key={l} className="flex justify-between"><span className="text-[#2A364B]/70">{l}</span><span>{fmtINR(v)}</span></div>
                ))}
                <div className="flex justify-between font-semibold border-t border-[#E2D8C2] pt-1">
                  <span>Gross Salary</span><span>{fmtINR(viewSlip.gross_salary)}</span>
                </div>
              </div>

              <div className="border-t border-[#E2D8C2] pt-3 mt-3 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-red-600 mb-2">Deductions</p>
                {[["PF", viewSlip.pf_deduction], ["Tax", viewSlip.tax_deduction], ["Other", viewSlip.other_deductions]].map(([l, v]) => (
                  <div key={l} className="flex justify-between"><span className="text-[#2A364B]/70">{l}</span><span className="text-red-600">{fmtINR(v)}</span></div>
                ))}
                <div className="flex justify-between font-semibold border-t border-[#E2D8C2] pt-1">
                  <span>Total Deductions</span><span className="text-red-600">{fmtINR(viewSlip.total_deductions)}</span>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl text-center py-3 mt-4">
                <p className="text-xs text-emerald-600">Net Salary</p>
                <p className="text-2xl font-bold text-emerald-700">{fmtINR(viewSlip.net_salary)}</p>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setViewSlip(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Close</button>
                <button onClick={downloadSlip}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4]">
                  Download / Print
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slips list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slips.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
            <p className="text-[#2A364B]/50 text-sm">No salary slips available yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slips.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0E1B2C]">{MONTHS[s.month - 1]} {s.year}</p>
                    <p className="text-[10px] text-[#2A364B]/50">{s.present_days} Present / {s.working_days} Working days</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${s.status === "finalized" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {s.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#F5F1EB] rounded-xl py-2">
                    <p className="text-[10px] text-[#2A364B]/50">Gross</p>
                    <p className="text-sm font-semibold">{fmtINR(s.gross_salary)}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl py-2">
                    <p className="text-[10px] text-red-400">Deductions</p>
                    <p className="text-sm font-semibold text-red-600">{fmtINR(s.total_deductions)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl py-2">
                    <p className="text-[10px] text-emerald-500">Net</p>
                    <p className="text-sm font-bold text-emerald-700">{fmtINR(s.net_salary)}</p>
                  </div>
                </div>
                <button onClick={() => setViewSlip(s)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-[#024396] border border-[#024396]/20 hover:bg-[#024396]/5 transition-all">
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
