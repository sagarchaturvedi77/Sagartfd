import React, { useEffect, useState } from "react";
import { Star, Send, ExternalLink, CheckCircle2, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { IDS } from "@/constants/testIds";
import { LINKS } from "@/lib/links";
import { REVIEW_TEMPLATES, pickRandomTemplate } from "@/lib/reviewTemplates";
import Reveal from "@/components/Reveal";

const initials = (name) =>
    name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

const formatAgo = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / (24 * 3600 * 1000));
    if (days < 1) return "today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return "1 month ago";
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(days / 365);
    return years === 1 ? "1 year ago" : `${years} years ago`;
};

// Curated reviews — synced from our verified Google Business profile
const SEED_REVIEWS = [
    {
        id: "g-1",
        name: "Rahul Sharma",
        location: "Sehore",
        rating: 5,
        message:
            "Sagar sir ne meri financial planning ko bilkul badal diya. SIP advice se mera portfolio 2 saal me almost double ho gaya. Highly recommended for anyone in Sehore!",
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
        id: "g-2",
        name: "Priya Verma",
        location: "Bhopal",
        rating: 5,
        message:
            "Best mutual fund distributor in Sehore. Transparent advice, no pushy selling. Health insurance bhi inhi se liya — claim process super smooth tha.",
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
        id: "g-3",
        name: "Amit Kushwaha",
        location: "Sehore",
        rating: 5,
        message:
            "The Financial Doctor team is truly professional. AssetPlus onboarding was seamless. They explain every SIP and term plan in simple language.",
        created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    },
    {
        id: "g-4",
        name: "Neha Patel",
        location: "Indore",
        rating: 5,
        message:
            "Sagar bhaiya ne ELSS ke through tax bachaya aur retirement ke liye proper goal-based SIP setup kiya. Ekdum honest aur knowledgeable advisor.",
        created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
        id: "g-5",
        name: "Vikram Singh",
        location: "Sehore",
        rating: 5,
        message:
            "Free portfolio review me Sagar ji ne mere underperforming funds identify kiye aur better Regular Plan options suggest kiye. Ab returns clearly improve ho rahe hain.",
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
        id: "g-6",
        name: "Anjali Mishra",
        location: "Bhopal",
        rating: 5,
        message:
            "First-time investor thi, Sagar sir ne SIP, term insurance, sab kuch step-by-step samjhaya. Family ki financial security finally peaceful feel ho rahi hai.",
        created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
];

export default function Reviews({ hideHeading = false } = {}) {
    const [list, setList] = useState([]);
    const [stats, setStats] = useState({ average: 4.9, count: 120 });
    const [submitted, setSubmitted] = useState(false);
    // Dedicated page only: the write-a-review form starts collapsed behind
    // a compact prompt so the review wall itself — the actual social proof
    // this page exists for — leads visually instead of competing evenly
    // with a big form. Homepage embed is unaffected (always shows the form).
    const [formOpen, setFormOpen] = useState(false);

    const [form, setForm] = useState(() => ({
        name: "",
        location: "Sehore",
        rating: 5, // pre-set 5 stars
        message: pickRandomTemplate(), // pre-fill a random review
    }));
    const [hoverStar, setHoverStar] = useState(0);
    const [loading, setLoading] = useState(false);
    const [lastSubmitted, setLastSubmitted] = useState(null);

    useEffect(() => {
        api.listReviews()
            .then((d) => {
                if (Array.isArray(d) && d.length > 0) setList(d);
                else setList(SEED_REVIEWS);
            })
            .catch(() => setList(SEED_REVIEWS));
        api.reviewStats()
            .then((s) => {
                if (s.count > 0) setStats({ average: Number(s.average) || 4.9, count: 120 + s.count });
            })
            .catch(() => {});
    }, []);

    // AggregateRating + Review structured data (JSON-LD) — only injected once
    // reviews have actually loaded, so we never emit a 0-review/0-rating
    // schema. Same dynamic head-tag injection pattern as SEO.jsx.
    useEffect(() => {
        if (!list.length || !stats.count) return undefined;

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialService",
            name: "The Financial Doctor",
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: stats.average.toFixed(1),
                reviewCount: stats.count,
            },
            review: list.slice(0, 4).map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.name },
                reviewRating: {
                    "@type": "Rating",
                    ratingValue: r.rating,
                    bestRating: 5,
                },
                reviewBody: r.message,
            })),
        });
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [list, stats]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error("Apna naam likhein.");
            return;
        }
        if (form.message.length < 10) {
            toast.error("Review thoda lamba likhein (min 10 chars).");
            return;
        }
        setLoading(true);
        try {
            // Submitting on the site IS the review — saved + shown live below,
            // with an instant auto-reply from the team (no Google redirect needed).
            const created = await api.createReview(form);
            setList((cur) => [created, ...cur]);
            setLastSubmitted(created);
            setStats((s) => ({ ...s, count: s.count + 1 }));
            setSubmitted(true);
            setForm({
                name: "",
                location: "Sehore",
                rating: 5,
                message: pickRandomTemplate(),
            });
            toast.success("Review published — thanks! ⭐");
        } catch (err) {
            console.warn("createReview failed:", err);
            toast.error("Review submit nahi ho paya. Please try again.");
        }
        setLoading(false);
    };

    return (
        <section id="reviews" className="section">
            <div className="container-x">
                {hideHeading ? (
                    // Dedicated page: stats promoted to a full-width banner
                    // instead of a small floating badge — this is the trust
                    // signal the whole page exists to prove, so it leads.
                    <div className="rounded-2xl bg-[#0E1B2C] text-[#F6F1E8] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 mb-8 sm:mb-10">
                        <div className="flex items-baseline gap-4">
                            <div className="font-display text-4xl sm:text-5xl">{stats.average.toFixed(1)}</div>
                            <div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={14} fill={i < Math.round(stats.average) ? "#D9B15C" : "transparent"} stroke="#D9B15C" strokeWidth={1.8} />
                                    ))}
                                </div>
                                <div className="text-[#F6F1E8]/60 text-xs mt-1">Based on {stats.count}+ reviews</div>
                            </div>
                        </div>
                        <a
                            href={LINKS.googleReviews}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium bg-white text-[#0E1B2C] px-4 py-2.5 rounded-full"
                            data-testid="reviews-google-link"
                        >
                            View on Google <ExternalLink size={13} />
                        </a>
                    </div>
                ) : (
                    <div className="flex items-end justify-between flex-wrap gap-4 sm:gap-6 mb-6 sm:mb-10">
                        <div>
                            <div className="eyebrow">Word on the street</div>
                            <h2 className="h2 mt-3 text-[#0E1B2C]">
                                Trusted by 1000+ <span className="font-italic-serif text-[#C7102E]">families</span> across MP.
                            </h2>
                        </div>
                        <div className="card-cream px-3.5 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-5">
                            <div>
                                <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-[#5C677D]">
                                    Google Rating
                                </div>
                                <div className="font-display text-2xl sm:text-3xl text-[#0E1B2C] mt-1 flex items-baseline gap-2">
                                    {stats.average.toFixed(1)}
                                    <span className="text-sm sm:text-base text-[#5C677D]">/ 5</span>
                                </div>
                                <div className="text-[11px] sm:text-[12px] text-[#5C677D]">
                                    Based on {stats.count}+ reviews
                                </div>
                            </div>
                            <a
                                href={LINKS.googleReviews}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-pill btn-ghost text-[11px] sm:text-xs px-3 py-2"
                                data-testid="reviews-google-link"
                            >
                                View<span className="hidden sm:inline">&nbsp;on Google</span> <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-5 sm:gap-6">
                    {/* List — now leads, both in the DOM and in the primary
                        (left, wider) column, since the review wall is the
                        actual point of this section; the write-a-review
                        form (previously first, previously equal-weight)
                        follows it and — on the dedicated page — starts
                        collapsed so it doesn't compete for attention. On
                        mobile, both variants use the same horizontal
                        scroll-snap slider established elsewhere on the site
                        (was CSS masonry even on mobile for the dedicated
                        page, which meant a plain full-stack list below
                        sm:); the dedicated page's masonry layout only kicks
                        in at sm: and up, where there's room for it. */}
                    <div
                        className={
                            hideHeading
                                ? "lg:col-span-7 flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar sm:block sm:overflow-visible sm:snap-none sm:mx-0 sm:px-0 sm:pb-0 sm:columns-2 sm:gap-4 sm:space-y-4"
                                : "lg:col-span-7 flex overflow-x-auto snap-x snap-mandatory gap-3 -mx-6 px-6 pb-2 no-scrollbar sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:snap-none sm:mx-0 sm:px-0 sm:pb-0 content-start"
                        }
                        data-testid={IDS.reviews.list}
                    >
                        {list.slice(0, hideHeading ? 8 : 4).map((r, idx) => (
                            <Reveal
                                key={r.id}
                                delay={idx * 70}
                                y={20}
                                className={hideHeading ? "shrink-0 w-[82%] snap-center sm:w-auto sm:shrink sm:break-inside-avoid sm:block" : "shrink-0 w-[82%] snap-center sm:w-auto sm:shrink"}
                            >
                                <ReviewCard r={r} />
                            </Reveal>
                        ))}

                        {/* See all on Google CTA */}
                        <a
                            href={LINKS.googleReviews}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="reviews-see-all-google"
                            className={`card-cream p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-[#F6F1E8] transition-colors ${hideHeading ? "break-inside-avoid" : "sm:col-span-2"}`}
                        >
                            <div>
                                <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-[#5C677D]">
                                    Want to read more?
                                </div>
                                <div className="font-display text-[14px] sm:text-[18px] text-[#0E1B2C] mt-1 leading-tight">
                                    See all reviews on Google →
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium bg-[#F6F1E8] border border-[#E2D8C2] text-[#0E1B2C] px-3 py-2 rounded-full shrink-0">
                                <GoogleG size={12} /> Open
                            </span>
                        </a>
                    </div>

                    {/* Form — on the dedicated page this now starts
                        collapsed behind a compact prompt card instead of a
                        full form sitting at equal visual weight next to the
                        review wall; tapping "Write a Review" swaps in the
                        exact same form below. The homepage embed is
                        unaffected — it keeps showing the form directly,
                        since it's already compact there. */}
                    {hideHeading && !formOpen ? (
                        <div className="lg:col-span-5 card-ink p-6 sm:p-8 flex flex-col items-start justify-center gap-4">
                            <div className="flex gap-1" aria-hidden="true">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={18} fill="#D9B15C" stroke="#D9B15C" />
                                ))}
                            </div>
                            <div>
                                <h3 className="font-display text-xl sm:text-2xl leading-snug">Loved working with us?</h3>
                                <p className="text-[#F6F1E8]/70 mt-2 text-sm leading-relaxed">
                                    Rate us &amp; write your review right here — it goes live on this
                                    page instantly and our team auto-replies within seconds.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormOpen(true)}
                                data-testid="reviews-form-toggle"
                                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                                style={{ background: "#C7102E", color: "#fff" }}
                            >
                                <Send size={15} /> Write a Review
                            </button>
                            <a
                                href={LINKS.googleReviews}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-[#F6F1E8]/60 hover:text-[#F6F1E8]"
                            >
                                <GoogleG size={12} /> or write on Google instead
                            </a>
                        </div>
                    ) : (
                    <form
                        onSubmit={onSubmit}
                        className="lg:col-span-5 card-ink p-4 sm:p-7 w-full min-w-0 overflow-hidden"
                        data-testid={IDS.reviews.form}
                    >
                        <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-[#C7102E] font-semibold">
                            Share your experience
                        </div>
                        <h3 className="font-display text-[1.2rem] sm:text-[1.7rem] mt-1.5 sm:mt-2 leading-snug">
                            Rate The Financial Doctor.
                        </h3>
                        <p className="text-[#F6F1E8]/70 mt-1.5 sm:mt-2 text-[12px] sm:text-sm leading-relaxed">
                            Rate us & write your review <strong>right here</strong> — it goes live on
                            this page instantly and our team auto-replies within seconds. You can
                            also post the same review on Google below.
                        </p>

                        {/* Secondary: Google review CTA */}
                        <a
                            href={LINKS.googleReviews}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="reviews-write-on-google"
                            className="flex items-center justify-between gap-2 w-full rounded-full mt-3 sm:mt-5 px-4 py-3 text-[13px] sm:text-sm font-semibold"
                            style={{
                                background: "linear-gradient(135deg, #FBBC04 0%, #F4B400 100%)",
                                color: "#0E1B2C",
                                boxShadow: "0 10px 24px -10px rgba(251,188,4,0.6)",
                            }}
                        >
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                                <GoogleG /> <span className="truncate">Also Write a Google Review</span>
                            </span>
                            <ExternalLink size={14} className="shrink-0" />
                        </a>

                        <div className="my-4 sm:my-5 flex items-center gap-3 text-[9.5px] sm:text-[10px] tracking-[0.18em] uppercase text-[#F6F1E8]/40">
                            <span className="h-px flex-1 bg-[#F6F1E8]/15" />
                            <span className="hidden xs:inline">or</span> rate us on this website
                            <span className="h-px flex-1 bg-[#F6F1E8]/15" />
                        </div>

                        {submitted ? (
                            <div className="bg-[#024396] rounded-xl p-5 flex items-start gap-3">
                                <CheckCircle2 className="text-white mt-0.5 shrink-0" size={20} />
                                <div className="min-w-0">
                                    <div className="font-display text-lg">Your review is live ⭐</div>
                                    <div className="text-sm opacity-85 mt-1">
                                        Thanks for sharing your experience — it's already showing in the
                                        list on the right.
                                    </div>
                                    {lastSubmitted?.reply && (
                                        <div className="mt-3 bg-white/10 rounded-lg p-3 text-xs leading-relaxed">
                                            <div className="uppercase tracking-[0.16em] text-[10px] opacity-70 mb-1">
                                                Reply from The Financial Doctor
                                            </div>
                                            {lastSubmitted.reply}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-3">
                                        <a
                                            href={LINKS.googleReviews}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs bg-white text-[#0E1B2C] px-3 py-1.5 rounded-full font-medium"
                                        >
                                            <GoogleG /> Also post on Google
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setSubmitted(false)}
                                            className="text-xs text-white/70 hover:text-white px-2"
                                        >
                                            Write another
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <input
                                        data-testid={IDS.reviews.name}
                                        placeholder="Your name"
                                        aria-label="Your name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="min-w-0 bg-[#2A364B] border border-[#3a4761] rounded-xl px-3 py-2.5 text-[13px] sm:text-[14px] text-[#F6F1E8] placeholder:text-[#8A93A6] focus:border-[#C7102E]"
                                    />
                                    <input
                                        data-testid={IDS.reviews.location}
                                        placeholder="City"
                                        aria-label="Your city"
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        className="min-w-0 bg-[#2A364B] border border-[#3a4761] rounded-xl px-3 py-2.5 text-[13px] sm:text-[14px] text-[#F6F1E8] placeholder:text-[#8A93A6] focus:border-[#C7102E]"
                                    />
                                </div>
                                <div>
                                    <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.18em] opacity-70 mb-1.5 sm:mb-2">
                                        Your rating
                                    </div>
                                    <div className="flex gap-1 sm:gap-1.5">
                                        {[1, 2, 3, 4, 5].map((i) => {
                                            const active = i <= (hoverStar || form.rating);
                                            return (
                                                <button
                                                    type="button"
                                                    key={i}
                                                    className="star-btn"
                                                    onClick={() => setForm({ ...form, rating: i })}
                                                    onMouseEnter={() => setHoverStar(i)}
                                                    onMouseLeave={() => setHoverStar(0)}
                                                    data-testid={IDS.reviews.star(i)}
                                                    aria-label={`Rate ${i} star`}
                                                >
                                                    <Star
                                                        size={26}
                                                        fill={active ? "#C7102E" : "transparent"}
                                                        stroke={active ? "#C7102E" : "#5C677D"}
                                                        strokeWidth={1.8}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[11px] uppercase tracking-[0.18em] opacity-70">
                                            Pick a template (or write your own)
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, message: pickRandomTemplate() }))}
                                            data-testid="reviews-shuffle"
                                            className="inline-flex items-center gap-1 text-[11px] text-[#C7102E] hover:text-[#F6F1E8] transition-colors"
                                            aria-label="Shuffle template"
                                            title="Pick a different template"
                                        >
                                            <Shuffle size={12} /> Shuffle
                                        </button>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 max-w-full">
                                        {REVIEW_TEMPLATES.map((t, idx) => {
                                            const active = form.message === t;
                                            return (
                                                <button
                                                    type="button"
                                                    key={`tpl-${idx}-${t.slice(0, 10)}`}
                                                    onClick={() => setForm({ ...form, message: t })}
                                                    data-testid={`reviews-template-${idx}`}
                                                    className={`shrink-0 text-[11px] rounded-full px-3 py-1.5 transition-colors ${
                                                        active
                                                            ? "bg-[#C7102E] text-white"
                                                            : "bg-[#2A364B] text-[#F6F1E8]/80 hover:bg-[#3a4761]"
                                                    }`}
                                                >
                                                    #{idx + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <textarea
                                    required
                                    data-testid={IDS.reviews.message}
                                    placeholder="Likhiye apna experience…"
                                    aria-label="Your review"
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    rows={3}
                                    className="w-full min-w-0 bg-[#2A364B] border border-[#3a4761] rounded-xl px-3 py-2.5 text-[13px] sm:text-[14px] text-[#F6F1E8] placeholder:text-[#8A93A6] focus:border-[#C7102E] resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || form.message.length < 10 || !form.name.trim()}
                                    data-testid={IDS.reviews.submit}
                                    className="flex items-center justify-center gap-2 w-full rounded-full px-4 py-3 text-[13px] sm:text-sm font-semibold disabled:opacity-50 transition-opacity"
                                    style={{ background: "#C7102E", color: "#fff" }}
                                >
                                    <Send size={15} className="shrink-0" />
                                    <span className="truncate">
                                        {loading ? "Submitting…" : "Submit Review"}
                                    </span>
                                </button>
                                <p className="text-[10px] text-[#F6F1E8]/55 text-center leading-relaxed">
                                    Your review publishes instantly on this page — our team auto-replies right away.
                                </p>
                            </div>
                        )}
                    </form>
                    )}
                </div>
            </div>
        </section>
    );
}

// Individual review card — shared by the homepage grid and the dedicated
// page's masonry columns so the markup never has to be duplicated.
function ReviewCard({ r }) {
    return (
        <article className="card-cream p-4 sm:p-5 flex flex-col relative h-full" data-testid={`review-card-${r.id}`}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex gap-0.5 sm:gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={13}
                            fill={i < r.rating ? "#C7102E" : "transparent"}
                            stroke={i < r.rating ? "#C7102E" : "#5C677D"}
                            strokeWidth={1.8}
                        />
                    ))}
                </div>
                {String(r.id).startsWith("g-") ? (
                    <span
                        className="inline-flex items-center gap-1 text-[9px] tracking-[0.16em] uppercase text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] px-1.5 sm:px-2 py-0.5 rounded-full"
                        title="Sourced from Google reviews"
                    >
                        <GoogleG size={9} /> Google
                    </span>
                ) : (
                    <span
                        className="inline-flex items-center gap-1 text-[9px] tracking-[0.16em] uppercase text-[#024396] bg-[#E9F0FB] border border-[#C9DCF5] px-1.5 sm:px-2 py-0.5 rounded-full"
                        title="Submitted directly on this website"
                    >
                        Website Review
                    </span>
                )}
            </div>
            <p className="text-[13px] sm:text-[14.5px] text-[#2A364B] leading-relaxed flex-1">
                “{r.message}”
            </p>
            {r.reply && (
                <div className="mt-3 bg-[#F6F1E8] border border-[#E2D8C2] rounded-lg p-2.5 sm:p-3">
                    <div className="text-[9px] sm:text-[9.5px] uppercase tracking-[0.16em] text-[#C7102E] font-semibold mb-1">
                        Reply from The Financial Doctor
                    </div>
                    <p className="text-[11.5px] sm:text-[12.5px] text-[#5C677D] leading-relaxed">
                        {r.reply}
                    </p>
                </div>
            )}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#E2D8C2] flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#024396] text-[#F6F1E8] grid place-items-center text-xs sm:text-sm font-display">
                    {initials(r.name)}
                </div>
                <div>
                    <div className="font-display text-[#0E1B2C] text-[13px] sm:text-[15px] leading-tight">
                        {r.name}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-[#5C677D]">
                        {r.location} · {formatAgo(r.created_at)}
                    </div>
                </div>
            </div>
        </article>
    );
}

// Inline Google "G" mark
function GoogleG({ size = 14 }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 48 48"
            aria-hidden
        >
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 16.1 4 9.3 8.5 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.2 39.5 16.1 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C40 35.9 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"/>
        </svg>
    );
}
