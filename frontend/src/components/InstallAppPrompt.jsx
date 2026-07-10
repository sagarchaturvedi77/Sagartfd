import React, { useState } from "react";
import { Download, Smartphone, Share } from "lucide-react";
import usePWAInstall from "../hooks/usePWAInstall";
import PortalModal from "./portal/PortalModal";

/** Install row shown on the portal login page — hidden entirely once
 * someone is already inside the installed APK or installed web app.
 * "Install Web App" installs directly with one tap wherever the browser
 * supports it (Android Chrome/Edge); iOS Safari has no such API, so it
 * shows the manual Add-to-Home-Screen steps instead. */
export default function InstallAppPrompt() {
  const { installed, canPromptInstall, promptInstall, isIOS, isAndroid } = usePWAInstall();
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  if (installed) return null;

  const handleWebAppInstall = async () => {
    if (canPromptInstall) {
      await promptInstall();
    } else if (isIOS) {
      setShowIOSSteps(true);
    }
  };

  const showWebAppButton = canPromptInstall || isIOS;

  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
      {isAndroid && (
        <a
          href="/TFD-Workspace.apk"
          download
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-[#E2D8C2] dark:border-white/15 text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3] hover:bg-[#FBF7EE] dark:hover:bg-white/5 transition-colors"
        >
          <Download size={15} /> Install APK (Android)
        </a>
      )}
      {showWebAppButton && (
        <button
          onClick={handleWebAppInstall}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-[#E2D8C2] dark:border-white/15 text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3] hover:bg-[#FBF7EE] dark:hover:bg-white/5 transition-colors"
        >
          <Smartphone size={15} /> Install Web App
        </button>
      )}

      <PortalModal open={showIOSSteps} onOpenChange={setShowIOSSteps} title="Install on iPhone / iPad" maxWidth="max-w-sm">
        <div className="space-y-3 text-sm text-[#2A364B] dark:text-[#C7CEDA]">
          <p>iOS doesn't let browsers install apps directly — do it in two taps from Safari:</p>
          <ol className="space-y-2 list-decimal list-inside">
            <li className="flex items-center gap-2">Tap the <Share size={14} className="inline" /> Share icon in Safari's toolbar</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
          </ol>
        </div>
      </PortalModal>
    </div>
  );
}
