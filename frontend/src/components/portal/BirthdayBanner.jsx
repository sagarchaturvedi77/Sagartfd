import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PortalModal from "./PortalModal";
import { Button } from "../ui/button";

// user.is_birthday_today comes straight from /api/auth/me (auth_routes.py's
// to_user_out) — dob lives in employee_profiles, matched against today's
// month+day server-side, so this needs no extra network round-trip here.
// The header bar's own birthday styling lives in PortalLayout.jsx (a
// conditional class on the existing fixed header) rather than a second
// banner bar here, to avoid disturbing the fixed-header-height layout math
// every page is calibrated against.
export default function BirthdayBanner() {
  const { user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!user?.is_birthday_today) return;
    const today = new Date().toISOString().slice(0, 10);
    const dismissedKey = `tfd_birthday_popup_seen_${today}`;
    if (localStorage.getItem(dismissedKey)) return;
    setShowPopup(true);
  }, [user?.is_birthday_today]);

  if (!user?.is_birthday_today) return null;

  const dismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`tfd_birthday_popup_seen_${today}`, "1");
    setShowPopup(false);
  };

  return (
    <PortalModal open={showPopup} onOpenChange={(v) => !v && dismiss()} maxWidth="max-w-sm">
      <div className="text-center py-2">
        <div className="text-5xl mb-3">🎉🎂🎉</div>
        <h2 className="text-xl font-serif text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">Happy Birthday, {user.name}!</h2>
        <p className="text-sm text-[#2A364B]/70 dark:text-[#8E99AC]">
          Poori TFD WorkSpace team ki taraf se aapko dher saari shubhkamnayein! Aapka din shandaar ho.
        </p>
        <Button onClick={dismiss} className="mt-5 w-full bg-gradient-to-r from-[#024396] to-[#0356c4]">
          Thank You! 🎈
        </Button>
      </div>
    </PortalModal>
  );
}
