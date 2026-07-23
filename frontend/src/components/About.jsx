import React from "react";
import { Award, BadgeCheck } from "lucide-react";
import Reveal from "@/components/Reveal";

const AWARD = "/assets/founder/sagar-award.webp";

const bullets = [
    "AMFI-registered Mutual Fund Distributor (ARN-290298)",
    "8+ years of personalised financial advisory",
    "1000+ families empowered across Madhya Pradesh",
    "Investment Awareness Excellence Award recipient",
    "Free portfolio review for every new client",
    "Workshops & digital education on financial literacy",
];

export default function About({ hideHeading = false } = {}) {
    if (hideHeading) {
        // Dedicated page: magazine-style layout — bio leads full-width at
        // top, award photo becomes a smaller inset card instead of the
        // dominant half, and credentials render as a card grid rather than
        // a plain bulleted list. Genuinely different composition from the
        // homepage's photo-left/text-right split, not just recoloured.
        return (
            <section id="about" className="section bg-[#EFE7D6]">
                <div className="container-x">
                    <div className="grid md:grid-cols-[1fr,280px] gap-10 items-start">
                        <Reveal y={24}>
                            <p className="text-[#2A364B] leading-relaxed text-[15px] md:text-base">
                                Sagar is the founder of <strong>The Financial Doctor</strong> — a platform
                                dedicated to simplifying finance and empowering individuals to take control of
                                their financial future.
                            </p>
                            <p className="mt-4 text-[#2A364B] leading-relaxed text-[15px] md:text-base">
                                He has been honoured with the <strong>Investment Awareness Excellence Award</strong>
                                {" "}for his outstanding efforts in spreading financial literacy. Through
                                workshops, digital content and 1-on-1 advisory, Sagar has positively impacted
                                thousands of lives.
                            </p>
                            <a
                                href="https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20a%20free%20portfolio%20review."
                                target="_blank"
                                rel="noreferrer"
                                className="btn-pill btn-primary mt-6"
                                data-testid="about-book-review"
                            >
                                Book Free Portfolio Review
                            </a>
                        </Reveal>
                        <Reveal delay={120} y={20}>
                            <div className="relative rounded-2xl overflow-hidden border border-[#E2D8C2]">
                                <img
                                    src={AWARD}
                                    alt="Sagar Chaturvedi receiving the Investment Awareness Excellence Award"
                                    className="w-full h-auto object-cover"
                                    width={900}
                                    height={883}
                                    loading="lazy"
                                />
                                {/* Top-left, not top-right — the photo itself already has
                                    "SAGAR CHATURVEDI / CEO" baked into its top-right corner
                                    (this badge was landing directly on top of that name), and
                                    the bottom of the photo is a full-width contact-info bar.
                                    Top-left is the one corner that's just clear background. */}
                                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-[#C7102E] text-white px-2.5 py-1 rounded-full text-[11px] font-medium">
                                    <Award size={12} /> Awarded
                                </div>
                            </div>
                            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#5C677D]">
                                Excellence in Investment Awareness
                            </div>
                        </Reveal>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mt-10">
                        {bullets.map((b, i) => (
                            <Reveal key={b} delay={i * 50} y={16}>
                                <div className="flex items-start gap-2 sm:gap-2.5 bg-white border border-[#E2D8C2] rounded-xl px-2.5 sm:px-4 py-3 sm:py-3.5 h-full">
                                    <BadgeCheck size={16} className="text-[#024396] mt-0.5 shrink-0 sm:hidden" />
                                    <BadgeCheck size={18} className="text-[#024396] mt-0.5 shrink-0 hidden sm:block" />
                                    <span className="text-[12.5px] sm:text-sm text-[#2A364B] leading-snug">{b}</span>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="about" className="section bg-[#EFE7D6]">
            <div className="container-x grid md:grid-cols-12 gap-12 items-center">
                <Reveal className="md:col-span-5" y={32}>
                    <div className="relative">
                        <div className="absolute -inset-4 rounded-[2rem] bg-[#024396]/15 rotate-2" />
                        <div className="relative rounded-[2rem] overflow-hidden border border-[#E2D8C2]">
                            <img
                                src={AWARD}
                                alt="Sagar Chaturvedi receiving the Investment Awareness Excellence Award"
                                className="w-full h-auto object-cover"
                                width={900}
                                height={883}
                                loading="lazy"
                            />
                            {/* Top-left — see note above, avoids the baked-in name text
                                (top-right) and the contact-info bar (full-width bottom). */}
                            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-[#C7102E] text-white px-3 py-1.5 rounded-full text-xs font-medium">
                                <Award size={14} /> Awarded
                            </div>
                        </div>
                        <div className="mt-4 text-center md:text-left text-xs uppercase tracking-[0.2em] text-[#5C677D]">
                            Excellence in Investment Awareness
                        </div>
                    </div>
                </Reveal>

                <Reveal className="md:col-span-7" delay={150} y={28}>
                    <div className="eyebrow">Meet the Doctor</div>
                    <h2 className="h2 mt-3 text-[#0E1B2C]">
                        Sagar Chaturvedi <span className="font-italic-serif text-[#024396]">— Founder &amp; CEO</span>
                    </h2>
                    <p className="mt-6 text-[#2A364B] leading-relaxed">
                        Sagar is the founder of <strong>The Financial Doctor</strong> — a platform
                        dedicated to simplifying finance and empowering individuals to take control of
                        their financial future.
                    </p>
                    <p className="mt-4 text-[#2A364B] leading-relaxed">
                        He has been honoured with the <strong>Investment Awareness Excellence Award</strong>
                        {" "}for his outstanding efforts in spreading financial literacy. Through
                        workshops, digital content and 1-on-1 advisory, Sagar has positively impacted
                        thousands of lives.
                    </p>

                    <ul className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3">
                        {bullets.map((b) => (
                            <li
                                key={b}
                                className="flex items-start gap-2 sm:gap-2.5 text-[13px] sm:text-[15px] text-[#2A364B] leading-snug"
                            >
                                <BadgeCheck size={16} className="text-[#024396] mt-0.5 shrink-0 sm:hidden" />
                                <BadgeCheck size={18} className="text-[#024396] mt-0.5 shrink-0 hidden sm:block" />
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>

                    <a
                        href="https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20a%20free%20portfolio%20review."
                        target="_blank"
                        rel="noreferrer"
                        className="btn-pill btn-primary mt-8"
                        data-testid="about-book-review"
                    >
                        Book Free Portfolio Review
                    </a>
                </Reveal>
            </div>
        </section>
    );
}
