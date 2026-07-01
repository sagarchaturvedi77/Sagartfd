const QUOTES = [
    { key: "gold", label: "Gold", symbol: "GC=F" },
    { key: "silver", label: "Silver", symbol: "SI=F" },
    { key: "nifty50", label: "Nifty 50", symbol: "^NSEI" },
    { key: "sensex", label: "Sensex", symbol: "^BSESN" },
    { key: "banknifty", label: "Bank Nifty", symbol: "^NSEBANK" },
];

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

function toItem(result, quote) {
    const meta = result?.meta || {};
    const value = meta.regularMarketPrice ?? meta.previousClose ?? null;
    const previous = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const change = value !== null && previous ? value - previous : null;
    const changePct = change !== null && previous ? (change / previous) * 100 : null;

    return {
        key: quote.key,
        label: quote.label,
        symbol: quote.symbol,
        value,
        change,
        changePct,
        currency: meta.currency || "",
        exchangeName: meta.exchangeName || "",
    };
}

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet() {
    try {
        const items = await Promise.all(
            QUOTES.map(async (quote) => {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(quote.symbol)}?range=1d&interval=1m`;
                const res = await fetch(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        Accept: "application/json",
                    },
                });
                if (!res.ok) throw new Error(`Quote failed: ${quote.symbol}`);
                const json = await res.json();
                return toItem(json?.chart?.result?.[0], quote);
            })
        );

        return Response.json(
            {
                items,
                updatedAt: new Date().toISOString(),
                note: "Gold/Silver use Yahoo futures symbols GC=F and SI=F; Indian indices use Yahoo index symbols.",
            },
            {
                headers: {
                    ...corsHeaders,
                    "Cache-Control": "public, max-age=30",
                },
            }
        );
    } catch (error) {
        return Response.json(
            {
                error: "market_ticker_failed",
                message: error.message,
                items: [],
                updatedAt: new Date().toISOString(),
            },
            {
                status: 502,
                headers: corsHeaders,
            }
        );
    }
}
