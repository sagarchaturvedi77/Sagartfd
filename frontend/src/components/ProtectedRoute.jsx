import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// 🔒 Wrap any route that needs login. Pass requiredRole="admin" to restrict further.
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#2A364B]">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/portal/login" replace />;
  }
  return children;
}
