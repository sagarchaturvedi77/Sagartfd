import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", designation: "", base_salary: "", training_days: "", training_salary: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewEmp, setViewEmp] = useState(null); // employee detail modal
  const [empDetail, setEmpDetail] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null); // show credentials after creation

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
    const payload = {
      ...form,
      role: "employee",
      base_salary: form.base_salary ? Number(form.base_salary) : null,
      training_days: form.training_days ? Number(form.training_days) : null,
    };
    const res = await fetch(`${API_BASE}/api/auth/create-employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.detail || "Could not create employee");
      return;
    }
    const data = await res.json();
    setCreatedCreds({ phone: form.phone, password: data.generated_password, name: form.name });
    setForm({ name: "", phone: "", designation: "", base_salary: "", training_days: "", training_salary: false });
    setShowAddForm(false);
    fetchEmployees();
  };

  const resetPassword = async (emp) => {
    if (!window.confirm(`Reset password for ${emp.name}?`)) return;
    const res = await fetch(`${API_BASE}/api/auth/employees/${emp.id}/reset-password`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCreatedCreds({ phone: data.phone, password: data.new_password, name: data.name });
    }
  };

  const viewEmployee = async (emp) => {
    setViewEmp(emp);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${emp.id}/full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEmpDetail(await res.json());
    } catch { /* silent */ }
  };

  const formatCurrency = (v) => v ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v) : "-";

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

        {/* Add form with training + salary fields */}
        {showAddForm && (
          <form onSubmit={handleAddEmployee} className="p-6 bg-[#FBF7EE]/50 border-b border-[#E2D8C2]">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormInput required placeholder="Full Name" value={form.name} onChange={v => setForm({...form, name: v})} />
              <FormInput required type="tel" placeholder="Mobile Number (Login ID)" value={form.phone} onChange={v => setForm({...form, phone: v})} />
              <FormInput placeholder="Designation (e.g. Relationship Manager)" value={form.designation} onChange={v => setForm({...form, designation: v})} />
              <FormInput type="number" placeholder="Base Salary (monthly)" value={form.base_salary} onChange={v => setForm({...form, base_salary: v})} />
              <FormInput type="number" placeholder="Training Period (days)" value={form.training_days} onChange={v => setForm({...form, training_days: v})} />
              <div className="flex items-center gap-2 px-4">
                <input type="checkbox" id="training_salary" checked={form.training_salary} onChange={e => setForm({...form, training_salary: e.target.checked})}
                  className="rounded border-[#E2D8C2]" />
                <label htmlFor="training_salary" className="text-sm text-[#2A364B]/70">Salary during training?</label>
              </div>
            </div>
            <p className="text-xs text-[#2A364B]/50 mt-2">Password will be auto-generated and shown after creation.</p>
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

        {/* Credentials popup */}
        {createdCreds && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0E1B2C] mb-1">Account Created!</h3>
              <p className="text-sm text-[#2A364B]/60 mb-4">{createdCreds.name}</p>
              <div className="bg-[#FBF7EE] rounded-xl p-4 text-left space-y-2 border border-[#E2D8C2]">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#2A364B]/50">User ID:</span>
                  <span className="font-mono font-bold text-[#0E1B2C]">{createdCreds.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#2A364B]/50">Password:</span>
                  <span className="font-mono font-bold text-[#024396]">{createdCreds.password}</span>
                </div>
              </div>
              <p className="text-[10px] text-[#2A364B]/40 mt-3">Share these credentials with the employee for login.</p>
              <button onClick={() => setCreatedCreds(null)}
                className="mt-4 bg-[#024396] text-white py-2.5 px-8 rounded-xl font-medium text-sm hover:bg-[#023580] transition-all w-full">
                Done
              </button>
            </div>
          </div>
        )}

        {/* Employee table */}
        {loading ? (
          <div className="p-12 text-center text-[#2A364B]/50">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#024396]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Loading team...
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#2A364B]/40 text-sm">No employees added yet. Click &quot;Add Employee&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FBF7EE]/80">
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Name</th>
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Phone (User ID)</th>
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Designation</th>
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider hidden md:table-cell">Salary</th>
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider hidden lg:table-cell">Training</th>
                  <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Actions</th>
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
                        <div>
                          <span className="font-medium text-[#0E1B2C]">{emp.name}</span>
                          {emp.profile_completed && (
                            <span className="ml-1 text-emerald-500" title="Profile complete">&#10003;</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#2A364B]/70 font-mono">{emp.phone || emp.email}</td>
                    <td className="p-4">
                      {emp.designation ? (
                        <span className="bg-[#024396]/10 text-[#024396] text-xs px-2.5 py-1 rounded-full">{emp.designation}</span>
                      ) : (
                        <span className="text-[#2A364B]/30">-</span>
                      )}
                    </td>
                    <td className="p-4 text-[#2A364B]/70 hidden md:table-cell">{formatCurrency(emp.base_salary)}</td>
                    <td className="p-4 hidden lg:table-cell">
                      {emp.training_days ? (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{emp.training_days} days</span>
                      ) : (
                        <span className="text-[#2A364B]/30 text-xs">No training</span>
                      )}
                    </td>
                    <td className="p-4 space-x-2">
                      <button onClick={() => viewEmployee(emp)}
                        className="text-xs text-[#024396] hover:underline font-medium">
                        View
                      </button>
                      <button onClick={() => resetPassword(emp)}
                        className="text-xs text-orange-600 hover:underline font-medium">
                        Reset PW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Detail Modal */}
      {viewEmp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif text-[#0E1B2C]">{viewEmp.name}</h3>
              <button onClick={() => { setViewEmp(null); setEmpDetail(null); }}
                className="text-xs text-[#2A364B]/50 hover:text-[#0E1B2C]">Close</button>
            </div>

            {!empDetail ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {/* Photo */}
                {empDetail.uploads?.photo?.data && (
                  <div className="text-center">
                    <img src={empDetail.uploads.photo.data} alt="Employee" className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-[#024396]/20" />
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <InfoRow label="Email" value={empDetail.user?.email} />
                  <InfoRow label="Phone" value={empDetail.user?.phone} />
                  <InfoRow label="Designation" value={empDetail.user?.designation} />
                  <InfoRow label="Join Date" value={empDetail.user?.join_date} />
                  <InfoRow label="Base Salary" value={formatCurrency(empDetail.user?.base_salary)} />
                  <InfoRow label="Training" value={empDetail.user?.training_days ? `${empDetail.user.training_days} days` : "None"} />
                  <InfoRow label="Training Salary" value={empDetail.user?.training_salary ? "Yes" : "No"} />
                  <InfoRow label="Profile" value={empDetail.user?.profile_completed ? "Completed" : "Pending"} />
                </div>

                {/* Profile details (if filled) */}
                {empDetail.profile?.full_name && (
                  <>
                    <h4 className="text-sm font-semibold text-[#0E1B2C] pt-2 border-t border-[#E2D8C2]">Personal Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <InfoRow label="Full Name" value={empDetail.profile.full_name} />
                      <InfoRow label="DOB" value={empDetail.profile.dob} />
                      <InfoRow label="Gender" value={empDetail.profile.gender} />
                      <InfoRow label="Marital Status" value={empDetail.profile.marital_status} />
                      <InfoRow label="Contact" value={empDetail.profile.contact_no} />
                      <InfoRow label="Father" value={empDetail.profile.father_name} />
                      <InfoRow label="Mother" value={empDetail.profile.mother_name} />
                      <InfoRow label="PAN" value={empDetail.profile.pan_number || "-"} />
                      <InfoRow label="Aadhar" value={empDetail.profile.aadhar_number ? `****${empDetail.profile.aadhar_number.slice(-4)}` : "-"} />
                    </div>
                    <InfoRow label="Address" value={empDetail.profile.address} />

                    <h4 className="text-sm font-semibold text-[#0E1B2C] pt-2 border-t border-[#E2D8C2]">Bank Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <InfoRow label="Bank" value={empDetail.profile.bank_name} />
                      <InfoRow label="A/C No." value={empDetail.profile.bank_account_number} />
                      <InfoRow label="IFSC" value={empDetail.profile.bank_ifsc} />
                      <InfoRow label="Branch" value={empDetail.profile.bank_branch} />
                    </div>
                  </>
                )}

                {/* Documents */}
                {Object.keys(empDetail.uploads || {}).length > 0 && (
                  <>
                    <h4 className="text-sm font-semibold text-[#0E1B2C] pt-2 border-t border-[#E2D8C2]">Documents</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(empDetail.uploads).map(([key, val]) => (
                        <div key={key} className="text-center">
                          {val.data?.startsWith("data:image") ? (
                            <img src={val.data} alt={key} className="h-16 mx-auto rounded-lg object-contain border border-[#E2D8C2]" />
                          ) : (
                            <div className="h-16 bg-[#FBF7EE] rounded-lg flex items-center justify-center text-[10px] text-[#2A364B]/50">PDF</div>
                          )}
                          <p className="text-[10px] text-[#2A364B]/50 mt-1 capitalize">{key.replace(/_/g, " ")}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="text-[#2A364B]/50">{label}:</span>{" "}
      <span className="font-medium text-[#0E1B2C]">{value || "-"}</span>
    </div>
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
