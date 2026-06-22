import React from "react";
import { TrendingUp, ShieldCheck, Heart, Activity, Car, Stethoscope } from "lucide-react";

const items = [
    {
        icon: TrendingUp,
        tag: "Wealth Creation",
        title: "Mutual Funds & SIP",
        body: "Goal-based investing across equity, debt, hybrid and ELSS funds. AssetPlus-powered onboarding in under 5 minutes.",
        cta: "Start SIP",
        href: "https://www.assetplus.in/mfd/ARN-290298",
    },
    {
        icon: ShieldCheck,
        tag: "Protection",
        title: "Term Insurance",
        body: "Pure protection plans with high cover at low premiums. We compare LIC, HDFC Life, ICICI Pru, Max Life and more.",
        cta: "Get a Quote",
        href: "https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20a%20Term%20Insurance%20quote.",
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
        href: "https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20to%20compare%20Health%20Insurance.",
    },
    {
        icon: Car,
        tag: "Vehicle Cover",
        title: "Motor Insurance",
        body: "Car & two-wheeler insurance with instant policy issuance and hassle-free claim assistance.",
        cta: "Quick Quote",
        href: "https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20a%20Motor%20Insurance%20quote.",
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

export default function Services() {
    return (
        <section id="services" className="section">
            <div className="container-x">
                <div className="max-w-3xl mb-12">
                    <div className="eyebrow">What we treat</div>
                    <h2 className="h2 mt-3 text-[#0E1B2C]">
                        One doctor for all your{" "}
                        <span className="font-italic-serif text-[#C9802A]">financial prescriptions.</span>
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
                            <article
                                key={it.title}
                                className="card-cream p-6 group hover:border-[#0E5E48] transition-colors relative overflow-hidden"
                                data-testid={`service-card-${idx}`}
                            >
                                <div
                                    aria-hidden
                                    className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[#0E5E48]/5 group-hover:bg-[#0E5E48]/10 transition-colors"
                                />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-[#0E1B2C] grid place-items-center text-[#F6F1E8]">
                                        <Icon size={20} />
                                    </div>
                                    <div className="mt-5 text-[11px] tracking-[0.18em] uppercase text-[#0E5E48] font-semibold">
                                        {it.tag}
                                    </div>
                                    <h3 className="h3 mt-2 text-[#0E1B2C]">{it.title}</h3>
                                    <p className="mt-3 text-[14.5px] text-[#2A364B] leading-relaxed">
                                        {it.body}
                                    </p>
                                    <a
                                        href={it.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-5 text-[#0E5E48] hover:text-[#0A4838] font-medium text-sm"
                                    >
                                        {it.cta} <span aria-hidden>→</span>
                                    </a>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
