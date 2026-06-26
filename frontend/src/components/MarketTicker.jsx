import React, { useEffect, useRef } from "react";

export default function MarketTicker() {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embed/embed-widget-ticker-tape.js";
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbols: [
                { proName: "NSE:NIFTY", title: "NIFTY 50" },
                { proName: "BSE:SENSEX", title: "SENSEX" },
                { proName: "NSE:BANKNIFTY", title: "BANK NIFTY" },
                { proName: "MCX:GOLD1!", title: "GOLD (10g)" },
                { proName: "MCX:SILVER1!", title: "SILVER (1kg)" },
            ],
            showSymbolLogo: false,
            isTransparent: false,
            displayMode: "compact",
            colorTheme: "dark",
            locale: "in",
        });

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) containerRef.current.innerHTML = "";
        };
    }, []);

    return (
        <div
            className="w-full fixed top-0 left-0 z-[100001] print:hidden h-[40px] overflow-hidden"
            style={{ background: "#0E1B2C" }}
        >
            <div
                className="tradingview-widget-container"
                ref={containerRef}
                style={{ height: "40px", width: "100%" }}
            />
        </div>
    );
}
