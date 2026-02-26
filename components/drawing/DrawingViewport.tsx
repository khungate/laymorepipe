"use client";

import React, { useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";

interface DrawingViewportProps {
  children: React.ReactNode;
}

/**
 * Zoomable, pannable engineering drawing viewport.
 * Dark navy background — engineering canvas aesthetic.
 * Scroll to zoom, drag to pan.
 */
export function DrawingViewport({ children }: DrawingViewportProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState({ x: 0, y: 0, zoom: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // Track drag distance to distinguish click from drag
  const dragDistRef = useRef(0);

  const zoomToPoint = useCallback(
    (clientX: number, clientY: number, zoomFactor: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      setViewState((prev) => {
        const newZoom = Math.max(0.2, Math.min(5, prev.zoom * zoomFactor));
        // Keep the point under the cursor fixed
        const newX = mouseX - ((mouseX - prev.x) / prev.zoom) * newZoom;
        const newY = mouseY - ((mouseY - prev.y) / prev.zoom) * newZoom;
        return { x: newX, y: newY, zoom: newZoom };
      });
    },
    []
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoomToPoint(e.clientX, e.clientY, delta);
    },
    [zoomToPoint]
  );

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

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      setDragging(false);
      // Click (not drag) → zoom in on that spot
      if (dragDistRef.current < 5) {
        zoomToPoint(e.clientX, e.clientY, 1.4);
      }
    },
    [zoomToPoint]
  );

  const resetView = useCallback(() => {
    setViewState({ x: 0, y: 0, zoom: 1 });
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
        onMouseLeave={handleMouseUp}
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

      {/* Zoom controls — styled for dark canvas */}
      <div
        className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded"
        style={{
          background: "hsl(var(--background) / 0.75)",
          border: "1px solid hsl(var(--border))",
          backdropFilter: "blur(4px)",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            zoomToPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.8);
          }}
          className="px-2.5 py-1.5 text-xs font-mono hover:bg-foreground/5 transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          −
        </button>
        <button
          onClick={resetView}
          className="px-2.5 py-1.5 text-xs font-mono hover:bg-foreground/5 transition-colors"
          style={{ color: "hsl(var(--muted-foreground))", minWidth: 42, textAlign: "center" }}
        >
          {Math.round(viewState.zoom * 100)}%
        </button>
        <button
          onClick={() => {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            zoomToPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.25);
          }}
          className="px-2.5 py-1.5 text-xs font-mono hover:bg-foreground/5 transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          +
        </button>
      </div>

      {/* View label */}
      <div
        className="absolute bottom-3 left-3 text-xs font-mono"
        style={{ color: "hsl(var(--muted-foreground) / 0.7)", zIndex: 10, letterSpacing: "0.05em" }}
      >
        PERMATILE / ENGINEERING CANVAS
      </div>
    </div>
  );
}
