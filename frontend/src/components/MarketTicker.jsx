import React, { useEffect } from "react";

export default function MarketTicker() {
  useEffect(() => {
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
        { "proName": "MCX:GOLD1!", "title": "GOLD LIVE (MCX)" },
        { "proName": "MCX:SILVER1!", "title": "SILVER LIVE (MCX)" }
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
  }, []);

  return (
    /* 🌐 Fixed Overlay Strip Layout to stop clipping behind logo */
    <div className="w-full bg-[#FBF7EE] border-b border-[#E2D8C2] relative z-[100] print:hidden min-h-[40px] block clear-both">
      <div id="tradingview-ticker-wrapper" className="tradingview-widget-container w-full">
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}
