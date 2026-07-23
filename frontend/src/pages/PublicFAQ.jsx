import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { FAQ_INDEX, FAQ_SOURCES } from "@/lib/faqIndex";

const PAGE_SIZE = 8;

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
                keywords="TFD FAQ, mutual fund FAQ, SIP questions answered, financial planning FAQ, term insurance FAQ, tax saving FAQ, mutual fund advisor Sehore, mutual fund advisor Madhya Pradesh, mutual fund advisor India, Sagar Chaturvedi FAQ, The Financial Doctor FAQ, AMFI registered mutual fund distributor, ARN-290298"
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
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            placeholder="Search your question — e.g. SIP, term insurance, ELSS..."
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
                                    <div key={`${item.sourceKey}-${page}-${i}`} className="border border-[#E2D8C2] rounded-xl overflow-hidden bg-[#FBF7EE]">
                                        <button
                                            onClick={() => setOpenIndex(isOpen ? null : i)}
                                            className="w-full text-left px-5 py-4 hover:bg-[#F2EAD8] transition-colors flex items-center justify-between gap-3"
                                        >
                                            <span className="min-w-0">
                                                <span className="block text-[10px] uppercase tracking-wider text-[#024396] font-semibold mb-1">{item.source}</span>
                                                <span className="font-display text-[#0E1B2C] text-sm md:text-[15px] leading-snug">{item.q}</span>
                                            </span>
                                            <ChevronDown size={16} className={`shrink-0 text-[#024396] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        {isOpen && (
                                            <div className="px-5 py-4 bg-white">
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
