import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, User, ExternalLink, Share2, Check, Search, Linkedin } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { LINKS } from "@/lib/links";
import { ORG_ID } from "@/components/PersonSchema";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const PAGE_SIZE = 9;

// Mirrors backend/internship_content_models.py's ContentTopic + TOPIC_LABELS
// — kept as a small static list here (rather than fetched) so the category
// strip renders instantly with zero network round-trip.
const CATEGORIES = [
    { key: "sip", label: "SIP" },
    { key: "lumpsum", label: "Lumpsum" },
    { key: "swp", label: "SWP" },
    { key: "financial_planning", label: "Financial Planning" },
    { key: "term_insurance", label: "Term Insurance" },
    { key: "health_insurance", label: "Health Insurance" },
    { key: "elss_tax_saving", label: "ELSS / Tax Saving" },
    { key: "retirement_planning", label: "Retirement" },
    { key: "general_investing", label: "General Investing" },
    { key: "awareness", label: "Market History & Awareness" },
    { key: "brand_comparison", label: "Why TFD" },
];

// Friendly, action-oriented CTA text per topic — pairs with each post's
// product_link (already topic-mapped server-side via TOPIC_PRODUCT_LINKS)
// so a SIP article links to "Start a SIP Calculator", not a generic
// "Learn More". Falls back to a generic label for any topic not listed.
const CTA_LABELS = {
    sip: "Try the SIP Calculator",
    lumpsum: "Try the Lumpsum Calculator",
    swp: "Try the SWP Calculator",
    financial_planning: "Explore Our Services",
    term_insurance: "Get a Term Insurance Quote",
    health_insurance: "Compare Health Plans",
    elss_tax_saving: "Try the Tax Calculator",
    retirement_planning: "Try the Goal Calculator",
    general_investing: "Explore Top Funds",
    awareness: "See Live Fund Data",
    brand_comparison: "Meet The Financial Doctor",
};

// One share card PER POST, PER LANGUAGE (see
// backend/scripts/generate_blog_post_share_cards.py, run manually whenever
// posts are added/edited) — every post's card is generated once with its
// Hinglish title (the default, blog-post-{id}.png) and again with its
// English title if one exists (blog-post-{id}-en.png), so a reader viewing
// in English sees an English image, not just English page text with a
// Hinglish-titled share card. Falls back to the default (Hinglish) image
// for English if that specific post has no title_en yet, and to the old
// per-topic image if the post has no per-post card generated at all (e.g.
// freshly published, script not yet re-run).
const DEFAULT_SHARE_IMAGE = "https://thefinancialdoctor.in/assets/og/blog-other.png";
// "-en" suffix only when this specific post actually has an English title
// (see generate_blog_post_share_cards.py — English cards are only ever
// generated for posts with title_en); falls back to the default Hinglish
// image otherwise rather than a missing file.
function imageLangSuffix(post, lang) {
    return lang === "en" && post?.title_en ? "-en" : "";
}
function shareImageFor(post, lang) {
    if (!post?.id) return DEFAULT_SHARE_IMAGE;
    return `https://thefinancialdoctor.in/assets/og/blog-post-${post.id}${imageLangSuffix(post, lang)}.png`;
}
function blogThumbSrc(post, lang) {
    return `/assets/og-thumbs/blog-post-${post.id}${imageLangSuffix(post, lang)}.webp`;
}

function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// English fields (title_en/body_en) only exist when lang === "en" AND the
// post actually has them populated; every other state (hi, hinglish, or a
// post missing its English version) falls back to the original title/body,
// which is the Hinglish version already live on the site.
function pickTitle(post, lang) {
    if (lang === "en" && post.title_en) return post.title_en;
    return post.title;
}
function pickBody(post, lang) {
    if (lang === "en" && post.body_en) return post.body_en;
    return post.body;
}

// The shared URL carries ?lang=en when the reader is in English mode, so
// the Cloudflare Pages Function at functions/blog/[id].js (which decides
// what WhatsApp/LinkedIn/etc. preview bots see) shows the matching-language
// title instead of always defaulting to the Hinglish original.
function shareUrlFor(post, lang) {
    const base = `${window.location.origin}/blog/${post.id}`;
    return lang === "en" ? `${base}?lang=en` : base;
}

// WhatsApp gets a deliberately minimal caption — title + link only. The
// link-preview card (photo, headline, site name) already comes from the
// og: tags functions/blog/[id].js serves to WhatsApp's crawler, so a long
// caption stacked underneath just duplicated the title and pushed the
// actual link (and its preview) further down the message.
function shareCaptionMinimal(post, lang, url) {
    return `${pickTitle(post, lang)}\n${url}`;
}

// Same per-post description fallback used by the SEO schema (meta_description,
// falling back to a body excerpt) — reused here so the copied caption always
// carries this specific post's own summary, not a generic brand line.
function pickCaptionDescription(post, lang) {
    if (post.meta_description) return post.meta_description;
    const body = pickBody(post, lang);
    return body ? `${body.slice(0, 180).trim()}...` : "";
}

// Telegram and the Instagram copy-caption flow both get the fuller
// caption: description, hashtags and our handles spelled out, since
// neither surfaces them automatically the way WhatsApp/LinkedIn's link-
// preview card does. `includeUrl` is false for Telegram specifically —
// its share intent takes the link as its own separate `url` param and
// generates its own preview from that, so repeating the raw URL inside
// the caption text would just show it twice in the composed message.
function shareCaptionRich(post, lang, url, includeUrl = true) {
    const title = pickTitle(post, lang);
    const description = pickCaptionDescription(post, lang);
    const tags = Array.isArray(post.hashtags) && post.hashtags.length ? post.hashtags.join(" ") : "";
    return [
        title,
        description,
        "",
        "— The Financial Doctor | Sagar Chaturvedi (AMFI Registered, ARN-290298)",
        includeUrl ? url : null,
        tags,
        "",
        `Instagram: ${LINKS.instagram}`,
        `LinkedIn: ${LINKS.linkedin}`,
        `YouTube: ${LINKS.youtube}`,
    ].filter(Boolean).join("\n");
}

function ShareButton({ post, lang }) {
    const [copied, setCopied] = useState(false);
    const share = async () => {
        const url = shareUrlFor(post, lang);
        const title = pickTitle(post, lang);
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
                return;
            } catch {
                // user cancelled the native share sheet — fall through to copy
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard blocked — nothing more we can do silently
        }
    };
    return (
        <button
            onClick={share}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0E1B2C] bg-[#F6F1E8] hover:bg-white border border-[#E2D8C2] px-3 py-1.5 rounded-full transition-colors"
            data-testid="blog-share"
        >
            {copied ? <Check size={13} className="text-[#0F6E5C]" /> : <Share2 size={13} />}
            {copied ? "Link copied" : "Share"}
        </button>
    );
}

// Dedicated "share this article" block with one button per platform.
//
// LinkedIn's official `share-offsite` intent has become unreliable for
// logged-in web sessions — tested live and confirmed it drops the user
// into a blank "start a post" composer without the URL attached at all,
// a known issue with that endpoint rather than anything on our end. So
// this copies the link to the clipboard FIRST (same pattern as the
// Instagram button below) and THEN opens LinkedIn, so the post still
// works by pasting even when LinkedIn's autofill doesn't fire.
//
// Instagram has no public web share-intent at all (deliberate platform
// restriction, same category of hard limitation as GBP's missing Q&A
// write-API) — so instead of faking a broken "share" link, this copies a
// ready-to-paste caption (with our handles) to the clipboard.
function ShareSection({ post, lang }) {
    const [copiedFor, setCopiedFor] = useState(null);
    const url = shareUrlFor(post, lang);
    const minimalCaption = shareCaptionMinimal(post, lang, url);
    const richCaption = shareCaptionRich(post, lang, url);

    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(minimalCaption)}`;
    const telegramCaption = shareCaptionRich(post, lang, url, false);
    const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(telegramCaption)}`;
    const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

    const copyThenOpen = async (text, key, href) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedFor(key);
            setTimeout(() => setCopiedFor(null), 4000);
        } catch {
            // clipboard blocked — still open the share window below
        }
        window.open(href, "_blank", "noopener,noreferrer");
    };

    const copyForInstagram = async () => {
        try {
            await navigator.clipboard.writeText(richCaption);
            setCopiedFor("instagram");
            setTimeout(() => setCopiedFor(null), 2500);
        } catch {
            // clipboard blocked — nothing more we can do silently
        }
    };

    return (
        <div className="mt-10 pt-8 border-t border-[#E2D8C2]">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#5C677D] font-semibold mb-3">Share this article</div>
            <div className="flex flex-wrap gap-2.5">
                <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-white bg-[#25D366] hover:brightness-105 px-4 py-2 rounded-full transition-all"
                >
                    Share on WhatsApp
                </a>
                <a
                    href={telegramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-white bg-[#26A5E4] hover:brightness-105 px-4 py-2 rounded-full transition-all"
                >
                    Share on Telegram
                </a>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        copyThenOpen(richCaption, "linkedin", linkedinHref);
                    }}
                    className="inline-flex items-center gap-2 text-xs font-medium text-white bg-[#0A66C2] hover:brightness-110 px-4 py-2 rounded-full transition-all"
                >
                    {copiedFor === "linkedin" ? <Check size={13} /> : <Linkedin size={13} />}
                    {copiedFor === "linkedin" ? "Description, hashtags & link copied — paste in the post" : "Share on LinkedIn"}
                </button>
                <button
                    onClick={copyForInstagram}
                    className="inline-flex items-center gap-2 text-xs font-medium text-white bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5] hover:brightness-105 px-4 py-2 rounded-full transition-all"
                >
                    {copiedFor === "instagram" ? <Check size={13} /> : null}
                    {copiedFor === "instagram" ? "Caption copied — paste on Instagram" : "Share on Instagram"}
                </button>
            </div>
            <p className="text-[11px] text-[#8A93A6] mt-2.5">
                LinkedIn's own share window doesn't reliably attach anything anymore, so "Share on LinkedIn" copies the
                full caption — title, description, hashtags and our website/LinkedIn/YouTube tags — to your clipboard
                first, then opens LinkedIn: just paste (Ctrl/Cmd+V) into the post box. Instagram doesn't allow a direct
                share link from the web at all — "Share on Instagram" copies the same kind of ready caption to paste
                into a post or story instead.
            </p>
        </div>
    );
}

// Standing CTA shown on every blog post (independent of topic) — points at
// our AssetPlus execution-partner portal where a reader can actually open
// an investment and see all their existing mutual funds in one dashboard,
// not just the one product a topic-specific CTA above it might suggest.
function InvestCTA({ className = "" }) {
    return (
        <a
            href={LINKS.assetPlus}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between gap-3 bg-[#F6F1E8] border border-[#E2D8C2] text-[#0E1B2C] px-5 py-4 rounded-2xl hover:bg-white transition-colors ${className}`}
        >
            <span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-[#024396] font-semibold">Track all your mutual funds in one place</span>
                <span className="font-display text-sm mt-0.5 block">Start Your Investment</span>
            </span>
            <ExternalLink size={16} className="shrink-0 text-[#024396]" />
        </a>
    );
}

function BlogCard({ p, lang }) {
    return (
        <a href={`/blog/${p.id}`} className="card-cream p-4 flex flex-col hover:bg-[#F6F1E8] transition-colors">
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#024396] font-semibold mb-1.5">{p.topic_label}</span>
            <h2 className="font-display text-[15px] text-[#0E1B2C] leading-snug mb-1.5 line-clamp-2">{pickTitle(p, lang)}</h2>
            <p className="text-[13px] text-[#2A364B]/70 leading-relaxed line-clamp-2 flex-1">{pickBody(p, lang)}</p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E2D8C2] text-[11px] text-[#5C677D]">
                <span className="flex items-center gap-1"><User size={10} /> {p.author_name}</span>
                <span>{formatDate(p.published_at)}</span>
            </div>
        </a>
    );
}

function BlogList({ posts, loading, lang, category, onCategoryChange, page, onPageChange, query, onQueryChange }) {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = useMemo(() => {
        if (!terms.length) return posts;
        return posts.filter((p) => {
            const hay = `${pickTitle(p, lang)} ${pickBody(p, lang)}`.toLowerCase();
            return terms.every((t) => hay.includes(t));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posts, query, lang]);

    // Only page 0 (no search) gets a featured hero card — this is deliberately
    // structured (featured + compact grid) instead of one long uniform list,
    // so the page reads as a magazine front page rather than an endless
    // scroll, and each page of results stays short.
    const showFeatured = page === 0 && !terms.length && filtered.length > 0;
    const featured = showFeatured ? filtered[0] : null;
    const rest = showFeatured ? filtered.slice(1) : filtered;

    const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
    const pageItems = useMemo(
        () => rest.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
        [rest, page]
    );

    return (
        <>
            <div className="relative max-w-md mb-6">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C677D]">
                    <Search size={16} />
                </div>
                <input
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Search articles — e.g. SIP, term insurance, market crash..."
                    className="w-full bg-[#FBF7EE] border border-[#E2D8C2] rounded-full pl-11 pr-4 py-2.5 text-sm text-[#0E1B2C] placeholder:text-[#8A93A6] focus:border-[#024396]"
                    data-testid="blog-search"
                />
            </div>

            {/* Category strip — filters the already-fetched `posts` array
                client-side (same pattern as the search box above), so
                picking a category is instant and never re-hits the
                network. See PublicBlog's `categoryPosts` useMemo. */}
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    onClick={() => onCategoryChange("all")}
                    className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                        category === "all" ? "bg-[#0E1B2C] border-[#0E1B2C] text-white" : "bg-white border-[#E2D8C2] text-[#2A364B] hover:border-[#024396]/40"
                    }`}
                >
                    All
                </button>
                {CATEGORIES.map((c) => (
                    <button
                        key={c.key}
                        onClick={() => onCategoryChange(c.key)}
                        className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                            category === c.key ? "bg-[#0E1B2C] border-[#0E1B2C] text-white" : "bg-white border-[#E2D8C2] text-[#2A364B] hover:border-[#024396]/40"
                        }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-hidden>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-[#E2D8C2] bg-[#FBF7EE] p-5 h-[180px] animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && featured && (
                <a
                    href={`/blog/${featured.id}`}
                    className="block card-cream p-6 sm:p-8 mb-5 hover:bg-[#F6F1E8] transition-colors border-l-4 border-[#C7102E]"
                >
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#C7102E] font-semibold">Latest · {featured.topic_label}</span>
                    <h2 className="font-display text-xl sm:text-2xl text-[#0E1B2C] leading-snug mt-2 mb-3 max-w-2xl">{pickTitle(featured, lang)}</h2>
                    <p className="text-sm text-[#2A364B]/75 leading-relaxed line-clamp-2 max-w-2xl">{pickBody(featured, lang)}</p>
                    <div className="flex items-center gap-2 mt-4 text-xs text-[#5C677D]">
                        <User size={11} /> {featured.author_name} <span>&middot;</span> {formatDate(featured.published_at)}
                    </div>
                </a>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {!loading && filtered.length === 0 && (
                    <p className="text-[#5C677D] text-sm col-span-full">
                        {terms.length ? `No articles match "${query}".` : "No articles in this category yet — check back soon."}
                    </p>
                )}
                {!loading && pageItems.map((p) => <BlogCard key={p.id} p={p} lang={lang} />)}
            </div>

            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                        onClick={() => onPageChange(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 rounded-full border border-[#E2D8C2] text-xs text-[#0E1B2C] disabled:opacity-30 hover:border-[#024396] transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-[#5C677D] tabular-nums">Page {page + 1} of {totalPages}</span>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 rounded-full border border-[#E2D8C2] text-xs text-[#0E1B2C] disabled:opacity-30 hover:border-[#024396] transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </>
    );
}

const SITE_URL = "https://thefinancialdoctor.in";

// Every other page type (Home, About, Services, Calculators, city pages)
// passes a real `keywords` prop to <SEO> — the blog never did, so none of
// the 150 post pages (or the list page) ever had a <meta name="keywords">
// tag at all. Builds one from the post's own topic/hashtags/title words
// plus the same brand terms used elsewhere, rather than a single generic
// string repeated on every post.
function pickKeywords(post) {
    const base = ["mutual fund advisor", "SIP", "financial planning", "Sagar Chaturvedi", "The Financial Doctor", "ARN-290298", "AMFI registered mutual fund distributor"];
    if (!post) return base.join(", ");
    const topicWords = (post.topic_label || "").split(/\s+/).filter(Boolean);
    const hashtagWords = Array.isArray(post.hashtags) ? post.hashtags.map((h) => h.replace(/^#/, "")) : [];
    // A handful of the post's own title words add real per-article
    // specificity without needing separate hand-authored keywords per post.
    const titleWords = (post.title || "")
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 6);
    return Array.from(new Set([...topicWords, ...hashtagWords, ...titleWords, ...base])).join(", ");
}

// BlogPosting structured data (JSON-LD) for the article detail view only --
// same dynamic head-tag injection pattern as SEO.jsx / FAQSection.jsx
// (plain DOM mutation on mount/update, no react-helmet dependency).
function useBlogPostingSchema(post, lang) {
    useEffect(() => {
        if (!post) return undefined;

        const title = pickTitle(post, lang);
        const body = pickBody(post, lang);
        const description = post.meta_description || (body ? `${body.slice(0, 152)}...` : "");
        const url = `${SITE_URL}/blog/${post.id}`;

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: title,
            description,
            keywords: pickKeywords(post),
            articleSection: post.topic_label || undefined,
            inLanguage: lang === "en" ? "en" : "hi-Latn",
            image: {
                "@type": "ImageObject",
                url: shareImageFor(post, lang),
                width: 1200,
                height: 630,
            },
            author: {
                "@type": "Person",
                "@id": `${SITE_URL}/about#sagar-chaturvedi`,
                name: "Sagar Chaturvedi",
                url: `${SITE_URL}/about`,
            },
            datePublished: post.published_at,
            dateModified: post.date_modified || post.published_at,
            // References the single canonical Organization entity (name,
            // "TFD" alternateName, logo, address, sameAs) defined once in
            // PersonSchema.jsx, which is mounted globally — every one of the
            // 150 posts now points at the same entity instead of each
            // repeating its own partial, slightly-different Organization
            // fragment.
            publisher: { "@id": ORG_ID },
            mainEntityOfPage: {
                "@type": "WebPage",
                "@id": url,
            },
        });
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [post, lang]);
}

// Fetches a few other posts from the same topic (excluding the current
// one) for the "Related Articles" strip — a lightweight, topic-scoped
// fetch rather than pulling the whole blog list just to filter client-side.
function useRelatedPosts(post) {
    const [related, setRelated] = useState([]);
    useEffect(() => {
        if (!post?.topic) {
            setRelated([]);
            return undefined;
        }
        let cancelled = false;
        fetch(`${API_BASE}/api/internship/public/content?content_type=blog&topic=${post.topic}&limit=6`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => {
                if (cancelled) return;
                setRelated((Array.isArray(d) ? d : []).filter((p) => p.id !== post.id).slice(0, 3));
            })
            .catch(() => !cancelled && setRelated([]));
        return () => {
            cancelled = true;
        };
    }, [post?.id, post?.topic]);
    return related;
}

function BlogDetail({ post, loading, lang }) {
    const navigate = useNavigate();
    useBlogPostingSchema(post, lang);
    const related = useRelatedPosts(post);
    if (loading) return <p className="text-[#5C677D] text-sm">Loading...</p>;
    if (!post) return <p className="text-[#5C677D] text-sm">This article isn't available.</p>;
    return (
        <div className="lg:grid lg:grid-cols-[1fr,340px] lg:gap-16 lg:items-start">
            {/* Reading column — width capped at a comfortable line length
                (~68ch) even though the outer layout is wide, so desktop
                gets a real landscape reading area instead of one narrow
                centered column, without hurting readability. */}
            <article className="max-w-[68ch]">
                <button onClick={() => navigate("/blog")} className="flex items-center gap-1.5 text-xs font-semibold text-[#5C677D] hover:text-[#0E1B2C] mb-6 lg:hidden">
                    <ArrowLeft size={14} /> All Articles
                </button>
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#024396] font-semibold">{post.topic_label}</span>
                <h1 className="font-display text-2xl sm:text-3xl text-[#0E1B2C] mt-2 mb-4 leading-snug">{pickTitle(post, lang)}</h1>
                <div className="flex items-center gap-3 text-xs text-[#5C677D] mb-6 pb-6 border-b border-[#E2D8C2]">
                    <Link to="/about" className="flex items-center gap-1 hover:text-[#0E1B2C]"><User size={12} /> {post.author_name}</Link>
                    {post.author_name === "Sagar Chaturvedi" && (
                        <a
                            href={LINKS.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#0A66C2] hover:underline"
                            aria-label="Sagar Chaturvedi on LinkedIn"
                        >
                            <Linkedin size={12} /> LinkedIn
                        </a>
                    )}
                    <span>&middot;</span>
                    <span>{formatDate(post.published_at)}</span>
                </div>
                {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6 -mt-2">
                        {post.hashtags.map((tag) => (
                            <span
                                key={tag}
                                className="text-[11px] font-medium text-[#024396] bg-[#024396]/8 px-2.5 py-1 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                {/* Mobile only — same per-post share-card image now shown on
                    desktop in the sidebar (see <aside> below), placed here
                    below the header instead since the sidebar is hidden at
                    this width. Lightweight WebP thumbnail, not the full
                    1200x630 share PNG — this loads for every reader now,
                    not just share bots, so size matters here. */}
                <img
                    src={blogThumbSrc(post, lang)}
                    alt={pickTitle(post, lang)}
                    className="lg:hidden w-full aspect-[1200/630] object-cover rounded-2xl mb-6"
                    loading="lazy"
                    decoding="async"
                    width={480}
                    height={252}
                />
                <div className="text-[#2A364B] leading-relaxed whitespace-pre-wrap text-[15px]">{pickBody(post, lang)}</div>

                <ShareSection post={post} lang={lang} />

                {/* Topic-contextual CTA — a SIP article links straight to
                    the SIP calculator, a term-insurance article to a quote
                    link, etc. Shown inline on mobile; the sidebar repeats
                    it on desktop, so it's hidden here at lg: to avoid a
                    duplicate. */}
                {post.product_link && (
                    <a
                        href={post.product_link}
                        className="lg:hidden flex items-center justify-between gap-3 mt-8 bg-[#0E1B2C] text-white px-6 py-4 rounded-2xl hover:bg-[#1a2a3f] transition-colors"
                    >
                        <span>
                            <span className="block text-[10px] uppercase tracking-[0.18em] text-[#D8B98A]">Ready to act on this?</span>
                            <span className="font-display text-base mt-0.5 block">{CTA_LABELS[post.topic] || "Explore The Financial Doctor"}</span>
                        </span>
                        <ExternalLink size={18} className="shrink-0" />
                    </a>
                )}
                <InvestCTA className="lg:hidden mt-4" />
                {/* Tablet only (sm-lg) — on phones this collapses into the
                    fixed floating button below instead, always reachable
                    without scrolling back to the top of a long article. */}
                {/* Mobile gets its Share button in the sticky toolbar under
                    the navbar instead (see PublicBlog's top-level render) —
                    this row covers tablet only, where that toolbar is hidden. */}
                <div className="hidden sm:flex lg:hidden items-center gap-3 mt-6 pt-6 border-t border-[#E2D8C2]">
                    <ShareButton post={post} lang={lang} />
                </div>
                {related.length > 0 && (
                    <div className="lg:hidden mt-10 pt-8 border-t border-[#E2D8C2]">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#5C677D] font-semibold mb-4">Related Articles</div>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {related.map((r) => (
                                <a key={r.id} href={`/blog/${r.id}`} className="card-cream p-4 hover:bg-[#F6F1E8] transition-colors">
                                    <span className="text-[9px] uppercase tracking-[0.16em] text-[#024396] font-semibold">{r.topic_label}</span>
                                    <div className="font-display text-sm text-[#0E1B2C] leading-snug mt-1.5 line-clamp-3">{pickTitle(r, lang)}</div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </article>

            {/* Sidebar — desktop only (lg:), sticky so it stays visible as
                the (potentially long) article is read. */}
            <aside className="hidden lg:block lg:sticky lg:top-24 space-y-5">
                <button onClick={() => navigate("/blog")} className="flex items-center gap-1.5 text-xs font-semibold text-[#5C677D] hover:text-[#0E1B2C]">
                    <ArrowLeft size={14} /> All Articles
                </button>
                <img
                    src={blogThumbSrc(post, lang)}
                    alt={pickTitle(post, lang)}
                    className="w-full aspect-[1200/630] object-cover rounded-2xl"
                    loading="lazy"
                    decoding="async"
                    width={480}
                    height={252}
                />
                <ShareButton post={post} lang={lang} />
                {post.product_link && (
                    <a
                        href={post.product_link}
                        className="flex items-center justify-between gap-3 bg-[#0E1B2C] text-white px-5 py-4 rounded-2xl hover:bg-[#1a2a3f] transition-colors"
                    >
                        <span>
                            <span className="block text-[10px] uppercase tracking-[0.18em] text-[#D8B98A]">Ready to act on this?</span>
                            <span className="font-display text-sm mt-0.5 block">{CTA_LABELS[post.topic] || "Explore The Financial Doctor"}</span>
                        </span>
                        <ExternalLink size={16} className="shrink-0" />
                    </a>
                )}
                <InvestCTA />
                {related.length > 0 && (
                    <div className="pt-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#5C677D] font-semibold mb-3">Related Articles</div>
                        <div className="space-y-2.5">
                            {related.map((r) => (
                                <a key={r.id} href={`/blog/${r.id}`} className="block card-cream p-3.5 hover:bg-[#F6F1E8] transition-colors">
                                    <span className="text-[9px] uppercase tracking-[0.16em] text-[#024396] font-semibold">{r.topic_label}</span>
                                    <div className="font-display text-sm text-[#0E1B2C] leading-snug mt-1 line-clamp-3">{pickTitle(r, lang)}</div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}

export default function PublicBlog() {
    const { contentId } = useParams();
    const { lang } = useLanguage();
    const [posts, setPosts] = useState([]);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("all");
    const [page, setPage] = useState(0);
    const [query, setQuery] = useState("");

    const onQueryChange = (v) => {
        setQuery(v);
        setPage(0);
    };

    // Category switch no longer re-fetches — see the effect below, which
    // now loads every post exactly once. This just resets pagination so a
    // category change always lands on that category's page 1.
    const onCategoryChange = (c) => {
        setCategory(c);
        setPage(0);
    };

    useEffect(() => {
        if (contentId) {
            setLoading(true);
            fetch(`${API_BASE}/api/internship/public/content/${contentId}`)
                .then((r) => (r.ok ? r.json() : null))
                .then(setDetail)
                .catch(() => setDetail(null))
                .finally(() => setLoading(false));
        }
    }, [contentId]);

    // Fetches the full blog list ONCE (mount, or whenever navigating back
    // from a detail page to the list) rather than re-fetching per category.
    // This used to be `&topic=${category}` in the query string and re-ran
    // on every category-button click — meaning every click re-downloaded
    // up to 200 posts' worth of full (bilingual) body text over the
    // network, which is exactly what made the blog list feel slow on
    // mobile: the FIRST click after landing on /blog always re-paid the
    // full network round-trip again. Search (below, in BlogList) already
    // filters this same `posts` array entirely client-side with zero
    // network cost — category filtering now works the same way (see
    // `categoryPosts` below), so the network is only ever hit once per
    // visit and every subsequent category click is instant.
    useEffect(() => {
        if (contentId) return undefined;
        setLoading(true);
        fetch(`${API_BASE}/api/internship/public/content?content_type=blog&limit=200`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setPosts(Array.isArray(d) ? d : []))
            .catch(() => setPosts([]))
            .finally(() => setLoading(false));
    }, [contentId]);

    // Client-side category filter over the single fetched batch — mirrors
    // BlogList's own search-term filtering (same pattern, same data).
    const categoryPosts = useMemo(() => {
        if (category === "all") return posts;
        return posts.filter((p) => p.topic === category);
    }, [posts, category]);

    return (
        <div className="relative">
            <SEO
                title={contentId ? (detail ? `The Financial Doctor | ${pickTitle(detail, lang)}` : "The Financial Doctor | Article") : "The Financial Doctor | Blog — Mutual Funds, SIP & Financial Planning"}
                description={contentId ? ((detail && detail.meta_description) || "Practical guides on SIP, lumpsum, SWP, tax-saving, and financial planning — written and reviewed for The Financial Doctor's investors.") : "Practical guides on SIP, lumpsum, SWP, tax-saving, and financial planning — written and reviewed for The Financial Doctor's investors."}
                keywords={contentId ? pickKeywords(detail) : "mutual fund blog, SIP blog, financial planning blog India, Sagar Chaturvedi blog, The Financial Doctor blog, mutual fund advisor Sehore, mutual fund advisor Madhya Pradesh, ARN-290298"}
                path={contentId ? `/blog/${contentId}` : "/blog"}
                ogImage={contentId ? shareImageFor(detail, lang) : undefined}
            />
            <Navbar />
            {/* Mobile-only toolbar, in normal document flow (not floating
                over content) right under the fixed navbar — sticky so it
                stays reachable while scrolling, without ever covering the
                article text the way a `position: fixed` overlay did. */}
            {/* top-20 (80px) matches the mobile navbar's real rendered height
                (py-4 = 32px + h-12 logo = 48px) — top-16 (64px) left the
                toolbar's top ~16px clipped under the fixed navbar. */}
            <div className="sm:hidden sticky top-20 z-30 bg-[#FBF7EE]/95 backdrop-blur border-b border-[#E2D8C2] px-4 py-2 flex items-center justify-between gap-2">
                <LanguageToggle className="scale-[0.85] origin-left" languages={["en", "hinglish"]} />
                {contentId && detail && <ShareButton post={detail} lang={lang} />}
            </div>
            {/* pt-[164px] on mobile only — position:sticky reserves layout
                space at the toolbar's NATURAL (unstuck) position, not its
                visually-stuck position, so a plain pt-24 leaves only a thin,
                estimation-dependent margin between the stuck toolbar's
                bottom edge and this content. Generous fixed clearance here
                removes that ambiguity entirely; sm: and up reverts to pt-24
                since the toolbar doesn't render there at all.
                IMPORTANT: these must stay `!`-important. The `.section`
                class (index.css) sets its own shorthand `padding` (4rem/
                5rem/7rem top depending on breakpoint) and, because index.css
                places that rule AFTER `@tailwind utilities;`, it wins the
                cascade over a plain `pt-[164px]`/`pt-24` at equal
                specificity — silently shrinking this to ~64px on mobile
                (less than the fixed navbar's own 80px height) and causing
                the exact navbar/toolbar overlap this padding exists to
                prevent. `!` forces these two declarations to win regardless
                of source order. */}
            <main className="!pt-[164px] sm:!pt-24 section">
                <div className="container-x">
                    {!contentId && (
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <div className="eyebrow">Learn</div>
                                <h1 className="h2 mt-3 text-[#0E1B2C]">
                                    Investing, <span className="font-italic-serif text-[#C7102E]">explained simply.</span>
                                </h1>
                            </div>
                            <LanguageToggle className="hidden sm:inline-flex" languages={["en", "hinglish"]} />
                        </div>
                    )}
                    {contentId && (
                        <div className="mb-6 hidden sm:flex justify-end">
                            <LanguageToggle languages={["en", "hinglish"]} />
                        </div>
                    )}
                    {contentId ? (
                        <BlogDetail post={detail} loading={loading} lang={lang} />
                    ) : (
                        <BlogList
                            posts={categoryPosts}
                            loading={loading}
                            lang={lang}
                            category={category}
                            onCategoryChange={onCategoryChange}
                            page={page}
                            onPageChange={setPage}
                            query={query}
                            onQueryChange={onQueryChange}
                        />
                    )}
                </div>
            </main>
            <Footer />
            <FloatingActions />
        </div>
    );
}
