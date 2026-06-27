import React, { useState } from "react";
import { TrendingUp, ShieldCheck, Heart, Activity, Car, Stethoscope } from "lucide-react";
import Reveal from "@/components/Reveal";
import MotorInsuranceForm from "@/components/MotorInsuranceForm";
import { LINKS } from "@/lib/links";
import { useModal } from "../context/ModalContext"; 

const items = [
    {
        icon: TrendingUp,
        tag: "Wealth Creation",
        title: "Mutual Funds & SIP",
        body: "Goal-based investing across equity, debt, hybrid and ELSS funds. AssetPlus-powered onboarding in under 5 minutes.",
        cta: "Start SIP",
        isPopup: true, // 🎯 Connected to secure popup system
    },
    {
        icon: ShieldCheck,
        tag: "Protection",
        title: "Term Insurance",
        body: "Pure protection plans with high cover at low premiums. We compare LIC, HDFC Life, ICICI Pru, Max Life and more.",
        cta: "Get a Quote",
        href: "https://insurance.assetplus.in/290298/term",
    },
    {
        icon: Heart,
        tag: "Family Security",
        title: "Life Insurance",
        body: "Endowment, ULIP, child & retirement plans tailored to your family goals and risk appetite.",
        cta: "Talk to Advisor",
        href: `${LINKS.whatsappDM.split('?')[0]}?text=${encodeURIComponent('Hi Sagar ji, I want to discuss Life Insurance.')}`,
    },
    {
        icon: Activity,
        tag: "Medical Cover",
        title: "Health Insurance",
        body: "Individual & family floater plans, top-ups and critical illness covers. Cashless across 10,000+ hospitals.",
        cta: "Compare Plans",
        href: "https://insurance.assetplus.in/290298/health",
    },
    {
        icon: Car,
        tag: "Vehicle Cover",
        title: "Motor Insurance",
        body: "Car & two-wheeler insurance with instant policy issuance and hassle-free claim assistance.",
        cta: "Quick Quote",
        isForm: true,
    },
    {
        icon: Stethoscope,
        tag: "Free Diagnosis",
        title: "Portfolio Review",
        body: "Free annual health-check of your existing portfolio. We diagnose underperforming funds and rebalance.",
        cta: "Book Review",
        href: `${LINKS.whatsappDM.split('?')[0]}?text=${encodeURIComponent('Hi Sagar ji, I want a free Portfolio Review.')}`,
    },
];

export default function Services() {
    const [formOpen, setFormOpen] = useState(false);
    // 🛠️ Step 2: Extracting active trigger handler 
    const { openGateway } = useModal(); 

    return (
        <section id="services" className="section">
            <div className="container-x">
                <div className="max-w-3xl mb-12">
                    <div className="eyebrow">What we treat</div>
                    <h2 className="h2 mt-3 text-[#0E1B2C]">
                        One doctor for all your{" "}
                        <span className="font-italic-serif text-[#C7102E]">financial prescriptions.</span>
                    </h2>
                    <p className="mt-3 text-[#2A364B]">
                        From your first SIP to your child's education plan, your family's term cover to your
                        car's renewal — get expert advice under one roof.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((it, idx) => {
                        const Icon = it.icon;
                        return (
                            <Reveal key={it.title} delay={idx * 70} y={26}>
                                <article
                                    className="card-cream p-6 group hover:border-[#024396] transition-colors relative overflow-hidden h-full"
                                    data-testid={`service-card-${idx}`}
                                >
                                    <div
                                        aria-hidden
                                        className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[#024396]/5 group-hover:bg-[#024396]/10 transition-colors"
                                    />
                                    <div className="relative">
                                        <div className="service-icon w-12 h-12 rounded-xl bg-[#0E1B2C] grid place-items-center text-[#F6F1E8]">
                                            <Icon size={20} />
                                        </div>
                                        <div className="mt-5 text-[11px] tracking-[0.18em] uppercase text-[#024396] font-semibold">
                                            {it.tag}
                                        </div>
                                        <h3 className="h3 mt-2 text-[#0E1B2C]">{it.title}</h3>
                                        <p className="mt-3 text-[14.5px] text-[#2A364B] leading-relaxed">
                                            {it.body}
                                        </p>
                                        
                                        {/* 🛠️ Dynamic Multi-Action Trigger Framework */}
                                        {it.isForm ? (
                                            <button
                                                type="button"
                                                onClick={() => setFormOpen(true)}
                                                className="inline-flex items-center gap-1.5 mt-5 text-[#024396] hover:text-[#012E6B] font-medium text-sm group/cta cursor-pointer"
                                            >
                                                {it.cta}{" "}
                                                <span aria-hidden className="transition-transform group-hover/cta:translate-x-1">
                                                    →
                                                </span>
                                            </button>
                                        ) : it.isPopup ? (
                                            /* 🎯 Mutual Funds and SIP will launch secure popup modal here */
                                            <button
                                                type="button"
                                                onClick={openGateway}
                                                className="inline-flex items-center gap-1.5 mt-5 text-[#024396] hover:text-[#012E6B] font-medium text-sm group/cta cursor-pointer bg-transparent border-none p-0"
                                            >
                                                {it.cta}{" "}
                                                <span aria-hidden className="transition-transform group-hover/cta:translate-x-1">
                                                    →
                                                </span>
                                            </button>
                                        ) : (
                                            <a
                                                href={it.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 mt-5 text-[#024396] hover:text-[#012E6B] font-medium text-sm group/cta"
                                            >
                                                {it.cta}{" "}
                                                <span aria-hidden className="transition-transform group-hover/cta:translate-x-1">
                                                    →
                                                </span>
                                            </a>
                                        )}
                                    </div>
                                </article>
                            </Reveal>
                        );
                    })}
                </div>
            </div>

            <MotorInsuranceForm open={formOpen} onClose={() => setFormOpen(false)} />
        </section>
    );
}
