import React, { createContext, useContext, useEffect, useState } from "react";

// Fully independent of the TFD WorkSpace AuthContext (context/AuthContext.jsx)
// — different localStorage key, different backend endpoints. The
// internship program is a separate app (headed for its own APK) with no
// login relationship to staff/employee auth; only the admin-facing
// roster/payment screens (inside the staff portal) read this program's
// data, using the admin's own separate login.
const InternshipAuthContext = createContext();
const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const TOKEN_KEY = "tfd_internship_token";

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

export function InternshipAuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = React.useCallback(async (activeToken) => {
    const t = activeToken || token;
    if (!t) return;
    try {
      const res = await fetch(`${API_BASE}/api/internship/me`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setStudent(null);
        return;
      }
      if (res.ok) setStudent(await res.json());
    } catch {
      // network hiccup — keep whatever session state we already have
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setStudent(null);
      setLoading(false);
      return;
    }
    const payload = decodeTokenPayload(token);
    if (!payload || isTokenExpired(payload)) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setStudent(null);
      setLoading(false);
      return;
    }
    refreshMe(token).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const setSession = React.useCallback((accessToken, studentObj) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setStudent(studentObj);
  }, []);

  const login = React.useCallback(async (phone, password) => {
    const res = await fetch(`${API_BASE}/api/internship/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Login failed");
    setSession(data.access_token, data.student);
    return data.student;
  }, [setSession]);

  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setStudent(null);
  }, []);

  // Memoized for the same reason as context/AuthContext.jsx's value — this
  // provider wraps the entire student portal, so an unstable value object
  // here forced every page/widget calling useInternshipAuth() to re-render
  // on every InternshipAuthProvider render, not just when auth state
  // actually changed. That's the kind of thing weaker mobile CPUs feel far
  // more than desktop, which lines up with reports of the portal being
  // especially slow on mobile.
  const value = React.useMemo(
    () => ({ token, student, loading, login, logout, setSession, refreshMe }),
    [token, student, loading, login, logout, setSession, refreshMe]
  );

  return <InternshipAuthContext.Provider value={value}>{children}</InternshipAuthContext.Provider>;
}

export function useInternshipAuth() {
  const ctx = useContext(InternshipAuthContext);
  if (!ctx) throw new Error("useInternshipAuth must be used within InternshipAuthProvider");
  return ctx;
}
