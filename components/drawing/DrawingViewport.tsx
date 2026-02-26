"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";

interface DrawingViewportProps {
  children: React.ReactNode;
  /** Logical width of the SVG content (default 900) */
  contentWidth?: number;
  /** Logical height of the SVG content (default 700) */
  contentHeight?: number;
  /**
   * Bottom inset (px) for the zoom controls.
   * Pass a larger value on mobile to keep them above the bottom sheet peek.
   * Default: 12
   */
  bottomOffset?: number;
}

/**
 * Zoomable, pannable engineering drawing viewport.
 *
 * On mount (and whenever the container resizes) the view is automatically
 * fitted so the entire drawing is centred and visible — especially important
 * on small mobile screens where the 900×700 SVG would otherwise be
 * off-screen.
 *
 * Desktop: scroll to zoom, drag to pan.
 * Mobile: pinch to zoom, single-finger drag to pan, double-tap to zoom in/out.
 */
export function DrawingViewport({
  children,
  contentWidth = 900,
  contentHeight = 700,
  bottomOffset = 12,
}: DrawingViewportProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState({ x: 0, y: 0, zoom: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragDistRef = useRef(0);

  // Stores the computed fit-to-container view so resetView always snaps back
  // to the correct fit regardless of container size changes.
  const fitViewRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Whether we've set the initial fit view yet (only do it once)
  const hasInitializedRef = useRef(false);

  // ─── Compute fit-to-container view ───────────────────────────────────
  const computeFitView = useCallback(
    (containerW: number, containerH: number) => {
      if (containerW === 0 || containerH === 0) return { x: 0, y: 0, zoom: 1 };
      const fitZoom =
        Math.min(containerW / contentWidth, containerH / contentHeight) * 0.85;
      const fitX = (containerW - contentWidth * fitZoom) / 2;
      const fitY = (containerH - contentHeight * fitZoom) / 2;
      return { x: fitX, y: fitY, zoom: fitZoom };
    },
    [contentWidth, contentHeight]
  );

  // ─── Track container size; auto-fit on mount ──────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const fit = computeFitView(width, height);
        fitViewRef.current = fit;
        // Only auto-set viewState on the very first measurement (mount)
        if (!hasInitializedRef.current && width > 0 && height > 0) {
          hasInitializedRef.current = true;
          setViewState(fit);
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [computeFitView]);

  // Touch state refs (refs to avoid stale closures in touch handlers)
  const touchStateRef = useRef({
    lastPinchDist: 0,
    lastPinchCenterX: 0,
    lastPinchCenterY: 0,
    isPinching: false,
    touchStartX: 0,
    touchStartY: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
  });

  const zoomToPoint = useCallback(
    (clientX: number, clientY: number, zoomFactor: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pointX = clientX - rect.left;
      const pointY = clientY - rect.top;

      setViewState((prev) => {
        const newZoom = Math.max(0.1, Math.min(8, prev.zoom * zoomFactor));
        const newX = pointX - ((pointX - prev.x) / prev.zoom) * newZoom;
        const newY = pointY - ((pointY - prev.y) / prev.zoom) * newZoom;
        return { x: newX, y: newY, zoom: newZoom };
      });
    },
    []
  );

  // ─── Desktop: wheel to zoom ───
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoomToPoint(e.clientX, e.clientY, delta);
    },
    [zoomToPoint]
  );

  // ─── Desktop: mouse drag to pan ───
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setDragging(true);
        dragDistRef.current = 0;
        setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
      }
    },
    [viewState.x, viewState.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      dragDistRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
      setViewState((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    },
    [dragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // ─── Touch: pinch to zoom, drag to pan, double-tap to toggle zoom ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Prevent browser's native pinch-zoom on the drawing canvas
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault();
    };
    el.addEventListener("touchmove", preventDefault, { passive: false });

    const handleTouchStart = (e: TouchEvent) => {
      const ts = touchStateRef.current;

      if (e.touches.length === 2) {
        // Pinch start
        ts.isPinching = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        ts.lastPinchDist = Math.hypot(dx, dy);
        ts.lastPinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        ts.lastPinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      } else if (e.touches.length === 1) {
        // Single finger — pan start + double-tap detection
        ts.isPinching = false;
        ts.touchStartX = e.touches[0].clientX;
        ts.touchStartY = e.touches[0].clientY;

        const now = Date.now();
        const dt = now - ts.lastTapTime;
        const tapDx = Math.abs(e.touches[0].clientX - ts.lastTapX);
        const tapDy = Math.abs(e.touches[0].clientY - ts.lastTapY);

        if (dt < 300 && tapDx < 30 && tapDy < 30) {
          // Double tap — toggle between zoomed in and fit view
          e.preventDefault();
          setViewState((prev) => {
            if (prev.zoom > 1.5) {
              // Zoom out to fit
              return fitViewRef.current;
            } else {
              // Zoom in 2.5x centred on tap point
              const container = containerRef.current;
              if (!container) return prev;
              const rect = container.getBoundingClientRect();
              const px = e.touches[0].clientX - rect.left;
              const py = e.touches[0].clientY - rect.top;
              const newZoom = 2.5;
              return {
                x: px - ((px - prev.x) / prev.zoom) * newZoom,
                y: py - ((py - prev.y) / prev.zoom) * newZoom,
                zoom: newZoom,
              };
            }
          });
          ts.lastTapTime = 0; // Reset so triple-tap doesn't re-trigger
          return;
        }

        ts.lastTapTime = now;
        ts.lastTapX = e.touches[0].clientX;
        ts.lastTapY = e.touches[0].clientY;

        setViewState((prev) => {
          setDragStart({ x: e.touches[0].clientX - prev.x, y: e.touches[0].clientY - prev.y });
          return prev;
        });
        setDragging(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const ts = touchStateRef.current;

      if (e.touches.length === 2) {
        // Pinch zoom + pan
        ts.isPinching = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        if (ts.lastPinchDist > 0) {
          const scale = dist / ts.lastPinchDist;
          const panDx = centerX - ts.lastPinchCenterX;
          const panDy = centerY - ts.lastPinchCenterY;

          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const pointX = centerX - rect.left;
            const pointY = centerY - rect.top;

            setViewState((prev) => {
              const newZoom = Math.max(0.1, Math.min(8, prev.zoom * scale));
              const newX = pointX - ((pointX - prev.x) / prev.zoom) * newZoom + panDx;
              const newY = pointY - ((pointY - prev.y) / prev.zoom) * newZoom + panDy;
              return { x: newX, y: newY, zoom: newZoom };
            });
          }
        }

        ts.lastPinchDist = dist;
        ts.lastPinchCenterX = centerX;
        ts.lastPinchCenterY = centerY;
      } else if (e.touches.length === 1 && !ts.isPinching) {
        // Single finger pan
        setViewState((prev) => ({
          ...prev,
          x: e.touches[0].clientX - (dragStart?.x ?? e.touches[0].clientX),
          y: e.touches[0].clientY - (dragStart?.y ?? e.touches[0].clientY),
        }));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const ts = touchStateRef.current;
      if (e.touches.length < 2) {
        ts.isPinching = false;
        ts.lastPinchDist = 0;
      }
      if (e.touches.length === 0) {
        setDragging(false);
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchmove", preventDefault);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragStart]);

  // Reset snaps back to the computed fit-to-container view
  const resetView = useCallback(() => {
    setViewState(fitViewRef.current);
  }, []);

  return (
    <div
      className={`${isDark ? "engineering-canvas" : ""} relative w-full h-full overflow-hidden`}
      style={{ background: isDark ? "var(--canvas-bg, #1a1f2e)" : "hsl(var(--muted) / 0.3)" }}
    >
      {/* Subtle vignette overlay (dark mode only) */}
      {isDark && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)",
            zIndex: 0,
          }}
        />
      )}

      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing relative"
        style={{ zIndex: 1 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragging(false)}
      >
        <div
          style={{
            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.zoom})`,
            transformOrigin: "0 0",
            transition: dragging ? "none" : "transform 0.1s ease-out",
          }}
          className="w-full h-full"
        >
          {children}
        </div>
      </div>

      {/* Zoom controls — positioned above the bottom sheet on mobile via bottomOffset */}
      <div
        className="absolute right-3 flex items-center gap-0.5 rounded"
        style={{
          bottom: bottomOffset,
          background: "hsl(var(--background) / 0.75)",
          border: "1px solid hsl(var(--border))",
          backdropFilter: "blur(4px)",
          zIndex: 10,
          transition: "bottom 200ms ease",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            zoomToPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.7);
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-mono hover:bg-foreground/5 active:bg-foreground/10 transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          −
        </button>
        <button
          onClick={resetView}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xs font-mono hover:bg-foreground/5 active:bg-foreground/10 transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {Math.round(viewState.zoom * 100)}%
        </button>
        <button
          onClick={() => {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            zoomToPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.4);
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-mono hover:bg-foreground/5 active:bg-foreground/10 transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          +
        </button>
      </div>

      {/* View label — hidden on mobile to save space */}
      <div
        className="absolute bottom-3 left-3 text-xs font-mono hidden md:block"
        style={{ color: "hsl(var(--muted-foreground) / 0.7)", zIndex: 10, letterSpacing: "0.05em" }}
      >
        PERMATILE / ENGINEERING CANVAS
      </div>
    </div>
  );
}
