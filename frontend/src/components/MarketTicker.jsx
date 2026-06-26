import React, { useEffect, useState } from "react";

export default function MarketTicker() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const existingScript = document.getElementById("tradingview-tape-script");
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.id = "tradingview-tape-script";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "INDEX:NIFTY", "title": "NIFTY 50" },
        { "proName": "INDEX:SENSEX", "title": "SENSEX" },
        { "proName": "INDEX:BANKNIFTY", "title": "BANK NIFTY" },
        { "proName": "FX_IDC:XAUUSD", "title": "GOLD LIVE" },
        { "proName": "FX_IDC:XAGUSD", "title": "SILVER LIVE" }
      ],
      "showSymbolLogo": true,
      "colorTheme": "light",
      "isTransparent": false,
      "displayMode": "adaptive",
      "locale": "in"
    });

    const container = document.getElementById("tradingview-tape-wrapper");
    if (container) {
      container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
      container.appendChild(script);
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <style>{`
        body { padding-top: 0px !important; }
        header, nav { top: 0px !important; }
      `}</style>
    );
  }

  return (
    /* 🌐 Fixed Sticky Top Ribbon Layout */
    <div className="w-full fixed top-0 left-0 z-[99999] print:hidden bg-[#FBF7EE] flex items-center shadow-sm" style={{ height: "40px", overflow: "hidden" }}>
      <div id="tradingview-tape-wrapper" className="tradingview-widget-container flex-1 h-full">
        <div className="tradingview-widget-container__widget"></div>
      </div>
      
      {/* ✕ CLOSE BUTTON */}
      <button 
        onClick={() => setIsVisible(false)}
        className="h-full px-4 bg-[#FBF7EE] border-l border-[#E2D8C2] text-[#5C677D] hover:text-[#C7102E] text-xs font-bold transition-colors z-[100000] relative cursor-pointer"
        title="Hide Ticker"
      >
        ✕
      </button>

      {/* 🛠️ Safe Layout Adjustment Layout Without Breaking Alignment Links */}
      <style>{`
        body {
          padding-top: 40px !important;
        }
        header, nav, .fixed-top {
          top: 40px !important;
        }
        .tradingview-widget-container {
          height: 40px !important;
        }
      `}</style>
    </div>
  );
}
