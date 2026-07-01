/**
 * Employee Calculators — same calc engine as the public site, but also lets
 * the employee save a branded proposal (PDF-friendly print page) for a client.
 */
import React, { useState, useRef } from "react";
import PortalLayout from "../components/PortalLayout";
import Calculators from "../components/Calculators";
import { useAuth } from "../context/AuthContext";

export default function EmployeeCalculators() {
  const { user } = useAuth();
  const [showProposal, setShowProposal] = useState(false);
  const [client, setClient] = useState({ name: "", phone: "", email: "", notes: "" });
  const printRef = useRef(null);

  const printProposal = () => {
    window.print();
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif text-[#0E1B2C]">🧮 Financial Calculators</h1>
            <p className="text-sm text-[#2A364B]/60">Use these to build plans and generate a client proposal.</p>
          </div>
          <button
            onClick={() => setShowProposal((v) => !v)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580]"
          >
            {showProposal ? "✕ Close Proposal" : "📄 Generate Proposal"}
          </button>
        </div>

        {/* ── Proposal Generator ───────────────────────────────── */}
        {showProposal && (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm space-y-4 print:shadow-none print:border-0">
            {/* Print Header */}
            <div className="hidden print:flex items-center gap-4 pb-4 border-b border-[#E2D8C2]">
              <img src="https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png"
                alt="TFD Logo" className="h-12 object-contain" />
              <div>
                <p className="font-bold text-[#0E1B2C]">The Financial Doctor</p>
                <p className="text-xs text-[#2A364B]/60">www.thefinancialdoctor.in</p>
              </div>
            </div>

            <h3 className="font-semibold text-[#0E1B2C] print:hidden">Client Details for Proposal</h3>
            <div className="grid sm:grid-cols-2 gap-4 print:hidden">
              <div>
                <label className="text-xs text-[#2A364B]/60 block mb-1">Client Name *</label>
                <input
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]"
                />
              </div>
              <div>
                <label className="text-xs text-[#2A364B]/60 block mb-1">Phone</label>
                <input
                  value={client.phone}
                  onChange={(e) => setClient({ ...client, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]"
                />
              </div>
              <div>
                <label className="text-xs text-[#2A364B]/60 block mb-1">Email</label>
                <input
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  placeholder="client@email.com"
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]"
                />
              </div>
              <div>
                <label className="text-xs text-[#2A364B]/60 block mb-1">Notes / Plan Summary</label>
                <input
                  value={client.notes}
                  onChange={(e) => setClient({ ...client, notes: e.target.value })}
                  placeholder="e.g. SIP ₹5,000/month for 15 years"
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]"
                />
              </div>
            </div>

            {/* Proposal Print Preview */}
            {client.name && (
              <div ref={printRef} className="border border-[#E2D8C2] rounded-xl p-4 bg-[#FBF7EE] text-sm space-y-2">
                <p className="font-semibold text-[#0E1B2C]">📋 Proposal for: {client.name}</p>
                {client.phone && <p className="text-xs text-[#2A364B]/70">📞 {client.phone}</p>}
                {client.email && <p className="text-xs text-[#2A364B]/70">✉️ {client.email}</p>}
                {client.notes && <p className="text-xs text-[#2A364B]/70 mt-1">📝 {client.notes}</p>}
                <div className="border-t border-[#E2D8C2] pt-2 mt-2">
                  <p className="text-xs text-[#2A364B]/50">Prepared by: {user?.name} | {user?.designation || "TFD Team"}</p>
                  <p className="text-xs text-[#2A364B]/50">Date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                  <p className="text-xs text-[#2A364B]/50">www.thefinancialdoctor.in</p>
                </div>
              </div>
            )}

            {client.name && (
              <button
                onClick={printProposal}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700"
              >
                🖨️ Print / Download PDF
              </button>
            )}
            {!client.name && (
              <p className="text-xs text-[#2A364B]/50">Enter the client's name above to preview the proposal.</p>
            )}
          </div>
        )}

        {/* ── Calculator Widget (reused from public site) ──────── */}
        <Calculators />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(.employee-calc-print) { display: none !important; }
          .print\\:hidden { display: none !important; }
          .print\\:flex { display: flex !important; }
          .print\\:block { display: block !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-0 { border: 0 !important; }
        }
      `}</style>
    </PortalLayout>
  );
}
