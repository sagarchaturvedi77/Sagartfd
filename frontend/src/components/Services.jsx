import React, { useState } from "react";
import { TrendingUp, ShieldCheck, Heart, Activity, Car, Stethoscope } from "lucide-react";
import Reveal from "@/components/Reveal";
import MotorInsuranceForm from "@/components/MotorInsuranceForm";
// 🛠️ Step 1: Central Context Hook Connected cleanly
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
        href: "https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20to%20discuss%20Life%20Insurance.",
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
        href: "https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20a%20free%20Portfolio%20Review.",
    },
];

export default function Services({ hideHeading = false } = {}) {
    const [formOpen, setFormOpen] = useState(false);
    // 🛠️ Step 2: Extracting active trigger handler 
    const { openGateway } = useModal(); 

    return (
        <section id="services" className="section">
            <div className="container-x">
                {!hideHeading && (
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
                )}

                {hideHeading ? (
                    // Dedicated page: featured-row layout — first service (the
                    // primary revenue line) gets a wide banner card, the rest
                    // sit in a compact two-column list instead of a uniform
                    // 3-col grid, so this page reads differently from the
                    // homepage's version of the same section.
                    <div className="space-y-4">
                        {items.slice(0, 1).map((it) => {
                            const Icon = it.icon;
                            return (
                                <article key={it.title} className="rounded-2xl bg-[#0E1B2C] text-[#F6F1E8] p-7 md:p-9 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 grid place-items-center shrink-0">
                                        <Icon size={26} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[11px] tracking-[0.18em] uppercase text-[#D8B98A] font-semibold">{it.tag}</div>
                                        <h3 className="font-display text-xl md:text-2xl mt-1.5">{it.title}</h3>
                                        <p className="mt-2 text-[#F6F1E8]/75 text-sm leading-relaxed max-w-2xl">{it.body}</p>
                                    </div>
                                    <ServiceCta it={it} onFormOpen={() => setFormOpen(true)} onPopup={openGateway} light />
                                </article>
                            );
                        })}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {items.slice(1).map((it, idx) => {
                                const Icon = it.icon;
                                return (
                                    <Reveal key={it.title} delay={idx * 60} y={18}>
                                        <article className="border border-[#E2D8C2] rounded-2xl p-5 flex items-start gap-4 h-full hover:border-[#024396]/40 transition-colors" data-testid={`service-card-${idx + 1}`}>
                                            <div className="w-11 h-11 rounded-xl bg-[#0E1B2C] grid place-items-center text-[#F6F1E8] shrink-0">
                                                <Icon size={19} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] tracking-[0.18em] uppercase text-[#024396] font-semibold">{it.tag}</div>
                                                <h3 className="font-display text-base text-[#0E1B2C] mt-1">{it.title}</h3>
                                                <p className="mt-1.5 text-[13px] text-[#2A364B]/80 leading-relaxed">{it.body}</p>
                                                <ServiceCta it={it} onFormOpen={() => setFormOpen(true)} onPopup={openGateway} />
                                            </div>
                                        </article>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0">
                        {items.map((it, idx) => {
                            const Icon = it.icon;
                            return (
                                <Reveal key={it.title} delay={idx * 70} y={26} className="shrink-0 w-[80%] snap-center md:w-auto md:shrink">
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
                                            <ServiceCta it={it} onFormOpen={() => setFormOpen(true)} onPopup={openGateway} />
                                        </div>
                                    </article>
                                </Reveal>
                            );
                        })}
                    </div>
                )}
            </div>

            <MotorInsuranceForm open={formOpen} onClose={() => setFormOpen(false)} />
        </section>
    );
}

// Shared CTA renderer for the 3 trigger types a service item can have (an
// in-page form modal, the site's secure investment popup, or a plain
// external link) — used by both the homepage grid and the dedicated page's
// featured/list layout so the click behaviour never has to be duplicated.
function ServiceCta({ it, onFormOpen, onPopup, light = false }) {
    const cls = `inline-flex items-center gap-1.5 mt-5 font-medium text-sm group/cta cursor-pointer ${
        light ? "text-white" : "text-[#024396] hover:text-[#012E6B]"
    }`;
    const arrow = (
        <span aria-hidden className="transition-transform group-hover/cta:translate-x-1">
            →
        </span>
    );
    if (it.isForm) {
        return (
            <button type="button" onClick={onFormOpen} className={cls}>
                {it.cta} {arrow}
            </button>
        );
    }
    if (it.isPopup) {
        return (
            <button type="button" onClick={onPopup} className={`${cls} bg-transparent border-none p-0`}>
                {it.cta} {arrow}
            </button>
        );
    }
    return (
        <a href={it.href} target="_blank" rel="noopener noreferrer" className={cls}>
            {it.cta} {arrow}
        </a>
    );
}
