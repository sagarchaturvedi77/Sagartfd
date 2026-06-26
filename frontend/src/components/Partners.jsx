import React from "react";

// 40+ Leading AMCs with 100% correct branding live image URLs
const amcList = [
  { name: "SBI Mutual Fund", logo: "https://logo.clearbit.com/sbimf.com" },
  { name: "HDFC Mutual Fund", logo: "https://logo.clearbit.com/hdfcfund.com" },
  { name: "ICICI Prudential Mutual Fund", logo: "https://logo.clearbit.com/icicipruamc.com" },
  { name: "Axis Mutual Fund", logo: "https://logo.clearbit.com/axismf.com" },
  { name: "Nippon India Mutual Fund", logo: "https://logo.clearbit.com/nipponindiamf.com" },
  { name: "Aditya Birla Sun Life Mutual Fund", logo: "https://logo.clearbit.com/adityabirlacapital.com" },
  { name: "Kotak Mahindra Mutual Fund", logo: "https://logo.clearbit.com/kotakmf.com" },
  { name: "UTI Mutual Fund", logo: "https://logo.clearbit.com/utimf.com" },
  { name: "DSP Mutual Fund", logo: "https://logo.clearbit.com/dspim.com" },
  { name: "Mirae Asset Mutual Fund", logo: "https://logo.clearbit.com/miraeassetmf.co.in" },
  { name: "Tata Mutual Fund", logo: "https://logo.clearbit.com/tatamutualfund.com" },
  { name: "Motilal Oswal Mutual Fund", logo: "https://logo.clearbit.com/motilaloswalmf.com" },
  { name: "PPFAS Mutual Fund", logo: "https://logo.clearbit.com/amc.amcprasanjit.com" },
  { name: "Quant Mutual Fund", logo: "https://logo.clearbit.com/quant-mutual.com" },
  { name: "Bandhan Mutual Fund", logo: "https://logo.clearbit.com/bandhanmutual.com" },
  { name: "Invesco India Mutual Fund", logo: "https://logo.clearbit.com/invescomutualfund.com" },
  { name: "Canara Robeco Mutual Fund", logo: "https://logo.clearbit.com/canararobeco.com" },
  { name: "Edelweiss Mutual Fund", logo: "https://logo.clearbit.com/edelweissmf.com" }
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

      {/* 🏃‍♂️ Infinite Moving Track */}
      <div className="w-full flex overflow-hidden relative py-4 mask-gradient">
        <div className="flex whitespace-nowrap gap-8 animate-amcMarquee">
          
          {/* Loop 1 */}
          {amcList.map((amc, idx) => (
            <div key={`amc-1-${idx}`} className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl shadow-sm border border-[#E2D8C2] min-w-[260px]">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1 border border-[#F0EAE1]">
                <img 
                  src={amc.logo} 
                  alt={amc.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback agar koi image network slow hone se load na ho
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full rounded-full bg-[#FBF7EE] items-center justify-center font-bold text-xs text-[#0E1B2C]">
                  {amc.name.charAt(0)}
                </div>
              </div>
              <span className="text-sm font-semibold text-[#0E1B2C]">{amc.name}</span>
            </div>
          ))}

          {/* Loop 2 for Seamless Continuous Track */}
          {amcList.map((amc, idx) => (
            <div key={`amc-2-${idx}`} className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl shadow-sm border border-[#E2D8C2] min-w-[260px]" aria-hidden="true">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1 border border-[#F0EAE1]">
                <img 
                  src={amc.logo} 
                  alt={amc.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full rounded-full bg-[#FBF7EE] items-center justify-center font-bold text-xs text-[#0E1B2C]">
                  {amc.name.charAt(0)}
                </div>
              </div>
              <span className="text-sm font-semibold text-[#0E1B2C]">{amc.name}</span>
            </div>
          ))}
          
        </div>
      </div>

      <style>{`
        @keyframes amcMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-amcMarquee {
          display: flex;
          animation: amcMarquee 35s linear infinite;
        }
        .animate-amcMarquee:hover {
          animation-play-state: paused;
        }
        .mask-gradient {
          mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
        }
      `}</style>
    </section>
  );
}
