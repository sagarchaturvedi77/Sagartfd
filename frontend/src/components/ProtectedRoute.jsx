import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ONBOARDING_PATH = "/portal/employee/onboarding";

// 🔒 Wrap any route that needs login. Pass requiredRole="admin" to restrict further.
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, profileCompleted, profileChecked } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#2A364B]">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/portal/login" replace />;
  }
  // Employees must finish onboarding before reaching any other portal page —
  // no skip option (AuthContext checks profile-status once per session).
  if (user.role === "employee" && location.pathname !== ONBOARDING_PATH) {
    if (!profileChecked) {
      return <div className="min-h-screen flex items-center justify-center text-[#2A364B]">Loading...</div>;
    }
    if (!profileCompleted) {
      return <Navigate to={ONBOARDING_PATH} replace />;
    }
  }
  return children;
}
