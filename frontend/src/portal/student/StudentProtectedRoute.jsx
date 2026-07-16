import React from "react";
import { Navigate } from "react-router-dom";
import { useInternshipAuth } from "./InternshipAuthContext";

// Mirrors components/ProtectedRoute.jsx's shape but checks the separate
// InternshipAuthContext — the internship program's login has no relation
// to TFD Workspace staff/employee auth.
export default function StudentProtectedRoute({ children }) {
  const { token, student, loading } = useInternshipAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#050B16] flex items-center justify-center text-white/60">Loading...</div>;
  }
  if (!token || !student) {
    return <Navigate to="/internship/login" replace />;
  }
  return children;
}
