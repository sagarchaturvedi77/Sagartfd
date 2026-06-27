import { useEffect, useState } from "react";

export default function usePopupDismiss(storageKey, showAfterMs) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (localStorage.getItem(storageKey)) return;
        const t = setTimeout(() => setOpen(true), showAfterMs);
        return () => clearTimeout(t);
    }, [storageKey, showAfterMs]);

    const dismiss = (reason = "dismissed") => {
        localStorage.setItem(
            storageKey,
            JSON.stringify({ reason, at: Date.now() })
        );
        setOpen(false);
    };

    return { open, setOpen, dismiss };
}
