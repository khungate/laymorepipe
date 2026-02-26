"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Eye } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

type SheetState = "peek" | "half" | "full";

/**
 * Portrait peek: drag handle (36px) + structure summary card (~106px) = 142px
 * Landscape peek: drag handle fills full height so the compact summary is visible
 * in the remaining space. Reduced to 60px so the drawing gets more room.
 */
const PORTRAIT_PEEK_HEIGHT = 142;
const LANDSCAPE_PEEK_HEIGHT = 60;

function getSnapTranslateY(
  state: SheetState,
  windowHeight: number,
  peekHeight: number
): number {
  const sheetH = windowHeight * 0.92; // sheet is 92vh tall
  switch (state) {
    case "full":
      return 0;
    case "half":
      return sheetH - windowHeight * 0.52; // leaves 52vh visible
    case "peek":
      return sheetH - peekHeight;
  }
}

interface MobileBottomSheetProps {
  children: React.ReactNode;
  /**
   * One-line compact summary shown in the drag handle area when in landscape
   * peek state (e.g. "3′×3′ · 14 units · 0.807 CY").
   */
  compactSummary?: string;
}

/**
 * iOS-style bottom sheet for the mobile workspace layout.
 *
 * Three snap states:
 *   peek  — only PEEK_HEIGHT visible (structure summary + drag handle)
 *   half  — 52vh visible (shows accordion sections)
 *   full  — 92vh visible (full editing)
 *
 * Improvements vs. original:
 * - Visual Viewport API: adjusts position when the on-screen keyboard opens
 *   so focused inputs are never hidden behind the keyboard.
 * - Landscape detection: uses a reduced PEEK_HEIGHT in landscape orientation
 *   so the engineering drawing has enough vertical space.
 * - Peek button: visible when sheet is half/full, tapping snaps back to peek
 *   so users can quickly check the drawing without dragging.
 * - Compact summary: shows a one-liner in the drag handle area when in
 *   landscape peek mode.
 */
export function MobileBottomSheet({ children, compactSummary }: MobileBottomSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const [dragTranslateY, setDragTranslateY] = useState<number | null>(null);
  const [windowH, setWindowH] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Landscape: reduce peek height so the drawing gets more vertical room
  const isLandscape = useMediaQuery(
    "(orientation: landscape) and (max-height: 500px)"
  );
  const PEEK_HEIGHT = isLandscape ? LANDSCAPE_PEEK_HEIGHT : PORTRAIT_PEEK_HEIGHT;

  const startDragRef = useRef<{ clientY: number; translateY: number } | null>(null);
  const velocityPointsRef = useRef<{ y: number; time: number }[]>([]);

  // Track layout window height for snap calculations.
  // We use window.innerHeight (not visualViewport.height) for layout so that
  // keyboard presence doesn't affect snap point maths — we handle that
  // separately via keyboardOffset.
  useEffect(() => {
    const update = () => setWindowH(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── Visual Viewport — keyboard handling ─────────────────────────────
  // When the on-screen keyboard opens, visualViewport.height shrinks.
  // We shift the sheet's `bottom` property upward by the keyboard height so
  // inputs are never hidden behind it, and auto-snap to "full" to give the
  // user maximum editing space.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handler = () => {
      // offsetTop handles cases where the address bar is partially visible
      const offset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop ?? 0));
      setKeyboardOffset(offset);
      if (offset > 50) {
        // Keyboard is open — give the user maximum editing space
        setSheetState("full");
        setDragTranslateY(null);
      }
    };

    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);
    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
    };
  }, []);

  const isDragging = dragTranslateY !== null;

  const currentTranslateY = isDragging
    ? dragTranslateY
    : getSnapTranslateY(sheetState, windowH, PEEK_HEIGHT);

  const sheetStyle: React.CSSProperties = {
    transform: `translateY(${currentTranslateY}px)`,
    bottom: keyboardOffset,
    transition: isDragging
      ? "none"
      : "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), bottom 120ms ease",
    willChange: "transform",
  };

  const snapToState = useCallback(
    (state: SheetState) => {
      setSheetState(state);
      setDragTranslateY(null);
    },
    []
  );

  // ── Snap logic (shared between touch and mouse) ────────────────────
  const resolveSnap = useCallback(
    (currentY: number, velocity: number): SheetState => {
      const sheetH = windowH * 0.92;
      const snapPoints: { state: SheetState; y: number }[] = [
        { state: "full", y: 0 },
        { state: "half", y: sheetH - windowH * 0.52 },
        { state: "peek", y: sheetH - PEEK_HEIGHT },
      ];

      let closest = snapPoints.reduce((acc, sp) =>
        Math.abs(sp.y - currentY) < Math.abs(acc.y - currentY) ? sp : acc
      );

      const stateOrder: SheetState[] = ["peek", "half", "full"];
      const currentIdx = stateOrder.indexOf(closest.state);
      if (velocity < -350 && currentIdx < 2) {
        closest = snapPoints.find((sp) => sp.state === stateOrder[currentIdx + 1])!;
      } else if (velocity > 350 && currentIdx > 0) {
        closest = snapPoints.find((sp) => sp.state === stateOrder[currentIdx - 1])!;
      }

      return closest.state;
    },
    [windowH, PEEK_HEIGHT]
  );

  const finishDrag = useCallback(
    (currentY: number) => {
      const pts = velocityPointsRef.current;
      let velocity = 0;
      if (pts.length >= 2) {
        const first = pts[0];
        const last = pts[pts.length - 1];
        const dt = last.time - first.time;
        if (dt > 0) velocity = ((last.y - first.y) / dt) * 1000;
      }
      const newState = resolveSnap(currentY, velocity);
      setSheetState(newState);
      setDragTranslateY(null);
      startDragRef.current = null;
      velocityPointsRef.current = [];
    },
    [resolveSnap]
  );

  // ── Touch handlers ────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const touch = e.touches[0];
      const startY = getSnapTranslateY(sheetState, windowH, PEEK_HEIGHT);
      startDragRef.current = { clientY: touch.clientY, translateY: startY };
      velocityPointsRef.current = [{ y: touch.clientY, time: Date.now() }];
    },
    [sheetState, windowH, PEEK_HEIGHT]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (!startDragRef.current) return;

      const touch = e.touches[0];
      const delta = touch.clientY - startDragRef.current.clientY;
      const newY = startDragRef.current.translateY + delta;

      const maxY = windowH * 0.92 - PEEK_HEIGHT;
      setDragTranslateY(Math.max(0, Math.min(maxY, newY)));

      const now = Date.now();
      velocityPointsRef.current.push({ y: touch.clientY, time: now });
      velocityPointsRef.current = velocityPointsRef.current.filter(
        (p) => now - p.time < 100
      );
    },
    [windowH, PEEK_HEIGHT]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (!startDragRef.current) {
        setDragTranslateY(null);
        return;
      }
      const currentY = dragTranslateY ?? getSnapTranslateY(sheetState, windowH, PEEK_HEIGHT);
      finishDrag(currentY);
    },
    [dragTranslateY, sheetState, windowH, PEEK_HEIGHT, finishDrag]
  );

  // ── Mouse handlers (desktop dev-mode testing) ────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startY = getSnapTranslateY(sheetState, windowH, PEEK_HEIGHT);
      startDragRef.current = { clientY: e.clientY, translateY: startY };
      velocityPointsRef.current = [{ y: e.clientY, time: Date.now() }];

      const onMove = (ev: MouseEvent) => {
        if (!startDragRef.current) return;
        const delta = ev.clientY - startDragRef.current.clientY;
        const newY = startDragRef.current.translateY + delta;
        const maxY = windowH * 0.92 - PEEK_HEIGHT;
        setDragTranslateY(Math.max(0, Math.min(maxY, newY)));
        const now = Date.now();
        velocityPointsRef.current.push({ y: ev.clientY, time: now });
        velocityPointsRef.current = velocityPointsRef.current.filter(
          (p) => now - p.time < 100
        );
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (!startDragRef.current) {
          setDragTranslateY(null);
          return;
        }
        const currentY =
          dragTranslateY ?? getSnapTranslateY(sheetState, windowH, PEEK_HEIGHT);
        finishDrag(currentY);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheetState, windowH, PEEK_HEIGHT, finishDrag]
  );

  if (windowH === 0) return null; // Wait for client mount

  const sheetHeight = windowH * 0.92;
  const showPeekButton = sheetState === "half" || sheetState === "full";
  const showCompactSummary = isLandscape && !!compactSummary;

  // In landscape, the drag handle fills the entire PEEK_HEIGHT (60px)
  // so the compact summary fits inside it. In portrait, 36px.
  const handleHeight = showCompactSummary ? LANDSCAPE_PEEK_HEIGHT : 36;

  return (
    <div
      className="fixed inset-x-0 z-40 flex flex-col rounded-t-2xl border-t border-border bg-background shadow-2xl"
      style={{
        height: sheetHeight,
        ...sheetStyle,
      }}
    >
      {/* ── Drag handle ──────────────────────────────────────────────
          Intercepts all touch/mouse events for drag-to-resize.
          In landscape, also shows the compact summary line so users
          see key dimensions without needing to expand the sheet.
      */}
      <div
        className="shrink-0 flex flex-col justify-start touch-none select-none cursor-grab active:cursor-grabbing"
        style={{ height: handleHeight }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        aria-label="Drag to resize panel"
      >
        {/* Drag pill row — always present */}
        <div className="flex items-center justify-center relative h-9 pt-2 pb-1">
          <div className="w-8 h-1 rounded-full bg-border" />

          {/* Peek-at-drawing button — only in half/full state */}
          {showPeekButton && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                snapToState("peek");
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="Peek at drawing"
              title="Peek at drawing"
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Compact summary — landscape peek only */}
        {showCompactSummary && sheetState === "peek" && (
          <div className="px-3 pb-1">
            <p className="text-[11px] font-mono text-muted-foreground truncate leading-none">
              {compactSummary}
            </p>
          </div>
        )}
      </div>

      {/* ── Sheet content ─────────────────────────────────────────────
          No overflow on this container — sidebarContent manages its own
          internal scroll (accordion section owns overflow-y-auto).
          This prevents triple-nested scroll containers that break iOS Safari.
      */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
