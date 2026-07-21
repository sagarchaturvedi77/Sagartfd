import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

// Extracted out of Calculators.jsx so the recharts bundle (only ever needed
// once a visitor is actually looking at a growth-series calculator tab) can
// be React.lazy()-loaded instead of shipping on every homepage visit.
export default function CalculatorChart({ series, fmtINR }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series || []}>
                <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#024396" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#024396" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C7102E" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#C7102E" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2D8C2" />
                <XAxis dataKey="label" stroke="#5C677D" tick={{ fontSize: 11 }} />
                <YAxis stroke="#5C677D" tick={{ fontSize: 10 }} tickFormatter={fmtINR} width={56} />
                <Tooltip contentStyle={{ background: "#0E1B2C", border: "none", borderRadius: 12, color: "#F6F1E8", fontSize: 12 }} formatter={(v) => fmtINR(v)} />
                <Area type="monotone" dataKey="invested" stroke="#C7102E" strokeWidth={2} fill="url(#gi)" />
                <Area type="monotone" dataKey="value" stroke="#024396" strokeWidth={2.4} fill="url(#gv)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}
