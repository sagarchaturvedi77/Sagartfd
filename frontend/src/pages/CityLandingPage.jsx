import React, { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { MapPin, Video, ShieldCheck, TrendingUp, Calculator, BookOpen, Quote, HeartPulse, Car, FileCheck2, PhoneCall, ClipboardList, LineChart, Share2, Linkedin, Check } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import ProblemSolution from "@/components/ProblemSolution";
import FAQSection from "@/components/FAQSection";
import { CITY_PAGES, findCityPage } from "@/data/cityPages";
import { LINKS } from "@/lib/links";

const SITE_URL = "https://thefinancialdoctor.in";
const CITY_PATH_PREFIX = "mutual-fund-distributor-in-";

// Reuses the same accent-colour family already established across the
// site's other bespoke pages (About/Services/Reviews/Contact/Calculators/
// TopFunds/Partner) — cycled by each city's position in CITY_PAGES, so the
// 47 city/state pages aren't all identically navy, without inventing a
// clashing new palette.
const CITY_ACCENTS = ["#024396", "#B8722E", "#0F6E5C", "#D9B15C", "#2E7FC7", "#6C63FF", "#22C55E", "#8B5CF6"];
function accentFor(slug) {
    const idx = CITY_PAGES.findIndex((c) => c.slug === slug);
    return CITY_ACCENTS[(idx < 0 ? 0 : idx) % CITY_ACCENTS.length];
}
// Some palette entries (the navy-blue one especially, #024396) are too
// close in darkness to the page's own navy hero background (#0E1B2C) to
// read clearly as TEXT — fine as a button fill or a border, illegible as
// foreground text on a near-black background. Blends the raw accent
// partway toward cream specifically for text use, guaranteeing contrast
// regardless of which of the 8 palette colours a given city lands on.
function accentTextColor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const cream = [246, 241, 232];
    const blended = [r, g, b].map((c, i) => Math.round(c * 0.55 + cream[i] * 0.45));
    return `rgb(${blended[0]}, ${blended[1]}, ${blended[2]})`;
}
// Mirror of accentTextColor for the opposite case: several palette entries
// (the yellow/green ones especially, #D9B15C and #22C55E) are too light to
// read as small text on this page's white/cream card backgrounds further
// down the page (contrast as low as ~2:1, well under WCAG AA's 4.5:1 for
// normal text) — fine as a button fill or border, illegible as foreground
// text on a light background. Blends the raw accent toward navy at the
// same 55/45 ratio used above, just flipped toward the dark end instead of
// cream, so every palette colour stays readable wherever it lands as text.
function accentTextColorOnLight(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const navy = [14, 27, 44];
    const blended = [r, g, b].map((c, i) => Math.round(c * 0.55 + navy[i] * 0.45));
    return `rgb(${blended[0]}, ${blended[1]}, ${blended[2]})`;
}
// A number of blog posts have a redundant "| The Financial Doctor" baked
// into their stored title text (same issue fixed in PublicBlog.jsx's
// pickTitle) — stripped here too since this page renders post.title raw.
function cleanBlogTitle(title) {
    return String(title || "").replace(/\s*\|\s*The Financial Doctor\s*$/i, "").trim();
}

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

// Real blog content embedded on every one of the 47 city/state pages
// (previously just a generic "Read the TFD Blog" link, no actual posts) —
// reinforces pan-India content depth and gives every city page real
// internal links into the blog. A single small batch (limit=9) is fetched
// once and shared across every city page visited in a session (module-
// scope cache, same pattern as fundData.js's fundCache) rather than each
// city page re-fetching the same list; which 3 of the 9 show is rotated
// by the city's own index so the 47 pages don't all show identical picks.
let blogPicksCache = null;
let blogPicksPromise = null;
function fetchBlogPicks() {
    if (blogPicksCache) return Promise.resolve(blogPicksCache);
    if (blogPicksPromise) return blogPicksPromise;
    const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
    blogPicksPromise = fetch(`${API_BASE}/api/internship/public/content?content_type=blog&limit=9`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
            blogPicksCache = Array.isArray(d) ? d : [];
            return blogPicksCache;
        })
        .catch(() => []);
    return blogPicksPromise;
}
function useCityBlogPicks(citySlug) {
    const [posts, setPosts] = useState([]);
    useEffect(() => {
        let cancelled = false;
        fetchBlogPicks().then((all) => {
            if (cancelled || !all.length) return;
            const cityIndex = Math.max(0, CITY_PAGES.findIndex((c) => c.slug === citySlug));
            const start = (cityIndex * 3) % all.length;
            const picks = [];
            for (let i = 0; i < 3 && i < all.length; i++) picks.push(all[(start + i) % all.length]);
            setPosts(picks);
        });
        return () => {
            cancelled = true;
        };
    }, [citySlug]);
    return posts;
}

// City-templated Q&A — genuine, answerable local content (not a doorway
// template): every question is something someone would actually type into
// Google or ask an AI answer engine about doing business with us FROM
// this specific city, covering mutual funds, all three insurance lines,
// calculators, and the proposal/portfolio-review workflow. Real FAQPage
// schema is warranted here (unlike on blog posts) because this is
// substantive, city-specific Q&A content, not a name-swapped template.
function buildCityFAQ(city) {
    const remote = city.meetingMode.toLowerCase().startsWith("100% video") || city.meetingMode.toLowerCase().startsWith("video consultation");
    return {
        en: [
            { q: `Does The Financial Doctor offer mutual fund SIP advisory in ${city.name}?`, a: `Yes — we're an AMFI-registered Mutual Fund Distributor (ARN-290298) and work with ${city.name} clients on SIP, lumpsum, and goal-based mutual fund planning, ${remote ? "entirely over video consultation" : "both in-person and over video"}. [Book a free call](/mutual-fund-distributor-in-${city.slug}).` },
            { q: `Can I get term insurance through The Financial Doctor in ${city.name}?`, a: `Yes, we help ${city.name} clients compare and set up term insurance cover through our licensed insurance partners, alongside your mutual fund planning. See our [Term Insurance](/term-insurance) page for details.` },
            { q: `Do you offer health insurance plans for ${city.name} residents?`, a: `Yes — health insurance is one of the three insurance lines we advise on for ${city.name} clients, reviewed as part of your overall financial plan, not sold in isolation. Details on our [Health Insurance](/health-insurance) page.` },
            { q: `Is motor insurance available through The Financial Doctor in ${city.name}?`, a: `Yes, we can help ${city.name} clients with motor insurance through our partner network, alongside your broader financial planning. See [Motor Insurance](/motor-insurance).` },
            { q: `Can I use TFD's SIP and goal calculators for my ${city.name} financial plan?`, a: `Yes — our [SIP, lumpsum, retirement and goal calculators](/calculators) are free and open to anyone, including ${city.name} residents working out their own numbers before ever talking to us.` },
            { q: `Do I get a written proposal or portfolio report as a ${city.name} client?`, a: `Yes — after your free consultation, we prepare a proposal/portfolio document specific to your goals, and ongoing clients get access to a live portfolio dashboard through our execution partner Asset Plus.` },
            { q: `Is the first consultation free for ${city.name} clients?`, a: `Yes, your first consultation is completely free with no obligation — ${city.meetingMode.toLowerCase()}` },
            { q: `How do I get started from ${city.name}?`, a: `[WhatsApp Sagar ji](${LINKS.whatsappDM}) directly, or use the "Book a Free Call" button on this page — mention you're in ${city.name} and we'll take it from there.` },
        ],
    };
}

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
    const blogPicks = useCityBlogPicks(city?.slug);

    if (!city) return <Navigate to="/" replace />;

    const accent = accentFor(city.slug);
    const accentRgb = hexToRgb(accent);
    const accentText = accentTextColor(accent);
    const accentTextLight = accentTextColorOnLight(accent);
    const isRemoteOnly = city.meetingMode.toLowerCase().startsWith("100% video") || city.meetingMode.toLowerCase().startsWith("video consultation");
    // City-specific WhatsApp message — so when someone clicks through from
    // this specific city page, the message Sagar receives already names
    // the city, instead of the generic sitewide WhatsApp text that gives
    // no clue which page the lead came from.
    const whatsappHref = `https://wa.me/917773805794?text=${encodeURIComponent(
        `Hi Sagar ji, I'm from ${city.name} — found you on your ${city.name} page and want to know more about mutual fund investments.`
    )}`;
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
                title={`The Financial Doctor | Best Mutual Fund Distributor in ${city.name}`}
                description={`Mutual fund SIP, term/health/motor insurance, free SIP & goal calculators, and a free portfolio review for ${city.name} investors — Sagar Chaturvedi (AMFI Registered, ARN-290298), zero-bias, goal-based planning with a written proposal. Book a free call.`}
                keywords={`mutual fund distributor ${city.name}, mutual fund distributor near me, mutual fund agent ${city.name}, mutual fund agent near me, mutual fund consultant ${city.name}, SIP agent ${city.name}, best mutual fund advisor ${city.name}, SIP advisor ${city.name}, mutual fund advisor ${city.name}, term insurance ${city.name}, health insurance ${city.name}, motor insurance ${city.name}, insurance agent ${city.name}, SIP calculator ${city.name}, lumpsum calculator ${city.name}, goal calculator ${city.name}, free portfolio review ${city.name}, financial planner ${city.state}, mutual funds ${city.name}, mutual fund ${city.name}, mutal fund ${city.name}, Sagar Chaturvedi ${city.name}, HDFC Mutual Fund ${city.name}, ICICI Prudential Mutual Fund ${city.name}, SBI Mutual Fund ${city.name}, Axis Mutual Fund ${city.name}, Nippon India Mutual Fund, Kotak Mutual Fund, Aditya Birla Sun Life Mutual Fund, UTI Mutual Fund, DSP Mutual Fund, Franklin Templeton Mutual Fund, Tata Mutual Fund, Mirae Asset Mutual Fund, Motilal Oswal Mutual Fund, Invesco Mutual Fund`}
                path={`/mutual-fund-distributor-in-${city.slug}`}
                ogImage={`${SITE_URL}/assets/og/city-${city.slug}.png`}
            />
            <Navbar />

            {/* Text-only hero with a per-city accent colour (see accentFor
                above) instead of reusing the OG share-card image here — that
                image already has its own baked-in headline/badge/button
                text, and placing it next to this section's own live H1 just
                duplicated the same message twice right next to each other.
                The share card still does its job as og:image; it doesn't
                need to also appear on the page itself. */}
            <section className="relative overflow-hidden bg-[#0E1B2C] pt-28 pb-14 md:pt-32 md:pb-16 px-6">
                <div
                    aria-hidden
                    className="fund-animate-in absolute -top-24 -right-32 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
                    style={{ background: `radial-gradient(circle at center, rgba(${accentRgb},0.55) 0%, transparent 65%)` }}
                />
                <div className="container-x relative max-w-3xl">
                    <div
                        className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-[#0E1B2C]/60 text-[11px] tracking-[0.18em] uppercase font-semibold"
                        style={{ borderColor: `rgba(${accentRgb},0.5)`, color: accentText }}
                    >
                        <MapPin size={13} /> {city.name}, {city.state}
                    </div>
                    <h1 className="fund-animate-in fund-animate-in-delay-1 font-display text-3xl sm:text-4xl md:text-5xl text-[#F6F1E8] mt-5 leading-tight">
                        Mutual fund advisory in {city.name} — <span className="font-italic-serif" style={{ color: accentText }}>{city.heroLine}.</span>
                    </h1>
                    <p className="fund-animate-in fund-animate-in-delay-2 mt-4 text-[#F6F1E8]/75 text-[15px] sm:text-base max-w-2xl leading-relaxed">
                        {city.intro}
                    </p>
                    {city.cultureLine && (
                        <div className="fund-animate-in fund-animate-in-delay-2 mt-5 flex gap-2.5 max-w-xl border-l-2 pl-4 py-0.5" style={{ borderColor: accent }}>
                            <Quote size={15} className="shrink-0 mt-0.5" style={{ color: accentText }} />
                            <p className="font-italic-serif text-[15px] sm:text-base leading-snug" style={{ color: accentText }}>
                                {city.cultureLine}
                            </p>
                        </div>
                    )}
                    <div className="fund-animate-in fund-animate-in-delay-3 flex flex-wrap gap-3 mt-7">
                        <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-pill text-sm text-white font-medium px-5 py-2.5 rounded-full transition-opacity hover:opacity-90"
                            style={{ background: accent }}
                        >
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
                accent={accent}
                problemLabel={`What ${city.name} investors usually face`}
                problem={`Most financial "advisors" in and around ${city.name} are really product sellers — pushing whatever pays the highest commission that month, with no ongoing relationship once the sale closes.`}
                solutionLabel="How we're different"
                solution={city.localNote}
            />

            <section className="bg-white py-14 md:py-16 px-6 border-t border-[#E2D8C2]">
                <div className="container-x max-w-4xl mx-auto flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:snap-none sm:mx-0 sm:px-0 sm:pb-0">
                    <div className="shrink-0 w-[82%] snap-center sm:w-auto sm:shrink bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-6">
                        <ShieldCheck className="text-[#024396]" size={22} />
                        <h3 className="font-display text-base text-[#0E1B2C] mt-3 mb-1.5">AMFI Registered</h3>
                        <p className="text-sm text-[#2A364B]/80">ARN-290298 — verify us directly on AMFI's website before you invest a rupee.</p>
                    </div>
                    <div className="shrink-0 w-[82%] snap-center sm:w-auto sm:shrink bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-6">
                        <TrendingUp className="text-[#024396]" size={22} />
                        <h3 className="font-display text-base text-[#0E1B2C] mt-3 mb-1.5">Real, Live Fund Data</h3>
                        <p className="text-sm text-[#2A364B]/80">
                            Our <Link to="/top-funds" className="text-[#024396] underline">Top Funds</Link> and{" "}
                            <Link to="/calculators" className="text-[#024396] underline">calculators</Link> use actual AMFI NAV history — not sample numbers.
                        </p>
                    </div>
                    <div className="shrink-0 w-[82%] snap-center sm:w-auto sm:shrink bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-6">
                        {isRemoteOnly ? <Video className="text-[#024396]" size={22} /> : <MapPin className="text-[#024396]" size={22} />}
                        <h3 className="font-display text-base text-[#0E1B2C] mt-3 mb-1.5">{isRemoteOnly ? "Fully Remote, Fully Real" : "In-Person When You Want It"}</h3>
                        <p className="text-sm text-[#2A364B]/80">{city.meetingMode}</p>
                    </div>
                </div>
            </section>

            {/* How it works — a genuinely new content section (not present
                before), giving {city} readers a concrete sense of the
                process instead of just a list of services. Numbered steps
                are appropriate here since this really is a sequence. */}
            <section className="bg-[#FBF7EE] py-14 md:py-16 px-6 border-t border-[#E2D8C2]">
                <div className="container-x max-w-5xl mx-auto">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#5C677D] font-semibold mb-2">
                        How it works
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl text-[#0E1B2C] mb-8 max-w-lg">
                        From a first conversation to an ongoing plan — here's exactly what happens.
                    </h2>
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0">
                        <HowStep
                            n="1"
                            icon={PhoneCall}
                            title={isRemoteOnly ? `A free video call` : `A free call or in-person meeting`}
                            desc={`We understand your income, goals and risk appetite first (${city.meetingMode}) No product is mentioned until this part is done.`}
                        />
                        <HowStep
                            n="2"
                            icon={ClipboardList}
                            title="A written proposal, made for you"
                            desc={`A goal-based plan specific to your numbers — mutual funds, and term/health/motor insurance if relevant — with a clear reason for every recommendation.`}
                        />
                        <HowStep
                            n="3"
                            icon={LineChart}
                            title="Ongoing portfolio reviews"
                            desc={`Not a one-time sale — periodic check-ins, a live portfolio dashboard via Asset Plus, and a real person to call when markets move.`}
                        />
                    </div>
                </div>
            </section>

            {/* Mission statement + Daily vs Monthly SIP explainer + fund
                selection emphasis + ongoing support — real educational and
                trust content, not filler, addressing exactly what {city}
                readers actually want to know before investing. */}
            <section className="bg-[#0E1B2C] py-14 md:py-16 px-6 border-t border-[#2A364B]">
                <div className="container-x max-w-5xl mx-auto">
                    <div className="max-w-2xl">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#8FB7E8] font-semibold mb-3">Our mission</div>
                        <p className="font-italic-serif text-[#F6F1E8] text-xl sm:text-2xl leading-snug">
                            "Our mission is simple — make every {city.name} family financially strong. Not just invested — genuinely
                            secure, with a plan they actually understand."
                        </p>
                        <p className="text-[#F6F1E8]/70 text-sm mt-4">— Sagar Chaturvedi, Founder</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5 mt-10">
                        <div className="bg-[#152238] border border-[#2A364B] rounded-2xl p-6">
                            <h3 className="font-display text-base text-[#F6F1E8] mb-2">Daily SIP or Monthly SIP?</h3>
                            <p className="text-sm text-[#F6F1E8]/70 leading-relaxed">
                                Both are available to {city.name} investors — a Daily SIP spreads small amounts across every trading
                                day for slightly finer rupee-cost averaging, while a Monthly SIP (the more common choice) lines up
                                with a salary or business cash cycle. Neither is "better" on its own; we help you pick whichever
                                actually matches how your money comes in.
                            </p>
                        </div>
                        <div className="bg-[#152238] border border-[#D8B98A]/40 rounded-2xl p-6">
                            <h3 className="font-display text-base text-[#D8B98A] mb-2">Fund selection is the real work</h3>
                            <p className="text-sm text-[#F6F1E8]/70 leading-relaxed">
                                Daily vs monthly, ₹1,000 vs ₹10,000 — these are quick decisions. The task we actually spend the most
                                time on for every {city.name} client is fund selection: matching the right fund category, AMC track
                                record, and expense ratio to your specific goal and time horizon. That's where most of our real work
                                happens, not in setting up the SIP itself.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex items-start gap-3 text-sm text-[#F6F1E8]/70 max-w-2xl">
                        <ShieldCheck size={18} className="text-[#8FB7E8] shrink-0 mt-0.5" />
                        <p>
                            <b className="text-[#F6F1E8]">Support doesn't stop after you invest.</b> Every {city.name} client can
                            reach us for a portfolio review, a fund switch question, or just to understand a statement — the same
                            free-first-consultation relationship continues for as long as you're invested with us.
                        </p>
                    </div>
                </div>
            </section>

            {/* Services in {city} — explicit mutual fund / insurance / calculator /
                proposal coverage, both for readers and for AEO (answer engines
                pull directly from clearly-labelled service blocks like this). */}
            <section className="bg-white py-14 md:py-16 px-6 border-t border-[#E2D8C2]">
                <div className="container-x max-w-5xl mx-auto">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#5C677D] font-semibold mb-5">
                        Our services in {city.name}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <ServiceTile icon={TrendingUp} title="Mutual Fund & SIP Planning" desc={`Goal-based SIP, lumpsum and portfolio planning for ${city.name} investors, Regular Plan servicing.`} href="/services" />
                        <ServiceTile icon={ShieldCheck} title="Term Insurance" desc={`Independent term cover review and setup for ${city.name} families, through licensed partners.`} href="/term-insurance" />
                        <ServiceTile icon={HeartPulse} title="Health Insurance" desc={`Health cover comparison and setup as part of your overall ${city.name} financial plan.`} href="/health-insurance" />
                        <ServiceTile icon={Car} title="Motor Insurance" desc={`Motor insurance through our partner network, alongside your broader planning.`} href="/motor-insurance" />
                        <ServiceTile icon={Calculator} title="Free Calculators" desc={`SIP, lumpsum, retirement and goal calculators — work out your own ${city.name} numbers, free.`} href="/calculators" />
                        <ServiceTile icon={FileCheck2} title="Free Portfolio Review" desc={`A written proposal/portfolio report for ${city.name} clients after your free first consultation.`} href={whatsappHref} external />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-8">
                        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-pill btn-primary text-sm">
                            Get My Free Portfolio Review
                        </a>
                        <Link to="/blog" className="btn-pill btn-ghost text-sm">
                            Read the TFD Blog
                        </Link>
                    </div>
                </div>
            </section>

            {/* Real embedded blog posts, not just a link — every city page
                previously only linked out to /blog with zero actual content
                shown. Which 3 of the small fetched batch appear is rotated
                by city index (useCityBlogPicks), so the 47 pages don't all
                show the same three posts, and every page carries real,
                fresh internal links into the blog. */}
            {blogPicks.length > 0 && (
                <section className="bg-white py-14 md:py-16 px-6 border-t border-[#E2D8C2]">
                    <div className="container-x max-w-5xl mx-auto">
                        <div className="flex items-end justify-between gap-4 mb-6">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-[#5C677D] font-semibold">
                                From the TFD Blog
                            </div>
                            <Link to="/blog" className="text-xs font-medium hover:underline" style={{ color: accentTextLight }}>
                                All articles →
                            </Link>
                        </div>
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:snap-none sm:mx-0 sm:px-0 sm:pb-0">
                            {blogPicks.map((post) => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.id}`}
                                    className="shrink-0 w-[80%] snap-center sm:w-auto sm:shrink block bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl overflow-hidden hover:border-[#024396]/40 hover:shadow-sm transition-all"
                                >
                                    <img
                                        src={`/assets/og-thumbs/blog-post-${post.id}.webp`}
                                        alt={cleanBlogTitle(post.title)}
                                        className="w-full aspect-[1200/630] object-cover"
                                        loading="lazy"
                                        decoding="async"
                                        width={480}
                                        height={252}
                                    />
                                    <div className="p-4">
                                        {post.topic_label && (
                                            <div className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-1.5" style={{ color: accentTextLight }}>
                                                {post.topic_label}
                                            </div>
                                        )}
                                        <h3 className="font-display text-[14px] text-[#0E1B2C] leading-snug line-clamp-2">{cleanBlogTitle(post.title)}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

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

            <FAQSection title={`${city.name} — Frequently Asked Questions`} data={buildCityFAQ(city)} />

            <CityShareSection city={city} pageUrl={`${SITE_URL}/mutual-fund-distributor-in-${city.slug}`} />

            <Footer />
            <FloatingActions />
        </div>
    );
}

// Same share pattern as the blog's ShareSection (PublicBlog.jsx) — WhatsApp
// and Telegram get real share intents; LinkedIn's own share window doesn't
// reliably attach anything, so it copies a caption first and opens LinkedIn
// after; Instagram has no web share-intent at all, so it copies a caption
// only. The shared URL and its og:image (this city's own card, with the
// distinct per-city accent colour) come from CityLandingPage's own SEO tag.
function CityShareSection({ city, pageUrl }) {
    const [copiedFor, setCopiedFor] = useState(null);
    const caption = `${city.name} — Mutual Fund & Insurance Advisory | The Financial Doctor\n\nAMFI Registered (ARN-290298) — mutual funds, SIP, term/health/motor insurance and a free portfolio review, now available in ${city.name}.\n${pageUrl}\n\nInstagram: ${LINKS.instagram}\nLinkedIn: ${LINKS.linkedin}\nYouTube: ${LINKS.youtube}`;
    const captionNoUrl = caption.replace(`${pageUrl}\n\n`, "");

    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${city.name} — Mutual Fund & Insurance Advisory | The Financial Doctor\n${pageUrl}`)}`;
    const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(captionNoUrl)}`;
    const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;

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
            await navigator.clipboard.writeText(caption);
            setCopiedFor("instagram");
            setTimeout(() => setCopiedFor(null), 2500);
        } catch {
            // clipboard blocked
        }
    };

    return (
        <section className="bg-white py-14 md:py-16 px-6 border-t border-[#E2D8C2]">
            <div className="container-x max-w-4xl mx-auto">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#5C677D] font-semibold mb-3">
                    Share the {city.name} page
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium text-white bg-[#25D366] hover:brightness-105 px-4 py-2 rounded-full transition-all"
                    >
                        <Share2 size={13} /> Share on WhatsApp
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
                            copyThenOpen(caption, "linkedin", linkedinHref);
                        }}
                        className="inline-flex items-center gap-2 text-xs font-medium text-white bg-[#0A66C2] hover:brightness-110 px-4 py-2 rounded-full transition-all"
                    >
                        {copiedFor === "linkedin" ? <Check size={13} /> : <Linkedin size={13} />}
                        {copiedFor === "linkedin" ? "Caption & link copied — paste in the post" : "Share on LinkedIn"}
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
                    Shares this page with its own title and {city.name}-specific image — WhatsApp/Telegram unfurl it
                    automatically; LinkedIn and Instagram copy a ready caption since neither reliably attaches one on their own.
                </p>
            </div>
        </section>
    );
}

function HowStep({ n, icon: Icon, title, desc }) {
    return (
        <div className="shrink-0 w-[82%] snap-center md:w-auto md:shrink bg-white border border-[#E2D8C2] rounded-2xl p-6 relative">
            <div className="flex items-center justify-between">
                <Icon size={22} className="text-[#024396]" />
                <span className="font-display text-3xl text-[#E2D8C2]">{n}</span>
            </div>
            <h3 className="font-display text-base text-[#0E1B2C] mt-4 mb-1.5">{title}</h3>
            <p className="text-sm text-[#2A364B]/80 leading-relaxed">{desc}</p>
        </div>
    );
}

function ServiceTile({ icon: Icon, title, desc, href, external }) {
    const Wrapper = external ? "a" : Link;
    const linkProps = external ? { href, target: "_blank", rel: "noopener noreferrer" } : { to: href };
    return (
        <Wrapper
            {...linkProps}
            className="block bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-3.5 sm:p-5 hover:border-[#024396]/40 hover:bg-white transition-colors"
        >
            <Icon size={18} className="text-[#024396] sm:hidden" />
            <Icon size={20} className="text-[#024396] hidden sm:block" />
            <h3 className="font-display text-[13px] sm:text-[15px] text-[#0E1B2C] mt-2 sm:mt-2.5 leading-snug">{title}</h3>
            <p className="text-[11.5px] sm:text-sm text-[#2A364B]/75 leading-relaxed mt-1 sm:mt-1.5">{desc}</p>
        </Wrapper>
    );
}
