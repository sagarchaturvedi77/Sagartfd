import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { useWidgets } from "../components/DashboardCustomizer";
import PageHeader from "../components/portal/PageHeader";
import StatCard from "../components/portal/StatCard";
import AdminActivityLog from "../components/portal/AdminActivityLog";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { activeWidgets } = useWidgets(user?.id, "admin");
  const [employees, setEmployees] = useState([]);

  const fetchEmployees = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/auth/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEmployees(await res.json());
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <PortalLayout>
      <PageHeader icon="📊" title="Dashboard" subtitle="Team overview and quick actions" />

      {activeWidgets.includes("stats") && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Employees" value={employees.length} color="navy" onClick={() => navigate("/portal/admin/employees")} />
          <StatCard label="Active" value={employees.filter(e => e.role === "employee").length} color="green" />
          <StatCard label="This Month" value={new Date().toLocaleString("default", { month: "long" })} color="purple" />
          <StatCard label="System Status" value="Live" color="green" />
          <StatCard label="🎯 Targets (+ Tasks)" value="View" color="navy" onClick={() => navigate("/portal/admin/targets")} />
        </div>
      )}

      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-4 sm:p-5 shadow-sm mb-6">
        <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1">Recent Activity</h3>
        <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] mb-2">What you've done recently in the portal</p>
        <AdminActivityLog token={token} />
      </div>
    </PortalLayout>
  );
}
