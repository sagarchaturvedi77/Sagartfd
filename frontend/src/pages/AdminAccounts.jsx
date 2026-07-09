import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Building2 } from "lucide-react";
import PageHeader from "../components/portal/PageHeader";

const API = process.env.REACT_APP_BACKEND_URL || "";

const TYPES = ["income", "expense", "loan", "asset", "liability"];
const CATEGORIES = {
  income: ["Revenue", "Commission", "Interest", "Consulting", "Other Income"],
  expense: ["Rent", "Salary", "Office Supplies", "Travel", "Electricity", "Internet", "Marketing", "Insurance", "Maintenance", "Food", "Other Expense"],
  loan: ["Business Loan", "Personal Loan", "Vehicle Loan", "EMI Payment", "Other Loan"],
  asset: ["Cash in Hand", "Bank Balance", "Fixed Deposit", "Equipment", "Furniture", "Vehicle", "Property", "Investments", "Other Asset"],
  liability: ["Outstanding Loan", "Payable", "Credit Card", "Other Liability"],
};
const PAYMENT_MODES = ["Cash", "Bank Transfer", "UPI", "Cheque", "Card", "Other"];

const fmtINR = (n) => {
  if (n === 0) return "₹0";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${n < 0 ? "-" : ""}₹${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${n < 0 ? "-" : ""}₹${(abs / 1e5).toFixed(2)} L`;
  return `${n < 0 ? "-" : ""}₹${abs.toLocaleString("en-IN")}`;
};

export default function AdminAccounts() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("overview");
  const [filterType, setFilterType] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    category: "Rent",
    description: "",
    amount: "",
    payment_mode: "Bank Transfer",
    reference: "",
  });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ year });
      if (filterType) params.set("type", filterType);
      const [txnRes, sumRes] = await Promise.all([
        fetch(`${API}/api/accounts/transactions?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/accounts/summary?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (txnRes.ok) setTransactions(await txnRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [token, year, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category) return;
    await fetch(`${API}/api/accounts/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setShowAdd(false);
    setForm({ date: new Date().toISOString().split("T")[0], type: "expense", category: "Rent", description: "", amount: "", payment_mode: "Bank Transfer", reference: "" });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await fetch(`${API}/api/accounts/transactions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const typeColor = { income: "text-green-600 bg-green-50", expense: "text-red-600 bg-red-50", loan: "text-orange-600 bg-orange-50", asset: "text-blue-600 bg-blue-50", liability: "text-purple-600 bg-purple-50" };

  return (
    <PortalLayout>
      <div className="space-y-4">
        <PageHeader
          icon="🏦"
          title="Accounts"
          subtitle="Income, expenses, and balance sheet"
          actions={
            <>
              <select value={year} onChange={e => setYear(e.target.value)} className="border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2 py-1.5 text-xs">
                {[...Array(5)].map((_, i) => { const y = new Date().getFullYear() - i; return <option key={y} value={y}>{y}</option>; })}
              </select>
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#024396] text-white rounded-lg text-xs font-semibold">
                <Plus size={14} /> Add Entry
              </button>
            </>
          }
        />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E2D8C2] dark:border-white/10 pb-1">
          {[["overview", "Overview"], ["transactions", "Transactions"], ["balance", "Balance Sheet"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg ${tab === k ? "bg-[#024396] text-white" : "text-[#5C677D] dark:text-[#8E99AC] hover:bg-[#F5F1EB] dark:hover:bg-white/10"}`}>
              {l}
            </button>
          ))}
        </div>

        {loading ? <p className="text-sm text-[#5C677D] dark:text-[#8E99AC]">Loading...</p> : (
          <>
            {/* Overview Tab */}
            {tab === "overview" && summary && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon={<TrendingUp size={18} />} label="Total Income" value={fmtINR(summary.total_income)} color="green" />
                  <StatCard icon={<TrendingDown size={18} />} label="Total Expense" value={fmtINR(summary.total_expense)} color="red" />
                  <StatCard icon={<DollarSign size={18} />} label="Profit / Loss" value={fmtINR(summary.profit_loss)} color={summary.profit_loss >= 0 ? "green" : "red"} />
                  <StatCard icon={<Building2 size={18} />} label="Net Worth" value={fmtINR(summary.networth)} color="blue" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-4">
                    <h4 className="text-xs font-semibold text-[#5C677D] dark:text-[#8E99AC] mb-2 uppercase tracking-wider">Assets</h4>
                    <p className="text-lg font-semibold text-blue-600">{fmtINR(summary.total_assets)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-4">
                    <h4 className="text-xs font-semibold text-[#5C677D] dark:text-[#8E99AC] mb-2 uppercase tracking-wider">Liabilities</h4>
                    <p className="text-lg font-semibold text-purple-600">{fmtINR(summary.total_liabilities)}</p>
                  </div>
                </div>

                {/* Category Breakdown */}
                {summary.category_breakdown && Object.keys(summary.category_breakdown).length > 0 && (
                  <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-4">
                    <h4 className="text-xs font-semibold text-[#5C677D] dark:text-[#8E99AC] mb-3 uppercase tracking-wider">Category Breakdown</h4>
                    <div className="space-y-3">
                      {Object.entries(summary.category_breakdown).map(([type, cats]) => (
                        <div key={type}>
                          <p className="text-xs font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] capitalize mb-1">{type}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(cats).map(([cat, amt]) => (
                              <div key={cat} className="text-xs text-[#2A364B] dark:text-[#8E99AC] bg-[#F5F1EB] dark:bg-white/5 rounded-lg px-2 py-1.5">
                                <span className="font-medium">{cat}:</span> {fmtINR(amt)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly P&L */}
                {summary.monthly && Object.keys(summary.monthly).length > 0 && (
                  <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-4">
                    <h4 className="text-xs font-semibold text-[#5C677D] dark:text-[#8E99AC] mb-3 uppercase tracking-wider">Monthly P&L</h4>
                    <div className="space-y-1.5">
                      {Object.entries(summary.monthly).sort().map(([m, d]) => (
                        <div key={m} className="flex justify-between text-xs text-[#2A364B] dark:text-[#8E99AC] bg-[#F5F1EB] dark:bg-white/5 rounded-lg px-3 py-2">
                          <span className="font-medium">{m}</span>
                          <div className="flex gap-4">
                            <span className="text-green-600">+{fmtINR(d.income)}</span>
                            <span className="text-red-600">-{fmtINR(d.expense)}</span>
                            <span className={d.income - d.expense >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                              {fmtINR(d.income - d.expense)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {tab === "transactions" && (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setFilterType("")} className={`px-3 py-1 rounded-lg text-xs border ${!filterType ? "bg-[#024396] text-white border-[#024396] dark:border-[#4C8DFF]" : "bg-white dark:bg-[#101D2E] border-[#E2D8C2] dark:border-white/10"}`}>All</button>
                  {TYPES.map(t => (
                    <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1 rounded-lg text-xs border capitalize ${filterType === t ? "bg-[#024396] text-white border-[#024396] dark:border-[#4C8DFF]" : "bg-white dark:bg-[#101D2E] border-[#E2D8C2] dark:border-white/10"}`}>{t}</button>
                  ))}
                </div>
                {transactions.length === 0 ? (
                  <p className="text-sm text-[#5C677D] dark:text-[#8E99AC] text-center py-8">No transactions found</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(txn => (
                      <div key={txn.id} className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-3 flex items-center gap-3">
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-semibold capitalize ${typeColor[txn.type] || ""}`}>{txn.type}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3] truncate">{txn.category}{txn.description ? ` — ${txn.description}` : ""}</p>
                          <p className="text-[10px] text-[#5C677D] dark:text-[#8E99AC]">{txn.date} {txn.payment_mode && `· ${txn.payment_mode}`} {txn.reference && `· Ref: ${txn.reference}`}</p>
                        </div>
                        <p className={`text-sm font-semibold ${txn.type === "income" || txn.type === "asset" ? "text-green-600" : "text-red-600"}`}>
                          {txn.type === "income" || txn.type === "asset" ? "+" : "-"}{fmtINR(txn.amount)}
                        </p>
                        <button onClick={() => handleDelete(txn.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Balance Sheet Tab */}
            {tab === "balance" && summary && (
              <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-5">
                <h3 className="text-center font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1">Balance Sheet — The Financial Doctor</h3>
                <p className="text-center text-xs text-[#5C677D] dark:text-[#8E99AC] mb-4">As on 31st December {year}</p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-[#024396] dark:text-[#7CB0FF] uppercase tracking-wider border-b border-[#024396] dark:border-[#4C8DFF] pb-1 mb-2">Assets</h4>
                    {summary.category_breakdown?.asset && Object.entries(summary.category_breakdown.asset).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs text-[#2A364B] dark:text-[#8E99AC] py-1 border-b border-dotted border-[#E2D8C2] dark:border-white/10">
                        <span>{k}</span><span className="font-medium">{fmtINR(v)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3] pt-2 border-t-2 border-[#0E1B2C] dark:border-white/20 mt-2">
                      <span>Total Assets</span><span>{fmtINR(summary.total_assets)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider border-b border-red-600 pb-1 mb-2">Liabilities</h4>
                    {summary.category_breakdown?.liability && Object.entries(summary.category_breakdown.liability).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs text-[#2A364B] dark:text-[#8E99AC] py-1 border-b border-dotted border-[#E2D8C2] dark:border-white/10">
                        <span>{k}</span><span className="font-medium">{fmtINR(v)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3] pt-2 border-t-2 border-[#0E1B2C] dark:border-white/20 mt-2">
                      <span>Total Liabilities</span><span>{fmtINR(summary.total_liabilities)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t-2 border-[#024396] dark:border-[#4C8DFF] flex justify-between">
                  <span className="text-sm font-bold text-[#024396] dark:text-[#7CB0FF]">Company Net Worth</span>
                  <span className="text-lg font-bold text-[#024396] dark:text-[#7CB0FF]">{fmtINR(summary.networth)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-[#E2D8C2] dark:border-white/10">
                  <div className="flex justify-between text-xs text-[#2A364B] dark:text-[#8E99AC] py-0.5"><span>Total Revenue ({year})</span><span className="text-green-600 font-medium">{fmtINR(summary.total_income)}</span></div>
                  <div className="flex justify-between text-xs text-[#2A364B] dark:text-[#8E99AC] py-0.5"><span>Total Expenses ({year})</span><span className="text-red-600 font-medium">{fmtINR(summary.total_expense)}</span></div>
                  <div className="flex justify-between text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3] pt-1 border-t border-[#E2D8C2] dark:border-white/10 mt-1">
                    <span>{summary.profit_loss >= 0 ? "Net Profit" : "Net Loss"}</span>
                    <span className={summary.profit_loss >= 0 ? "text-green-600" : "text-red-600"}>{fmtINR(summary.profit_loss)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Add Transaction Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#101D2E] rounded-2xl p-6 max-w-md w-full space-y-3 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Add Entry</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, category: (CATEGORIES[e.target.value] || [])[0] || "" }))}
                    className="w-full border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm capitalize">
                    {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm">
                  {(CATEGORIES[form.type] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Amount (₹)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="Enter amount" />
              </div>

              <div>
                <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="Optional details" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Payment Mode</label>
                  <select value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))}
                    className="w-full border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm">
                    {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Reference</label>
                  <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                    className="w-full border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="Bill/Txn no." />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-[#E2D8C2] dark:border-white/10 text-sm">Cancel</button>
                <button type="submit" disabled={!form.amount} className="flex-1 py-2.5 rounded-xl bg-[#024396] text-white text-sm font-semibold disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-70">{icon}<span className="text-[10px] font-medium uppercase tracking-wider">{label}</span></div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
