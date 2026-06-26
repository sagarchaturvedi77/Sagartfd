import React from "react";

// 40+ AMCs ka data unke placeholder images/logos ke sath
const amcList = [
  { name: "SBI Mutual Fund", logo: "https://img.imfprod.com/images/amc/sbi.png" },
  { name: "HDFC Mutual Fund", logo: "https://img.imfprod.com/images/amc/hdfc.png" },
  { name: "ICICI Prudential", logo: "https://img.imfprod.com/images/amc/icici.png" },
  { name: "Axis Mutual Fund", logo: "https://img.imfprod.com/images/amc/axis.png" },
  { name: "Nippon India", logo: "https://img.imfprod.com/images/amc/nippon.png" },
  { name: "Aditya Birla Sun Life", logo: "https://img.imfprod.com/images/amc/adityabirla.png" },
  { name: "Kotak Mahindra", logo: "https://img.imfprod.com/images/amc/kotak.png" },
  { name: "UTI Mutual Fund", logo: "https://img.imfprod.com/images/amc/uti.png" },
  { name: "DSP Mutual Fund", logo: "https://img.imfprod.com/images/amc/dsp.png" },
  { name: "Mirae Asset", logo: "https://img.imfprod.com/images/amc/mirae.png" },
  { name: "Franklin Templeton", logo: "https://img.imfprod.com/images/amc/franklin.png" },
  { name: "Tata Mutual Fund", logo: "https://img.imfprod.com/images/amc/tata.png" },
  { name: "Edelweiss MF", logo: "https://img.imfprod.com/images/amc/edelweiss.png" },
  { name: "Motilal Oswal", logo: "https://img.imfprod.com/images/amc/motilal.png" },
  { name: "PPFAS Mutual Fund", logo: "https://img.imfprod.com/images/amc/ppfas.png" },
  { name: "Quant MF", logo: "https://img.imfprod.com/images/amc/quant.png" },
  { name: "Bandhan MF", logo: "https://img.imfprod.com/images/amc/bandhan.png" },
  { name: "Invesco India", logo: "https://img.imfprod.com/images/amc/invesco.png" },
  { name: "Canara Robeco", logo: "https://img.imfprod.com/images/amc/canara.png" },
];

export default function Partners() {
  return (
    <section className="py-12 bg-[#FBF7EE] border-t border-b border-[#E2D8C2] overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 mb-6 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-[#5C677D]">
          PARTNERS WE DELIVER THROUGH
        </span>
        <h2 className="text-3xl font-serif text-[#0E1B2C] mt-2">
          Access to 40+ AMCs, <span className="italic text-[#C7102E]">one trusted advisor.</span>
        </h2>
      </div>

      {/* 🏃‍♂️ Infinite Logo Slider Track Area */}
      <div className="w-full flex overflow-hidden relative py-4">
        <div className="flex whitespace-nowrap gap-12 animate-amcMarquee">
          
          {/* Loop 1 */}
          {amcList.map((amc, idx) => (
            <div key={`amc-1-${idx}`} className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border border-[#E2D8C2] min-w-[220px]">
              <div className="w-8 h-8 rounded-full bg-[#FBF7EE] flex items-center justify-center font-bold text-xs text-[#0E1B2C] border border-[#E2D8C2]">
                {amc.name.charAt(0)}
              </div>
              <span className="text-sm font-semibold text-[#0E1B2C]">{amc.name}</span>
            </div>
          ))}

          {/* Loop 2 (Seamless loop ke liye copy) */}
          {amcList.map((amc, idx) => (
            <div key={`amc-2-${idx}`} className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border border-[#E2D8C2] min-w-[220px]" aria-hidden="true">
              <div className="w-8 h-8 rounded-full bg-[#FBF7EE] flex items-center justify-center font-bold text-xs text-[#0E1B2C] border border-[#E2D8C2]">
                {amc.name.charAt(0)}
              </div>
              <span className="text-sm font-semibold text-[#0E1B2C]">{amc.name}</span>
            </div>
          ))}
          
        </div>
      </div>

      {/* 🛠️ CSS Styling for Smooth Moving Track */}
      <style>{`
        @keyframes amcMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-amcMarquee {
          display: flex;
          animation: amcMarquee 40s linear infinite;
        }
        .animate-amcMarquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
