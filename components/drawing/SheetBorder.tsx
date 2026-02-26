"use client";

import React from "react";
import { ProjectInfo, CulvertGeometry, UnitConfig } from "@/lib/types/culvert";
import { TitleBlock, TITLE_BLOCK_TOTAL_H } from "./TitleBlock";

export type SheetSize = "ARCH_D" | "TABLOID";

/** Sheet dimensions in CSS points (1pt = 1/72 inch) */
const SHEET_DIMS: Record<SheetSize, { w: number; h: number; label: string }> = {
  ARCH_D: { w: 2592, h: 1728, label: '24" x 36"' },   // 36x24 landscape
  TABLOID: { w: 1224, h: 792, label: '11" x 17"' },    // 17x11 landscape
};

interface SheetBorderProps {
  size: SheetSize;
  project: ProjectInfo;
  geometry: CulvertGeometry;
  units: UnitConfig;
  sheetNumber: number;
  totalSheets: number;
  sheetTitle: string;
  children: React.ReactNode;
}

export function SheetBorder({
  size,
  project,
  geometry,
  units,
  sheetNumber,
  totalSheets,
  sheetTitle,
  children,
}: SheetBorderProps) {
  const dims = SHEET_DIMS[size];
  const margin = 36; // 0.5 inch margin
  const borderW = dims.w - margin * 2;
  const borderH = dims.h - margin * 2;
  const innerPad = 8; // gap between inner border and content
  const titleBlockW = borderW - innerPad * 2;

  return (
    <svg
      viewBox={`0 0 ${dims.w} ${dims.h}`}
      width={dims.w}
      height={dims.h}
      style={{
        fontFamily: "'Courier New', monospace",
        background: "white",
        color: "black",
        pageBreakAfter: "always",
      }}
    >
      {/* Sheet border */}
      <rect
        x={margin}
        y={margin}
        width={borderW}
        height={borderH}
        fill="none"
        stroke="black"
        strokeWidth={2}
      />
      {/* Inner border line (double border) */}
      <rect
        x={margin + 4}
        y={margin + 4}
        width={borderW - 8}
        height={borderH - 8}
        fill="none"
        stroke="black"
        strokeWidth={0.5}
      />

      {/* Drawing content area */}
      <g transform={`translate(${margin + 20}, ${margin + 20})`}>
        {children}
      </g>

      {/* Title block (bottom, full width inside border) */}
      <TitleBlock
        project={project}
        geometry={geometry}
        units={units}
        sheetNumber={sheetNumber}
        totalSheets={totalSheets}
        sheetTitle={sheetTitle}
        width={titleBlockW}
        x={margin + innerPad}
        y={margin + borderH - TITLE_BLOCK_TOTAL_H - innerPad}
      />
    </svg>
  );
}

export { SHEET_DIMS, TITLE_BLOCK_TOTAL_H };
