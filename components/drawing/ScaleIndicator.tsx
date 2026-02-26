"use client";

import React from "react";

interface ScaleIndicatorProps {
  ppi: number;
  x: number;
  y: number;
}

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
    if (len >= 55 && len <= 220) return c;
  }
  return candidates[1];
}

export function ScaleIndicator({ ppi, x, y }: ScaleIndicatorProps) {
  const interval = pickInterval(ppi);
  const barLen = interval.inches * ppi;
  const barH = 4;
  const tickH = 6;

  return (
    <g>
      <text
        x={x} y={y - 9}
        fontSize={7}
        fontWeight="bold"
        letterSpacing={0.8}
        style={{ fill: "var(--draw-text-dim)" }}
        fontFamily="'Courier New', Courier, monospace"
      >
        SCALE
      </text>
      {/* Alternating bar segments */}
      <rect x={x} y={y} width={barLen / 2} height={barH} style={{ fill: "var(--draw-stroke-heavy)" }} />
      <rect
        x={x + barLen / 2} y={y} width={barLen / 2} height={barH}
        style={{ fill: "var(--draw-fill-void)", stroke: "var(--draw-stroke-heavy)" }}
        strokeWidth={0.5}
      />
      {/* Tick marks */}
      <line x1={x} y1={y - tickH / 2} x2={x} y2={y + barH + tickH / 2} style={{ stroke: "var(--draw-stroke-heavy)" }} strokeWidth={0.6} />
      <line x1={x + barLen / 2} y1={y} x2={x + barLen / 2} y2={y + barH + tickH / 2} style={{ stroke: "var(--draw-stroke-medium)" }} strokeWidth={0.4} />
      <line x1={x + barLen} y1={y - tickH / 2} x2={x + barLen} y2={y + barH + tickH / 2} style={{ stroke: "var(--draw-stroke-heavy)" }} strokeWidth={0.6} />
      {/* Labels */}
      <text x={x} y={y + barH + tickH + 9} fontSize={7} textAnchor="middle" style={{ fill: "var(--draw-text-dim)" }} fontFamily="'Courier New', Courier, monospace">0</text>
      <text x={x + barLen} y={y + barH + tickH + 9} fontSize={7} textAnchor="middle" style={{ fill: "var(--draw-text-dim)" }} fontFamily="'Courier New', Courier, monospace">{interval.label}</text>
    </g>
  );
}
