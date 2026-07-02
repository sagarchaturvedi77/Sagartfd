/**
 * Employee Calculators — same calc engine & proposal design as the public site.
 * Proposal generation now happens from the "Download Proposal" button below the
 * calculator itself (inside <Calculators variant="employee" />), not from a
 * separate top-of-page form. That flow asks for the client's name, then shows
 * a Download / Share popup with English & Hinglish message templates.
 */
import React from "react";
import PortalLayout from "../components/PortalLayout";
import Calculators from "../components/Calculators";
import { useAuth } from "../context/AuthContext";

export default function EmployeeCalculators() {
  const { user } = useAuth();

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-[#0E1B2C]">🧮 Financial Calculators</h1>
          <p className="text-sm text-[#2A364B]/60">Use these to build plans and generate a client proposal.</p>
        </div>

        {/*
          Confirmed via EmployeeIDCardPage.js (which also reads /api/auth/me)
          that the phone field is simply `phone` on the user object.
        */}
        <Calculators
          variant="employee"
          employeeInfo={{
            name: user?.name,
            phone: user?.phone,
          }}
        />
      </div>
    </PortalLayout>
  );
}
