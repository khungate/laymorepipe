"use client";

import React from "react";

interface ScaleIndicatorProps {
  /** Drawing pixels per real-world inch */
  ppi: number;
  /** Position in SVG coordinates */
  x: number;
  y: number;
}

/** Pick a round interval (in inches) that renders a bar between 60-200 SVG pixels */
function pickInterval(ppi: number): { inches: number; label: string } {
  const candidates = [
    { inches: 6, label: '6"' },
    { inches: 12, label: "1'-0\"" },
    { inches: 24, label: "2'-0\"" },
    { inches: 36, label: "3'-0\"" },
    { inches: 48, label: "4'-0\"" },
    { inches: 60, label: "5'-0\"" },
  ];
  for (const c of candidates) {
    const len = c.inches * ppi;
    if (len >= 60 && len <= 200) return c;
  }
  // Fallback: 12 inches
  return candidates[1];
}

/**
 * Graphical scale bar showing a known measurement.
 */
export function ScaleIndicator({ ppi, x, y }: ScaleIndicatorProps) {
  const interval = pickInterval(ppi);
  const barLen = interval.inches * ppi;
  const barH = 4;
  const tickH = 6;

  return (
    <g>
      {/* Label */}
      <text
        x={x}
        y={y - 8}
        fontSize={7}
        fontWeight="bold"
        fill="currentColor"
        letterSpacing={0.5}
        fontFamily="'Courier New', monospace"
      >
        SCALE
      </text>

      {/* Main bar (alternating black/white segments) */}
      <rect x={x} y={y} width={barLen / 2} height={barH} fill="currentColor" />
      <rect x={x + barLen / 2} y={y} width={barLen / 2} height={barH} fill="none" stroke="currentColor" strokeWidth={0.5} />

      {/* Tick marks */}
      <line x1={x} y1={y - tickH / 2} x2={x} y2={y + barH + tickH / 2} stroke="currentColor" strokeWidth={0.5} />
      <line x1={x + barLen / 2} y1={y} x2={x + barLen / 2} y2={y + barH + tickH / 2} stroke="currentColor" strokeWidth={0.35} />
      <line x1={x + barLen} y1={y - tickH / 2} x2={x + barLen} y2={y + barH + tickH / 2} stroke="currentColor" strokeWidth={0.5} />

      {/* Labels */}
      <text x={x} y={y + barH + tickH + 8} fontSize={7} fill="currentColor" textAnchor="middle" fontFamily="'Courier New', monospace">
        0
      </text>
      <text x={x + barLen} y={y + barH + tickH + 8} fontSize={7} fill="currentColor" textAnchor="middle" fontFamily="'Courier New', monospace">
        {interval.label}
      </text>
    </g>
  );
}
