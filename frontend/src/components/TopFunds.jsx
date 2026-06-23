import React, { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, Sparkles, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { IDS } from "@/constants/testIds";

const ASSETPLUS = "https://www.assetplus.in/mfd/ARN-290298";

const fmtPct = (v) => (v === null || v === undefined ? "—" : `${v}%`);

export default function TopFunds() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("All");
    const [searchQ, setSearchQ] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchingDetail, setSearchingDetail] = useState(null);

    useEffect(() => {
        api.topFunds()
            .then((d) => setData(d))
            .catch((e) => console.error("topFunds error", e))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (searchQ.length < 2) {
            setSearchResults([]);
            return;
        }
        const t = setTimeout(() => {
            api.searchFunds(searchQ)
                .then(setSearchResults)
                .catch(() => setSearchResults([]));
        }, 350);
        return () => clearTimeout(t);
    }, [searchQ]);

    const categories = useMemo(() => {
        if (!data) return ["All"];
        return ["All", ...data.categories];
    }, [data]);

    const filtered = useMemo(() => {
        if (!data) return [];
        if (category === "All") return data.funds;
        return data.funds.filter((f) => f.category === category);
    }, [data, category]);

    const openFundDetail = async (code) => {
        try {
            const d = await api.fundDetail(code);
            setSearchingDetail(d);
        } catch (e) {
            console.error(e);
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
                        <h2 className="h2 mt-3 text-[#0E1B2C]">
                            Top funds, <span className="font-italic-serif text-[#0E5E48]">handpicked</span> for you.
                        </h2>
                        <p className="mt-3 text-[#2A364B] max-w-2xl">
                            Live NAV &amp; trailing returns powered by AMFI (via{" "}
                            <a className="underline" href="https://www.mfapi.in" target="_blank" rel="noopener noreferrer">
                                MFAPI.in
                            </a>
                            ). All funds shown are <strong>Regular plans (Growth option)</strong> — curated for advisory clients of ARN-290298.
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6 max-w-xl">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C677D]" />
                    <input
                        data-testid={IDS.funds.search}
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        placeholder="Search any mutual fund (e.g. Parag Parikh Flexi)"
                        className="w-full bg-[#FBF7EE] border border-[#E2D8C2] rounded-full pl-11 pr-4 py-3 text-[#0E1B2C] placeholder:text-[#8A93A6] focus:border-[#0E5E48]"
                    />
                    {searchResults.length > 0 && (
                        <div
                            data-testid={IDS.funds.searchResults}
                            className="absolute z-20 left-0 right-0 mt-2 bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl max-h-[300px] overflow-y-auto shadow-xl"
                        >
                            {searchResults.map((r) => (
                                <button
                                    key={r.schemeCode}
                                    onClick={() => {
                                        openFundDetail(r.schemeCode);
                                        setSearchQ("");
                                        setSearchResults([]);
                                    }}
                                    className="block w-full text-left px-4 py-2.5 hover:bg-[#EFE7D6] text-[14px] text-[#0E1B2C] border-b border-[#E2D8C2] last:border-0"
                                >
                                    {r.schemeName}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Categories */}
                <div className="-mx-6 md:mx-0 px-6 md:px-0 mb-6 overflow-x-auto" data-testid={IDS.funds.category}>
                    <div className="flex gap-2 min-w-max md:flex-wrap">
                        {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                className={`tab-pill shrink-0 ${category === c ? "active" : ""}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Funds — desktop table / mobile cards */}
                <div className="card-cream overflow-hidden" data-testid={IDS.funds.table}>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#F6F1E8] text-[#5C677D]">
                                <tr className="text-left">
                                    <th className="px-5 py-4 font-medium text-[11px] tracking-[0.18em] uppercase">
                                        Fund
                                    </th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase">
                                        Category
                                    </th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">
                                        NAV
                                    </th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">
                                        1Y
                                    </th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">
                                        3Y
                                    </th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">
                                        5Y
                                    </th>
                                    <th className="px-5 py-4" />
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-[#5C677D]">
                                            <Sparkles className="inline animate-pulse" size={16} /> Fetching live NAVs from AMFI…
                                        </td>
                                    </tr>
                                )}
                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-[#5C677D]">
                                            No funds found for this category.
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    filtered.map((f) => (
                                        <tr key={f.code} className="border-t border-[#E2D8C2] hover:bg-[#F6F1E8]">
                                            <td className="px-5 py-4">
                                                <div className="font-display text-[15px] text-[#0E1B2C] leading-tight">
                                                    {f.name}
                                                </div>
                                                <div className="text-[11px] text-[#5C677D] mt-1">
                                                    {f.fund_house}
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-[12px] text-[#5C677D]">{f.category}</td>
                                            <td className="px-3 py-4 text-right">
                                                <div className="font-medium text-[#0E1B2C]">
                                                    ₹{f.nav ? Number(f.nav).toFixed(2) : "—"}
                                                </div>
                                                <div className="text-[10px] text-[#5C677D]">
                                                    {f.nav_date || "—"}
                                                </div>
                                            </td>
                                            <td className={`px-3 py-4 text-right font-medium ${returnColor(f.return_1y)}`}>
                                                {fmtPct(f.return_1y)}
                                            </td>
                                            <td className={`px-3 py-4 text-right font-medium ${returnColor(f.return_3y)}`}>
                                                {fmtPct(f.return_3y)}
                                            </td>
                                            <td className={`px-3 py-4 text-right font-medium ${returnColor(f.return_5y)}`}>
                                                {fmtPct(f.return_5y)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <a
                                                    href={ASSETPLUS}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[#0E5E48] hover:text-[#0A4838] text-sm font-medium"
                                                >
                                                    Invest <ExternalLink size={13} />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile card list */}
                    <div className="md:hidden divide-y divide-[#E2D8C2]">
                        {loading && (
                            <div className="px-5 py-8 text-center text-[#5C677D] text-sm">
                                <Sparkles className="inline animate-pulse mr-1" size={14} />
                                Fetching live NAVs from AMFI…
                            </div>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="px-5 py-8 text-center text-[#5C677D] text-sm">
                                No funds found for this category.
                            </div>
                        )}
                        {!loading &&
                            filtered.map((f) => (
                                <article key={f.code} className="px-4 py-4 bg-[#FBF7EE]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-display text-[14.5px] text-[#0E1B2C] leading-tight">
                                                {f.name}
                                            </div>
                                            <div className="text-[11px] text-[#5C677D] mt-1">
                                                {f.fund_house}
                                            </div>
                                            <span className="inline-block mt-2 text-[10px] tracking-[0.14em] uppercase text-[#0E5E48] bg-[#0E5E48]/10 px-2 py-0.5 rounded-full">
                                                {f.category}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-display text-[16px] text-[#0E1B2C] leading-none">
                                                ₹{f.nav ? Number(f.nav).toFixed(2) : "—"}
                                            </div>
                                            <div className="text-[9px] tracking-[0.18em] uppercase text-[#5C677D] mt-1">
                                                NAV · {f.nav_date || "—"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        <ReturnPill label="1Y" value={f.return_1y} />
                                        <ReturnPill label="3Y" value={f.return_3y} />
                                        <ReturnPill label="5Y" value={f.return_5y} />
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <button
                                            onClick={() => openFundDetail(f.code)}
                                            className="text-[12px] text-[#5C677D] underline-offset-2 hover:underline"
                                        >
                                            View details
                                        </button>
                                        <a
                                            href={ASSETPLUS}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#F6F1E8] bg-[#0E5E48] hover:bg-[#0A4838] px-3.5 py-2 rounded-full"
                                        >
                                            Invest <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </article>
                            ))}
                    </div>
                </div>

                <p className="text-xs text-[#5C677D] mt-4 italic">
                    Returns shown are CAGR for the periods indicated, computed from latest NAV history.
                    Mutual fund investments are subject to market risks.
                </p>

                {searchingDetail && (
                    <FundModal data={searchingDetail} onClose={() => setSearchingDetail(null)} />
                )}
            </div>
        </section>
    );
}

function returnColor(v) {
    if (v === null || v === undefined) return "text-[#5C677D]";
    if (v >= 0) return "text-[#0E5E48]";
    return "text-[#C04A2A]";
}

function ReturnPill({ label, value }) {
    const positive = value !== null && value !== undefined && value >= 0;
    const negative = value !== null && value !== undefined && value < 0;
    const bg = positive
        ? "bg-[#0E5E48]/10 text-[#0E5E48]"
        : negative
        ? "bg-[#C04A2A]/10 text-[#C04A2A]"
        : "bg-[#F6F1E8] text-[#5C677D]";
    return (
        <div className={`rounded-lg px-2 py-1.5 text-center ${bg}`}>
            <div className="text-[10px] tracking-[0.18em] uppercase opacity-80">{label}</div>
            <div className="font-display text-[15px] leading-none mt-1">
                {value === null || value === undefined ? "—" : `${value}%`}
            </div>
        </div>
    );
}

function FundModal({ data, onClose }) {
    return (
        <div
            className="fixed inset-0 z-[60] bg-[#0E1B2C]/70 backdrop-blur grid place-items-center p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-7 max-w-lg w-full"
                data-testid="fund-detail-modal"
            >
                <div className="font-display text-2xl text-[#0E1B2C]">{data.name}</div>
                <div className="text-xs text-[#5C677D] mt-1">{data.fund_house}</div>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <Info label="Latest NAV" value={`₹${data.nav ? Number(data.nav).toFixed(4) : "—"}`} />
                    <Info label="NAV Date" value={data.nav_date || "—"} />
                    <Info label="Category" value={data.scheme_category || "—"} />
                    <Info label="Type" value={data.scheme_type || "—"} />
                    <Info label="1Y Return" value={fmtPct(data.return_1y)} accent />
                    <Info label="3Y Return" value={fmtPct(data.return_3y)} accent />
                    <Info label="5Y Return" value={fmtPct(data.return_5y)} accent />
                </div>
                <div className="mt-6 flex gap-3">
                    <a
                        href={ASSETPLUS}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-pill btn-primary flex-1 justify-center"
                    >
                        Invest now
                    </a>
                    <button onClick={onClose} className="btn-pill btn-ghost">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function Info({ label, value, accent }) {
    return (
        <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C677D]">{label}</div>
            <div className={`mt-1 font-display ${accent ? "text-[#0E5E48] text-lg" : "text-[#0E1B2C]"}`}>
                {value}
            </div>
        </div>
    );
}
