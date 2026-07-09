import { useState, useEffect } from "react";

const BREAKPOINT = 768;

/**
 * Reactive mobile/desktop check via matchMedia — replaces the old pattern
 * of reading `window.innerWidth` once at mount/render, which never updated
 * on an actual window resize or device rotation.
 */
export default function useIsMobile(breakpoint = BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
