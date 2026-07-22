import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, Award, Users, Sparkles } from "lucide-react";

const perks = [
    {
        icon: Award,
        t: "Industry-best commissions",
        b: "Competitive payout structure across all 40+ AMCs.",
    },
    {
        icon: Briefcase,
        t: "Training & certification",
        b: "We help you become AMFI / NISM certified, start to finish.",
    },
    {
        icon: Users,
        t: "Dedicated back-office",
        b: "Tech, compliance and client servicing — handled for you.",
    },
    {
        icon: Sparkles,
        t: "White-glove onboarding",
        b: "From ARN to first SIP, your client journey is co-built with us.",
    },
];

export default function Partnership() {
    return (
        <section className="section bg-[#EFE7D6]">
            <div className="container-x">
                <div className="grid lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-5">
                        <div className="eyebrow">What you get</div>
                        <h2 className="h2 mt-3 text-[#0E1B2C]">
                            Everything you need, <span className="font-italic-serif text-[#024396]">nothing you don't.</span>
                        </h2>
                        <p className="mt-4 text-[#2A364B]">
                            You bring the relationships — we bring the AMC network, compliance, and
                            back-office so you can spend your time where it actually matters.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <a
                                href="https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%27m%20interested%20in%20partnering%20with%20The%20Financial%20Doctor%20as%20a%20sub-broker%20%2F%20referral%20partner.%20Please%20share%20details."
                                target="_blank"
                                rel="noreferrer"
                                className="btn-pill btn-primary"
                            >
                                Partner via WhatsApp
                            </a>
                            <Link to="/contact" className="btn-pill btn-ghost">
                                Apply via Form
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:snap-none sm:mx-0 sm:px-0 sm:pb-0">
                        {perks.map((p, idx) => {
                            const Icon = p.icon;
                            return (
                                <article
                                    key={p.t}
                                    className="shrink-0 w-[80%] snap-center sm:w-auto sm:shrink card-cream p-6"
                                    data-testid={`partnership-perk-${idx}`}
                                >
                                    <div className="w-11 h-11 rounded-xl bg-[#C7102E]/15 text-[#C7102E] grid place-items-center">
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="font-display text-[1.2rem] text-[#0E1B2C] mt-4">
                                        {p.t}
                                    </h3>
                                    <p className="text-sm text-[#2A364B] mt-2 leading-relaxed">
                                        {p.b}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
