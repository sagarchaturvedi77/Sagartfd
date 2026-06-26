import React, { useEffect, useState } from "react";

export default function MarketTicker() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    // Purane scripts ko clear karna taaki duplicate na ho
    const existingScript = document.getElementById("tradingview-ticker-script");
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.id = "tradingview-ticker-script";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-tickers.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "NSE:NIFTY", "title": "NIFTY 50" },
        { "proName": "BSE:SENSEX", "title": "SENSEX" },
        { "proName": "NSE:BANKNIFTY", "title": "BANK NIFTY" },
        { "proName": "MCX:GOLD1!", "title": "GOLD LIVE" },
        { "proName": "MCX:SILVER1!", "title": "SILVER LIVE" }
      ],
      "colorTheme": "light",
      "isTransparent": false,
      "showSymbolLogo": true,
      "locale": "in"
    });

    const container = document.getElementById("tradingview-ticker-wrapper");
    if (container) {
      container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
      container.appendChild(script);
    }
  }, [isVisible]);

  // Agar user (✕) par click kare, toh layout margins ko automatic reset kar do
  if (!isVisible) {
    return (
      <style>{`
        body { padding-top: 0px !important; }
        header, nav, .fixed-top, [class*="Navbar"], [class*="header"] { top: 0px !important; }
      `}</style>
    );
  }

  return (
    /* 🌐 Fixed Top Strip - Browser Security Safe Container */
    <div className="w-full fixed top-0 left-0 z-[99999] print:hidden bg-[#FBF7EE] flex items-center" style={{ height: "40px", overflow: "hidden" }}>
      <div id="tradingview-ticker-wrapper" className="tradingview-widget-container flex-1 h-full">
        <div className="tradingview-widget-container__widget"></div>
      </div>
      
      {/* ✕ USER CONTROL HIDE BUTTON */}
      <button 
        onClick={() => setIsVisible(false)}
        className="h-full px-4 bg-[#FBF7EE] border-l border-[#E2D8C2] text-[#5C677D] hover:text-[#C7102E] text-xs font-bold transition-colors z-[100000] relative cursor-pointer"
        title="Hide Market Ticker"
      >
        ✕
      </button>
      
      {/* 🛠️ INJECTING INLINE FIXED STYLE SHEETS */}
      <style>{`
        body {
          padding-top: 40px !important;
        }
        header, nav, .fixed-top, [class*="Navbar"], [class*="header"] {
          top: 40px !important;
          z-index: 9999 !important;
        }
        .tradingview-widget-container {
          height: 40px !important;
        }
      `}</style>
    </div>
  );
}
