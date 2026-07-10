import { useEffect, useState, useCallback } from "react";

/** Detects whether the site is already running as the installed Android
 * APK (Trusted Web Activity) or an installed web-app (standalone display
 * mode / iOS "Add to Home Screen"), and exposes the browser's native
 * one-tap install prompt (Android Chrome/Edge) when available. */
export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    const isTWA = document.referrer.startsWith("android-app://");
    setInstalled(isStandalone || isTWA);

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => { setInstalled(true); setDeferredPrompt(null); };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt]);

  const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(window.navigator.userAgent);

  return { installed, canPromptInstall: !!deferredPrompt, promptInstall, isIOS, isAndroid };
}
