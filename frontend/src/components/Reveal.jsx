import React, { useEffect, useRef, useState } from "react";

/**
 * Reveal: lightweight IntersectionObserver-based fade+slide-up on first scroll into view.
 * Pure CSS transitions — no extra deps.
 */
export default function Reveal({
    children,
    delay = 0,
    y = 24,
    duration = 700,
    once = true,
    className = "",
    as = "div",
}) {
    const ref = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        if (!ref.current || typeof window === "undefined") return;
        // Respect reduced-motion preference
        const reduce =
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
            setShown(true);
            return;
        }
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        setShown(true);
                        if (once) obs.disconnect();
                    } else if (!once) {
                        setShown(false);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
        );
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, [once]);

    const Tag = as;
    const style = {
        transition: `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0,0,0)" : `translate3d(0,${y}px,0)`,
        willChange: "opacity, transform",
    };

    return (
        <Tag ref={ref} style={style} className={className}>
            {children}
        </Tag>
    );
}
