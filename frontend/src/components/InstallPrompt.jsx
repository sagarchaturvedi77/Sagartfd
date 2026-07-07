import React from "react";
import BrandLogo from "./BrandLogo";

// Capture the beforeinstallprompt event as early as possible
let deferredPrompt = null;
const promptListeners = [];
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    promptListeners.forEach((fn) => fn(e));
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    localStorage.setItem("tfd_install_dismissed", "1");
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [open, setOpen] = React.useState(false);
  const [ios, setIos] = React.useState(false);

  React.useEffect(() => {
    // Don't show install prompt if already installed or running in app/webview
    if (isStandalone()) return;
    if (localStorage.getItem("tfd_install_dismissed") === "1") return;

    const showPrompt = () => {
      setIos(isIOS());
      setOpen(true);
    };

    // If deferred prompt already captured, auto-trigger install immediately
    if (deferredPrompt) {
      // Auto trigger install prompt after short delay
      const timer = setTimeout(() => {
        triggerInstall();
      }, 500);
      return () => clearTimeout(timer);
    }

    if (isIOS()) {
      const timer = setTimeout(showPrompt, 800);
      return () => clearTimeout(timer);
    }

    // Wait for the event to fire (up to 4s)
    const handler = () => {
      // Auto trigger install as soon as event is captured
      setTimeout(() => triggerInstall(), 300);
    };
    promptListeners.push(handler);
    const timeout = setTimeout(() => {
      if (deferredPrompt) triggerInstall();
      else if (isIOS()) showPrompt();
    }, 4000);

    return () => {
      clearTimeout(timeout);
      const idx = promptListeners.indexOf(handler);
      if (idx >= 0) promptListeners.splice(idx, 1);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      setIos(isIOS());
      setOpen(true);
      return;
    }
    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (result.outcome === "accepted") {
        localStorage.setItem("tfd_install_dismissed", "1");
        setOpen(false);
        return;
      }
      // User dismissed - show banner
      setOpen(true);
    } catch {
      setOpen(true);
    }
  };

  const dismiss = () => {
    localStorage.setItem("tfd_install_dismissed", "1");
    setOpen(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (result.outcome === "accepted") {
        dismiss();
        return;
      }
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
            <h3 className="font-semibold text-[#0E1B2C] leading-tight">Install TFD WorkSpace</h3>
            <p className="text-xs text-[#2A364B]/60">Get the app on your device</p>
          </div>
        </div>

        {ios ? (
          <p className="text-sm text-[#2A364B]/80 mb-5">
            Tap the <span className="font-semibold">Share</span> icon{" "}
            <span aria-hidden>⎙</span> in Safari, then choose{" "}
            <span className="font-semibold">"Add to Home Screen"</span> to install the app.
          </p>
        ) : (
          <p className="text-sm text-[#2A364B]/80 mb-5">
            Install TFD WorkSpace for one-tap access, faster loading and push
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
              Install App
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
