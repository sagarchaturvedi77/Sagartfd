import { useRef, useCallback } from "react";

/**
 * useCallReturn — detects "the employee just came back from a phone call".
 *
 * Usage:
 *   const { startCall } = useCallReturn((lead) => setOutcomeLead(lead));
 *   <a href={`tel:${phone}`} onClick={() => startCall(lead)}>Call</a>
 *
 * How it works: tapping a tel: link backgrounds the browser tab/app while
 * the native dialer takes over. We mark "call started" at that moment, then
 * listen for the tab becoming visible again. If the tab was hidden for at
 * least MIN_HIDDEN_MS (long enough to be an actual call, not an accidental
 * tap-and-cancel), we fire onReturn with the lead that was being called.
 */
const MIN_HIDDEN_MS = 3000;

export default function useCallReturn(onReturn) {
  const pendingLead = useRef(null);
  const hiddenAt = useRef(null);
  const listenerAttached = useRef(false);

  const handleVisibility = useCallback(() => {
    if (document.visibilityState === "hidden") {
      hiddenAt.current = Date.now();
      return;
    }
    // visible again
    if (pendingLead.current && hiddenAt.current) {
      const elapsed = Date.now() - hiddenAt.current;
      if (elapsed >= MIN_HIDDEN_MS) {
        const lead = pendingLead.current;
        pendingLead.current = null;
        hiddenAt.current = null;
        onReturn(lead);
      }
    }
  }, [onReturn]);

  const startCall = useCallback(
    (lead) => {
      pendingLead.current = lead;
      hiddenAt.current = null;
      if (!listenerAttached.current) {
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("focus", handleVisibility);
        listenerAttached.current = true;
      }
    },
    [handleVisibility]
  );

  return { startCall };
}
