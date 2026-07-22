import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "./LanguageToggle";

const PAGE_SIZE = 6;

// Answers can embed links using markdown-style [label](/path) — internal
// paths render as a react-router <Link> (no full reload), external URLs as
// a normal <a>. Kept intentionally tiny (no markdown lib) since this is the
// only formatting FAQ answers ever need.
function LinkedAnswer({ text }) {
    const parts = String(text || "").split(/(\[[^\]]+\]\([^)]+\))/g);
    return (
        <>
            {parts.map((part, i) => {
                const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (!m) return <React.Fragment key={i}>{part}</React.Fragment>;
                const [, label, href] = m;
                return href.startsWith("/") ? (
                    <Link key={i} to={href} className="text-[#024396] underline hover:text-[#012E6B]">
                        {label}
                    </Link>
                ) : (
                    <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-[#024396] underline hover:text-[#012E6B]">
                        {label}
                    </a>
                );
            })}
        </>
    );
}

// 📋 Reusable FAQ block used at the bottom of every page.
// `data` shape: { en: [{q,a}], hi: [{q,a}], hinglish: [{q,a}] }
// Grid of PAGE_SIZE cards + pagination, each card expands INLINE in place
// (no popup) to reveal its answer — keeps a 50-question page a fixed,
// scannable height without a modal on top of the page.
export default function FAQSection({ title = "Frequently Asked Questions", data }) {
    const { lang } = useLanguage();
    const [page, setPage] = useState(0);
    const [openIndex, setOpenIndex] = useState(null);
    const items = useMemo(() => data?.[lang] || data?.en || [], [data, lang]);

    useEffect(() => {
        setPage(0);
        setOpenIndex(null);
    }, [lang]);

    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const pageItems = useMemo(
        () => items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
        [items, page]
    );

    // FAQPage structured data (JSON-LD) — built from the same en/hi/hinglish
    // question data already rendered above, so it always matches on-page
    // content. Uses the same dynamic head-tag injection pattern as SEO.jsx
    // (plain DOM mutation on mount/update, no react-helmet dependency).
    useEffect(() => {
        if (!items.length) return undefined;

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: item.a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
                },
            })),
        });
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [items]);

    return (
        <section className="bg-white py-16 px-6 border-t border-[#E2D8C2]">
            <div className="container-x max-w-4xl mx-auto">
                <div className="flex flex-col items-center gap-4 mb-10">
                    <h2 className="text-2xl md:text-3xl font-serif text-[#0E1B2C] text-center">{title}</h2>
                    <LanguageToggle />
                </div>

                <div className="grid sm:grid-cols-2 gap-3 items-start">
                    {pageItems.map((item, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <div
                                key={page * PAGE_SIZE + i}
                                className={`border rounded-xl overflow-hidden transition-colors ${
                                    isOpen ? "border-[#024396]/40 sm:col-span-2" : "border-[#E2D8C2]"
                                }`}
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : i)}
                                    className="w-full text-left px-5 py-4 bg-[#FBF7EE] hover:bg-[#F2EAD8] transition-colors flex items-center justify-between gap-3"
                                >
                                    <span className="font-display text-[#0E1B2C] text-sm md:text-[15px] leading-snug">{item.q}</span>
                                    <ChevronDown
                                        size={16}
                                        className={`shrink-0 text-[#024396] transition-transform ${isOpen ? "rotate-180" : ""}`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 py-4 bg-white">
                                        <p className="text-sm text-[#2A364B]/85 leading-relaxed">
                                            <LinkedAnswer text={item.a} />
                                        </p>
                                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E2D8C2]">
                                            <img
                                                src="/assets/logos/TFD-MAIN-LOGO.webp"
                                                alt="The Financial Doctor"
                                                width={90}
                                                height={24}
                                                className="h-4 w-auto"
                                            />
                                            <span className="text-[9.5px] text-[#8A93A6] tracking-wide">
                                                The Financial Doctor · AMFI ARN-290298
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={() => {
                                setPage((p) => Math.max(0, p - 1));
                                setOpenIndex(null);
                            }}
                            disabled={page === 0}
                            className="w-9 h-9 rounded-full border border-[#E2D8C2] grid place-items-center text-[#0E1B2C] disabled:opacity-30 hover:border-[#024396] transition-colors"
                            aria-label="Previous questions"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs text-[#5C677D] tabular-nums">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => {
                                setPage((p) => Math.min(totalPages - 1, p + 1));
                                setOpenIndex(null);
                            }}
                            disabled={page >= totalPages - 1}
                            className="w-9 h-9 rounded-full border border-[#E2D8C2] grid place-items-center text-[#0E1B2C] disabled:opacity-30 hover:border-[#024396] transition-colors"
                            aria-label="Next questions"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
