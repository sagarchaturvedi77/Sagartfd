// Shared live mutual-fund data helpers — backed by MFAPI.in (AMFI NAV feed).
// Extracted out of TopFunds.jsx so other tools (CompareFunds, future pages)
// can pull the same real, cached fund data instead of hardcoding sample
// numbers. Returns (1Y/3Y/5Y CAGR) are computed from actual historical NAV,
// never invented.

export const MASTER_FUNDS = [
    { code: "122639", category: "Flexi Cap", fund_house: "PPFAS Mutual Fund" },
    { code: "112939", category: "Flexi Cap", fund_house: "HDFC Mutual Fund" },
    { code: "119841", category: "Flexi Cap", fund_house: "SBI Mutual Fund" },
    { code: "148480", category: "Small Cap", fund_house: "Quant Mutual Fund" },
    { code: "125497", category: "Small Cap", fund_house: "Nippon India Mutual Fund" },
    { code: "118127", category: "Small Cap", fund_house: "HDFC Mutual Fund" },
    { code: "120593", category: "Mid Cap", fund_house: "Axis Mutual Fund" },
    { code: "112090", category: "Mid Cap", fund_house: "HDFC Mutual Fund" },
    { code: "148477", category: "Mid Cap", fund_house: "Quant Mutual Fund" },
    { code: "118989", category: "Large Cap", fund_house: "SBI Mutual Fund" },
    { code: "120716", category: "Large Cap", fund_house: "Mirae Asset Mutual Fund" },
    { code: "113028", category: "Large Cap", fund_house: "ICICI Prudential Mutual Fund" },
    { code: "122313", category: "ELSS Tax Saver", fund_house: "Mirae Asset Mutual Fund" },
    { code: "148464", category: "ELSS Tax Saver", fund_house: "Quant Mutual Fund" },
    { code: "119775", category: "ELSS Tax Saver", fund_house: "SBI Mutual Fund" },
];

export const fmtPct = (v) =>
    v === null || v === undefined || Number.isNaN(Number(v)) ? "-" : `${Number(v).toFixed(1)}%`;

export const fmtINR = (n) => {
    if (!Number.isFinite(Number(n))) return "Rs. 0";
    const v = Number(n);
    if (v >= 1e7) return `Rs. ${(v / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `Rs. ${(v / 1e5).toFixed(2)} L`;
    if (v >= 1e3) return `Rs. ${(v / 1e3).toFixed(1)} K`;
    return `Rs. ${Math.round(v).toLocaleString("en-IN")}`;
};

export const fmtFullINR = (n) => `Rs. ${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

function parseMfDate(dateStr) {
    const [d, m, y] = String(dateStr || "").split("-").map(Number);
    return new Date(y, m - 1, d);
}

function normalizeHistory(raw = []) {
    return raw
        .map((row) => ({ date: row.date, nav: Number(row.nav), dt: parseMfDate(row.date) }))
        .filter((row) => Number.isFinite(row.nav) && !Number.isNaN(row.dt.getTime()))
        .sort((a, b) => b.dt - a.dt);
}

function findClosestNav(history, targetDt) {
    if (!history?.length) return null;
    let closest = history[0];
    let minDiff = Infinity;
    for (const item of history) {
        const diff = Math.abs(item.dt.getTime() - targetDt.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            closest = item;
        }
    }
    return closest;
}

export function calculateCagr(history, years) {
    if (!history?.length) return null;
    const latest = history[0];
    const target = new Date(latest.dt);
    target.setFullYear(target.getFullYear() - years);
    const past = findClosestNav(history, target);
    if (!past || past.nav <= 0 || latest.nav <= 0) return null;
    return (Math.pow(latest.nav / past.nav, 1 / years) - 1) * 100;
}

function calculateTrailingReturns(history) {
    return {
        return_1y: calculateCagr(history, 1),
        return_3y: calculateCagr(history, 3),
        return_5y: calculateCagr(history, 5),
    };
}

const fundCache = new Map();

export async function fetchFund(code) {
    if (fundCache.has(String(code))) return fundCache.get(String(code));
    const res = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!res.ok) throw new Error(`Unable to fetch scheme ${code}`);
    const d = await res.json();
    const history = normalizeHistory(d.data);
    const latest = history[0];
    const fund = {
        code,
        name: d.meta?.scheme_name || `Scheme ${code}`,
        fund_house: d.meta?.fund_house || "-",
        scheme_category: d.meta?.scheme_category || "-",
        scheme_type: d.meta?.scheme_type || "-",
        nav: latest?.nav || null,
        nav_date: latest?.date || "-",
        history,
        ...calculateTrailingReturns(history),
    };
    fundCache.set(String(code), fund);
    return fund;
}

// Live scheme-name search against MFAPI, filtered to Growth (non-IDCW)
// plans and ranked so exact/direct matches surface first — same ranking
// TopFunds.jsx's search box already used inline.
export async function searchFundsByName(query) {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
    const rawData = await res.json();
    const cleanedQuery = query.toLowerCase().trim();
    const filteredGrowth = rawData.filter((f) => {
        const name = f.schemeName.toLowerCase();
        return name.includes("growth") && !name.includes("idcw") && !name.includes("dividend");
    });
    return filteredGrowth
        .sort((a, b) => {
            const an = a.schemeName.toLowerCase();
            const bn = b.schemeName.toLowerCase();
            const aStarts = an.includes(cleanedQuery) ? 0 : 1;
            const bStarts = bn.includes(cleanedQuery) ? 0 : 1;
            if (aStarts !== bStarts) return aStarts - bStarts;
            const aDirect = an.includes("direct") ? 0 : 1;
            const bDirect = bn.includes("direct") ? 0 : 1;
            if (aDirect !== bDirect) return aDirect - bDirect;
            return a.schemeName.length - b.schemeName.length;
        })
        .slice(0, 25);
}
