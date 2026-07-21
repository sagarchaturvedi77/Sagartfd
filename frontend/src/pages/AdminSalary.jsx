import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import DataTable from "../components/portal/DataTable";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtINR = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function AdminSalary() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [slips, setSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [configEmp, setConfigEmp] = useState(null);
  const [cfg, setCfg] = useState({});

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

  const [generateSlips, generating] = useSubmitOnce(async () => {
    const res = await fetch(`${API_BASE}/api/salary/generate`, {
      method: "POST", headers,
      body: JSON.stringify({ month, year }),
    });
    if (!res.ok) {
      toast.error("Could not generate salary slips. Please try again.");
      return;
    }
    await load();
  });

  const [finalizeSlip, finalizing] = useSubmitOnce(async (slipId) => {
    const res = await fetch(`${API_BASE}/api/salary/slips/${slipId}/finalize`, { method: "POST", headers });
    if (!res.ok) {
      toast.error("Could not finalize this slip. Please try again.");
      return;
    }
    load();
  });

  const openConfig = async (emp) => {
    setConfigEmp(emp);
    try {
      const res = await fetch(`${API_BASE}/api/salary/config/${emp.id}`, { headers });
      if (res.ok) setCfg(await res.json());
      else setCfg({});
    } catch { setCfg({}); }
  };

  const [saveConfig, savingCfg] = useSubmitOnce(async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/salary/config/${configEmp.id}`, {
      method: "POST", headers, body: JSON.stringify(cfg),
    });
    if (!res.ok) {
      toast.error("Could not save salary config. Please try again.");
      return;
    }
    setConfigEmp(null);
  });

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  const columns = [
    {
      key: "employee_name", label: "Employee",
      render: (s) => (
        <div>
          <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{s.employee_name}</p>
          <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC]">{s.designation}</p>
        </div>
      ),
    },
    { key: "gross_salary", label: "Gross", render: (s) => <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{fmtINR(s.gross_salary)}</span> },
    { key: "total_deductions", label: "Deductions", hideBelow: "md", render: (s) => <span className="text-red-600 dark:text-red-400">{fmtINR(s.total_deductions)}</span> },
    { key: "net_salary", label: "Net", render: (s) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{fmtINR(s.net_salary)}</span> },
    {
      key: "attendance", label: "Attendance", hideBelow: "lg",
      render: (s) => <span className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">{s.present_days}P / {s.half_days}H / {s.absent_days}A</span>,
    },
    {
      key: "status", label: "Status",
      render: (s) => (
        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${s.status === "finalized" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400"}`}>
          {s.status}
        </span>
      ),
    },
    {
      key: "action", label: "Action",
      render: (s) => s.status !== "finalized" && (
        <button onClick={() => finalizeSlip(s.id)} disabled={finalizing} className="text-xs text-[#024396] dark:text-[#7CB0FF] hover:underline disabled:opacity-50">{finalizing ? "Finalizing..." : "Finalize"}</button>
      ),
    },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <PageHeader
          icon="💰"
          title="Salary Management"
          subtitle="Configure salaries, generate monthly slips"
          actions={
            <>
              <select value={month} onChange={(e) => setMonth(+e.target.value)} className="border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-3 py-2 text-sm">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(+e.target.value)} className="border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-3 py-2 text-sm">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <Button onClick={generateSlips} disabled={generating} className="bg-gradient-to-r from-[#024396] to-[#0356c4] whitespace-nowrap">
                {generating ? "Generating..." : "Generate Slips"}
              </Button>
            </>
          }
        />

        {/* Employee salary configs */}
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Employee Salary Config</h3>
          <div className="flex flex-wrap gap-2">
            {employees.map(emp => (
              <button key={emp.id} onClick={() => openConfig(emp)}
                className="px-3 py-1.5 rounded-lg text-xs border border-[#E2D8C2] dark:border-white/15 dark:text-[#C7CEDA] hover:border-[#024396] hover:text-[#024396] dark:hover:border-[#7CB0FF] dark:hover:text-[#7CB0FF] transition-all">
                {emp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Config modal */}
        <PortalModal
          open={!!configEmp}
          onOpenChange={(v) => !v && setConfigEmp(null)}
          title={configEmp ? `Salary Config: ${configEmp.name}` : ""}
          description={configEmp?.designation || "Employee"}
          maxWidth="max-w-md"
        >
          <form onSubmit={saveConfig} className="space-y-3">
            {[
              ["base_salary", "Base Salary"], ["hra", "HRA"], ["da", "DA"],
              ["other_allowances", "Other Allowances"], ["pf_deduction", "PF Deduction"],
              ["tax_deduction", "Tax Deduction"], ["other_deductions", "Other Deductions"],
              ["incentive_per_target_pct", "Incentive per Target %"],
            ].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-[#2A364B]/70 dark:text-[#8E99AC] mb-1">{label}</label>
                <input type="number" step="any" value={cfg[k] || ""} onChange={(e) => setCfg({ ...cfg, [k]: +e.target.value || 0 })} className={field} />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConfigEmp(null)}>Cancel</Button>
              <Button type="submit" disabled={savingCfg} className="flex-1 bg-gradient-to-r from-[#024396] to-[#0356c4]">
                {savingCfg ? "Saving..." : "Save Config"}
              </Button>
            </div>
          </form>
        </PortalModal>

        {/* Slips table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
            <DataTable
              columns={columns}
              rows={slips}
              emptyIcon="💰"
              emptyTitle={`No salary slips for ${MONTHS[month - 1]} ${year}`}
              emptySubtitle='Configure employee salaries and click "Generate Slips".'
            />
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
