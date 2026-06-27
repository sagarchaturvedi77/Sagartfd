import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", designation: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/auth/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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
    <div className="min-h-screen bg-[#FBF7EE]">
      {/* HEADER */}
      <header className="bg-[#0E1B2C] text-[#F6F1E8] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg">Admin Dashboard</h1>
          <p className="text-xs text-[#F6F1E8]/60">Welcome, {user?.name}</p>
        </div>
        <button onClick={logout} className="text-sm border border-[#F6F1E8]/30 px-4 py-1.5 rounded-full hover:bg-[#F6F1E8]/10">
          Logout
        </button>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-[#0E1B2C]">Employees ({employees.length})</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#024396] text-white px-5 py-2 rounded-full text-sm font-display hover:bg-[#0356c4]"
          >
            {showAddForm ? "Cancel" : "+ Add Employee"}
          </button>
        </div>

        {/* ADD EMPLOYEE FORM */}
        {showAddForm && (
          <form onSubmit={handleAddEmployee} className="bg-white border border-[#E2D8C2] rounded-2xl p-6 mb-8 grid sm:grid-cols-2 gap-4">
            <input required placeholder="Full Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-[#E2D8C2] rounded-lg px-3 py-2" />
            <input required type="email" placeholder="Email (login id)" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-[#E2D8C2] rounded-lg px-3 py-2" />
            <input required type="password" placeholder="Temporary Password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border border-[#E2D8C2] rounded-lg px-3 py-2" />
            <input placeholder="Phone Number" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border border-[#E2D8C2] rounded-lg px-3 py-2" />
            <input placeholder="Designation (e.g. Relationship Manager)" value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="border border-[#E2D8C2] rounded-lg px-3 py-2 sm:col-span-2" />
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <button type="submit" className="bg-[#024396] text-white py-2 rounded-lg font-display sm:col-span-2">
              Create Employee Login
            </button>
          </form>
        )}

        {/* EMPLOYEE LIST */}
        {loading ? (
          <p className="text-[#2A364B]/60">Loading employees...</p>
        ) : employees.length === 0 ? (
          <p className="text-[#2A364B]/60">No employees added yet.</p>
        ) : (
          <div className="bg-white border border-[#E2D8C2] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FBF7EE]">
                <tr>
                  <th className="text-left p-4 font-display text-[#0E1B2C]">Name</th>
                  <th className="text-left p-4 font-display text-[#0E1B2C]">Email</th>
                  <th className="text-left p-4 font-display text-[#0E1B2C]">Designation</th>
                  <th className="text-left p-4 font-display text-[#0E1B2C]">Phone</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-t border-[#E2D8C2]">
                    <td className="p-4">{e.name}</td>
                    <td className="p-4">{e.email}</td>
                    <td className="p-4">{e.designation || "-"}</td>
                    <td className="p-4">{e.phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-[#2A364B]/50 mt-8">
          Coming next: targets, attendance tracking, lead assignment, proposals & salary —
          built module by module on top of this dashboard.
        </p>
      </main>
    </div>
  );
}
