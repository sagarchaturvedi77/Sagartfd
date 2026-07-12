import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

// Reads {sub, role, exp} straight out of the JWT locally — no network, no
// signature check (the backend still enforces the real check on every API
// call). This only powers an optimistic "am I logged in" state so the app
// doesn't have to wait on a round-trip before rendering.
function decodeTokenPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  return !payload?.exp || payload.exp * 1000 < Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("tfd_token"));
  const [loading, setLoading] = useState(true);
  // Employee onboarding is mandatory — checked once per session here (not
  // per-page in ProtectedRoute) so navigating between already-unlocked pages
  // doesn't re-fetch/flash a loading state every time.
  const [profileCompleted, setProfileCompleted] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);

  const refreshProfileStatus = React.useCallback(() => {
    if (!token) return Promise.resolve();
    return fetch(`${API_BASE}/api/profile-status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setProfileCompleted(!!data.profile_completed); })
      .catch(() => {})
      .finally(() => setProfileChecked(true));
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const payload = decodeTokenPayload(token);
    if (!payload || isTokenExpired(payload)) {
      // Token itself is unusable (malformed or past its own expiry) — no
      // network call can save this one.
      localStorage.removeItem("tfd_token");
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Optimistic session from the token alone — matters right after an iOS
    // PWA is killed by the app-switcher and relaunched, where the network
    // may not be ready for the first fetch yet. Without this, a slow/failed
    // /api/auth/me on that first render used to look identical to "your
    // session is invalid" and wiped a perfectly good 90-day token.
    setUser((prev) => prev || { id: payload.sub, role: payload.role, _provisional: true });
    setLoading(false);

    const checkSession = () =>
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => {
          if (r.status === 401 || r.status === 403) {
            // The backend itself rejected this token — it really is invalid
            // server-side (revoked, tampered, or the account was disabled —
            // get_current_user_payload re-checks is_active on every call),
            // not just unreachable.
            localStorage.removeItem("tfd_token");
            setToken(null);
            setUser(null);
            return null;
          }
          return r.ok ? r.json() : null;
        })
        .then((data) => {
          if (data) setUser(data);
          // Anything else — network error, timeout, 5xx, a cold-starting
          // backend — is a "couldn't check right now", not a logout. Keep
          // the optimistic session; real API calls elsewhere still carry
          // this same bearer token and are unaffected either way.
        })
        .catch(() => { /* network error — keep the optimistic session */ });

    checkSession();
    if (payload.role === "employee") refreshProfileStatus();
    // Re-check periodically so an admin disabling this employee's login
    // takes effect on their already-open tab within a couple of minutes,
    // not only the next time they happen to reload — API calls made
    // in-between would eventually 401 too, but most portal pages don't
    // fail loudly on a background fetch error, so this is the reliable path.
    const interval = setInterval(checkSession, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (phone, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.detail === "account_disabled") {
        // A disabled (or resigned-less-than-a-week-ago) account shouldn't
        // be told it's been disabled — this promise deliberately never
        // resolves or rejects, so the caller's "signing in..." state just
        // stays put forever instead of showing an error.
        return new Promise(() => {});
      }
      if (err.detail?.code === "resigned") {
        const name = err.detail.name || "there";
        throw new Error(
          `Dear ${name}, your association with The Financial Doctor has ended following your resignation. ` +
          `You are no longer part of our team, and access to this portal has been disabled. We sincerely thank you ` +
          `for your contributions during your time with us and wish you the very best in your future endeavours.`
        );
      }
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("tfd_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("tfd_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, profileCompleted, profileChecked, refreshProfileStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
