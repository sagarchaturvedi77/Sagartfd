import React from "react";
import BrandLogo from "./BrandLogo";

// "Add to Home Screen" popup. Shown once after login.
// - Android/Chrome: uses the captured `beforeinstallprompt` event for a native install.
// - iOS Safari: shows manual "Share -> Add to Home Screen" instructions (iOS has no prompt API).
let deferredPrompt = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [open, setOpen] = React.useState(false);
  const [ios, setIos] = React.useState(false);

  React.useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem("tfd_install_dismissed") === "1") return;
    const timer = setTimeout(() => {
      setIos(isIOS());
      // Show if we have a native prompt OR it's iOS (manual flow)
      if (deferredPrompt || isIOS()) setOpen(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem("tfd_install_dismissed", "1");
    setOpen(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
    dismiss();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-[slideUp_0.25s_ease]">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#0E1B2C] rounded-xl p-2">
            <BrandLogo className="h-9" />
          </div>
          <div>
            <h3 className="font-semibold text-[#0E1B2C] leading-tight">Install TFD Workspace</h3>
            <p className="text-xs text-[#2A364B]/60">Add to your home screen</p>
          </div>
        </div>

        {ios ? (
          <p className="text-sm text-[#2A364B]/80 mb-5">
            Tap the <span className="font-semibold">Share</span> icon{" "}
            <span aria-hidden>⎙</span> in Safari, then choose{" "}
            <span className="font-semibold">"Add to Home Screen"</span> to install the app
            with the TFD logo.
          </p>
        ) : (
          <p className="text-sm text-[#2A364B]/80 mb-5">
            Install the app on your phone for one-tap access, faster loading and push
            notifications — just like a native app.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2] hover:bg-[#F5F1EB] transition-all"
          >
            Not now
          </button>
          {!ios && (
            <button
              onClick={install}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] transition-all shadow-lg shadow-[#024396]/25"
            >
              Install
            </button>
          )}
          {ios && (
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] transition-all shadow-lg shadow-[#024396]/25"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
