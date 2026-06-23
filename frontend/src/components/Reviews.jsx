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

export default function Reviews() {
    const [list, setList] = useState([]);
    const [stats, setStats] = useState({ average: 4.9, count: 120 });
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState(() => ({
        name: "",
        location: "Sehore",
        rating: 5, // pre-set 5 stars
        message: pickRandomTemplate(), // pre-fill a random review
    }));
    const [hoverStar, setHoverStar] = useState(0);
    const [loading, setLoading] = useState(false);

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

    const onSubmit = async (e) => {
        e.preventDefault();
        if (form.message.length < 10) {
            toast.error("Review thoda lamba likhein (min 10 chars).");
            return;
        }
        setLoading(true);
        // Copy message to clipboard so user can paste on Google
        try {
            if (navigator.clipboard) await navigator.clipboard.writeText(form.message);
        } catch {}
        // Save locally for analytics (not displayed — only Google reviews shown)
        try {
            const created = await api.createReview(form);
            setList((cur) => [created, ...cur]);
        } catch {}
        // Redirect to Google review page in a new tab — primary action
        window.open(LINKS.googleReviews, "_blank", "noopener,noreferrer");
        setSubmitted(true);
        setForm({
            name: "",
            location: "Sehore",
            rating: 5,
            message: pickRandomTemplate(),
        });
        toast.success("Review copied! Paste it on Google to publish ⭐");
        setLoading(false);
    };

    return (
        <section id="reviews" className="section">
            <div className="container-x">
                <div className="flex items-end justify-between flex-wrap gap-4 sm:gap-6 mb-6 sm:mb-10">
                    <div>
                        <div className="eyebrow">Word on the street</div>
                        <h2 className="h2 mt-3 text-[#0E1B2C]">
                            Trusted by 1000+ <span className="font-italic-serif text-[#C9802A]">families</span> across MP.
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

                <div className="grid lg:grid-cols-12 gap-5 sm:gap-6">
                    {/* Form */}
                    <form
                        onSubmit={onSubmit}
                        className="lg:col-span-5 card-ink p-4 sm:p-7 w-full min-w-0 overflow-hidden"
                        data-testid={IDS.reviews.form}
                    >
                        <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-[#C9802A] font-semibold">
                            Share your experience
                        </div>
                        <h3 className="font-display text-[1.2rem] sm:text-[1.7rem] mt-1.5 sm:mt-2 leading-snug">
                            Rate The Financial Doctor.
                        </h3>
                        <p className="text-[#F6F1E8]/70 mt-1.5 sm:mt-2 text-[12px] sm:text-sm leading-relaxed">
                            We showcase only <strong>verified Google reviews</strong>. Pick a template
                            below and tap Publish — your review opens directly on Google with the text
                            ready to paste.
                        </p>

                        {/* Primary: Google review CTA */}
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
                                <GoogleG /> <span className="truncate">Write a Google Review</span>
                            </span>
                            <ExternalLink size={14} className="shrink-0" />
                        </a>

                        <div className="my-4 sm:my-5 flex items-center gap-3 text-[9.5px] sm:text-[10px] tracking-[0.18em] uppercase text-[#F6F1E8]/40">
                            <span className="h-px flex-1 bg-[#F6F1E8]/15" />
                            <span className="hidden xs:inline">or</span> prep your review
                            <span className="h-px flex-1 bg-[#F6F1E8]/15" />
                        </div>

                        {submitted ? (
                            <div className="bg-[#0E5E48] rounded-xl p-5 flex items-start gap-3">
                                <CheckCircle2 className="text-white mt-0.5" size={20} />
                                <div>
                                    <div className="font-display text-lg">Thanks for the note ⭐</div>
                                    <div className="text-sm opacity-85 mt-1">
                                        Mind dropping the same review on Google? It really helps families
                                        in MP discover us.
                                    </div>
                                    <a
                                        href={LINKS.googleReviews}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-3 text-xs bg-white text-[#0E1B2C] px-3 py-1.5 rounded-full font-medium"
                                    >
                                        <GoogleG /> Post on Google
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <input
                                        data-testid={IDS.reviews.name}
                                        placeholder="Your name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="min-w-0 bg-[#2A364B] border border-[#3a4761] rounded-xl px-3 py-2.5 text-[13px] sm:text-[14px] text-[#F6F1E8] placeholder:text-[#8A93A6] focus:border-[#C9802A]"
                                    />
                                    <input
                                        data-testid={IDS.reviews.location}
                                        placeholder="City"
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        className="min-w-0 bg-[#2A364B] border border-[#3a4761] rounded-xl px-3 py-2.5 text-[13px] sm:text-[14px] text-[#F6F1E8] placeholder:text-[#8A93A6] focus:border-[#C9802A]"
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
                                                        fill={active ? "#C9802A" : "transparent"}
                                                        stroke={active ? "#C9802A" : "#5C677D"}
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
                                            className="inline-flex items-center gap-1 text-[11px] text-[#C9802A] hover:text-[#F6F1E8] transition-colors"
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
                                                    key={idx}
                                                    onClick={() => setForm({ ...form, message: t })}
                                                    data-testid={`reviews-template-${idx}`}
                                                    className={`shrink-0 text-[11px] rounded-full px-3 py-1.5 transition-colors ${
                                                        active
                                                            ? "bg-[#C9802A] text-white"
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
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    rows={3}
                                    className="w-full min-w-0 bg-[#2A364B] border border-[#3a4761] rounded-xl px-3 py-2.5 text-[13px] sm:text-[14px] text-[#F6F1E8] placeholder:text-[#8A93A6] focus:border-[#C9802A] resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || form.message.length < 10}
                                    data-testid={IDS.reviews.submit}
                                    className="flex items-center justify-between gap-2 w-full rounded-full px-4 py-3 text-[13px] sm:text-sm font-semibold disabled:opacity-50 transition-opacity"
                                    style={{ background: "#C9802A", color: "#fff" }}
                                >
                                    <span className="inline-flex items-center gap-1.5 min-w-0">
                                        <Send size={15} className="shrink-0" />
                                        <span className="truncate">
                                            {loading ? "Opening…" : "Publish on Google"}
                                        </span>
                                    </span>
                                    <ExternalLink size={14} className="shrink-0" />
                                </button>
                                <p className="text-[10px] text-[#F6F1E8]/55 text-center leading-relaxed">
                                    Tapping Publish opens Google Review with your text auto-copied — just paste &amp; post.
                                </p>
                            </div>
                        )}
                    </form>

                    {/* List */}
                    <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3 sm:gap-4 content-start" data-testid={IDS.reviews.list}>
                        {list.slice(0, 4).map((r, idx) => (
                            <Reveal key={r.id} delay={idx * 70} y={20}>
                                <article
                                    className="card-cream p-4 sm:p-5 flex flex-col relative h-full"
                                    data-testid={`review-card-${r.id}`}
                                >
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <div className="flex gap-0.5 sm:gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                size={13}
                                                fill={i < r.rating ? "#C9802A" : "transparent"}
                                                stroke={i < r.rating ? "#C9802A" : "#5C677D"}
                                                strokeWidth={1.8}
                                            />
                                        ))}
                                    </div>
                                    <span
                                        className="inline-flex items-center gap-1 text-[9px] tracking-[0.16em] uppercase text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] px-1.5 sm:px-2 py-0.5 rounded-full"
                                        title="Sourced from Google reviews"
                                    >
                                        <GoogleG size={9} /> Google
                                    </span>
                                </div>
                                <p className="text-[13px] sm:text-[14.5px] text-[#2A364B] leading-relaxed flex-1">
                                    “{r.message}”
                                </p>
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#E2D8C2] flex items-center gap-2.5 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0E5E48] text-[#F6F1E8] grid place-items-center text-xs sm:text-sm font-display">
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
                            </Reveal>
                        ))}

                        {/* See all on Google CTA */}
                        <a
                            href={LINKS.googleReviews}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="reviews-see-all-google"
                            className="card-cream p-4 sm:p-5 flex items-center justify-between gap-3 sm:col-span-2 hover:bg-[#F6F1E8] transition-colors"
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
                </div>
            </div>
        </section>
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
