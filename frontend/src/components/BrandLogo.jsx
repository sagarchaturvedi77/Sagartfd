import React from "react";

// TFD Workspace logo (served from /public). Falls back to a styled monogram.
export default function BrandLogo({ className = "h-10", rounded = false, variant = "workspace" }) {
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
      className={`${className} object-contain ${rounded ? "rounded-xl" : ""}`}
    />
  );
}
