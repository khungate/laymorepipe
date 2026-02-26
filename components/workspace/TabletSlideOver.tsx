"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TabletSlideOverProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Right-side slide-over panel for the tablet breakpoint (768-1023px).
 * Slides in from the right over a semi-transparent backdrop.
 * Dismiss via close button or backdrop click.
 *
 * NOTE: Content scrolling is managed by sidebarContent internally
 * (accordion section owns overflow-y-auto). This container just provides
 * the fixed-height frame.
 */
export function TabletSlideOver({ open, onClose, children }: TabletSlideOverProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 250ms ease",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ────────────────────────────────────────────────── */}
      <div
        className="fixed top-0 bottom-0 right-0 z-40 w-[380px] flex flex-col bg-background border-l border-border shadow-2xl"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
        aria-modal="true"
        role="dialog"
      >
        {/* Close button */}
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content — sidebarContent manages its own internal scroll */}
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    </>
  );
}
