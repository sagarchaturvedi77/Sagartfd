import React from "react";
import { Award, BadgeCheck } from "lucide-react";
import Reveal from "@/components/Reveal";
import { LINKS } from "@/lib/links";

const AWARD =
    "https://customer-assets.emergentagent.com/job_wealth-advisor-111/artifacts/xqwjwi4k_IMG_9401.jpeg";

const bullets = [
    "AMFI-registered Mutual Fund Distributor (ARN-290298)",
    "8+ years of personalised financial advisory",
    "1000+ families empowered across Madhya Pradesh",
    "Investment Awareness Excellence Award recipient",
    "Free portfolio review for every new client",
    "Workshops & digital education on financial literacy",
];

export default function About() {
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
                                loading="lazy"
                            />
                            <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 bg-[#C7102E] text-white px-3 py-1.5 rounded-full text-xs font-medium">
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

                    <ul className="mt-7 grid sm:grid-cols-2 gap-3">
                        {bullets.map((b) => (
                            <li
                                key={b}
                                className="flex items-start gap-2.5 text-[15px] text-[#2A364B]"
                            >
                                <BadgeCheck size={18} className="text-[#024396] mt-0.5 shrink-0" />
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>

                    <a
                        href={`${LINKS.whatsappDM.split('?')[0]}?text=${encodeURIComponent('Hi Sagar ji, I want a free portfolio review.')}`}
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
