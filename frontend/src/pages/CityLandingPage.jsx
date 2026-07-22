import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { MapPin, Video, ShieldCheck, TrendingUp } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import ProblemSolution from "@/components/ProblemSolution";
import { CITY_PAGES, findCityPage } from "@/data/cityPages";
import { LINKS } from "@/lib/links";

const SITE_URL = "https://thefinancialdoctor.in";
const CITY_PATH_PREFIX = "mutual-fund-distributor-in-";

// LocalBusiness structured data — areaServed lists every location we
// actively target (not just the current page's city), which is what
// signals to Google that TFD serves the whole region, not one town.
function useLocalBusinessSchema(city) {
    React.useEffect(() => {
        if (!city) return undefined;
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialService",
            name: `The Financial Doctor — Mutual Fund Distributor serving ${city.name}`,
            description: `AMFI-registered Mutual Fund Distributor (ARN-290298) led by Sagar Chaturvedi, ${city.slug === "sehore" ? "based in" : "serving"} ${city.name}, ${city.state}.`,
            url: `${SITE_URL}/mutual-fund-distributor-in-${city.slug}`,
            image: `${SITE_URL}/assets/founder/sagar-photo.webp`,
            telephone: "+917773805794",
            address: {
                "@type": "PostalAddress",
                streetAddress: "1st Floor, above SK Finance, Sekdakhedi Road, New Bus Stand",
                addressLocality: "Sehore",
                addressRegion: "Madhya Pradesh",
                postalCode: "466001",
                addressCountry: "IN",
            },
            areaServed: CITY_PAGES.map((c) => ({ "@type": "City", name: `${c.name}, ${c.state}` })),
            founder: { "@type": "Person", name: "Sagar Chaturvedi" },
        });
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, [city]);
}

export default function CityLandingPage() {
    const { pageSlug = "" } = useParams();
    const citySlug = pageSlug.startsWith(CITY_PATH_PREFIX) ? pageSlug.slice(CITY_PATH_PREFIX.length) : null;
    const city = citySlug ? findCityPage(citySlug) : undefined;
    useLocalBusinessSchema(city);

    if (!city) return <Navigate to="/" replace />;

    const isRemoteOnly = city.meetingMode.toLowerCase().startsWith("100% video") || city.meetingMode.toLowerCase().startsWith("video consultation");
    // Same-state pages first (genuinely relevant "also serving" neighbours),
    // then everything else — so this list stays locally meaningful even as
    // the number of city/state pages grows, instead of always showing the
    // same first few entries regardless of which page it's on.
    const otherCities = CITY_PAGES.filter((c) => c.slug !== city.slug)
        .sort((a, b) => (a.state === city.state ? -1 : 0) - (b.state === city.state ? -1 : 0))
        .slice(0, 8);

    return (
        <div className="relative">
            <SEO
                title={`Best Mutual Fund Distributor in ${city.name} | The Financial Doctor`}
                description={`Looking for a trusted mutual fund & wealth planning advisor in ${city.name}, ${city.state}? Sagar Chaturvedi (AMFI Registered, ARN-290298) offers zero-bias portfolio reviews and goal-based planning. Book a free call.`}
                keywords={`mutual fund distributor ${city.name}, best mutual fund advisor ${city.name}, SIP advisor ${city.name}, financial planner ${city.state}`}
                path={`/mutual-fund-distributor-in-${city.slug}`}
            />
            <Navbar />

            <section className="relative overflow-hidden bg-[#0E1B2C] pt-28 pb-14 md:pt-32 md:pb-16 px-6">
                <div
                    aria-hidden
                    className="fund-animate-in absolute -top-24 -right-32 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
                    style={{ background: "radial-gradient(circle at center, rgba(2,67,150,0.55) 0%, transparent 65%)" }}
                />
                <div className="container-x relative max-w-3xl">
                    <div className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2A364B] bg-[#0E1B2C]/60 text-[11px] tracking-[0.18em] uppercase text-[#8FB7E8] font-semibold">
                        <MapPin size={13} /> {city.name}, {city.state}
                    </div>
                    <h1 className="fund-animate-in fund-animate-in-delay-1 font-display text-3xl sm:text-4xl md:text-5xl text-[#F6F1E8] mt-5 leading-tight">
                        Mutual fund advisory in {city.name} — <span className="font-italic-serif text-[#8FB7E8]">{city.heroLine}.</span>
                    </h1>
                    <p className="fund-animate-in fund-animate-in-delay-2 mt-4 text-[#F6F1E8]/75 text-[15px] sm:text-base max-w-2xl leading-relaxed">
                        {city.intro}
                    </p>
                    <div className="fund-animate-in fund-animate-in-delay-3 flex flex-wrap gap-3 mt-7">
                        <a href={LINKS.whatsappDM} target="_blank" rel="noopener noreferrer" className="btn-pill btn-primary text-sm">
                            Book a Free Call
                        </a>
                        <Link to="/about" className="btn-pill btn-ghost text-sm">
                            About Sagar Chaturvedi
                        </Link>
                    </div>
                    <div className="fund-animate-in flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-[#F6F1E8]/70">
                        <span><b className="text-[#F6F1E8]">1000+</b> families served</span>
                        <span><b className="text-[#F6F1E8]">ARN-290298</b> AMFI Registered</span>
                        <span className="inline-flex items-center gap-1.5">
                            {isRemoteOnly ? <Video size={14} /> : <MapPin size={14} />} {city.meetingMode}
                        </span>
                    </div>
                </div>
            </section>

            <ProblemSolution
                accent="#024396"
                problemLabel={`What ${city.name} investors usually face`}
                problem={`Most financial "advisors" in and around ${city.name} are really product sellers — pushing whatever pays the highest commission that month, with no ongoing relationship once the sale closes.`}
                solutionLabel="How we're different"
                solution={city.localNote}
            />

            <section className="bg-white py-14 md:py-16 px-6 border-t border-[#E2D8C2]">
                <div className="container-x max-w-4xl mx-auto grid sm:grid-cols-3 gap-5">
                    <div className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-6">
                        <ShieldCheck className="text-[#024396]" size={22} />
                        <h3 className="font-display text-base text-[#0E1B2C] mt-3 mb-1.5">AMFI Registered</h3>
                        <p className="text-sm text-[#2A364B]/80">ARN-290298 — verify us directly on AMFI's website before you invest a rupee.</p>
                    </div>
                    <div className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-6">
                        <TrendingUp className="text-[#024396]" size={22} />
                        <h3 className="font-display text-base text-[#0E1B2C] mt-3 mb-1.5">Real, Live Fund Data</h3>
                        <p className="text-sm text-[#2A364B]/80">
                            Our <Link to="/top-funds" className="text-[#024396] underline">Top Funds</Link> and{" "}
                            <Link to="/calculators" className="text-[#024396] underline">calculators</Link> use actual AMFI NAV history — not sample numbers.
                        </p>
                    </div>
                    <div className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-6">
                        {isRemoteOnly ? <Video className="text-[#024396]" size={22} /> : <MapPin className="text-[#024396]" size={22} />}
                        <h3 className="font-display text-base text-[#0E1B2C] mt-3 mb-1.5">{isRemoteOnly ? "Fully Remote, Fully Real" : "In-Person When You Want It"}</h3>
                        <p className="text-sm text-[#2A364B]/80">{city.meetingMode}</p>
                    </div>
                </div>
            </section>

            <section className="bg-[#FBF7EE] py-14 md:py-16 px-6 border-t border-[#E2D8C2]">
                <div className="container-x max-w-4xl mx-auto text-center">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#5C677D] font-semibold mb-4">Also serving</div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {otherCities.map((c) => (
                            <Link
                                key={c.slug}
                                to={`/mutual-fund-distributor-in-${c.slug}`}
                                className="px-3.5 py-1.5 rounded-full text-xs border border-[#E2D8C2] bg-white text-[#2A364B] hover:border-[#024396]/40 transition-colors"
                            >
                                {c.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
            <FloatingActions />
        </div>
    );
}
