import React, { useEffect } from "react";

export default function MarketTicker() {
  useEffect(() => {
    // TradingView widget script ko dynamically injection dena
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-tickers.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "FOREXCOM:SPX500", "title": "S&P 500" }, // Global reference
        { "proName": "BSE:SENSEX", "title": "Sensex" },
        { "proName": "NSE:NIFTY", "title": "Nifty 50" },
        { "proName": "MCX:GOLD1!", "title": "Gold Live (MCX)" },
        { "proName": "MCX:SILVER1!", "title": "Silver Live (MCX)" }
      ],
      "colorTheme": "light",
      "isTransparent": false,
      "showSymbolLogo": true,
      "locale": "in"
    });

    const container = document.getElementById("tradingview-ticker-container");
    if (container) {
      container.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full bg-[#F6F1E8] border-b border-[#E2D8C2] py-1 print:hidden">
      <div id="tradingview-ticker-container" className="tradingview-widget-container">
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}
