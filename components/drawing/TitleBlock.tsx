"use client";

import React from "react";
import { ProjectInfo, CulvertGeometry, UnitConfig } from "@/lib/types/culvert";
import { formatFeetInches } from "@/lib/calculations/quantities";

interface TitleBlockProps {
  project: ProjectInfo;
  geometry: CulvertGeometry;
  units: UnitConfig;
  sheetNumber: number;
  totalSheets: number;
  sheetTitle: string;
  /** Width of the title block in SVG units */
  width: number;
  /** X position */
  x: number;
  /** Y position (top of entire title block including revisions) */
  y: number;
}

/** Total height exported for layout calculations */
export const TITLE_BLOCK_TOTAL_H = 160;

export function TitleBlock({
  project,
  geometry,
  units,
  sheetNumber,
  totalSheets,
  sheetTitle,
  width,
  x,
  y,
}: TitleBlockProps) {
  const revs = project.revisions ?? [];
  const revRowH = 13;
  const revRows = Math.max(revs.length, 2);
  const revHeaderH = 14;
  const revTableH = revRows * revRowH + revHeaderH;
  const mainH = TITLE_BLOCK_TOTAL_H - revTableH;

  const structureDesc = `${formatFeetInches(geometry.span)} x ${formatFeetInches(geometry.rise)} x ${formatFeetInches(units.totalLength)} ${geometry.cellCount > 1 ? geometry.cellCount + " Cell" : "Single Cell"} Box Culvert`;

  const revY = y;
  const tbY = y + revTableH;

  // Column positions as absolute x offsets from left edge of title block
  const c1 = width * 0.35;  // Producer/Project/Structure
  const c2 = width * 0.55;  // Personnel
  const c3 = width * 0.72;  // PE stamp / rev
  const c4 = width * 0.86;  // Sheet number area

  return (
    <g fontFamily="'Courier New', monospace">
      {/* ─── Revision Table ─── */}
      <rect x={x} y={revY} width={width} height={revTableH} fill="white" stroke="black" strokeWidth={0.5} />
      <rect x={x} y={revY} width={width} height={revHeaderH} fill="#f5f5f5" stroke="black" strokeWidth={0.5} />
      <text x={x + 6} y={revY + 10} fontSize={6} fontWeight="bold" fill="black">REV</text>
      <text x={x + 28} y={revY + 10} fontSize={6} fontWeight="bold" fill="black">DATE</text>
      <text x={x + 100} y={revY + 10} fontSize={6} fontWeight="bold" fill="black">DESCRIPTION</text>
      <text x={x + width - 30} y={revY + 10} fontSize={6} fontWeight="bold" fill="black">BY</text>

      {/* Rev column dividers */}
      <line x1={x + 22} y1={revY} x2={x + 22} y2={revY + revTableH} stroke="black" strokeWidth={0.2} />
      <line x1={x + 90} y1={revY} x2={x + 90} y2={revY + revTableH} stroke="black" strokeWidth={0.2} />
      <line x1={x + width - 40} y1={revY} x2={x + width - 40} y2={revY + revTableH} stroke="black" strokeWidth={0.2} />

      {Array.from({ length: revRows }).map((_, i) => {
        const ry = revY + revHeaderH + i * revRowH;
        const rev = revs[i];
        return (
          <g key={i}>
            {i > 0 && <line x1={x} y1={ry} x2={x + width} y2={ry} stroke="black" strokeWidth={0.15} />}
            {rev && (
              <>
                <text x={x + 6} y={ry + 10} fontSize={6} fill="black">{rev.number}</text>
                <text x={x + 28} y={ry + 10} fontSize={6} fill="black">{rev.date}</text>
                <text x={x + 100} y={ry + 10} fontSize={6} fill="black">{rev.description}</text>
                <text x={x + width - 30} y={ry + 10} fontSize={6} fill="black">{rev.by}</text>
              </>
            )}
          </g>
        );
      })}

      {/* ─── Main Title Block ─── */}
      <rect x={x} y={tbY} width={width} height={mainH} fill="white" stroke="black" strokeWidth={1.5} />

      {/* Column dividers */}
      <line x1={x + c1} y1={tbY} x2={x + c1} y2={tbY + mainH} stroke="black" strokeWidth={0.5} />
      <line x1={x + c2} y1={tbY} x2={x + c2} y2={tbY + mainH} stroke="black" strokeWidth={0.5} />
      <line x1={x + c3} y1={tbY} x2={x + c3} y2={tbY + mainH} stroke="black" strokeWidth={0.5} />
      <line x1={x + c4} y1={tbY} x2={x + c4} y2={tbY + mainH} stroke="black" strokeWidth={0.5} />

      {/* ─── Col 1: Producer / Project / Structure ─── */}
      {/* Logo placeholder */}
      <rect x={x + 4} y={tbY + 3} width={36} height={16} fill="none" stroke="black" strokeWidth={0.25} strokeDasharray="3,1.5" rx={1} />
      <text x={x + 22} y={tbY + 13} textAnchor="middle" fontSize={4} fill="black" opacity={0.25}>LOGO</text>

      <text x={x + 46} y={tbY + 9} fontSize={5.5} fill="black" opacity={0.5}>PRODUCER</text>
      <text x={x + 46} y={tbY + 18} fontSize={8} fontWeight="bold" fill="black">
        {project.clientName || "Producer Name"}
      </text>

      <line x1={x} y1={tbY + 22} x2={x + c1} y2={tbY + 22} stroke="black" strokeWidth={0.25} />

      <text x={x + 4} y={tbY + 30} fontSize={5.5} fill="black" opacity={0.5}>PROJECT</text>
      <text x={x + 4} y={tbY + 39} fontSize={7} fill="black">{project.projectName || "Project Name"}</text>

      <line x1={x} y1={tbY + 43} x2={x + c1} y2={tbY + 43} stroke="black" strokeWidth={0.25} />

      <text x={x + 4} y={tbY + 51} fontSize={5.5} fill="black" opacity={0.5}>STRUCTURE</text>
      <text x={x + 4} y={tbY + 60} fontSize={6} fill="black">{structureDesc}</text>

      <line x1={x} y1={tbY + 64} x2={x + c1} y2={tbY + 64} stroke="black" strokeWidth={0.25} />

      <text x={x + 4} y={tbY + 72} fontSize={5.5} fill="black" opacity={0.5}>DESIGN STANDARD</text>
      <text x={x + 4} y={tbY + 81} fontSize={6} fill="black">AASHTO LRFD per {project.stateStandard}</text>

      <line x1={x} y1={tbY + 85} x2={x + c1} y2={tbY + 85} stroke="black" strokeWidth={0.25} />

      <text x={x + 4} y={tbY + 93} fontSize={5.5} fill="black" opacity={0.5}>LOCATION</text>
      <text x={x + 4} y={tbY + 102} fontSize={6} fill="black">{project.location || ""}</text>

      {/* ─── Col 2: Personnel ─── */}
      <text x={x + c1 + 4} y={tbY + 9} fontSize={5.5} fill="black" opacity={0.5}>DRAWN BY</text>
      <text x={x + c1 + 4} y={tbY + 18} fontSize={7} fill="black">{project.drawnBy}</text>

      <line x1={x + c1} y1={tbY + 22} x2={x + c2} y2={tbY + 22} stroke="black" strokeWidth={0.25} />

      <text x={x + c1 + 4} y={tbY + 30} fontSize={5.5} fill="black" opacity={0.5}>CHECKED BY</text>
      <text x={x + c1 + 4} y={tbY + 39} fontSize={7} fill="black">{project.checkedBy}</text>

      <line x1={x + c1} y1={tbY + 43} x2={x + c2} y2={tbY + 43} stroke="black" strokeWidth={0.25} />

      <text x={x + c1 + 4} y={tbY + 51} fontSize={5.5} fill="black" opacity={0.5}>ENGINEER</text>
      <text x={x + c1 + 4} y={tbY + 60} fontSize={7} fill="black">{project.engineer}</text>

      <line x1={x + c1} y1={tbY + 64} x2={x + c2} y2={tbY + 64} stroke="black" strokeWidth={0.25} />

      <text x={x + c1 + 4} y={tbY + 72} fontSize={5.5} fill="black" opacity={0.5}>DATE</text>
      <text x={x + c1 + 4} y={tbY + 81} fontSize={7} fill="black">{project.dateCreated}</text>

      <line x1={x + c1} y1={tbY + 85} x2={x + c2} y2={tbY + 85} stroke="black" strokeWidth={0.25} />

      <text x={x + c1 + 4} y={tbY + 93} fontSize={5.5} fill="black" opacity={0.5}>PROJECT NO.</text>
      <text x={x + c1 + 4} y={tbY + 102} fontSize={7} fill="black">{project.projectNumber}</text>

      {/* ─── Col 3: PE Stamp + REV ─── */}
      {(() => {
        const stampSize = Math.min(c3 - c2 - 12, mainH - 30);
        return (
          <rect
            x={x + c2 + (c3 - c2 - stampSize) / 2}
            y={tbY + 4}
            width={stampSize}
            height={stampSize}
            fill="none" stroke="black" strokeWidth={0.25} strokeDasharray="3,1.5" rx={2}
          />
        );
      })()}
      <text x={x + (c2 + c3) / 2} y={tbY + 38} textAnchor="middle" fontSize={5} fill="black" opacity={0.25}>PE STAMP</text>

      <line x1={x + c2} y1={tbY + mainH - 20} x2={x + c3} y2={tbY + mainH - 20} stroke="black" strokeWidth={0.25} />
      <text x={x + c2 + 4} y={tbY + mainH - 10} fontSize={5.5} fill="black" opacity={0.5}>REV.</text>
      <text x={x + c2 + 24} y={tbY + mainH - 6} fontSize={12} fontWeight="bold" fill="black">{project.revisionNumber}</text>

      {/* ─── Col 4: Sheet Title ─── */}
      <text x={x + c3 + 4} y={tbY + 9} fontSize={5.5} fill="black" opacity={0.5}>SHEET TITLE</text>
      <text x={x + c3 + 4} y={tbY + 22} fontSize={8} fontWeight="bold" fill="black">{sheetTitle}</text>

      <line x1={x + c3} y1={tbY + 28} x2={x + c4} y2={tbY + 28} stroke="black" strokeWidth={0.25} />

      <text x={x + c3 + 4} y={tbY + 38} fontSize={6} fill="black" opacity={0.5}>
        {project.stateStandard} Shop Drawing
      </text>

      {/* ─── Col 5: Sheet Number ─── */}
      <text x={x + (c4 + width) / 2} y={tbY + mainH * 0.55} textAnchor="middle" fontSize={24} fontWeight="bold" fill="black">
        {sheetNumber}
      </text>
      <text x={x + (c4 + width) / 2} y={tbY + mainH * 0.55 + 16} textAnchor="middle" fontSize={8} fill="black" opacity={0.5}>
        OF {totalSheets}
      </text>
    </g>
  );
}
