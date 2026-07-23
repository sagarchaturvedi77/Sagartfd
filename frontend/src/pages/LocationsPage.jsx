import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { CITY_PAGES } from "@/data/cityPages";

const SITE_URL = "https://thefinancialdoctor.in";

// Groups every city page under its state, states in the order they were
// first introduced in CITY_PAGES (roughly: home state first, then by size
// of footprint) rather than alphabetically — reads more like "here's where
// we actually operate" than a dry directory listing.
function groupByState() {
    const cities = CITY_PAGES.filter((c) => c.kind === "city");
    const states = CITY_PAGES.filter((c) => c.kind === "state");
    const order = [];
    const byState = {};
    for (const c of cities) {
        if (!byState[c.state]) {
            byState[c.state] = [];
            order.push(c.state);
        }
        byState[c.state].push(c);
    }
    return order.map((state) => ({
        state,
        statePage: states.find((s) => s.state === state && s.name === state),
        cities: byState[state],
    }));
}

function useCollectionSchema(groups) {
    React.useEffect(() => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "The Financial Doctor — Pan-India Digital Presence",
            description: "Mutual fund distributor and financial advisory services from The Financial Doctor, available across cities and states in India.",
            url: `${SITE_URL}/locations`,
            hasPart: groups.flatMap((g) => g.cities).map((c) => ({
                "@type": "WebPage",
                name: `The Financial Doctor in ${c.name}`,
                url: `${SITE_URL}/mutual-fund-distributor-in-${c.slug}`,
            })),
        });
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, [groups]);
}

export default function LocationsPage() {
    const groups = useMemo(() => groupByState(), []);
    useCollectionSchema(groups);
    const totalCities = CITY_PAGES.filter((c) => c.kind === "city").length;

    return (
        <div className="relative">
            <SEO
                title="Pan-India Digital Presence — Mutual Fund Advisory in 35+ Cities | The Financial Doctor"
                description="The Financial Doctor's mutual fund, SIP and insurance advisory now reaches investors across 35+ cities and 12 states in India — in-person in Madhya Pradesh, over video everywhere else. Find your city."
                keywords="mutual fund distributor India, financial advisor near me, SIP advisor by city, The Financial Doctor locations, pan India mutual fund advisory"
                path="/locations"
            />
            <Navbar />

            <section className="relative overflow-hidden bg-[#0E1B2C] pt-28 pb-16 md:pt-32 md:pb-20 px-6">
                <div
                    aria-hidden
                    className="fund-animate-in absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
                    style={{ background: "radial-gradient(circle at center, rgba(2,67,150,0.6) 0%, transparent 65%)" }}
                />
                <div className="container-x relative max-w-3xl mx-auto text-center">
                    <div className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2A364B] bg-[#0E1B2C]/60 text-[11px] tracking-[0.18em] uppercase text-[#8FB7E8] font-semibold">
                        <MapPin size={13} /> Pan-India Digital Presence
                    </div>
                    <h1 className="fund-animate-in fund-animate-in-delay-1 font-display text-3xl sm:text-4xl md:text-5xl text-[#F6F1E8] mt-5 leading-tight">
                        One advisor, <span className="font-italic-serif text-[#8FB7E8]">{totalCities}+ cities.</span>
                    </h1>
                    <p className="fund-animate-in fund-animate-in-delay-2 mt-4 text-[#F6F1E8]/75 text-[15px] sm:text-base max-w-xl mx-auto leading-relaxed">
                        In-person across Madhya Pradesh, over video everywhere else in India — same AMFI-registered
                        process (ARN-290298), same free portfolio review, wherever you're based. Find your city below.
                    </p>
                    <div className="fund-animate-in flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-[#F6F1E8]/70">
                        <span><b className="text-[#F6F1E8]">{totalCities}+</b> cities</span>
                        <span><b className="text-[#F6F1E8]">12</b> states</span>
                        <span><b className="text-[#F6F1E8]">1000+</b> families served</span>
                    </div>
                </div>
            </section>

            <main className="bg-[#FBF7EE] py-16 px-6">
                <div className="container-x max-w-5xl mx-auto space-y-14">
                    {groups.map((g) => (
                        <div key={g.state}>
                            <div className="flex items-baseline justify-between gap-4 mb-5 pb-3 border-b border-[#E2D8C2]">
                                <h2 className="font-display text-xl sm:text-2xl text-[#0E1B2C]">{g.state}</h2>
                                {g.statePage && (
                                    <Link
                                        to={`/mutual-fund-distributor-in-${g.statePage.slug}`}
                                        className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-[#024396] hover:underline"
                                    >
                                        {g.state}-wide page <ArrowRight size={12} />
                                    </Link>
                                )}
                            </div>
                            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:overflow-visible sm:snap-none sm:mx-0 sm:px-0 sm:pb-0">
                                {g.cities.map((c) => (
                                    <Link
                                        key={c.slug}
                                        to={`/mutual-fund-distributor-in-${c.slug}`}
                                        className="shrink-0 w-[78%] snap-center sm:w-auto sm:shrink block bg-white border border-[#E2D8C2] rounded-2xl overflow-hidden hover:border-[#024396]/40 hover:shadow-sm transition-all"
                                    >
                                        <img
                                            src={`/assets/og-thumbs/city-${c.slug}.webp`}
                                            alt={`The Financial Doctor — ${c.name}`}
                                            className="w-full aspect-[1200/630] object-cover"
                                            loading="lazy"
                                            decoding="async"
                                            width={480}
                                            height={252}
                                        />
                                        <div className="p-5">
                                            <div className="flex items-center gap-1.5 text-[#0E1B2C] font-display text-[16px]">
                                                <MapPin size={14} className="text-[#024396]" /> {c.name}
                                            </div>
                                            {c.cultureLine && (
                                                <p className="text-[13px] text-[#B8722E] italic leading-snug mt-2">{c.cultureLine}</p>
                                            )}
                                            <p className="text-[13px] text-[#2A364B]/70 leading-relaxed mt-2 line-clamp-3">{c.intro}</p>
                                            <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-[#024396]">
                                                View {c.name} page <ArrowRight size={11} />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
            <FloatingActions />
        </div>
    );
}
