/**
 * Admin Calculators — identical calculator set and proposal-generation flow
 * as the Employee portal, reusing the same shared <Calculators /> engine
 * (variant="employee" gives the "Client Details" + Prepared-By-employee
 * proposal flow; here it auto-fills with the logged-in admin's own name).
 */
import React from "react";
import PortalLayout from "../components/PortalLayout";
import Calculators from "../components/Calculators";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/portal/PageHeader";

export default function AdminCalculators() {
  const { user } = useAuth();

  return (
    <PortalLayout>
      <div className="space-y-6">
        <PageHeader icon="🧮" title="Financial Calculators" subtitle="Build plans and generate a client proposal." />

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
