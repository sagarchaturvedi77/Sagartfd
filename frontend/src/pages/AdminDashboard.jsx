import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", designation: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/auth/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch(`${API_BASE}/api/auth/create-employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, role: "employee" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.detail || "Could not create employee");
      return;
    }
    setForm({ name: "", email: "", password: "", phone: "", designation: "" });
    setShowAddForm(false);
    fetchEmployees();
  };

  return (
    <PortalLayout>
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Employees" value={employees.length} color="blue" />
        <StatCard label="Active" value={employees.filter(e => e.role === "employee").length} color="green" />
        <StatCard label="This Month" value={new Date().toLocaleString("default", { month: "long" })} color="purple" isText />
        <StatCard label="System Status" value="Live" color="emerald" isText />
      </div>

      {/* Employees section */}
      <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E2D8C2] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif text-[#0E1B2C]">Team Members</h2>
            <p className="text-xs text-[#2A364B]/50 mt-0.5">{employees.length} employees registered</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showAddForm
                ? "bg-[#2A364B]/10 text-[#2A364B] hover:bg-[#2A364B]/20"
                : "bg-[#024396] text-white hover:bg-[#023580] shadow-md shadow-[#024396]/20"
            }`}
          >
            {showAddForm ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>Cancel</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>Add Employee</>
            )}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <form onSubmit={handleAddEmployee} className="p-6 bg-[#FBF7EE]/50 border-b border-[#E2D8C2]">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormInput required placeholder="Full Name" value={form.name} onChange={v => setForm({...form, name: v})} />
              <FormInput required type="email" placeholder="Email (login ID)" value={form.email} onChange={v => setForm({...form, email: v})} />
              <FormInput required type="password" placeholder="Temporary Password" value={form.password} onChange={v => setForm({...form, password: v})} />
              <FormInput placeholder="Phone Number" value={form.phone} onChange={v => setForm({...form, phone: v})} />
              <FormInput placeholder="Designation (e.g. Relationship Manager)" value={form.designation} onChange={v => setForm({...form, designation: v})} className="sm:col-span-2" />
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-3 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </p>
            )}
            <button type="submit" className="mt-4 bg-[#024396] text-white py-2.5 px-8 rounded-xl font-medium text-sm hover:bg-[#023580] transition-all shadow-md shadow-[#024396]/20">
              Create Employee Account
            </button>
          </form>
        )}

        {/* Employee table */}
        {loading ? (
          <div className="p-12 text-center text-[#2A364B]/50">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#024396]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Loading team...
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#2A364B]/40 text-sm">No employees added yet. Click "Add Employee" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FBF7EE]/80">
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Name</th>
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Designation</th>
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Phone</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t border-[#E2D8C2]/50 hover:bg-[#FBF7EE]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white text-xs font-bold">
                          {emp.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-[#0E1B2C]">{emp.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#2A364B]/70">{emp.email}</td>
                    <td className="p-4">
                      {emp.designation ? (
                        <span className="bg-[#024396]/10 text-[#024396] text-xs px-2.5 py-1 rounded-full">{emp.designation}</span>
                      ) : (
                        <span className="text-[#2A364B]/30">-</span>
                      )}
                    </td>
                    <td className="p-4 text-[#2A364B]/70">{emp.phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

function StatCard({ label, value, color, isText }) {
  const colors = {
    blue: "from-[#024396] to-[#0356c4]",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-violet-500 to-violet-600",
    emerald: "from-teal-500 to-teal-600",
  };
  return (
    <div className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm">
      <p className="text-[10px] font-medium text-[#2A364B]/50 uppercase tracking-wider mb-1">{label}</p>
      <p className={`${isText ? "text-lg" : "text-2xl"} font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}>
        {value}
      </p>
    </div>
  );
}

function FormInput({ className = "", onChange, ...props }) {
  return (
    <input
      {...props}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-[#E2D8C2] rounded-xl px-4 py-2.5 bg-white focus:border-[#024396] focus:ring-2 focus:ring-[#024396]/20 outline-none transition-all text-sm ${className}`}
    />
  );
}
