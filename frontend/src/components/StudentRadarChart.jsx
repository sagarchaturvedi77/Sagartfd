import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

// Split out of StudentLeaderboard.jsx so recharts (a genuinely heavy chart
// library) is only fetched once a student actually lands on the leaderboard
// page and has radar data to show, instead of shipping inside that page's
// own bundle unconditionally. Mirrors the CalculatorChart.jsx lazy-load
// pattern used on the public Calculators widget.
export default function StudentRadarChart({ radarData }) {
  return (
    <ResponsiveContainer>
      <RadarChart data={radarData} outerRadius="75%">
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} />
        <Radar dataKey="value" stroke="#14E0A0" fill="#14E0A0" fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
