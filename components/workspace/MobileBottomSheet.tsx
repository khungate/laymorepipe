"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

type SheetState = "peek" | "half" | "full";

// How much of the sheet is visible in each state.
// 142px = 36px drag handle + ~106px for the structure summary card (p-3 wrapper).
const PEEK_HEIGHT = 142; // px — drag handle + structure summary

function getSnapTranslateY(state: SheetState, windowHeight: number): number {
  const sheetH = windowHeight * 0.92; // sheet is 92vh tall
  switch (state) {
    case "full": return 0;
    case "half": return sheetH - windowHeight * 0.52; // leaves 52vh visible
    case "peek": return sheetH - PEEK_HEIGHT;
  }
}

interface MobileBottomSheetProps {
  children: React.ReactNode;
}

/**
 * iOS-style bottom sheet for the mobile workspace layout.
 *
 * Three snap states:
 *   peek  — only PEEK_HEIGHT visible (structure summary + drag handle)
 *   half  — 52vh visible (shows accordion sections)
 *   full  — 92vh visible (full editing)
 *
 * The drag handle intercepts touch; drawing canvas below is still pannable
 * because CSS transforms correctly shift the hit area.
 */
export function MobileBottomSheet({ children }: MobileBottomSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const [dragTranslateY, setDragTranslateY] = useState<number | null>(null);
  const [windowH, setWindowH] = useState(0);

  const startDragRef = useRef<{ clientY: number; translateY: number } | null>(null);
  const velocityPointsRef = useRef<{ y: number; time: number }[]>([]);

  // Track window height for snap calculations.
  useEffect(() => {
    const update = () => setWindowH(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isDragging = dragTranslateY !== null;

  const currentTranslateY =
    isDragging ? dragTranslateY : getSnapTranslateY(sheetState, windowH);

  const sheetStyle: React.CSSProperties = {
    transform: `translateY(${currentTranslateY}px)`,
    transition: isDragging
      ? "none"
      : "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
    willChange: "transform",
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const touch = e.touches[0];
      const startY = getSnapTranslateY(sheetState, windowH);
      startDragRef.current = { clientY: touch.clientY, translateY: startY };
      velocityPointsRef.current = [{ y: touch.clientY, time: Date.now() }];
    },
    [sheetState, windowH]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (!startDragRef.current) return;

      const touch = e.touches[0];
      const delta = touch.clientY - startDragRef.current.clientY;
      const newY = startDragRef.current.translateY + delta;

      // Clamp: can't go above full (0) or below peek
      const maxY = windowH * 0.92 - PEEK_HEIGHT;
      setDragTranslateY(Math.max(0, Math.min(maxY, newY)));

      // Track for velocity
      const now = Date.now();
      velocityPointsRef.current.push({ y: touch.clientY, time: now });
      // Keep only the last 100ms
      velocityPointsRef.current = velocityPointsRef.current.filter(
        (p) => now - p.time < 100
      );
    },
    [windowH]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (!startDragRef.current) {
        setDragTranslateY(null);
        return;
      }

      const currentY = dragTranslateY ?? getSnapTranslateY(sheetState, windowH);

      // Compute velocity from recent points (px/s, positive = moving down)
      const pts = velocityPointsRef.current;
      let velocity = 0;
      if (pts.length >= 2) {
        const first = pts[0];
        const last = pts[pts.length - 1];
        const dt = last.time - first.time;
        if (dt > 0) velocity = ((last.y - first.y) / dt) * 1000;
      }

      const sheetH = windowH * 0.92;
      const snapPoints: { state: SheetState; y: number }[] = [
        { state: "full", y: 0 },
        { state: "half", y: sheetH - windowH * 0.52 },
        { state: "peek", y: sheetH - PEEK_HEIGHT },
      ];

      // Find closest snap by distance
      let closest = snapPoints.reduce((acc, sp) =>
        Math.abs(sp.y - currentY) < Math.abs(acc.y - currentY) ? sp : acc
      );

      // Velocity override: >350 px/s counts as a directional swipe
      const stateOrder: SheetState[] = ["peek", "half", "full"];
      const currentIdx = stateOrder.indexOf(closest.state);
      if (velocity < -350 && currentIdx < 2) {
        // Swiping up → go one state more open
        closest = snapPoints.find((sp) => sp.state === stateOrder[currentIdx + 1])!;
      } else if (velocity > 350 && currentIdx > 0) {
        // Swiping down → go one state more closed
        closest = snapPoints.find((sp) => sp.state === stateOrder[currentIdx - 1])!;
      }

      setSheetState(closest.state);
      setDragTranslateY(null);
      startDragRef.current = null;
      velocityPointsRef.current = [];
    },
    [dragTranslateY, sheetState, windowH]
  );

  // Same handlers for mouse drag (desktop dev mode testing)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startY = getSnapTranslateY(sheetState, windowH);
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

      const onUp = (ev: MouseEvent) => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);

        if (!startDragRef.current) {
          setDragTranslateY(null);
          return;
        }
        const currentY = dragTranslateY ?? getSnapTranslateY(sheetState, windowH);
        const pts = velocityPointsRef.current;
        let velocity = 0;
        if (pts.length >= 2) {
          const first = pts[0];
          const last = pts[pts.length - 1];
          const dt = last.time - first.time;
          if (dt > 0) velocity = ((last.y - first.y) / dt) * 1000;
        }
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
        setSheetState(closest.state);
        setDragTranslateY(null);
        startDragRef.current = null;
        velocityPointsRef.current = [];
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheetState, windowH]
  );

  if (windowH === 0) return null; // Wait for client mount

  const sheetHeight = windowH * 0.92;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl border-t border-border bg-background shadow-2xl"
      style={{
        height: sheetHeight,
        ...sheetStyle,
      }}
    >
      {/* ── Drag handle ────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-center h-[36px] pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        aria-label="Drag to resize panel"
      >
        <div className="w-8 h-1 rounded-full bg-border" />
      </div>

      {/* ── Sheet content ───────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
