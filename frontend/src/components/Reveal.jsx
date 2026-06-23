import React from "react";

/**
 * Reveal: no-op passthrough (animations disabled per user preference).
 * Keeps API stable for components that still import it.
 */
export default function Reveal({ children, className = "", as = "div" }) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
}
