import React from "react";

export function FormFieldBlock({ label, required, children }) {
    return (
        <div>
            <label className="text-[12px] uppercase tracking-[0.1em] text-[#5C677D] mb-1.5 block">
                {label} {required && <span className="text-[#C7102E]">*</span>}
            </label>
            {children}
        </div>
    );
}

export function FormFieldInline({ label, required, children }) {
    return (
        <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-[#5C677D] mb-2">
                {label}
                {required && <span className="text-[#C7102E] ml-0.5">*</span>}
            </span>
            {children}
        </label>
    );
}
