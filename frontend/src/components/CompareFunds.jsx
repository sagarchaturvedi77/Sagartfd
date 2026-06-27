import React, { useState } from "react";

// 📊 Simple side-by-side fund comparison tool.
// Replace SAMPLE_FUNDS with your live/AMFI fund data feed when available.
const SAMPLE_FUNDS = [
  { id: "f1", name: "Axis Bluechip Fund", category: "Large Cap", returns3y: "15.2%", returns5y: "13.8%", risk: "Moderate", expenseRatio: "0.55%" },
  { id: "f2", name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", returns3y: "18.4%", returns5y: "17.1%", risk: "Moderate-High", expenseRatio: "0.63%" },
  { id: "f3", name: "Quant Small Cap Fund", category: "Small Cap", returns3y: "26.7%", returns5y: "24.3%", risk: "High", expenseRatio: "0.62%" },
  { id: "f4", name: "ICICI Pru Balanced Advantage", category: "Hybrid", returns3y: "12.1%", returns5y: "11.4%", risk: "Low-Moderate", expenseRatio: "0.45%" },
  { id: "f5", name: "Mirae Asset Tax Saver (ELSS)", category: "ELSS", returns3y: "17.9%", returns5y: "16.2%", risk: "Moderate-High", expenseRatio: "0.58%" },
];

export default function CompareFunds() {
  const [selected, setSelected] = useState(["f1", "f2"]);

  const toggleFund = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const comparedFunds = SAMPLE_FUNDS.filter((f) => selected.includes(f.id));

  return (
    <section className="bg-white py-16 px-6 border-t border-[#E2D8C2]">
      <div className="container-x max-w-5xl mx-auto">
        <h2 className="text-3xl font-serif text-[#0E1B2C] mb-3 text-center">Compare Funds</h2>
        <p className="text-[#2A364B]/80 text-center max-w-2xl mx-auto mb-8">
          Select up to 3 funds to compare side by side. Figures shown are sample
          data — connect a live AMFI/NAV feed for production use.
        </p>

        {/* FUND SELECTOR */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {SAMPLE_FUNDS.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFund(f.id)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                selected.includes(f.id)
                  ? "bg-[#024396] text-white border-[#024396]"
                  : "bg-[#FBF7EE] text-[#2A364B] border-[#E2D8C2] hover:border-[#024396]"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* COMPARISON TABLE */}
        {comparedFunds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border border-[#E2D8C2] rounded-xl text-sm">
              <thead>
                <tr className="bg-[#FBF7EE]">
                  <th className="text-left p-4 font-display text-[#0E1B2C]">Fund</th>
                  {comparedFunds.map((f) => (
                    <th key={f.id} className="text-left p-4 font-display text-[#024396] min-w-[160px]">{f.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Category", "category"],
                  ["3Y Returns", "returns3y"],
                  ["5Y Returns", "returns5y"],
                  ["Risk Level", "risk"],
                  ["Expense Ratio", "expenseRatio"],
                ].map(([label, key]) => (
                  <tr key={key} className="border-t border-[#E2D8C2]">
                    <td className="p-4 text-[#2A364B]/70 font-medium">{label}</td>
                    {comparedFunds.map((f) => (
                      <td key={f.id} className="p-4 text-[#2A364B]">{f[key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-[#2A364B]/60">Select at least one fund to compare.</p>
        )}
      </div>
    </section>
  );
}
