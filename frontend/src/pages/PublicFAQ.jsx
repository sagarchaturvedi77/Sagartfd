import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, ArrowRight, Link as LinkIcon, Check } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { FAQ_INDEX, FAQ_SOURCES } from "@/lib/faqIndex";

const PAGE_SIZE = 8;

// Resolves the current `window.location.hash` (if any) to its position in
// the FULL FAQ_INDEX — not the currently filtered/searched `results` — so
// a deep link always finds its target even if a leftover search query or
// category filter would otherwise hide it.
function findHashMatch() {
    const hash = decodeURIComponent(window.location.hash || "").replace(/^#/, "");
    if (!hash) return null;
    const idx = FAQ_INDEX.findIndex((item) => item.id === hash);
    if (idx === -1) return null;
    return { idx, page: Math.floor(idx / PAGE_SIZE), indexInPage: idx % PAGE_SIZE };
}

function matchScore(text, terms) {
    const lower = (text || "").toLowerCase();
    return terms.reduce((score, t) => (lower.includes(t) ? score + 1 : score), 0);
}

// This page aggregates every FAQ from every other page on the site — yet,
// unlike each individual page's own FAQSection (which emits real FAQPage
// JSON-LD), this hub page had no structured data at all. Built from the
// full FAQ_INDEX (not just the current search/page slice) so Google and
// answer engines see the complete question set this page actually offers.
function useFaqIndexSchema() {
    useEffect(() => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_INDEX.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: String(item.a || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
                },
            })),
        });
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, []);
}

export default function PublicFAQ() {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [openIndex, setOpenIndex] = useState(null);
    const [page, setPage] = useState(0);
    const [copiedId, setCopiedId] = useState(null);
    // Set only when a hash deep-link opened an item — cleared right after the
    // scroll fires — so we never re-scroll on ordinary clicks/pagination.
    const pendingScrollId = useRef(null);

    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const isSearching = terms.length > 0;

    const results = useMemo(() => {
        if (isSearching) {
            return FAQ_INDEX
                .map((item) => ({ item, score: matchScore(item.q, terms) * 2 + matchScore(item.a, terms) }))
                .filter((r) => r.score > 0)
                .sort((a, b) => b.score - a.score)
                .map((r) => r.item);
        }
        return category === "all" ? FAQ_INDEX : FAQ_INDEX.filter((i) => i.sourceKey === category);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, category]);

    const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    const pageItems = results.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    useFaqIndexSchema();

    // Deep-link on load: if the URL already points at a specific question
    // (e.g. someone clicked through from a Google/AI-engine answer built
    // from our FAQPage schema), clear any search/filter that would hide it,
    // jump to the page it lives on, and open it.
    useEffect(() => {
        const match = findHashMatch();
        if (!match) return;
        setQuery("");
        setCategory("all");
        setPage(match.page);
        setOpenIndex(match.indexInPage);
        pendingScrollId.current = FAQ_INDEX[match.idx].id;
        // Runs once on mount only — this is the initial-load deep link;
        // subsequent hash changes are handled by the listener below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Also react to in-page hash changes (e.g. a "copy link" click on this
    // same page, or the user editing the URL fragment directly) without
    // requiring a full reload.
    useEffect(() => {
        const onHashChange = () => {
            const match = findHashMatch();
            if (!match) return;
            setQuery("");
            setCategory("all");
            setPage(match.page);
            setOpenIndex(match.indexInPage);
            pendingScrollId.current = FAQ_INDEX[match.idx].id;
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    // After the matched page/item state has committed and the DOM reflects
    // the newly-opened answer, scroll it into view.
    useEffect(() => {
        if (!pendingScrollId.current) return undefined;
        const id = pendingScrollId.current;
        const t = setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            pendingScrollId.current = null;
        }, 60);
        return () => clearTimeout(t);
    }, [page, openIndex]);

    const copyLink = (e, id) => {
        e.stopPropagation();
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(url).catch(() => {});
        }
        window.history.replaceState(null, "", `#${id}`);
        setCopiedId(id);
        setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    };

    const onQueryChange = (v) => {
        setQuery(v);
        setPage(0);
        setOpenIndex(null);
    };
    const onCategoryChange = (c) => {
        setCategory(c);
        setPage(0);
        setOpenIndex(null);
    };

    return (
        <div className="relative">
            <SEO
                title="Mutual Fund & Financial Planning FAQs | The Financial Doctor"
                description={`${FAQ_INDEX.length}+ answers on SIP, lumpsum, insurance, tax-saving and financial planning — search your question, from The Financial Doctor.`}
                keywords="TFD FAQ, mutual fund FAQ, SIP questions answered, SIP kya hai, financial planning FAQ, term insurance FAQ, tax saving FAQ, mutual fund agent FAQ, mutual fund advisor Sehore, mutual fund advisor Madhya Pradesh, mutual fund advisor India, Sagar Chaturvedi FAQ, The Financial Doctor FAQ, AMFI registered mutual fund distributor, ARN-290298"
                path="/faq"
            />
            <Navbar />
            <main className="pt-24 pb-16 section">
                <div className="container-x max-w-3xl mx-auto">
                    <div className="mb-8 text-center">
                        <div className="eyebrow">{FAQ_INDEX.length}+ answers, one place</div>
                        <h1 className="h2 mt-3 text-[#0E1B2C]">
                            Search your <span className="font-italic-serif text-[#C7102E]">question.</span>
                        </h1>
                        <p className="mt-3 text-[#5C677D] text-sm max-w-lg mx-auto">
                            Every FAQ from every page on this site, mixed into one searchable place.
                        </p>
                    </div>

                    <div className="relative max-w-xl mx-auto mb-6">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C677D]">
                            <Search size={18} />
                        </div>
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            placeholder="Search your question — e.g. SIP, term insurance, ELSS..."
                            aria-label="Search FAQs"
                            className="w-full bg-[#FBF7EE] border border-[#E2D8C2] rounded-full pl-12 pr-4 py-3 text-[#0E1B2C] placeholder:text-[#8A93A6] focus:border-[#024396] text-sm"
                        />
                    </div>

                    {!isSearching && (
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            <button
                                onClick={() => onCategoryChange("all")}
                                className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                                    category === "all" ? "bg-[#0E1B2C] border-[#0E1B2C] text-white" : "bg-white border-[#E2D8C2] text-[#2A364B] hover:border-[#024396]/40"
                                }`}
                            >
                                All ({FAQ_INDEX.length})
                            </button>
                            {FAQ_SOURCES.map((s) => (
                                <button
                                    key={s.key}
                                    onClick={() => onCategoryChange(s.key)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                                        category === s.key ? "bg-[#0E1B2C] border-[#0E1B2C] text-white" : "bg-white border-[#E2D8C2] text-[#2A364B] hover:border-[#024396]/40"
                                    }`}
                                >
                                    {s.label} ({s.data.en?.length || 0})
                                </button>
                            ))}
                        </div>
                    )}

                    {isSearching && (
                        <p className="text-xs text-[#5C677D] text-center mb-4">
                            {results.length} result{results.length === 1 ? "" : "s"} for "{query}"
                        </p>
                    )}

                    {results.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-[#2A364B]">No match for "{query}" yet.</p>
                            <p className="text-sm text-[#5C677D] mt-2">
                                Try a shorter phrase, or reach out on our <a href="/contact" className="text-[#024396] underline">Contact page</a> — we'll answer personally.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pageItems.map((item, i) => {
                                const isOpen = openIndex === i;
                                return (
                                    <div key={item.id} id={item.id} className="border border-[#E2D8C2] rounded-xl overflow-hidden bg-[#FBF7EE] scroll-mt-24">
                                        {/* Two independent controls, not nested — a <button> can't
                                            legally contain another interactive control, which the
                                            previous role="button" span for copy-link did. */}
                                        <div className="w-full px-5 py-4 hover:bg-[#F2EAD8] transition-colors flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setOpenIndex(isOpen ? null : i)}
                                                aria-expanded={isOpen}
                                                aria-controls={`${item.id}-panel`}
                                                className="flex-1 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer"
                                            >
                                                <span className="block text-[10px] uppercase tracking-wider text-[#024396] font-semibold mb-1">{item.source}</span>
                                                <span className="font-display text-[#0E1B2C] text-sm md:text-[15px] leading-snug">{item.q}</span>
                                            </button>
                                            <span className="shrink-0 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => copyLink(e, item.id)}
                                                    aria-label="Copy link to this question"
                                                    title="Copy link to this question"
                                                    className="text-[#8A93A6] hover:text-[#024396] transition-colors p-1 -m-1 bg-transparent border-none cursor-pointer"
                                                >
                                                    {copiedId === item.id ? <Check size={14} /> : <LinkIcon size={14} />}
                                                </button>
                                                <ChevronDown size={16} aria-hidden="true" className={`text-[#024396] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                            </span>
                                        </div>
                                        {isOpen && (
                                            <div id={`${item.id}-panel`} role="region" className="px-5 py-4 bg-white">
                                                <p className="text-sm text-[#2A364B]/85 leading-relaxed">{item.a}</p>
                                                <a href={item.path} className="inline-flex items-center gap-1 mt-3 text-xs text-[#024396] font-medium hover:underline">
                                                    More on {item.source} <ArrowRight size={12} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => { setPage((p) => Math.max(0, p - 1)); setOpenIndex(null); }}
                                disabled={page === 0}
                                className="px-4 py-2 rounded-full border border-[#E2D8C2] text-xs text-[#0E1B2C] disabled:opacity-30 hover:border-[#024396] transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-[#5C677D] tabular-nums">Page {page + 1} of {totalPages}</span>
                            <button
                                onClick={() => { setPage((p) => Math.min(totalPages - 1, p + 1)); setOpenIndex(null); }}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 rounded-full border border-[#E2D8C2] text-xs text-[#0E1B2C] disabled:opacity-30 hover:border-[#024396] transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <FloatingActions />
        </div>
    );
}
