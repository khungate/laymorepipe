"use client";

import React from "react";
import { BarShape } from "@/lib/types/culvert";
import { formatInches } from "@/lib/calculations/quantities";

interface BarBendingDiagramProps {
  shape: BarShape;
  length: number;
  leg1: number | null;
  leg2: number | null;
  /** Position in SVG */
  x: number;
  y: number;
  /** Box size for the diagram */
  size?: number;
}

/**
 * Renders a small SVG diagram of a bent bar shape with dimension annotations.
 */
export function BarBendingDiagram({
  shape,
  length,
  leg1,
  leg2,
  x,
  y,
  size = 50,
}: BarBendingDiagramProps) {
  const pad = 6;
  const inner = size - pad * 2;
  const sw = 1.2;

  if (shape === "straight") {
    return (
      <g>
        <line
          x1={x + pad}
          y1={y + size / 2}
          x2={x + size - pad}
          y2={y + size / 2}
          stroke="black"
          strokeWidth={sw}
        />
        <text x={x + size / 2} y={y + size / 2 - 4} textAnchor="middle" fontSize={5} fill="black">
          {formatInches(length)}
        </text>
      </g>
    );
  }

  if (shape === "L") {
    const cornerX = x + pad;
    const cornerY = y + pad;
    return (
      <g>
        <path
          d={`M ${cornerX} ${cornerY} L ${cornerX} ${cornerY + inner} L ${cornerX + inner} ${cornerY + inner}`}
          fill="none"
          stroke="black"
          strokeWidth={sw}
        />
        {/* Leg 1 label (vertical) */}
        {leg1 != null && (
          <text x={cornerX - 3} y={cornerY + inner / 2} textAnchor="end" fontSize={5} fill="black">
            {formatInches(leg1)}
          </text>
        )}
        {/* Leg 2 label (horizontal) */}
        {leg2 != null && (
          <text x={cornerX + inner / 2} y={cornerY + inner + 8} textAnchor="middle" fontSize={5} fill="black">
            {formatInches(leg2)}
          </text>
        )}
      </g>
    );
  }

  if (shape === "U") {
    const topY = y + pad;
    const botY = y + size - pad;
    const leftX = x + pad;
    const rightX = x + size - pad;
    return (
      <g>
        <path
          d={`M ${leftX} ${topY} L ${leftX} ${botY} L ${rightX} ${botY} L ${rightX} ${topY}`}
          fill="none"
          stroke="black"
          strokeWidth={sw}
        />
        {/* Leg 1 (left vertical) */}
        {leg1 != null && (
          <text x={leftX - 3} y={topY + inner / 2} textAnchor="end" fontSize={5} fill="black">
            {formatInches(leg1)}
          </text>
        )}
        {/* Bottom (overall or length) */}
        <text x={x + size / 2} y={botY + 8} textAnchor="middle" fontSize={5} fill="black">
          {formatInches(length)}
        </text>
        {/* Leg 2 (right vertical) */}
        {leg2 != null && (
          <text x={rightX + 3} y={topY + inner / 2} textAnchor="start" fontSize={5} fill="black">
            {formatInches(leg2)}
          </text>
        )}
      </g>
    );
  }

  if (shape === "Z") {
    const midY = y + size / 2;
    return (
      <g>
        <path
          d={`M ${x + pad} ${y + pad} L ${x + pad} ${midY} L ${x + size - pad} ${midY} L ${x + size - pad} ${y + size - pad}`}
          fill="none"
          stroke="black"
          strokeWidth={sw}
        />
        {/* Leg 1 (top left vertical) */}
        {leg1 != null && (
          <text x={x + pad - 3} y={y + pad + (midY - y - pad) / 2} textAnchor="end" fontSize={5} fill="black">
            {formatInches(leg1)}
          </text>
        )}
        {/* Middle horizontal */}
        <text x={x + size / 2} y={midY - 3} textAnchor="middle" fontSize={5} fill="black">
          {formatInches(length)}
        </text>
        {/* Leg 2 (bottom right vertical) */}
        {leg2 != null && (
          <text x={x + size - pad + 3} y={midY + (y + size - pad - midY) / 2} textAnchor="start" fontSize={5} fill="black">
            {formatInches(leg2)}
          </text>
        )}
      </g>
    );
  }

  return null;
}
