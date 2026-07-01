import React, { useEffect, useState } from "react";

export default function WelcomeAnimation({ userName, onComplete }) {
  const [phase, setPhase] = useState(0); // 0=logo fade in, 1=text, 2=fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onComplete && onComplete(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#0E1B2C] via-[#162d4a] to-[#0E1B2C] transition-opacity duration-700 ${phase === 2 ? "opacity-0" : "opacity-100"}`}
    >
      {/* Background decorative circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#024396]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#024396]/8 rounded-full blur-3xl animate-pulse" />

      <div className="text-center relative">
        {/* Logo */}
        <div
          className={`transition-all duration-700 ease-out ${phase >= 0 ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 translate-y-4"}`}
        >
          <img
            src="/tfd-workspace-logo.png"
            alt="TFD Workspace"
            className="h-32 sm:h-40 mx-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* Welcome text */}
        <div
          className={`mt-8 transition-all duration-700 ease-out delay-200 ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Welcome to <span className="text-[#2563EB]">TFD Workspace</span>
          </h1>
          {userName && (
            <p className="mt-3 text-lg text-white/70 font-medium">
              Hello, {userName}
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
