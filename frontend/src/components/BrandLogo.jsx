import React from "react";

// TFD Workspace logo (served from /public). Falls back to a styled monogram.
export default function BrandLogo({ className = "h-10", rounded = false, variant = "workspace", animate = true }) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div
        className={`${className} aspect-square rounded-xl bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white font-bold tracking-tight`}
      >
        TFD
      </div>
    );
  }

  const src = variant === "workspace" ? "/tfd-workspace-logo.png" : "/tfd-logo.png";

  return (
    <img
      src={src}
      alt="TFD Workspace"
      onError={() => setFailed(true)}
      className={`${className} object-contain ${rounded ? "rounded-xl" : ""} ${
        animate ? "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-700 ease-out drop-shadow-[0_4px_18px_rgba(2,67,150,0.35)]" : ""
      }`}
    />
  );
}
