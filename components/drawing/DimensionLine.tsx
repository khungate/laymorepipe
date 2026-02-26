"use client";

import React from "react";

interface DimensionLineProps {
  /** Start point */
  x1: number;
  y1: number;
  /** End point */
  x2: number;
  y2: number;
  /** The text label (e.g. "5'-0\"") */
  label: string;
  /** Offset distance from the main line to draw the dimension (for stacked dims) */
  offset?: number;
  /** Side to offset: "top" | "bottom" | "left" | "right" */
  side?: "top" | "bottom" | "left" | "right";
  /** Font size in SVG units */
  fontSize?: number;
}

/**
 * Engineering-style dimension line with tick marks and centered text.
 */
export function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  label,
  offset = 0,
  side = "top",
  fontSize = 11,
}: DimensionLineProps) {
  const isHorizontal = Math.abs(y1 - y2) < 1;
  const isVertical = Math.abs(x1 - x2) < 1;

  let ox = 0,
    oy = 0;
  const tickLen = 6;
  const extLen = offset + 4;

  if (isHorizontal) {
    oy = side === "top" ? -offset : offset;
  } else if (isVertical) {
    ox = side === "left" ? -offset : offset;
  }

  const sx = x1 + ox,
    sy = y1 + oy;
  const ex = x2 + ox,
    ey = y2 + oy;

  // Midpoint for label
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  // Tick marks (45-degree slash)
  const tickPaths = [sx, ex].map((tx, i) => {
    const ty = i === 0 ? sy : ey;
    if (isHorizontal) {
      return `M${tx - tickLen / 2},${ty - tickLen / 2}L${tx + tickLen / 2},${ty + tickLen / 2}`;
    }
    return `M${tx - tickLen / 2},${ty - tickLen / 2}L${tx + tickLen / 2},${ty + tickLen / 2}`;
  });

  // Extension lines from object to dimension line
  const extLines: React.ReactNode[] = [];
  if (offset > 0) {
    if (isHorizontal) {
      const dir = side === "top" ? -1 : 1;
      extLines.push(
        <line key="ext1" x1={x1} y1={y1} x2={x1} y2={y1 + dir * extLen} stroke="currentColor" strokeWidth={0.25} />,
        <line key="ext2" x1={x2} y1={y2} x2={x2} y2={y2 + dir * extLen} stroke="currentColor" strokeWidth={0.25} />
      );
    } else if (isVertical) {
      const dir = side === "left" ? -1 : 1;
      extLines.push(
        <line key="ext1" x1={x1} y1={y1} x2={x1 + dir * extLen} y2={y1} stroke="currentColor" strokeWidth={0.25} />,
        <line key="ext2" x1={x2} y1={y2} x2={x2 + dir * extLen} y2={y2} stroke="currentColor" strokeWidth={0.25} />
      );
    }
  }

  // Text positioning
  const textAnchor = "middle";
  let textX = mx;
  let textY = my;
  let rotation = 0;

  if (isHorizontal) {
    textY = my - 4;
  } else if (isVertical) {
    textX = mx - 4;
    rotation = -90;
  }

  return (
    <g className="text-foreground/70" style={{ color: "inherit" }}>
      {extLines}
      {/* Main dimension line */}
      <line
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
        stroke="currentColor"
        strokeWidth={0.35}
      />
      {/* Tick marks */}
      {tickPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={0.8}
          fill="none"
        />
      ))}
      {/* Label */}
      <text
        x={textX}
        y={textY}
        textAnchor={textAnchor}
        dominantBaseline="auto"
        fontSize={fontSize}
        fontFamily="'Courier New', monospace"
        fill="currentColor"
        transform={rotation ? `rotate(${rotation}, ${textX}, ${textY})` : undefined}
      >
        {label}
      </text>
    </g>
  );
}
