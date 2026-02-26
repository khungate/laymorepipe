"use client";

import React from "react";
import { barDiameter } from "@/lib/calculations/quantities";

interface RebarSymbolProps {
  cx: number;
  cy: number;
  barSize: number;
  scale: number;
  /** Bar ID for bidirectional highlight linkage */
  barId?: string;
  /** If true, render in highlight color */
  highlighted?: boolean;
  onClick?: () => void;
}

/**
 * Rebar cross-section symbol — a filled circle representing a cut bar.
 * Size is proportional to bar diameter at scale.
 * Color is controlled by CSS custom properties (dark canvas vs. print).
 */
export function RebarSymbol({
  cx,
  cy,
  barSize,
  scale,
  barId,
  highlighted = false,
  onClick,
}: RebarSymbolProps) {
  const diameter = barDiameter(barSize);
  const radius = Math.max(diameter * scale * 0.5, 2.0);

  const fillColor = highlighted
    ? "var(--draw-rebar-highlight)"
    : "var(--draw-rebar)";

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      style={{
        fill: fillColor,
        cursor: onClick ? "pointer" : "default",
        transition: "fill 0.15s ease",
      }}
      data-bar-id={barId}
      onClick={onClick}
      // Small stroke ring on highlight for extra pop
      stroke={highlighted ? "var(--draw-rebar-highlight)" : "none"}
      strokeWidth={highlighted ? 1.5 : 0}
      strokeOpacity={highlighted ? 0.4 : 0}
    />
  );
}
