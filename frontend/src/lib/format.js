export function fmtINR(n) {
    if (!Number.isFinite(Number(n))) return "\u20B90";
    const v = Number(n);
    if (v >= 1e7) return `\u20B9${(v / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `\u20B9${(v / 1e5).toFixed(2)} L`;
    if (v >= 1e3) return `\u20B9${(v / 1e3).toFixed(1)} K`;
    return `\u20B9${Math.round(v).toLocaleString("en-IN")}`;
}

export function fmtINRFull(n) {
    return `\u20B9${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
}

export function fmtPct(v) {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
    return `${Number(v).toFixed(1)}%`;
}
