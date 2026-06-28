import React from "react";

// Local TFD logo asset (served from /public). Falls back to a styled monogram
// if the image fails to load so the UI never shows a broken-image icon.
export default function BrandLogo({ className = "h-10", rounded = false }) {
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

  return (
    <img
      src="/tfd-logo.png"
      alt="The Financial Doctor"
      onError={() => setFailed(true)}
      className={`${className} object-contain ${rounded ? "rounded-xl" : ""}`}
    />
  );
}
