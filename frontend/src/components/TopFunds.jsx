import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    TrendingUp,
    Sparkles,
    ExternalLink,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Download,
    X,
} from "lucide-react";
// html2canvas is dynamically imported at its call site in downloadProposal
// below — only loaded when a visitor actually clicks the download button.
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { IDS } from "@/constants/testIds";
// 🛠️ Context Hook Connect Kiya
import { useModal } from "../context/ModalContext"; 

const ASSETPLUS = "https://www.assetplus.in/mfd/ARN-290298";
const TFD_LOGO = "/assets/logos/TFD-MAIN-LOGO.webp";
const SAGAR_PHOTO = "/assets/founder/sagar-photo.webp";
const fundCache = new Map();

const MASTER_FUNDS = [
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

const fmtPct = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? "-" : `${Number(v).toFixed(1)}%`);
const fmtINR = (n) => {
    if (!Number.isFinite(Number(n))) return "Rs. 0";
    const v = Number(n);
    if (v >= 1e7) return `Rs. ${(v / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `Rs. ${(v / 1e5).toFixed(2)} L`;
    if (v >= 1e3) return `Rs. ${(v / 1e3).toFixed(1)} K`;
    return `Rs. ${Math.round(v).toLocaleString("en-IN")}`;
};
const fmtFullINR = (n) => `Rs. ${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

function parseMfDate(dateStr) {
    const [d, m, y] = String(dateStr || "").split("-").map(Number);
    return new Date(y, m - 1, d);
}

function normalizeHistory(raw = []) {
    return raw
        .map((row) => ({
            date: row.date,
            nav: Number(row.nav),
            dt: parseMfDate(row.date),
        }))
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

function calculateCagr(history, years) {
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

function xirr(cashflows) {
    if (!cashflows?.length) return null;
    const firstDate = cashflows[0].date;
    const npv = (rate) =>
        cashflows.reduce((sum, cf) => {
            const years = (cf.date - firstDate) / (365 * 24 * 60 * 60 * 1000);
            return sum + cf.amount / Math.pow(1 + rate, years);
        }, 0);

    let rate = 0.12;
    for (let i = 0; i < 60; i += 1) {
        const f = npv(rate);
        const derivative = (npv(rate + 0.0001) - f) / 0.0001;
        if (!Number.isFinite(derivative) || Math.abs(derivative) < 1e-8) break;
        const next = rate - f / derivative;
        if (!Number.isFinite(next) || next <= -0.99) break;
        if (Math.abs(next - rate) < 0.000001) return next * 100;
        rate = next;
    }
    return Number.isFinite(rate) ? rate * 100 : null;
}

function jpegDataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function asciiBytes(str) {
    return new TextEncoder().encode(str);
}

function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
}

function singlePagePdfBlobFromJpeg(jpegBytes, imageW, imageH, pageW = 595.28, pageH = 841.89) {
    const pageStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
        `<< /Type /XObject /Subtype /Image /Width ${imageW} /Height ${imageH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n__IMAGE__\nendstream`,
        `<< /Length ${asciiBytes(pageStream).length} >>\nstream\n${pageStream}endstream`,
    ];

    const parts = [asciiBytes("%PDF-1.4\n")];
    const offsets = [0];

    objects.forEach((obj, index) => {
        offsets.push(parts.reduce((sum, p) => sum + p.length, 0));
        if (obj.includes("__IMAGE__")) {
            const [before, after] = obj.split("__IMAGE__");
            parts.push(asciiBytes(`${index + 1} 0 obj\n${before}`), jpegBytes, asciiBytes(`${after}\nendobj\n`));
        } else {
            parts.push(asciiBytes(`${index + 1} 0 obj\n${obj}\nendobj\n`));
        }
    });

    const xrefOffset = parts.reduce((sum, p) => sum + p.length, 0);
    const xref = [
        "xref",
        `0 ${objects.length + 1}`,
        "0000000000 65535 f ",
        ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
        "trailer",
        `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
        "startxref",
        String(xrefOffset),
        "%%EOF",
    ].join("\n");
    parts.push(asciiBytes(xref));
    return new Blob([concatBytes(parts)], { type: "application/pdf" });
}

async function fetchFund(code) {
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

export default function TopFunds() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("All");
    const [searchQ, setSearchQ] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchingDetail, setSearchingDetail] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [searching, setSearching] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const detailRequestId = useRef(0);
    const itemsPerPage = 4;

    // 🎯 Extract central open hook
    const { openGateway } = useModal(); 

    useEffect(() => {
        let mounted = true;
        const fetchAllMasterFunds = async () => {
            try {
                setData([]);
                const results = [];
                await Promise.allSettled(
                    MASTER_FUNDS.map(async (fund, index) => {
                        const live = await fetchFund(fund.code);
                        const row = {
                            ...fund,
                            ...live,
                            category: fund.category,
                            fund_house: live.fund_house || fund.fund_house,
                        };
                        results[index] = row;
                        if (mounted) {
                            setData(results.filter(Boolean));
                            setLoading(false);
                        }
                    })
                );
                if (mounted) setData(results.filter(Boolean));
            } catch (e) {
                console.error("Error fetching master funds:", e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchAllMasterFunds();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (searchQ.trim().length < 3) {
            setSearchResults([]);
            return undefined;
        }
        setSearching(true);
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(searchQ)}`);
                const rawData = await res.json();
                const cleanedQuery = searchQ.toLowerCase().trim();
                const filteredGrowth = rawData.filter((f) => {
                    const name = f.schemeName.toLowerCase();
                    return name.includes("growth") && !name.includes("idcw") && !name.includes("dividend");
                });
                const ranked = filteredGrowth.sort((a, b) => {
                    const an = a.schemeName.toLowerCase();
                    const bn = b.schemeName.toLowerCase();
                    const aStarts = an.includes(cleanedQuery) ? 0 : 1;
                    const bStarts = bn.includes(cleanedQuery) ? 0 : 1;
                    if (aStarts !== bStarts) return aStarts - bStarts;
                    const aDirect = an.includes("direct") ? 0 : 1;
                    const bDirect = bn.includes("direct") ? 0 : 1;
                    if (aDirect !== bDirect) return aDirect - bDirect;
                    return a.schemeName.length - b.schemeName.length;
                });
                setSearchResults(ranked.slice(0, 25));
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [searchQ]);

    const categories = useMemo(() => ["All", "Flexi Cap", "Small Cap", "Mid Cap", "Large Cap", "ELSS Tax Saver"], []);
    const filtered = useMemo(() => (category === "All" ? data : data.filter((f) => f.category === category)), [data, category]);
    const paginatedFunds = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [filtered, currentPage]);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const handleCategoryChange = (cat) => {
        setCategory(cat);
        setCurrentPage(1);
    };

    const openFundDetail = async (code) => {
        const requestId = detailRequestId.current + 1;
        detailRequestId.current = requestId;
        setLoadingDetails(true);
        try {
            const detail = await fetchFund(code);
            if (detailRequestId.current === requestId) setSearchingDetail(detail);
        } catch (e) {
            console.error("Details fetch error:", e);
            toast?.error?.("Fund details fetch nahi ho paye. Please try again.");
        } finally {
            if (detailRequestId.current === requestId) setLoadingDetails(false);
        }
    };

    return (
        <section id="funds" className="section bg-[#EFE7D6]">
            <div className="container-x">
                <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
                    <div>
                        <div className="eyebrow">
                            <TrendingUp size={14} /> Live market data
                        </div>
                        <h1 className="h2 mt-3 text-[#0E1B2C]">
                            Search Any Fund or View <span className="font-italic-serif text-[#024396]">Top Picks</span>
                        </h1>
                        <p className="mt-3 text-[#2A364B] max-w-2xl">
                            Live NAV & performance details powered by AMFI via{" "}
                            <a className="underline" href="https://www.mfapi.in" target="_blank" rel="noopener noreferrer">
                                MFAPI.in
                            </a>
                            . Returns are calculated from real historical NAV.
                        </p>
                    </div>
                </div>

                <div className="relative mb-6 max-w-xl">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C677D]">
                        {searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                    </div>
                    <input
                        data-testid={IDS.funds.search}
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        placeholder="Type fund name (e.g. SBI Bluechip, HDFC Flexi)..."
                        className="w-full bg-[#FBF7EE] border border-[#E2D8C2] rounded-full pl-11 pr-4 py-3 text-[#0E1B2C] placeholder:text-[#8A93A6] focus:border-[#024396] text-sm"
                    />

                    {searchResults.length > 0 && (
                        <div
                            data-testid={IDS.funds.searchResults}
                            className="absolute z-20 left-0 right-0 mt-2 bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl max-h-[280px] overflow-y-auto shadow-xl divide-y divide-[#E2D8C2]/40"
                        >
                            {searchResults.map((r) => (
                                <button
                                    key={r.schemeCode}
                                    onClick={() => {
                                        openFundDetail(r.schemeCode);
                                        setSearchQ("");
                                        setSearchResults([]);
                                    }}
                                    className="block w-full text-left px-4 py-3 hover:bg-[#EFE7D6] text-[13px] text-[#0E1B2C] transition-colors"
                                >
                                    <span className="font-medium block">{r.schemeName}</span>
                                    <span className="text-[10px] text-[#5C677D]">Scheme Code: {r.schemeCode}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loadingDetails && (
                    <div className="flex items-center gap-2 text-xs text-[#024396] mb-4 bg-[#024396]/10 px-4 py-2 rounded-xl w-fit">
                        <Loader2 className="animate-spin" size={14} /> Fetching selected fund history...
                    </div>
                )}

                <div className="-mx-6 md:mx-0 px-6 md:px-0 mb-6 overflow-x-auto" data-testid={IDS.funds.category}>
                    <div className="flex gap-2 min-w-max md:flex-wrap">
                        {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => handleCategoryChange(c)}
                                className={`tab-pill shrink-0 ${category === c ? "active" : ""}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card-cream overflow-hidden" data-testid={IDS.funds.table}>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#F6F1E8] text-[#5C677D]">
                                <tr className="text-left">
                                    <th className="px-5 py-4 font-medium text-[11px] tracking-[0.18em] uppercase">Fund Name</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase">Category</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">Live NAV</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">1Y CAGR</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">3Y CAGR</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">5Y CAGR</th>
                                    <th className="px-5 py-4" />
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-[#5C677D]">
                                            <Sparkles className="inline animate-pulse" size={16} /> Connecting live AMFI database...
                                        </td>
                                    </tr>
                                )}
                                {!loading && paginatedFunds.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-[#5C677D]">
                                            No records found.
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    paginatedFunds.map((f) => (
                                        <tr key={f.code} className="border-t border-[#E2D8C2] hover:bg-[#F6F1E8]">
                                            <td className="px-5 py-4">
                                                <button onClick={() => openFundDetail(f.code)} className="text-left group block">
                                                    <div className="font-display text-[15px] text-[#0E1B2C] font-semibold leading-tight group-hover:text-[#024396] transition-colors">{f.name}</div>
                                                    <div className="text-[11px] text-[#5C677D] mt-1">{f.fund_house}</div>
                                                </button>
                                            </td>
                                            <td className="px-3 py-4 text-[12px] text-[#5C677D]">{f.category}</td>
                                            <td className="px-3 py-4 text-right">
                                                <div className="font-medium text-[#0E1B2C]">Rs. {Number(f.nav || 0).toFixed(4)}</div>
                                                <div className="text-[10px] text-[#5C677D]">{f.nav_date}</div>
                                            </td>
                                            <td className="px-3 py-4 text-right text-[#024396] font-medium">{fmtPct(f.return_1y)}</td>
                                            <td className="px-3 py-4 text-right text-[#024396] font-medium">{fmtPct(f.return_3y)}</td>
                                            <td className="px-3 py-4 text-right text-[#024396] font-medium">{fmtPct(f.return_5y)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openFundDetail(f.code)} className="text-xs font-bold text-white bg-[#024396] hover:bg-[#012E6B] px-4 py-2 rounded-lg transition-all shadow-sm">
                                                        Past Returns Calculator
                                                    </button>
                                                    {/* 🎯 DESKTOP TABLE BUTTON: Connected to Gateway Popup trigger */}
                                                    <button 
                                                        onClick={openGateway} 
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#00A86B] hover:bg-[#078458] px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
                                                    >
                                                        Invest <ExternalLink size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden divide-y divide-[#E2D8C2]">
                        {!loading &&
                            paginatedFunds.map((f) => (
                                <article key={f.code} className="px-4 py-4 bg-[#FBF7EE]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-display text-[14.5px] font-bold text-[#0E1B2C] leading-tight">{f.name}</div>
                                            <div className="text-[11px] text-[#5C677D] mt-1">{f.fund_house}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-display text-[15px] font-bold text-[#0E1B2C]">Rs. {Number(f.nav || 0).toFixed(4)}</div>
                                            <div className="text-[9px] text-[#5C677D] mt-0.5">{f.nav_date}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] mt-3 text-[#024396] font-semibold">
                                        <span>1Y {fmtPct(f.return_1y)}</span>
                                        <span>3Y {fmtPct(f.return_3y)}</span>
                                        <span>5Y {fmtPct(f.return_5y)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button onClick={() => openFundDetail(f.code)} className="w-full text-center text-xs font-bold text-white bg-[#024396] py-2.5 rounded-xl shadow-sm block">
                                            Past Calculator
                                        </button>
                                        {/* 🎯 MOBILE CARD BUTTON: Connected to Gateway Popup trigger */}
                                        <button 
                                            onClick={openGateway} 
                                            className="w-full inline-flex justify-center items-center gap-1 text-xs font-bold text-white bg-[#00A86B] py-2.5 rounded-xl shadow-sm cursor-pointer"
                                        >
                                            Invest <ExternalLink size={13} />
                                        </button>
                                    </div>
                                </article>
                            ))}
                    </div>
                </div>

                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between mt-5 px-1">
                        <div className="text-xs text-[#5C677D]">
                            Showing page <span className="font-semibold text-[#0E1B2C]">{currentPage}</span> of <span className="font-semibold text-[#0E1B2C]">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-[#FBF7EE] border border-[#E2D8C2] disabled:opacity-40 hover:bg-[#F6F1E8]">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-[#FBF7EE] border border-[#E2D8C2] disabled:opacity-40 hover:bg-[#F6F1E8]">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {searchingDetail && <FundModal data={searchingDetail} onClose={() => setSearchingDetail(null)} />}
            </div>
        </section>
    );
}

function FundModal({ data, onClose }) {
    const [calcType, setCalcType] = useState("SIP");
    const [amount, setAmount] = useState(5000);
    const [yearsAgo, setYearsAgo] = useState(5);
    const [customMode, setCustomMode] = useState(false);
    const [customMonth, setCustomMonth] = useState("01");
    const [customYear, setCustomYear] = useState("2021");
    const [loadingCalc, setLoadingCalc] = useState(false);
    const [calcResult, setCalcResult] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const proposalRef = useRef(null);
    
    // 🎯 Modal Popup Hook Connect
    const { openGateway } = useModal(); 

    const selectedStartDate = useMemo(() => {
        const latest = data.history?.[0]?.dt || new Date();
        if (customMode) return new Date(Number(customYear), Number(customMonth) - 1, 1);
        const d = new Date(latest);
        d.setFullYear(d.getFullYear() - yearsAgo);
        return d;
    }, [customMode, customMonth, customYear, data.history, yearsAgo]);

    const runSingleCalculation = () => {
        setLoadingCalc(true);
        try {
            const history = data.history || [];
            const latest = history[0];
            if (!latest) return;

            const startPoint = findClosestNav(history, selectedStartDate);
            const currentNav = latest.nav;
            const currentDate = latest.dt;
            let totalInvested = 0;
            let totalUnits = 0;
            const cashflows = [];
            const series = [];

            if (calcType === "Lumpsum") {
                totalInvested = Number(amount) || 0;
                totalUnits = totalInvested / startPoint.nav;
                cashflows.push({ date: startPoint.dt, amount: -totalInvested });
                cashflows.push({ date: currentDate, amount: totalUnits * currentNav });
                series.push({ label: "Start", invested: totalInvested, value: totalInvested });
                series.push({ label: "Today", invested: totalInvested, value: totalUnits * currentNav });
            } else {
                const loopDt = new Date(startPoint.dt);
                while (loopDt <= currentDate) {
                    const point = findClosestNav(history, loopDt);
                    const monthly = Number(amount) || 0;
                    totalInvested += monthly;
                    totalUnits += monthly / point.nav;
                    cashflows.push({ date: new Date(point.dt), amount: -monthly });
                    if (loopDt.getMonth() === 0 || loopDt.getTime() === startPoint.dt.getTime()) {
                        series.push({
                            label: `${loopDt.getFullYear()}`,
                            invested: Math.round(totalInvested),
                            value: Math.round(totalUnits * point.nav),
                        });
                    }
                    loopDt.setMonth(loopDt.getMonth() + 1);
                }
                cashflows.push({ date: currentDate, amount: totalUnits * currentNav });
                series.push({
                    label: "Today",
                    invested: Math.round(totalInvested),
                    value: Math.round(totalUnits * currentNav),
                });
            }

            const cValue = totalUnits * currentNav;
            const selectedYears = Math.max(1 / 12, (currentDate - startPoint.dt) / (365 * 24 * 60 * 60 * 1000));
            const periodCagr = (Math.pow(currentNav / startPoint.nav, 1 / selectedYears) - 1) * 100;
            const annualized = calcType === "SIP" ? xirr(cashflows) : periodCagr;

            setCalcResult({
                invested: Math.round(totalInvested),
                currentValue: Math.round(cValue),
                profit: Math.round(cValue - totalInvested),
                returnsPct: ((cValue - totalInvested) / Math.max(totalInvested, 1)) * 100,
                annualizedReturn: annualized,
                periodCagr,
                startDate: startPoint.date,
                startNav: startPoint.nav,
                asOfDate: latest.date,
                currentNav,
                series,
            });
        } finally {
            setLoadingCalc(false);
        }
    };

    useEffect(() => {
        runSingleCalculation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [yearsAgo, calcType, amount, customMode, customMonth, customYear, data.code]);

    const downloadProposal = async () => {
        if (!proposalRef.current || !calcResult) return;
        setDownloading(true);
        try {
            toast?.loading?.("Generating 1-page proposal PDF...", { id: "fund-proposal" });
            const { default: html2canvas } = await import("html2canvas");
            await new Promise((resolve) => setTimeout(resolve, 150));
            const canvas = await html2canvas(proposalRef.current, {
                backgroundColor: "#F6F1E8",
                scale: 2,
                useCORS: true,
                logging: false,
                width: 794,
                height: 1123,
                windowWidth: 794,
                windowHeight: 1123,
            });
            const jpeg = canvas.toDataURL("image/jpeg", 0.96);
            const blob = singlePagePdfBlobFromJpeg(jpegDataUrlToBytes(jpeg), canvas.width, canvas.height);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `TFD-${data.name.replace(/[^a-z0-9]+/gi, "-").slice(0, 70)}-proposal.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            toast?.success?.("Proposal PDF downloaded.", { id: "fund-proposal" });
        } catch (e) {
            console.error(e);
            toast?.error?.("PDF download nahi ho paya. Please try again.", { id: "fund-proposal" });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-[#0E1B2C]/70 backdrop-blur grid place-items-center p-4" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="bg-[#FBF7EE] border-2 border-[#E2D8C2] rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative overflow-y-auto max-h-[92vh]">
                <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full bg-white border border-[#E2D8C2] text-[#5C677D] hover:text-[#0E1B2C]">
                    <X size={16} />
                </button>

                <div className="border-b-2 border-[#024396] pb-3 mb-4 flex justify-between items-center pr-12">
                    <div>
                        <h3 className="text-lg font-bold text-[#024396] tracking-wide uppercase font-display">The Financial Doctor</h3>
                        <p className="text-[9px] text-[#5C677D] tracking-wider font-semibold uppercase mt-0.5">Treating your financial health - AMFI registered MFD</p>
                    </div>
                    <span className="text-xs font-bold text-[#0E1B2C] bg-[#F6F1E8] px-3 py-1 rounded-full border border-[#E2D8C2]">ARN-290298</span>
                </div>

                <div className="mb-5 bg-[#024396]/5 p-3.5 rounded-xl border border-[#024396]/10">
                    <span className="text-[9px] font-bold text-[#024396] uppercase tracking-widest bg-[#024396]/10 px-2 py-0.5 rounded">Real NAV backtest</span>
                    <h4 className="font-display text-lg font-bold text-[#0E1B2C] leading-tight mt-2">{data.name}</h4>
                    <p className="text-xs text-[#5C677D] mt-0.5">
                        {data.fund_house} - Live NAV: Rs. {Number(data.nav || 0).toFixed(4)} as on {data.nav_date}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <MiniReturn label="1Y CAGR" value={data.return_1y} />
                        <MiniReturn label="3Y CAGR" value={data.return_3y} />
                        <MiniReturn label="5Y CAGR" value={data.return_5y} />
                    </div>
                </div>

                <div className="space-y-4 text-xs">
                    <div className="flex gap-2 p-1 bg-[#F6F1E8] rounded-lg">
                        <button onClick={() => setCalcType("SIP")} className={`flex-1 py-2 text-center rounded-md font-semibold transition-all ${calcType === "SIP" ? "bg-[#024396] text-white shadow" : "text-[#5C677D]"}`}>Monthly SIP</button>
                        <button onClick={() => setCalcType("Lumpsum")} className={`flex-1 py-2 text-center rounded-md font-semibold transition-all ${calcType === "Lumpsum" ? "bg-[#024396] text-white shadow" : "text-[#5C677D]"}`}>One-Time Lumpsum</button>
                    </div>

                    <div>
                        <label className="block text-[#5C677D] font-medium mb-1.5">Investment Amount (Rs.):</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm font-semibold text-[#0E1B2C]" />
                    </div>

                    <div>
                        <label className="block text-[#5C677D] font-medium mb-1.5">Select Past Horizon:</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[3, 5, 7].map((yr) => (
                                <button key={yr} onClick={() => { setCustomMode(false); setYearsAgo(yr); }} className={`py-2 rounded-xl border font-bold text-center transition-all ${!customMode && yearsAgo === yr ? "bg-[#024396]/10 border-[#024396] text-[#024396]" : "bg-white border-[#E2D8C2] text-[#5C677D]"}`}>{yr} Yr Ago</button>
                            ))}
                            <button onClick={() => setCustomMode(true)} className={`py-2 rounded-xl border font-bold text-center transition-all ${customMode ? "bg-[#024396]/10 border-[#024396] text-[#024396]" : "bg-white border-[#E2D8C2] text-[#5C677D]"}`}>Custom</button>
                        </div>
                    </div>

                    {customMode && (
                        <div className="grid grid-cols-2 gap-3 bg-[#F6F1E8]/40 p-3 rounded-xl border border-[#E2D8C2]/40">
                            <div>
                                <label className="block text-[10px] uppercase text-[#5C677D] mb-1">Month</label>
                                <select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} className="w-full bg-white border border-[#E2D8C2] rounded-lg p-2 font-medium">
                                    {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-[#5C677D] mb-1">Year</label>
                                <select value={customYear} onChange={(e) => setCustomYear(e.target.value)} className="w-full bg-white border border-[#E2D8C2] rounded-lg p-2 font-medium">
                                    {["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"].map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-5 border-t border-[#E2D8C2] pt-4">
                    {loadingCalc && <div className="text-center py-6 text-xs text-[#024396] font-medium animate-pulse">Calculating with real historical NAV...</div>}

                    {!loadingCalc && calcResult && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <StatBox label="Total Invested Capital" value={fmtFullINR(calcResult.invested)} />
                                <StatBox label="Estimated Current Value" value={fmtFullINR(calcResult.currentValue)} accent />
                            </div>
                            <div className="bg-white border border-[#E2D8C2] p-3 rounded-xl grid grid-cols-2 gap-3 text-xs shadow-sm">
                                <div>
                                    <span className="text-[#5C677D] text-[10px] uppercase block">Net Gains</span>
                                    <span className={`text-sm font-bold mt-0.5 block ${calcResult.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {calcResult.profit >= 0 ? "+" : ""}{fmtFullINR(calcResult.profit)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#5C677D] text-[10px] uppercase block">Absolute Return</span>
                                    <span className="text-sm font-extrabold text-[#024396] mt-0.5 block">{fmtPct(calcResult.returnsPct)}</span>
                                </div>
                                <div>
                                    <span className="text-[#5C677D] text-[10px] uppercase block">Fund CAGR Used</span>
                                    <span className="text-sm font-extrabold text-[#024396] mt-0.5 block">{fmtPct(calcResult.periodCagr)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#5C677D] text-[10px] uppercase block">{calcType === "SIP" ? "SIP XIRR" : "Annualized Return"}</span>
                                    <span className="text-sm font-extrabold text-[#024396] mt-0.5 block">{fmtPct(calcResult.annualizedReturn)}</span>
                                </div>
                            </div>

                            <p className="text-[10px] text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] rounded-xl p-3 leading-relaxed">
                                Calculation selected fund ke real historical NAV se hua hai: start NAV Rs. {calcResult.startNav.toFixed(4)} on {calcResult.startDate}, current NAV Rs. {calcResult.currentNav.toFixed(4)} on {calcResult.asOfDate}.
                            </p>

                            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 pt-2">
                                <button onClick={downloadProposal} disabled={downloading} className="inline-flex justify-center items-center gap-2 text-xs text-white font-bold py-3 bg-[#024396] hover:bg-[#012E6B] rounded-xl transition-all shadow-md disabled:opacity-60">
                                    {downloading ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
                                    Download Proposal PDF
                                </button>
                                {/* 🎯 MODAL POPUP INVEST BUTTON: Connected to Gateway Popup trigger */}
                                <button 
                                    onClick={openGateway} 
                                    className="inline-flex justify-center items-center gap-2 text-xs text-white font-bold py-3 bg-[#00A86B] hover:bg-[#078458] rounded-xl transition-all shadow-md cursor-pointer"
                                >
                                    Invest Now <ExternalLink size={15} />
                                </button>
                                <button onClick={onClose} className="px-4 text-center text-xs text-[#5C677D] border border-[#E2D8C2] font-semibold py-3 bg-white hover:bg-[#F6F1E8] rounded-xl transition-all">Close</button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ position: "fixed", left: -10000, top: 0, zIndex: -1 }} aria-hidden>
                    {calcResult && <ProposalPage refEl={proposalRef} data={data} calcType={calcType} amount={amount} result={calcResult} />}
                </div>
            </div>
        </div>
    );
}

function MiniReturn({ label, value }) {
    return (
        <div className="bg-white border border-[#E2D8C2] rounded-lg px-2 py-2">
            <div className="text-[9px] uppercase tracking-[0.12em] text-[#5C677D]">{label}</div>
            <div className="text-[#024396] font-bold mt-0.5">{fmtPct(value)}</div>
        </div>
    );
}

function StatBox({ label, value, accent }) {
    return (
        <div className={`${accent ? "bg-[#024396]/5 border-[#024396]/10" : "bg-[#F6F1E8]/60 border-[#E2D8C2]/40"} p-3 rounded-xl border`}>
            <span className={`${accent ? "text-[#024396]" : "text-[#5C677D]"} text-[10px] uppercase font-semibold block`}>{label}</span>
            <span className={`${accent ? "text-[#024396] text-lg" : "text-[#0E1B2C] text-base"} font-bold block mt-0.5`}>{value}</span>
        </div>
    );
}

function ProposalPage({ refEl, data, calcType, amount, result }) {
    return (
        <div
            ref={refEl}
            style={{
                width: 794,
                height: 1123,
                background: "#F6F1E8",
                color: "#0E1B2C",
                padding: 34,
                fontFamily: "DM Sans, Arial, sans-serif",
                border: "1px solid #E2D8C2",
                boxSizing: "border-box",
            }}
        >
            {/* 🛠️ FIXED SYNTAX HERE: Replaced equal sign (=) with colon (:) for correct object compilation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <img src={TFD_LOGO} crossOrigin="anonymous" alt="TFD" style={{ width: 360, height: 95, objectFit: "contain", border: "1px solid #E2D8C2", borderRadius: 14, background: "#FBF7EE" }} />
                    <div>
                        <div style={{ fontFamily: "Fraunces, serif", fontSize: 31, lineHeight: 1.05 }}>The Financial<br />Doctor</div>
                        <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5C677D", marginTop: 8 }}>Treating your<br />financial health</div>
                    </div>
                </div>
                <div style={{ textAlign: "right", color: "#024396", fontWeight: 700, fontSize: 13, letterSpacing: "0.2em" }}>
                    AMFI - ARN<br />290298
                    <div style={{ marginTop: 14, letterSpacing: 0 }}>Sehore - MP</div>
                </div>
            </div>

            <div style={{ background: "#0E1B2C", borderRadius: 22, padding: 26, color: "#F6F1E8", marginBottom: 22 }}>
                <div style={{ color: "#C7102E", fontSize: 13, letterSpacing: "0.35em", textTransform: "uppercase", fontWeight: 700 }}>{calcType} Historical Proposal</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 34, lineHeight: 1.1, marginTop: 18 }}>{fmtINR(result.currentValue)}</div>
                <div style={{ opacity: 0.75, fontSize: 15, marginTop: 4 }}>
                    Current value from real NAV history - calculated @ {fmtPct(result.periodCagr)} fund CAGR
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 16 }}>
                    {calcType === "SIP" ? "Monthly SIP" : "One-time investment"}: {fmtFullINR(amount)}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
                <PdfStat label="Total Invested" value={fmtINR(result.invested)} />
                <PdfStat label="Net Gain" value={fmtINR(result.profit)} />
                <PdfStat label="Current Value" value={fmtINR(result.currentValue)} accent />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
                <PdfStat label="Absolute Return" value={fmtPct(result.returnsPct)} />
                <PdfStat label={calcType === "SIP" ? "SIP XIRR" : "Annualized Return"} value={fmtPct(result.annualizedReturn)} />
            </div>

            <div style={{ border: "1px solid #E2D8C2", borderRadius: 16, background: "#FBF7EE", padding: 18, marginBottom: 18 }}>
                <div style={{ color: "#024396", fontWeight: 800, fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10 }}>Selected Fund</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, lineHeight: 1.15 }}>{data.name}</div>
                <div style={{ color: "#5C677D", fontSize: 13, marginTop: 8 }}>{data.fund_house} - Scheme code {data.code}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16, fontSize: 13 }}>
                    <div><strong>Start:</strong> NAV Rs. {result.startNav.toFixed(4)} on {result.startDate}</div>
                    <div><strong>Latest:</strong> NAV Rs. {result.currentNav.toFixed(4)} on {result.asOfDate}</div>
                    <div><strong>1Y CAGR:</strong> {fmtPct(data.return_1y)}</div>
                    <div><strong>3Y CAGR:</strong> {fmtPct(data.return_3y)}</div>
                    <div><strong>5Y CAGR:</strong> {fmtPct(data.return_5y)}</div>
                    <div><strong>Used for this proposal:</strong> {fmtPct(result.periodCagr)}</div>
                </div>
            </div>

            <div style={{ border: "1px solid #E2D8C2", borderLeft: "4px solid #C7102E", borderRadius: 14, background: "#FBF7EE", padding: 16, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, color: "#024396", marginBottom: 6 }}>Important note</div>
                <div style={{ color: "#5C677D", fontSize: 13, lineHeight: 1.45 }}>
                    This proposal uses the selected fund's real historical NAV records from AMFI/MFAPI. Past returns are shown only for illustration and do not guarantee future returns.
                </div>
            </div>

            <div style={{ background: "#0E1B2C", color: "#F6F1E8", borderRadius: 18, padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img src={SAGAR_PHOTO} crossOrigin="anonymous" alt="Sagar" style={{ width: 76, height: 92, borderRadius: 12, objectFit: "cover", border: "2px solid #C7102E" }} />
                    <div>
                        <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, lineHeight: 1.1 }}>Sagar Chaturvedi</div>
                        <div style={{ fontSize: 11, color: "#F6F1E8", opacity: 0.7, marginTop: 4, letterSpacing: "0.12em", textTransform: "uppercase" }}>Founder - MFD (AMFI Certified)</div>
                        <div style={{ fontSize: 12, marginTop: 8, opacity: 0.9 }}>+91 77738 05794</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>wecare@thefinancialdoctor.in</div>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ background: "#fff", padding: 6, borderRadius: 10 }}>
                        <QRCodeCanvas value={ASSETPLUS} size={92} bgColor="#FFFFFF" fgColor="#0E1B2C" level="M" includeMargin={false} />
                    </div>
                    <div style={{ fontSize: 9, marginTop: 6, color: "#C7102E", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>Scan to invest</div>
                    <div style={{ fontSize: 9, opacity: 0.6 }}>AssetPlus - ARN-290298</div>
                </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 18 }}>
                <div style={{ fontSize: 13, color: "#0E1B2C", fontWeight: 800, marginBottom: 6 }}>thefinancialdoctor.in</div>
                <div style={{ fontSize: 11, color: "#5C677D", fontStyle: "italic", lineHeight: 1.4 }}>
                    Mutual fund investments are subject to market risks. Read all scheme-related documents carefully. Calculations are illustrative; actual returns may vary.
                </div>
            </div>
        </div>
    );
}

function PdfStat({ label, value, accent }) {
    return (
        <div style={{ background: accent ? "#024396" : "#FBF7EE", border: accent ? "none" : "1px solid #E2D8C2", borderRadius: 16, padding: "18px 18px", color: accent ? "#F6F1E8" : "#0E1B2C" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: accent ? "rgba(246,241,232,0.75)" : "#5C677D", marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, lineHeight: 1.1 }}>{value}</div>
        </div>
    );
}
