import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "tfd_theme"; // "light" | "dark"

function getInitialTheme() {
  const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (saved === "light" || saved === "dark") return saved;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

// Scoped to the portal only — deliberately does NOT touch
// document.documentElement, so the public marketing site (which never
// reads this context) can never be affected by a portal user's theme
// choice. Pages that support dark mode apply the "dark" class to their
// own root wrapper via useTheme()'s `theme` value instead.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
