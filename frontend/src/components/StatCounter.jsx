import React, { useEffect, useRef, useState } from "react";

// Animated count-up stat strip for the homepage — genuinely different from
// the static number blocks used elsewhere on the site (Hero's inline trio,
// city-page badges, etc). Counts up from 0 to each stat's numeric value the
// first time the strip scrolls into view, then holds. Respects
// prefers-reduced-motion (shows the final value immediately, no animation)
// per the brief's instruction to keep this tasteful for a financial brand,
// not a startup-landing-page gimmick.
function useCountUp(target, active, duration = 1400) {
    const [value, setValue] = useState(0);
    const startedRef = useRef(false);

    useEffect(() => {
        if (!active || startedRef.current) return undefined;
        startedRef.current = true;

        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (reduceMotion) {
            setValue(target);
            return undefined;
        }

        let raf;
        const start = performance.now();
        const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            // ease-out-cubic — quick start, gentle settle, no bounce/overshoot
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => raf && cancelAnimationFrame(raf);
    }, [active, target, duration]);

    return value;
}

function StatTile({ stat, active, accent }) {
    const count = useCountUp(stat.value, active);
    return (
        <div className="flex-1 min-w-[120px]">
            <div className="font-display text-3xl sm:text-4xl text-[#F6F1E8] tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
                {stat.prefix}
                {count.toLocaleString("en-IN")}
                {stat.suffix}
            </div>
            <div className="text-[11px] sm:text-xs uppercase tracking-[0.16em] mt-1.5" style={{ color: accent }}>
                {stat.label}
            </div>
        </div>
    );
}

// Real figures already in use sitewide (Hero's "1000+ families", "40+ AMC
// partners", Home's "35+ cities" banner, About's "8+ years") — reused here,
// not invented for this strip.
const STATS = [
    { value: 1000, suffix: "+", label: "Families Served" },
    { value: 8, suffix: "+", label: "Years Active" },
    { value: 40, suffix: "+", label: "AMC & Insurer Partners" },
    { value: 35, suffix: "+", label: "Cities Served" },
];

export default function StatCounter({ accent = "#D8B98A" }) {
    const [active, setActive] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setActive(true);
            },
            { threshold: 0.35 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={ref} className="bg-[#0E1B2C] py-8 sm:py-10 px-6" data-testid="home-stat-counter">
            <div className="container-x flex flex-wrap sm:flex-nowrap items-start gap-x-6 gap-y-5 sm:gap-x-8 sm:justify-between">
                {STATS.map((stat) => (
                    <StatTile key={stat.label} stat={stat} active={active} accent={accent} />
                ))}
            </div>
        </section>
    );
}
