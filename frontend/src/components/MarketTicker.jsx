import React, { useEffect } from "react";

export default function MarketTicker() {
  useEffect(() => {
    // Purane hooks aur scripts clear karna warning blocks se bachne ke liye
    const existingScript = document.getElementById("tradingview-ticker-script");
    if (existingScript) {
      existingScript.remove();
    }

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

    const container = document.getElementById("tradingview-ticker-outer-wrapper");
    if (container) {
      container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
      container.appendChild(script);
    }
  }, []);

  return (
    /* 🌐 Premium Fixed Top Bar Layout Container */
    <div className="w-full bg-[#FBF7EE] border-b border-[#E2D8C2] relative z-[100] print:hidden h-[40px] overflow-hidden">
      <div id="tradingview-ticker-outer-wrapper" className="tradingview-widget-container w-full h-full">
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}
