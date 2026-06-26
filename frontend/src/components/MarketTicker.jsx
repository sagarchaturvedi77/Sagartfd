import React, { useState, useEffect } from "react";

export default function MarketTicker() {
  const [isVisible, setIsVisible] = useState(true);
  const [marketData] = useState({
    nifty: { price: "23,564.10", change: "+0.52%" },
    sensex: { price: "77,100.47", change: "+0.14%" },
    banknifty: { price: "51,220.15", change: "-0.22%" },
    gold: { price: "72,450", change: "+0.62%" },
    silver: { price: "88,900", change: "+1.15%" }
  });

  useEffect(() => {
    if (!isVisible) {
      document.body.style.marginTop = "0px";
      return;
    }
    document.body.style.marginTop = "40px";
  }, [isVisible]);

  if (!isVisible) {
    return (
      <style>{`
        body { padding-top: 0px !important; }
        header, nav, [class*="Navbar"] { transform: none !important; }
      `}</style>
    );
  }

  return (
    /* 🌐 Fixed Top Seamless News-Channel Marquee Ribbon */
    <div className="w-full fixed top-0 left-0 z-[100001] print:hidden bg-[#0E1B2C] text-[#FBF7EE] flex items-center shadow-md h-[40px] overflow-hidden select-none">
      
      {/* 🏃‍♂️ Running Track Area */}
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        <div className="flex whitespace-nowrap gap-16 animate-marquee">
          {/* Loop 1 */}
          <div className="flex gap-16 items-center font-medium text-xs tracking-wider">
            <span className="flex items-center gap-2">🟢 <b>NIFTY 50:</b> {marketData.nifty.price} <span className="text-emerald-400 font-bold">{marketData.nifty.change}</span></span>
            <span className="flex items-center gap-2">🟢 <b>SENSEX:</b> {marketData.sensex.price} <span className="text-emerald-400 font-bold">{marketData.sensex.change}</span></span>
            <span className="flex items-center gap-2">🔴 <b>BANK NIFTY:</b> {marketData.banknifty.price} <span className="text-rose-400 font-bold">{marketData.banknifty.change}</span></span>
            <span className="flex items-center gap-2">🟢 <b>GOLD LIVE (10g):</b> ₹{marketData.gold.price} <span className="text-emerald-400 font-bold">{marketData.gold.change}</span></span>
            <span className="flex items-center gap-2">🟢 <b>SILVER LIVE (1kg):</b> ₹{marketData.silver.price} <span className="text-emerald-400 font-bold">{marketData.silver.change}</span></span>
          </div>
          {/* Loop 2 for Seamless Streaming */}
          <div className="flex gap-16 items-center font-medium text-xs tracking-wider" aria-hidden="true">
            <span className="flex items-center gap-2">🟢 <b>NIFTY 50:</b> {marketData.nifty.price} <span className="text-emerald-400 font-bold">{marketData.nifty.change}</span></span>
            <span className="flex items-center gap-2">🟢 <b>SENSEX:</b> {marketData.sensex.price} <span className="text-emerald-400 font-bold">{marketData.sensex.change}</span></span>
            <span className="flex items-center gap-2">🔴 <b>BANK NIFTY:</b> {marketData.banknifty.price} <span className="text-rose-400 font-bold">{marketData.banknifty.change}</span></span>
          </div>
        </div>
      </div>
      
      {/* ✕ USER CLOSE INTERACTIVE BUTTON */}
      <button 
        onClick={() => {
          setIsVisible(false);
          document.body.style.marginTop = "0px";
        }}
        className="h-full px-4 bg-[#0E1B2C] border-l border-[#2A364B] text-[#8A93A6] hover:text-[#C7102E] text-xs font-bold transition-colors z-[100002] relative cursor-pointer"
        title="Hide Ticker"
      >
        ✕
      </button>

      {/* 🛠️ SPECIFIC NAVIGATION RESTORATION INTERFACES */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        /* Safely translates navbar elements without affecting height grids */
        header, nav, [class*="Navbar"] {
          padding-top: 40px !important;
        }
      `}</style>
    </div>
  );
}
