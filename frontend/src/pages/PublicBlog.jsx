import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, ExternalLink } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function BlogList({ posts, loading }) {
    return (
        <div className="grid sm:grid-cols-2 gap-5">
            {loading && <p className="text-[#5C677D] text-sm col-span-2">Loading articles...</p>}
            {!loading && posts.length === 0 && (
                <p className="text-[#5C677D] text-sm col-span-2">No articles published yet — check back soon.</p>
            )}
            {posts.map((p) => (
                <a key={p.id} href={`/blog/${p.id}`} className="card-cream p-5 flex flex-col hover:bg-[#F6F1E8] transition-colors">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#024396] font-semibold mb-2">{p.topic_label}</span>
                    <h2 className="font-display text-lg text-[#0E1B2C] leading-snug mb-2">{p.title}</h2>
                    <p className="text-sm text-[#2A364B]/70 leading-relaxed line-clamp-3 flex-1">{p.body}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E2D8C2] text-xs text-[#5C677D]">
                        <span className="flex items-center gap-1"><User size={11} /> {p.author_name}</span>
                        <span>{formatDate(p.published_at)}</span>
                    </div>
                </a>
            ))}
        </div>
    );
}

function BlogDetail({ post, loading }) {
    const navigate = useNavigate();
    if (loading) return <p className="text-[#5C677D] text-sm">Loading...</p>;
    if (!post) return <p className="text-[#5C677D] text-sm">This article isn't available.</p>;
    return (
        <article className="max-w-2xl mx-auto">
            <button onClick={() => navigate("/blog")} className="flex items-center gap-1.5 text-xs font-semibold text-[#5C677D] hover:text-[#0E1B2C] mb-6">
                <ArrowLeft size={14} /> All Articles
            </button>
            <span className="text-[11px] uppercase tracking-[0.16em] text-[#024396] font-semibold">{post.topic_label}</span>
            <h1 className="font-display text-2xl sm:text-3xl text-[#0E1B2C] mt-2 mb-4 leading-snug">{post.title}</h1>
            <div className="flex items-center gap-3 text-xs text-[#5C677D] mb-6 pb-6 border-b border-[#E2D8C2]">
                <span className="flex items-center gap-1"><User size={12} /> {post.author_name}</span>
                <span>&middot;</span>
                <span>{formatDate(post.published_at)}</span>
            </div>
            <div className="text-[#2A364B] leading-relaxed whitespace-pre-wrap text-[15px]">{post.body}</div>
            {post.product_link && (
                <a
                    href={post.product_link}
                    className="inline-flex items-center gap-1.5 mt-8 bg-[#024396] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#0356c4] transition-colors"
                >
                    Learn More <ExternalLink size={14} />
                </a>
            )}
        </article>
    );
}

export default function PublicBlog() {
    const { contentId } = useParams();
    const [posts, setPosts] = useState([]);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        if (contentId) {
            fetch(`${API_BASE}/api/internship/public/content/${contentId}`)
                .then((r) => (r.ok ? r.json() : null))
                .then(setDetail)
                .catch(() => setDetail(null))
                .finally(() => setLoading(false));
        } else {
            fetch(`${API_BASE}/api/internship/public/content?content_type=blog&limit=30`)
                .then((r) => (r.ok ? r.json() : []))
                .then((d) => setPosts(Array.isArray(d) ? d : []))
                .catch(() => setPosts([]))
                .finally(() => setLoading(false));
        }
    }, [contentId]);

    return (
        <div className="relative">
            <SEO
                title={contentId ? (detail ? `${detail.title} | The Financial Doctor` : "Article | The Financial Doctor") : "Blog — Mutual Funds, SIP & Financial Planning | The Financial Doctor"}
                description="Practical guides on SIP, lumpsum, SWP, tax-saving, and financial planning — written and reviewed for The Financial Doctor's investors."
                path={contentId ? `/blog/${contentId}` : "/blog"}
            />
            <Navbar />
            <main className="pt-24 section">
                <div className="container-x">
                    {!contentId && (
                        <div className="mb-8">
                            <div className="eyebrow">Learn</div>
                            <h1 className="h2 mt-3 text-[#0E1B2C]">
                                Investing, <span className="font-italic-serif text-[#C7102E]">explained simply.</span>
                            </h1>
                        </div>
                    )}
                    {contentId ? <BlogDetail post={detail} loading={loading} /> : <BlogList posts={posts} loading={loading} />}
                </div>
            </main>
            <Footer />
            <FloatingActions />
        </div>
    );
}
