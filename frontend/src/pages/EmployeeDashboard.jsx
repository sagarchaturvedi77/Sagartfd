import React from "react";
import { useAuth } from "../context/AuthContext";

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <header className="bg-[#0E1B2C] text-[#F6F1E8] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg">Employee Dashboard</h1>
          <p className="text-xs text-[#F6F1E8]/60">Welcome, {user?.name} {user?.designation ? `· ${user.designation}` : ""}</p>
        </div>
        <button onClick={logout} className="text-sm border border-[#F6F1E8]/30 px-4 py-1.5 rounded-full hover:bg-[#F6F1E8]/10">
          Logout
        </button>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-[#E2D8C2] rounded-2xl p-6 text-center">
            <p className="text-xs text-[#2A364B]/60 mb-1">My Leads</p>
            <p className="text-2xl font-display text-[#024396]">Coming Soon</p>
          </div>
          <div className="bg-white border border-[#E2D8C2] rounded-2xl p-6 text-center">
            <p className="text-xs text-[#2A364B]/60 mb-1">Attendance</p>
            <p className="text-2xl font-display text-[#024396]">Coming Soon</p>
          </div>
          <div className="bg-white border border-[#E2D8C2] rounded-2xl p-6 text-center">
            <p className="text-xs text-[#2A364B]/60 mb-1">Monthly Target</p>
            <p className="text-2xl font-display text-[#024396]">Coming Soon</p>
          </div>
        </div>
        <p className="text-sm text-[#2A364B]/70">
          This is your starting dashboard. Lead management, attendance check-in,
          proposal creation, and target tracking will be added here next.
        </p>
      </main>
    </div>
  );
}
