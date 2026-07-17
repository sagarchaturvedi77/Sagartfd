import { useCallback, useRef, useState } from "react";

// Prevents duplicate action-button clicks (status updates, downloads, form
// submits — anything that fires an API call) from firing multiple in-flight
// requests. React state alone isn't enough to guard this: setState is
// async/batched, so a `disabled={saving}` button can still fire a second
// handler call before the first render committing `saving=true` actually
// reaches the DOM (rapid double-click, or the UI just lagging under load).
// The useRef guard here updates synchronously, closing that window
// entirely — a second call while the first is still in flight is a no-op,
// not a second request.
//
// Usage:
//   const [handleSave, saving] = useSubmitOnce(async () => {
//     await apiSend("/api/leads/123/call-outcome", data);
//   });
//   <button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
//
// On success OR failure the button re-enables (nothing stays permanently
// stuck) — the guard's job is only to block *concurrent* duplicate
// requests while one is still pending, not to block a deliberate second
// action once the first has actually finished.
export function useSubmitOnce(action) {
  const inFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const run = useCallback(
    async (...args) => {
      if (inFlightRef.current) return undefined;
      inFlightRef.current = true;
      setIsSubmitting(true);
      try {
        return await action(...args);
      } finally {
        inFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [action]
  );

  return [run, isSubmitting];
}
