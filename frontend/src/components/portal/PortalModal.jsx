import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { cn } from "../../lib/utils";

/**
 * Replaces the many hand-rolled `fixed inset-0 z-[100] bg-black/50` modals
 * scattered across pages with one Radix-backed dialog (focus trap, Esc to
 * close, scroll lock, accessible labelling all come for free).
 */
export default function PortalModal({ open, onOpenChange, title, description, children, footer, className = "", maxWidth = "max-w-lg" }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidth, "max-h-[85vh] overflow-y-auto bg-white dark:bg-[#101D2E] border-[#E2D8C2] dark:border-white/10", className)}>
        {title ? (
          <DialogHeader>
            <DialogTitle className="font-serif text-[#0E1B2C] dark:text-[#F1EDE3] text-lg">{title}</DialogTitle>
            {description && <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC]">{description}</p>}
          </DialogHeader>
        ) : (
          // Radix requires a DialogTitle for screen readers even when the
          // modal has its own custom heading inside children.
          <DialogTitle className="sr-only">Dialog</DialogTitle>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
