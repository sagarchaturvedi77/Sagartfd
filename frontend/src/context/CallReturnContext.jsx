import React, { createContext, useCallback, useContext, useEffect, useRef, useState, lazy, Suspense } from "react";
import { useAuth } from "./AuthContext";

// Lazy-loaded: CallFlowPopup (and the ~14 lucide icons + ProtectedText it
// pulls in) is a staff-portal-only "how did the call go?" form. This
// provider wraps the ENTIRE app (see App.js) including every public
// marketing page, so a static top-level import here shipped this
// portal-only code to every public visitor's main.js bundle even though
// outcomeLead/token below is only ever truthy for a logged-in portal user
// mid-call-flow. Deferring it to its own chunk keeps it out of the
// render-blocking shared bundle for the (much more numerous) public site.
const CallFlowPopup = lazy(() => import("../components/CallFlowPopup"));

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MIN_HIDDEN_MS = 3000;
const STORAGE_KEY = "tfd_pending_call";

const CallReturnContext = createContext(null);

/**
 * Portal-wide "just came back from a call" tracker. Any page/component can
 * call startCall(lead) — from the Leads page, the Dashboard's Recent
 * Activity, Today's Follow-ups, wherever a tel: link lives — and the
 * connected/not-connected outcome popup will show up here, once, no matter
 * which page the user is actually on when they return.
 *
 * Pending calls are also persisted to localStorage (not just an in-memory
 * ref) so a call that outlives the page — Android reclaiming the WebView's
 * memory mid-call and reloading it on return, for example — still recovers
 * the popup on the next mount instead of silently losing it.
 */
export function CallReturnProvider({ children }) {
  const { token } = useAuth();
  const [outcomeLead, setOutcomeLead] = useState(null);
  const pendingLead = useRef(null);
  const hiddenAt = useRef(null);
  const listenerAttached = useRef(false);

  const clearPending = useCallback(() => {
    pendingLead.current = null;
    hiddenAt.current = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const handleVisibility = useCallback(() => {
    if (document.visibilityState === "hidden") {
      hiddenAt.current = Date.now();
      return;
    }
    if (pendingLead.current && hiddenAt.current) {
      const elapsed = Date.now() - hiddenAt.current;
      if (elapsed >= MIN_HIDDEN_MS) {
        const lead = pendingLead.current;
        clearPending();
        setOutcomeLead(lead);
      }
    }
  }, [clearPending]);

  const startCall = useCallback((lead) => {
    pendingLead.current = lead;
    hiddenAt.current = null;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lead, startedAt: Date.now() }));
    } catch { /* ignore */ }
    if (!listenerAttached.current) {
      document.addEventListener("visibilitychange", handleVisibility);
      window.addEventListener("focus", handleVisibility);
      listenerAttached.current = true;
    }
    if (lead?.id) {
      fetch(`${API_BASE}/api/leads/${lead.id}/call-started`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [handleVisibility, token]);

  // Recover a call that was in progress when the page got reloaded/killed
  // mid-call — the in-memory refs above are gone in that case, but
  // localStorage survives, so re-open the outcome popup for that lead here.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { lead, startedAt } = JSON.parse(raw);
        if (lead && Date.now() - startedAt >= MIN_HIDDEN_MS) {
          clearPending();
          setOutcomeLead(lead);
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = React.useMemo(() => ({ startCall }), [startCall]);

  return (
    <CallReturnContext.Provider value={value}>
      {children}
      {outcomeLead && token && (
        <Suspense fallback={null}>
          <CallFlowPopup
            lead={outcomeLead}
            token={token}
            onClose={() => setOutcomeLead(null)}
            onSaved={() => {
              setOutcomeLead(null);
              window.dispatchEvent(new CustomEvent("tfd:lead-updated"));
            }}
          />
        </Suspense>
      )}
    </CallReturnContext.Provider>
  );
}

export function useCallReturnContext() {
  const ctx = useContext(CallReturnContext);
  if (!ctx) throw new Error("useCallReturnContext must be used within a CallReturnProvider");
  return ctx;
}
