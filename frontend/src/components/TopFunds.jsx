import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
// 🛠️ Clean context import without space
import { useModal } from "../context/ModalContext";

export default function TopFunds() {
  const { openGateway } = useModal();
  const [searchTerm, setSearchTerm] = useState("");

  // Live website layout sync data
  const fundsData = [
    { name: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth", cat: "Flexi Cap", nav: "89.7127", y1: "-2.5%", y3: "15.0%", y5: "14.8%" },
    { name: "Nippon India Credit Risk Fund  - Institutional Growth Plan", cat: "Flexi Cap", nav: "39.6330", y1: "8.5%", y3: "8.6%", y5: "8.7%" },
    { name: "SBI Multi Asset Allocation Fund - Direct Plan", cat: "Flexi Cap", nav: "33.1955", y1: "12.4%", y3: "17.5%", y5: "14.4%" },
    { name: "Union Medium Duration Fund - Direct Plan", cat: "Small Cap", nav: "12.5851", y1: "8.0%", y3: "5.8%", y5: "4.7%" }
  ];

  return (
    <section id="funds" className="py-20 bg-[#FBF7EE] border-b border-[#E2D8C2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-serif text-[#0E1B2C]">Search Any Fund or View Top Picks</h2>
          <p className="text-[#5C677D] mt-3 text-sm">Live NAV & performance details powered by AMFI.</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8 relative">
          <Search className="absolute left-4 top-3.5 text-[#8A93A6]" size={18} />
          <input 
            type="text" 
            placeholder="Type fund name (e.g. SBI Bluechip, HDFC Flexi)..."
            className="w-full bg-white border border-[#E2D8C2] rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#024396]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table Layout */}
        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F1E8] text-[#5C677D] text-xs font-bold uppercase tracking-wider border-b border-[#E2D8C2]">
                  <th className="p-5">Fund Name</th>
                  <th className="p-5">Category</th>
                  <th className="p-5">Live NAV</th>
                  <th className="p-5">1Y CAGR</th>
                  <th className="p-5">3Y CAGR</th>
                  <th className="p-5">5Y CAGR</th>
                  <th className="p-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D8C2] text-sm text-[#2A364B]">
                {fundsData.map((fund, idx) => (
                  <tr key={idx} className="hover:bg-[#FBF7EE]/50 transition-colors">
                    <td className="p-5 font-medium text-[#0E1B2C]">{fund.name}</td>
                    <td className="p-5">
                      <span className="bg-[#F6F1E8] text-xs px-2.5 py-1 rounded-md font-semibold">
                        {fund.cat}
                      </span>
                    </td>
                    <td className="p-5 font-mono font-semibold">Rs. {fund.nav}</td>
                    <td className="p-5 text-rose-600 font-bold">{fund.y1}</td>
                    <td className="p-5 text-emerald-600 font-bold">{fund.y3}</td>
                    <td className="p-5 text-emerald-600 font-bold">{fund.y5}</td>
                    <td className="p-5 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      
                      {/* 🛡️ AAPKA PURANA CALCULATOR BUTTON SECURE HAI */}
                      <button className="text-xs font-semibold text-[#024396] hover:underline cursor-pointer">
                        Past Returns Calculator
                      </button>

                      {/* 🎯 TRIGGERS SECURE ONBOARDING POPUP */}
                      <button
                        onClick={openGateway}
                        className="bg-[#00A86B] hover:bg-[#008F5A] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        Invest
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
