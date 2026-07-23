import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Link as LinkIcon, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "./LanguageToggle";

const PAGE_SIZE = 6;

// Stable, URL-safe id for a single FAQ item, derived purely from its
// question text — so the same question always resolves to the same id
// (usable as a `#hash` deep link) regardless of which page/position it
// lands on. A short deterministic hash suffix is always appended, not only
// when an ASCII-slug collision is spotted: Hindi/Hinglish question text
// (used across every FAQSection instance via the `hi`/`hinglish` arrays)
// strips down to an empty or near-identical ASCII slug once non-Latin
// characters are removed, so most Hindi questions in the same list would
// otherwise collide on the same id. The hash keeps every id unique
// regardless of script. Kept as a local copy (not imported from
// lib/faqIndex.js) to avoid a circular import — faqIndex.js pulls FAQ data
// from pages that themselves render this component.
const COMBINING_DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");
function slugifyFaqId(text) {
    const raw = String(text || "");
    const base = raw
        .toLowerCase()
        .normalize("NFKD")
        .replace(COMBINING_DIACRITICS_RE, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
        .replace(/-+$/g, "");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = (hash * 31 + raw.charCodeAt(i)) | 0;
    }
    const suffix = Math.abs(hash).toString(36);
    return `faq-${base ? `${base}-` : ""}${suffix}`;
}

// Resolves the current `window.location.hash` (if any) against a given
// list of {id}-bearing items, returning which page/position it lives at.
function findHashMatch(list) {
    const hash = decodeURIComponent(window.location.hash || "").replace(/^#/, "");
    if (!hash) return null;
    const idx = list.findIndex((item) => item.id === hash);
    if (idx === -1) return null;
    return { idx, page: Math.floor(idx / PAGE_SIZE), indexInPage: idx % PAGE_SIZE };
}

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
    const [copiedId, setCopiedId] = useState(null);
    // Set only when a hash deep-link opened an item — cleared right after
    // the scroll fires — so ordinary clicks/pagination never trigger a scroll.
    const pendingScrollId = useRef(null);
    const items = useMemo(() => data?.[lang] || data?.en || [], [data, lang]);
    const itemsWithIds = useMemo(
        () => items.map((item) => ({ ...item, id: slugifyFaqId(item.q) })),
        [items]
    );

    // Runs on every language switch (mirrors the previous reset-only
    // behaviour) AND on first mount — if the URL hash already points at one
    // of this list's questions (e.g. a click-through from a Google/AI-engine
    // answer built from this section's own FAQPage schema below), jump to
    // its page and open it instead of resetting to page 0/closed.
    useEffect(() => {
        const match = findHashMatch(itemsWithIds);
        if (match) {
            setPage(match.page);
            setOpenIndex(match.indexInPage);
            pendingScrollId.current = itemsWithIds[match.idx].id;
        } else {
            setPage(0);
            setOpenIndex(null);
            pendingScrollId.current = null;
        }
    }, [itemsWithIds]);

    // Also react to in-page hash changes (e.g. a "copy link" click on this
    // same section, or the user editing the URL fragment directly).
    useEffect(() => {
        const onHashChange = () => {
            const match = findHashMatch(itemsWithIds);
            if (!match) return;
            setPage(match.page);
            setOpenIndex(match.indexInPage);
            pendingScrollId.current = itemsWithIds[match.idx].id;
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, [itemsWithIds]);

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

    const totalPages = Math.max(1, Math.ceil(itemsWithIds.length / PAGE_SIZE));
    const pageItems = useMemo(
        () => itemsWithIds.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
        [itemsWithIds, page]
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
                                key={item.id}
                                id={item.id}
                                className={`border rounded-xl overflow-hidden transition-colors scroll-mt-24 ${
                                    isOpen ? "border-[#024396]/40 sm:col-span-2" : "border-[#E2D8C2]"
                                }`}
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : i)}
                                    className="w-full text-left px-5 py-4 bg-[#FBF7EE] hover:bg-[#F2EAD8] transition-colors flex items-center justify-between gap-3"
                                >
                                    <span className="font-display text-[#0E1B2C] text-sm md:text-[15px] leading-snug">{item.q}</span>
                                    <span className="shrink-0 flex items-center gap-2">
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => copyLink(e, item.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") copyLink(e, item.id);
                                            }}
                                            aria-label="Copy link to this question"
                                            title="Copy link to this question"
                                            className="text-[#8A93A6] hover:text-[#024396] transition-colors p-1 -m-1"
                                        >
                                            {copiedId === item.id ? <Check size={14} /> : <LinkIcon size={14} />}
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            className={`text-[#024396] transition-transform ${isOpen ? "rotate-180" : ""}`}
                                        />
                                    </span>
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
