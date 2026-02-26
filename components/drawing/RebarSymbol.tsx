"use client";

import React from "react";
import { barDiameter } from "@/lib/calculations/quantities";

interface RebarSymbolProps {
  cx: number;
  cy: number;
  barSize: number;
  scale: number;
  label?: string;
  labelSide?: "left" | "right" | "top" | "bottom";
  /** Compact mode: smaller dot, no leader line */
  compact?: boolean;
}

export function RebarSymbol({
  cx,
  cy,
  barSize,
  scale,
  label,
  labelSide = "right",
  compact = false,
}: RebarSymbolProps) {
  const diameter = barDiameter(barSize);
  const minRadius = compact ? 1.8 : 2.5;
  const radius = Math.max(diameter * scale * 0.5, minRadius);

  if (compact) {
    return (
      <circle cx={cx} cy={cy} r={radius} fill="currentColor" stroke="none" />
    );
  }

  let labelX = cx;
  let labelY = cy;
  let textAnchor: "start" | "middle" | "end" = "start";
  let leaderEndX = cx;
  let leaderEndY = cy;
  const leaderLen = 30;

  switch (labelSide) {
    case "right":
      leaderEndX = cx + leaderLen;
      leaderEndY = cy;
      labelX = leaderEndX + 3;
      labelY = cy + 3;
      textAnchor = "start";
      break;
    case "left":
      leaderEndX = cx - leaderLen;
      leaderEndY = cy;
      labelX = leaderEndX - 3;
      labelY = cy + 3;
      textAnchor = "end";
      break;
    case "top":
      leaderEndX = cx;
      leaderEndY = cy - leaderLen;
      labelX = cx;
      labelY = leaderEndY - 4;
      textAnchor = "middle";
      break;
    case "bottom":
      leaderEndX = cx;
      leaderEndY = cy + leaderLen;
      labelX = cx;
      labelY = leaderEndY + 12;
      textAnchor = "middle";
      break;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill="currentColor" stroke="none" />
      {label && (
        <>
          <line
            x1={cx + (labelSide === "right" ? radius + 1 : labelSide === "left" ? -(radius + 1) : 0)}
            y1={cy + (labelSide === "bottom" ? radius + 1 : labelSide === "top" ? -(radius + 1) : 0)}
            x2={leaderEndX}
            y2={leaderEndY}
            stroke="currentColor"
            strokeWidth={0.4}
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor={textAnchor}
            fontSize={9}
            fontFamily="'Courier New', monospace"
            fill="currentColor"
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
}
