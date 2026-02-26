"use client";

import React, { useRef, useState, useCallback } from "react";

interface DrawingViewportProps {
  children: React.ReactNode;
}

/**
 * Zoomable, pannable viewport for the engineering drawing.
 * Scroll to zoom, drag to pan.
 */
export function DrawingViewport({ children }: DrawingViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState({ x: 0, y: 0, zoom: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState((prev) => ({
      ...prev,
      zoom: Math.max(0.2, Math.min(5, prev.zoom * delta)),
    }));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setDragging(true);
        setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
      }
    },
    [viewState.x, viewState.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
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

  const resetView = useCallback(() => {
    setViewState({ x: 0, y: 0, zoom: 1 });
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted/30">
      {/* Subtle engineering paper background */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.zoom})`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 0.1s ease-out",
          }}
          className="w-full h-full"
        >
          {children}
        </div>
      </div>
      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background/90 border border-border rounded-md px-2 py-1 text-xs font-mono text-muted-foreground">
        <button
          onClick={() =>
            setViewState((prev) => ({ ...prev, zoom: Math.max(0.2, prev.zoom * 0.8) }))
          }
          className="px-1.5 py-0.5 hover:text-foreground"
        >
          −
        </button>
        <button onClick={resetView} className="px-1.5 py-0.5 hover:text-foreground">
          {Math.round(viewState.zoom * 100)}%
        </button>
        <button
          onClick={() =>
            setViewState((prev) => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.25) }))
          }
          className="px-1.5 py-0.5 hover:text-foreground"
        >
          +
        </button>
      </div>
    </div>
  );
}
