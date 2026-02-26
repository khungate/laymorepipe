"use client";

import React from "react";

interface DimensionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  offset?: number;
  side?: "top" | "bottom" | "left" | "right";
  fontSize?: number;
}

/**
 * Engineering-style dimension line (ASME Y14.5 style):
 * - Thin line with tick marks at each end
 * - Extension lines from object to dimension line
 * - Centered dimension text
 * Uses CSS custom properties for dark/print theming.
 */
export function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  label,
  offset = 0,
  side = "top",
  fontSize = 10,
}: DimensionLineProps) {
  const isHorizontal = Math.abs(y1 - y2) < 1;
  const isVertical = Math.abs(x1 - x2) < 1;

  let ox = 0, oy = 0;
  const tickLen = 5;
  const extLen = offset + 4;

  if (isHorizontal) {
    oy = side === "top" ? -offset : offset;
  } else if (isVertical) {
    ox = side === "left" ? -offset : offset;
  }

  const sx = x1 + ox, sy = y1 + oy;
  const ex = x2 + ox, ey = y2 + oy;

  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  // Tick marks at 45°
  const tickPaths = [
    `M${sx - tickLen / 2},${sy - tickLen / 2}L${sx + tickLen / 2},${sy + tickLen / 2}`,
    `M${ex - tickLen / 2},${ey - tickLen / 2}L${ex + tickLen / 2},${ey + tickLen / 2}`,
  ];

  const extLines: React.ReactNode[] = [];
  if (offset > 0) {
    if (isHorizontal) {
      const dir = side === "top" ? -1 : 1;
      extLines.push(
        <line key="ext1" x1={x1} y1={y1} x2={x1} y2={y1 + dir * extLen} style={{ stroke: "var(--draw-stroke-thin)" }} strokeWidth={0.25} />,
        <line key="ext2" x1={x2} y1={y2} x2={x2} y2={y2 + dir * extLen} style={{ stroke: "var(--draw-stroke-thin)" }} strokeWidth={0.25} />
      );
    } else if (isVertical) {
      const dir = side === "left" ? -1 : 1;
      extLines.push(
        <line key="ext1" x1={x1} y1={y1} x2={x1 + dir * extLen} y2={y1} style={{ stroke: "var(--draw-stroke-thin)" }} strokeWidth={0.25} />,
        <line key="ext2" x1={x2} y1={y2} x2={x2 + dir * extLen} y2={y2} style={{ stroke: "var(--draw-stroke-thin)" }} strokeWidth={0.25} />
      );
    }
  }

  let textX = mx;
  let textY = my;
  let rotation = 0;

  if (isHorizontal) {
    textY = my - 4;
  } else if (isVertical) {
    textX = mx - 4;
    rotation = -90;
  }

  const dimColor = "var(--draw-dim)";
  const dimTextColor = "var(--draw-text-dim)";

  return (
    <g>
      {extLines}
      {/* Main dimension line */}
      <line x1={sx} y1={sy} x2={ex} y2={ey} style={{ stroke: dimColor }} strokeWidth={0.35} />
      {/* Tick marks */}
      {tickPaths.map((d, i) => (
        <path key={i} d={d} style={{ stroke: dimColor }} strokeWidth={0.9} fill="none" />
      ))}
      {/* Background knockout for readability */}
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="auto"
        fontSize={fontSize}
        fontFamily="'Courier New', Courier, monospace"
        style={{ fill: "var(--draw-bg, transparent)", stroke: "var(--draw-bg, transparent)", strokeWidth: 3, paintOrder: "stroke" }}
        transform={rotation ? `rotate(${rotation}, ${textX}, ${textY})` : undefined}
        aria-hidden="true"
      >
        {label}
      </text>
      {/* Dimension text */}
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="auto"
        fontSize={fontSize}
        fontFamily="'Courier New', Courier, monospace"
        style={{ fill: dimTextColor }}
        transform={rotation ? `rotate(${rotation}, ${textX}, ${textY})` : undefined}
        letterSpacing={0.3}
      >
        {label}
      </text>
    </g>
  );
}
