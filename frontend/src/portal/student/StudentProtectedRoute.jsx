import React from "react";
import { Navigate } from "react-router-dom";
import { useInternshipAuth } from "./InternshipAuthContext";

// Mirrors components/ProtectedRoute.jsx's shape but checks the separate
// InternshipAuthContext — the internship program's login has no relation
// to TFD Workspace staff/employee auth.
//
// Onboarding gate: once payment is confirmed, a student must complete the
// one-time KYC + agreement-signing step (StudentOnboarding.jsx) before
// reaching the rest of the portal — mirrors the employee ProtectedRoute's
// profile_completed gate. Pass skipOnboardingGate on the onboarding route
// itself, or this would redirect to itself in a loop.
//
// The permanent demo account (is_demo) bypasses this entirely — same
// reasoning as its existing quiz-lock bypass in _effective_unlocked_week
// (backend/internship_routes.py): it's meant to be an always-available,
// frictionless walkthrough of the whole portal, not something that requires
// real KYC/Aadhaar/signature/GPS to even reach the dashboard.
export default function StudentProtectedRoute({ children, skipOnboardingGate = false }) {
  const { token, student, loading } = useInternshipAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#050B16] flex items-center justify-center text-white/60">Loading...</div>;
  }
  if (!token || !student) {
    return <Navigate to="/internship/login" replace />;
  }

  const paymentDone = student.payment_status === "paid" || student.payment_status === "waived";
  if (!skipOnboardingGate && !student.is_demo && paymentDone && !student.profile_completed) {
    return <Navigate to="/portal/student/onboarding" replace />;
  }

  return children;
}
