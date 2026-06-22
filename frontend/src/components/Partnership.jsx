import React from "react";
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
                        <div className="eyebrow">Partner with us</div>
                        <h2 className="h2 mt-3 text-[#0E1B2C]">
                            Build a distribution business with India's{" "}
                            <span className="font-italic-serif text-[#0E5E48]">most-loved doctor.</span>
                        </h2>
                        <p className="mt-4 text-[#2A364B]">
                            Whether you're a CA, insurance agent, or aspiring MFD — partner with The
                            Financial Doctor and tap into our 8 years of trust, 40+ AMC relationships, and
                            a back-office that handles everything except the client smile.
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
                            <a href="#contact" className="btn-pill btn-ghost">
                                Apply via Form
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
                        {perks.map((p, idx) => {
                            const Icon = p.icon;
                            return (
                                <article
                                    key={p.t}
                                    className="card-cream p-6"
                                    data-testid={`partnership-perk-${idx}`}
                                >
                                    <div className="w-11 h-11 rounded-xl bg-[#C9802A]/15 text-[#C9802A] grid place-items-center">
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
