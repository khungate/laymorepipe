"use client";

import React from "react";
import { ReinforcementBar } from "@/lib/types/culvert";
import { formatFeetInches, barWeightPerFoot } from "@/lib/calculations/quantities";
import { BarBendingDiagram } from "./BarBendingDiagram";

interface BarScheduleTableProps {
  bars: ReinforcementBar[];
  totalUnits: number;
  /** SVG coordinate position */
  x: number;
  y: number;
}

export function BarScheduleTable({ bars, totalUnits, x, y }: BarScheduleTableProps) {
  const rowH = 18;
  const bentRowH = 50; // taller rows for bent bars (to show diagram)
  const headerH = 22;
  const cols = [0, 60, 150, 200, 250, 310, 370, 430, 500, 560];
  const headers = ["Mark", "Location", "Size", "Spc", "Qty/Unit", "Length", "Total Qty", "Weight", "Shape"];
  const tableW = 620;

  // Calculate row heights
  const rowHeights = bars.map((bar) => bar.shape !== "straight" ? bentRowH : rowH);
  const totalRowH = rowHeights.reduce((a, b) => a + b, 0);

  let cumulativeY = 0;

  return (
    <g fontFamily="'Courier New', monospace" fill="black">
      {/* Title */}
      <text x={x + tableW / 2} y={y - 10} textAnchor="middle" fontSize={12} fontWeight="bold" letterSpacing={1}>
        STEEL REINFORCEMENT SUMMARY
      </text>

      {/* Header row */}
      <rect x={x} y={y} width={tableW} height={headerH} fill="#f0f0f0" stroke="black" strokeWidth={0.5} />
      {headers.map((h, i) => (
        <text key={i} x={x + cols[i] + 4} y={y + 15} fontSize={8} fontWeight="bold">
          {h}
        </text>
      ))}

      {/* Vertical lines */}
      {cols.slice(1).map((c, i) => (
        <line key={i} x1={x + c} y1={y} x2={x + c} y2={y + headerH + totalRowH} stroke="black" strokeWidth={0.3} />
      ))}

      {/* Data rows */}
      {bars.map((bar, i) => {
        const ry = y + headerH + cumulativeY;
        const rh = rowHeights[i];
        const totalQty = bar.quantity * totalUnits;
        const weight = totalQty * (bar.length / 12) * barWeightPerFoot(bar.barSize);
        const textY = ry + (rh <= rowH ? 13 : 13);
        cumulativeY += rh;

        return (
          <g key={bar.id}>
            <rect x={x} y={ry} width={tableW} height={rh} fill={i % 2 === 0 ? "white" : "#fafafa"} stroke="black" strokeWidth={0.3} />
            <text x={x + cols[0] + 4} y={textY} fontSize={8} fontWeight="bold">{bar.barMark}</text>
            <text x={x + cols[1] + 4} y={textY} fontSize={7}>{bar.location}</text>
            <text x={x + cols[2] + 4} y={textY} fontSize={8}>#{bar.barSize}</text>
            <text x={x + cols[3] + 4} y={textY} fontSize={8}>{bar.spacing > 0 ? `${bar.spacing}" O.C.` : "  "}</text>
            <text x={x + cols[4] + 4} y={textY} fontSize={8}>{bar.quantity}</text>
            <text x={x + cols[5] + 4} y={textY} fontSize={8}>{formatFeetInches(bar.length)}</text>
            <text x={x + cols[6] + 4} y={textY} fontSize={8}>{totalQty}</text>
            <text x={x + cols[7] + 4} y={textY} fontSize={8}>{Math.round(weight).toLocaleString()} lb</text>
            {/* Shape diagram */}
            <BarBendingDiagram
              shape={bar.shape}
              length={bar.length}
              leg1={bar.leg1}
              leg2={bar.leg2}
              x={x + cols[8]}
              y={ry + (rh <= rowH ? -8 : 0)}
              size={rh <= rowH ? 36 : bentRowH - 4}
            />
          </g>
        );
      })}

      {/* Bottom border */}
      <line x1={x} y1={y + headerH + totalRowH} x2={x + tableW} y2={y + headerH + totalRowH} stroke="black" strokeWidth={0.5} />

      {/* Totals row */}
      {(() => {
        const totY = y + headerH + totalRowH;
        const totalWeight = bars.reduce((sum, bar) => {
          const totalQty = bar.quantity * totalUnits;
          return sum + totalQty * (bar.length / 12) * barWeightPerFoot(bar.barSize);
        }, 0);

        return (
          <g>
            <rect x={x} y={totY} width={tableW} height={rowH} fill="#f0f0f0" stroke="black" strokeWidth={0.5} />
            <text x={x + cols[6] + 4} y={totY + 13} fontSize={8} fontWeight="bold">TOTAL:</text>
            <text x={x + cols[7] + 4} y={totY + 13} fontSize={8} fontWeight="bold">{Math.round(totalWeight).toLocaleString()} lb</text>
          </g>
        );
      })()}
    </g>
  );
}
