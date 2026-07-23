import React, { useState } from "react";
import { Link } from "react-router-dom";

// Projects real lat/lng onto a simple equirectangular grid scaled to
// India's bounding box (lat 8-37, lng 68-97) — genuine relative
// positioning, not a stock map embed (no API key / external map
// dependency) and not a hand-drawn coastline (a wrong-looking hand-drawn
// India outline would look worse than no outline at all). The soft
// diamond backdrop is a deliberately abstract gesture at the landmass,
// not a claim of cartographic accuracy.
const LAT_MIN = 8, LAT_MAX = 37, LNG_MIN = 68, LNG_MAX = 97;
const MAP_W = 640, MAP_H = 620;

function project(lat, lng) {
    const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W;
    const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H;
    return { x, y };
}

export default function LocationsMap({ cities }) {
    const [hovered, setHovered] = useState(null);
    const points = cities.filter((c) => c.lat && c.lng).map((c) => ({ ...c, ...project(c.lat, c.lng) }));
    const home = points.find((p) => p.slug === "sehore");

    return (
        <div className="relative bg-[#0E1B2C] rounded-3xl border border-[#2A364B] overflow-hidden">
            <div
                aria-hidden
                className="absolute inset-0 opacity-40"
                style={{ background: "radial-gradient(ellipse at 35% 45%, rgba(2,67,150,0.5) 0%, transparent 60%)" }}
            />
            <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full h-auto relative" role="img" aria-label="Map of cities served by The Financial Doctor across India">
                {/* Soft abstract landmass gesture, not a precise outline */}
                <ellipse cx={MAP_W * 0.42} cy={MAP_H * 0.5} rx={MAP_W * 0.36} ry={MAP_H * 0.46} fill="#152238" opacity="0.6" />

                {/* Constellation lines from the Sehore home base to every other city */}
                {home && points.filter((p) => p.slug !== "sehore").map((p) => (
                    <line
                        key={`line-${p.slug}`}
                        x1={home.x} y1={home.y} x2={p.x} y2={p.y}
                        stroke="#D8B98A"
                        strokeWidth="0.6"
                        opacity={hovered === p.slug ? 0.7 : 0.15}
                    />
                ))}

                {points.map((p) => {
                    const isHome = p.slug === "sehore";
                    const isHovered = hovered === p.slug;
                    return (
                        <g key={p.slug}>
                            {isHome && <circle cx={p.x} cy={p.y} r={isHovered ? 14 : 10} fill="#C7102E" opacity="0.25" />}
                            <Link to={`/mutual-fund-distributor-in-${p.slug}`}>
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isHome ? 5.5 : isHovered ? 5 : 3.5}
                                    fill={isHome ? "#C7102E" : "#D8B98A"}
                                    stroke="#0E1B2C"
                                    strokeWidth="1.5"
                                    onMouseEnter={() => setHovered(p.slug)}
                                    onMouseLeave={() => setHovered(null)}
                                    style={{ cursor: "pointer", transition: "r 0.15s" }}
                                />
                            </Link>
                            {(isHovered || isHome) && (
                                <text
                                    x={p.x}
                                    y={p.y - 10}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fontWeight={isHome ? 700 : 500}
                                    fill="#F6F1E8"
                                    style={{ pointerEvents: "none" }}
                                >
                                    {p.name}{isHome ? " (HQ)" : ""}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[11px] text-[#F6F1E8]/60">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C7102E] inline-block" /> Sehore (HQ)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D8B98A] inline-block" /> City served</span>
            </div>
        </div>
    );
}
