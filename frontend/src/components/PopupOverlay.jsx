import React from "react";
import { X } from "lucide-react";

export default function PopupOverlay({
    onDismiss,
    testId,
    closeTestId,
    zIndex = 80,
    placement = "center",
    children,
}) {
    const placementClass =
        placement === "bottom"
            ? "place-items-end sm:place-items-center"
            : "place-items-center";

    return (
        <div
            className={`fixed inset-0 z-[${zIndex}] grid ${placementClass} bg-[#0E1B2C]/55 backdrop-blur-sm p-4`}
            onClick={onDismiss}
            data-testid={testId}
        >
            <div onClick={(e) => e.stopPropagation()} className="relative">
                {closeTestId && (
                    <button
                        onClick={onDismiss}
                        aria-label="Close popup"
                        data-testid={closeTestId}
                        className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-[#F6F1E8] hover:bg-[#E2D8C2] text-[#0E1B2C] z-10"
                    >
                        <X size={16} />
                    </button>
                )}
                {children}
            </div>
        </div>
    );
}
