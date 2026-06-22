import React, { useEffect, useState } from "react";
import { Star, Send, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { IDS } from "@/constants/testIds";

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

// Curated seed reviews if no DB reviews exist yet
const SEED_REVIEWS = [
    {
        id: "seed-1",
        name: "Rahul Sharma",
        location: "Sehore",
        rating: 5,
        message:
            "Sagar sir ne meri financial planning ko bilkul badal diya. SIP advice se mera portfolio 2 saal me almost double ho gaya. Highly recommended for anyone in Sehore!",
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
        id: "seed-2",
        name: "Priya Verma",
        location: "Bhopal",
        rating: 5,
        message:
            "Best mutual fund distributor in Sehore. Transparent advice, no pushy selling. Health insurance bhi inhi se liya — claim process super smooth tha.",
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
        id: "seed-3",
        name: "Amit Kushwaha",
        location: "Sehore",
        rating: 5,
        message:
            "The Financial Doctor team is truly professional. AssetPlus onboarding was seamless. They explain every SIP and term plan in simple language.",
        created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    },
];

export default function Reviews() {
    const [list, setList] = useState([]);
    const [stats, setStats] = useState({ average: 4.9, count: 120 });
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState({ name: "", location: "Sehore", rating: 5, message: "" });
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
        try {
            const created = await api.createReview(form);
            setList((cur) => [created, ...cur]);
            setSubmitted(true);
            setForm({ name: "", location: "Sehore", rating: 5, message: "" });
            toast.success("Dhanyavaad! Your review is live on the site ⭐");
        } catch (e) {
            toast.error("Could not submit. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="reviews" className="section">
            <div className="container-x">
                <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
                    <div>
                        <div className="eyebrow">Word on the street</div>
                        <h2 className="h2 mt-3 text-[#0E1B2C]">
                            Trusted by 1000+ <span className="font-italic-serif text-[#C9802A]">families</span> across MP.
                        </h2>
                    </div>
                    <div className="card-cream px-5 py-4 flex items-center gap-5">
                        <div>
                            <div className="text-[11px] tracking-[0.18em] uppercase text-[#5C677D]">
                                Google Rating
                            </div>
                            <div className="font-display text-3xl text-[#0E1B2C] mt-1 flex items-baseline gap-2">
                                {stats.average.toFixed(1)}
                                <span className="text-base text-[#5C677D]">/ 5</span>
                            </div>
                            <div className="text-[12px] text-[#5C677D]">
                                Based on {stats.count}+ reviews
                            </div>
                        </div>
                        <a
                            href="https://share.google/8w0NsnnohM2bqqk0y"
                            target="_blank"
                            rel="noreferrer"
                            className="btn-pill btn-ghost text-xs"
                            data-testid="reviews-google-link"
                        >
                            View on Google <ExternalLink size={12} />
                        </a>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Form */}
                    <form
                        onSubmit={onSubmit}
                        className="lg:col-span-5 card-ink p-7"
                        data-testid={IDS.reviews.form}
                    >
                        <div className="text-[11px] tracking-[0.2em] uppercase text-[#C9802A] font-semibold">
                            Share your experience
                        </div>
                        <h3 className="font-display text-[1.7rem] mt-2 leading-snug">
                            Rate The Financial Doctor.
                        </h3>
                        <p className="text-[#F6F1E8]/70 mt-2 text-sm">
                            Your review appears live on this page and helps other families in MP.
                        </p>

                        {submitted ? (
                            <div className="mt-6 bg-[#0E5E48] rounded-xl p-5 flex items-start gap-3">
                                <CheckCircle2 className="text-white mt-0.5" size={20} />
                                <div>
                                    <div className="font-display text-lg">Review published ⭐</div>
                                    <div className="text-sm opacity-85 mt-1">
                                        Thanks for taking the time. Scroll down to see it live.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSubmitted(false)}
                                        className="mt-3 text-xs underline opacity-80"
                                    >
                                        Write another
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        required
                                        data-testid={IDS.reviews.name}
                                        placeholder="Your name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="bg-[#2A364B] border border-[#3a4761] rounded-xl px-4 py-3 text-[#F6F1E8] placeholder:text-[#8A93A6] focus:border-[#C9802A]"
                                    />
                                    <input
                                        data-testid={IDS.reviews.location}
                                        placeholder="City (e.g. Sehore)"
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        className="bg-[#2A364B] border border-[#3a4761] rounded-xl px-4 py-3 text-[#F6F1E8] placeholder:text-[#8A93A6] focus:border-[#C9802A]"
                                    />
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-[0.18em] opacity-70 mb-2">
                                        Your rating
                                    </div>
                                    <div className="flex gap-1.5">
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
                                                        size={30}
                                                        fill={active ? "#C9802A" : "transparent"}
                                                        stroke={active ? "#C9802A" : "#5C677D"}
                                                        strokeWidth={1.8}
                                                    />
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
                                    rows={4}
                                    className="w-full bg-[#2A364B] border border-[#3a4761] rounded-xl px-4 py-3 text-[#F6F1E8] placeholder:text-[#8A93A6] focus:border-[#C9802A]"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !form.name || form.message.length < 10}
                                    data-testid={IDS.reviews.submit}
                                    className="btn-pill w-full justify-center disabled:opacity-50"
                                    style={{ background: "#C9802A", color: "#fff" }}
                                >
                                    <Send size={16} /> {loading ? "Publishing…" : "Publish review"}
                                </button>
                            </div>
                        )}
                    </form>

                    {/* List */}
                    <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 content-start" data-testid={IDS.reviews.list}>
                        {list.slice(0, 6).map((r) => (
                            <article
                                key={r.id}
                                className="card-cream p-5 flex flex-col"
                                data-testid={`review-card-${r.id}`}
                            >
                                <div className="flex gap-1 mb-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            fill={i < r.rating ? "#C9802A" : "transparent"}
                                            stroke={i < r.rating ? "#C9802A" : "#5C677D"}
                                            strokeWidth={1.8}
                                        />
                                    ))}
                                </div>
                                <p className="text-[14.5px] text-[#2A364B] leading-relaxed flex-1">
                                    “{r.message}”
                                </p>
                                <div className="mt-4 pt-4 border-t border-[#E2D8C2] flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0E5E48] text-[#F6F1E8] grid place-items-center text-sm font-display">
                                        {initials(r.name)}
                                    </div>
                                    <div>
                                        <div className="font-display text-[#0E1B2C] text-[15px] leading-tight">
                                            {r.name}
                                        </div>
                                        <div className="text-[11px] text-[#5C677D]">
                                            {r.location} · {formatAgo(r.created_at)}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
