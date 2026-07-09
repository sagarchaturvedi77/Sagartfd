import { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

// Applies the portal's dark/light theme to document.body — needed because
// Radix Dialog/Sheet/DropdownMenu render their content via a Portal
// straight into document.body, not as a DOM descendant of whatever
// wrapper div we're in, so scoping the "dark" class to a local wrapper
// alone would leave modals unstyled.
//
// Applying to <body> (not <html>) and stripping it on unmount keeps this
// strictly scoped to "while a portal page is mounted" — the instant a
// user navigates to the public marketing site, the class is gone, so
// the public site is never affected by a portal user's theme choice.
export default function usePortalTheme() {
  const { theme } = useTheme();

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    return () => document.body.classList.remove("dark");
  }, [theme]);

  return theme;
}
