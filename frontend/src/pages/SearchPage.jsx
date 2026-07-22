import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, FileText, HelpCircle } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { FAQ_INDEX } from "@/lib/faqIndex";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function matchScore(text, terms) {
    const lower = (text || "").toLowerCase();
    return terms.reduce((score, t) => (lower.includes(t) ? score + 1 : score), 0);
}

export default function SearchPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const q = params.get("q") || "";
    const [input, setInput] = useState(q);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => setInput(q), [q]);

    useEffect(() => {
        if (!q.trim()) {
            setPosts([]);
            return;
        }
        setLoading(true);
        fetch(`${API_BASE}/api/internship/public/content?content_type=blog&limit=100`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setPosts(Array.isArray(d) ? d : []))
            .catch(() => setPosts([]))
            .finally(() => setLoading(false));
    }, [q]);

    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);

    const faqResults = terms.length
        ? FAQ_INDEX
              .map((item) => ({ item, score: matchScore(item.q, terms) * 2 + matchScore(item.a, terms) }))
              .filter((r) => r.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 12)
              .map((r) => r.item)
        : [];

    const blogResults = terms.length
        ? posts
              .map((p) => ({ post: p, score: matchScore(p.title, terms) * 2 + matchScore(p.body, terms) }))
              .filter((r) => r.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 12)
              .map((r) => r.post)
        : [];

    const submit = (e) => {
        e.preventDefault();
        if (input.trim()) navigate(`/search?q=${encodeURIComponent(input.trim())}`);
    };

    return (
        <div className="relative" data-testid="search-page-root">
            <SEO
                title={q ? `"${q}" — Search Results | The Financial Doctor` : "Search | The Financial Doctor"}
                description="Search The Financial Doctor's FAQs and blog for answers on mutual funds, SIP, insurance, and financial planning."
                path="/search"
            />
            <Navbar />
            <main className="pt-28 pb-16 px-6 min-h-[60vh]">
                <div className="container-x max-w-3xl mx-auto">
                    <div className="eyebrow">Search</div>
                    <h1 className="h2 mt-3 text-[#0E1B2C]">
                        Search your <span className="font-italic-serif text-[#024396]">question.</span>
                    </h1>
                    <form onSubmit={submit} className="relative mt-6">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C677D]">
                            <Search size={18} />
                        </div>
                        <input
                            autoFocus
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g. SIP kya hota hai, term insurance, ELSS tax saving..."
                            className="w-full bg-[#FBF7EE] border border-[#E2D8C2] rounded-full pl-12 pr-28 py-3.5 text-[#0E1B2C] placeholder:text-[#8A93A6] focus:border-[#024396] text-sm"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#024396] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#012E6B] transition-colors"
                        >
                            Search
                        </button>
                    </form>

                    {!q.trim() && (
                        <p className="text-sm text-[#5C677D] mt-6">
                            Type a question above — we'll search across every page's FAQ and our blog for the closest match.
                        </p>
                    )}

                    {q.trim() && (
                        <div className="mt-10 space-y-10">
                            {loading && <p className="text-sm text-[#5C677D]">Searching...</p>}

                            {!loading && faqResults.length === 0 && blogResults.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-[#2A364B]">No exact match for "{q}" yet.</p>
                                    <p className="text-sm text-[#5C677D] mt-2">
                                        Try a shorter phrase, or{" "}
                                        <Link to="/contact" className="text-[#024396] underline">ask us directly</Link> — we'll answer personally.
                                    </p>
                                </div>
                            )}

                            {faqResults.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#024396] font-semibold mb-4">
                                        <HelpCircle size={14} /> From our FAQs
                                    </div>
                                    <div className="space-y-3">
                                        {faqResults.map((r, i) => (
                                            <Link
                                                key={i}
                                                to={r.path}
                                                className="block card-cream p-4 hover:bg-[#F2EAD8] transition-colors"
                                            >
                                                <div className="font-display text-[#0E1B2C] text-sm">{r.q}</div>
                                                <p className="text-sm text-[#2A364B]/75 mt-1.5 leading-relaxed line-clamp-2">{r.a}</p>
                                                <div className="flex items-center gap-1 text-xs text-[#5C677D] mt-2">
                                                    {r.source} <ArrowRight size={12} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {blogResults.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#C7102E] font-semibold mb-4">
                                        <FileText size={14} /> From our blog
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {blogResults.map((p) => (
                                            <Link key={p.id} to={`/blog/${p.id}`} className="card-cream p-4 hover:bg-[#F2EAD8] transition-colors">
                                                <div className="font-display text-[#0E1B2C] text-sm leading-snug">{p.title}</div>
                                                <p className="text-xs text-[#2A364B]/70 mt-2 leading-relaxed line-clamp-3">{p.body}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <FloatingActions />
        </div>
    );
}
