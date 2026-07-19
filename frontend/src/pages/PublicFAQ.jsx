import React, { useEffect, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function FAQItem({ item }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="card-cream border border-[#E2D8C2] rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left"
            >
                <span className="font-display text-[#0E1B2C] text-sm sm:text-base leading-snug">{item.title}</span>
                <ChevronDown size={16} className={`text-[#5C677D] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <p className="text-sm text-[#2A364B]/80 leading-relaxed whitespace-pre-wrap">{item.body}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E2D8C2]/70 text-xs text-[#5C677D]">
                        <span>Answered by {item.author_name}</span>
                        {item.product_link && (
                            <a href={item.product_link} className="flex items-center gap-1 text-[#024396] font-medium hover:underline">
                                Learn more <ExternalLink size={11} />
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PublicFAQ() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/internship/public/content?content_type=faq&limit=100`)
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => setItems(Array.isArray(d) ? d : []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    const grouped = items.reduce((acc, item) => {
        (acc[item.topic_label] = acc[item.topic_label] || []).push(item);
        return acc;
    }, {});

    return (
        <div className="relative">
            <SEO
                title="Mutual Fund & Financial Planning FAQs | The Financial Doctor"
                description="Answers on SIP, lumpsum, SWP, tax-saving, insurance, and financial planning — from The Financial Doctor's team."
                path="/faq"
            />
            <Navbar />
            <main className="pt-24 section">
                <div className="container-x max-w-3xl mx-auto">
                    <div className="mb-8 text-center">
                        <div className="eyebrow">Questions, answered</div>
                        <h1 className="h2 mt-3 text-[#0E1B2C]">
                            Frequently Asked <span className="font-italic-serif text-[#C7102E]">Questions.</span>
                        </h1>
                    </div>

                    {loading && <p className="text-[#5C677D] text-sm text-center">Loading...</p>}
                    {!loading && items.length === 0 && <p className="text-[#5C677D] text-sm text-center">No FAQs published yet — check back soon.</p>}

                    <div className="space-y-8">
                        {Object.entries(grouped).map(([topicLabel, group]) => (
                            <div key={topicLabel}>
                                <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#024396] font-semibold mb-3">{topicLabel}</h2>
                                <div className="space-y-2.5">
                                    {group.map((item) => <FAQItem key={item.id} item={item} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
            <FloatingActions />
        </div>
    );
}
