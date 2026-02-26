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
  /** Y position (top of title block) */
  y: number;
}

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
  const revRowH = 14;
  const revTableH = Math.max(revs.length, 3) * revRowH + 16; // min 3 blank rows
  const mainH = 120;
  const h = mainH + revTableH;
  const col1 = width * 0.45;
  const col2 = width * 0.65;
  const col3 = width * 0.82;

  const structureDesc = `${formatFeetInches(geometry.span)} x ${formatFeetInches(geometry.rise)} x ${formatFeetInches(units.totalLength)} ${geometry.cellCount > 1 ? geometry.cellCount + " Cell" : "Single Cell"} Precast Box Culvert`;

  // Title block starts at y, revision table above it at y - revTableH
  const tbY = y;
  const revY = y - revTableH;

  return (
    <g fontFamily="'Courier New', monospace">
      {/* ─── Revision Table (above title block) ─── */}
      <rect x={x} y={revY} width={width} height={revTableH} fill="none" stroke="black" strokeWidth={0.5} />
      <rect x={x} y={revY} width={width} height={16} fill="#f5f5f5" stroke="black" strokeWidth={0.5} />
      <text x={x + 6} y={revY + 11} fontSize={7} fontWeight="bold" fill="black">REV</text>
      <text x={x + 30} y={revY + 11} fontSize={7} fontWeight="bold" fill="black">DATE</text>
      <text x={x + 100} y={revY + 11} fontSize={7} fontWeight="bold" fill="black">DESCRIPTION</text>
      <text x={x + width - 40} y={revY + 11} fontSize={7} fontWeight="bold" fill="black">BY</text>

      {/* Revision rows */}
      {Array.from({ length: Math.max(revs.length, 3) }).map((_, i) => {
        const ry = revY + 16 + i * revRowH;
        const rev = revs[i];
        return (
          <g key={i}>
            <line x1={x} y1={ry} x2={x + width} y2={ry} stroke="black" strokeWidth={0.2} />
            {rev && (
              <>
                <text x={x + 6} y={ry + 10} fontSize={7} fill="black">{rev.number}</text>
                <text x={x + 30} y={ry + 10} fontSize={7} fill="black">{rev.date}</text>
                <text x={x + 100} y={ry + 10} fontSize={7} fill="black">{rev.description}</text>
                <text x={x + width - 40} y={ry + 10} fontSize={7} fill="black">{rev.by}</text>
              </>
            )}
          </g>
        );
      })}

      {/* Column dividers for rev table */}
      <line x1={x + 24} y1={revY} x2={x + 24} y2={revY + revTableH} stroke="black" strokeWidth={0.2} />
      <line x1={x + 94} y1={revY} x2={x + 94} y2={revY + revTableH} stroke="black" strokeWidth={0.2} />
      <line x1={x + width - 50} y1={revY} x2={x + width - 50} y2={revY + revTableH} stroke="black" strokeWidth={0.2} />

      {/* ─── Main Title Block ─── */}
      <rect x={x} y={tbY} width={width} height={mainH} fill="none" stroke="black" strokeWidth={1.5} />

      {/* Vertical dividers */}
      <line x1={x + col1} y1={tbY} x2={x + col1} y2={tbY + mainH} stroke="black" strokeWidth={0.5} />
      <line x1={x + col2} y1={tbY} x2={x + col2} y2={tbY + mainH} stroke="black" strokeWidth={0.5} />
      <line x1={x + col3} y1={tbY} x2={x + col3} y2={tbY + mainH} stroke="black" strokeWidth={0.5} />

      {/* ─── Column 1: Logo + Producer/Project/Structure ─── */}
      {/* Logo placeholder */}
      <rect x={x + 6} y={tbY + 4} width={50} height={22} fill="none" stroke="black" strokeWidth={0.3} strokeDasharray="4,2" rx={2} />
      <text x={x + 31} y={tbY + 18} textAnchor="middle" fontSize={5} fill="black" opacity={0.3}>LOGO</text>

      {/* Producer */}
      <text x={x + 62} y={tbY + 11} fontSize={7} fill="black" opacity={0.5}>PRODUCER</text>
      <text x={x + 62} y={tbY + 22} fontSize={10} fontWeight="bold" fill="black">
        {project.clientName || "Producer Name"}
      </text>

      <line x1={x} y1={tbY + 28} x2={x + col1} y2={tbY + 28} stroke="black" strokeWidth={0.3} />

      {/* Project */}
      <text x={x + 6} y={tbY + 38} fontSize={7} fill="black" opacity={0.5}>PROJECT</text>
      <text x={x + 6} y={tbY + 49} fontSize={9} fill="black">{project.projectName || "Project Name"}</text>

      <line x1={x} y1={tbY + 53} x2={x + col1} y2={tbY + 53} stroke="black" strokeWidth={0.3} />

      {/* Structure */}
      <text x={x + 6} y={tbY + 62} fontSize={7} fill="black" opacity={0.5}>STRUCTURE</text>
      <text x={x + 6} y={tbY + 72} fontSize={7} fill="black">{structureDesc}</text>

      <line x1={x} y1={tbY + 76} x2={x + col1} y2={tbY + 76} stroke="black" strokeWidth={0.3} />

      {/* Design standard */}
      <text x={x + 6} y={tbY + 85} fontSize={7} fill="black" opacity={0.5}>DESIGN STANDARD</text>
      <text x={x + 6} y={tbY + 95} fontSize={7} fill="black">AASHTO LRFD per {project.stateStandard}</text>

      <line x1={x} y1={tbY + 99} x2={x + col1} y2={tbY + 99} stroke="black" strokeWidth={0.3} />

      {/* Location */}
      <text x={x + 6} y={tbY + 108} fontSize={7} fill="black" opacity={0.5}>LOCATION</text>
      <text x={x + 6} y={tbY + 117} fontSize={7} fill="black">{project.location || ""}</text>

      {/* ─── Column 2: Personnel + Dates ─── */}
      <text x={x + col1 + 6} y={tbY + 11} fontSize={7} fill="black" opacity={0.5}>DRAWN BY</text>
      <text x={x + col1 + 6} y={tbY + 22} fontSize={9} fill="black">{project.drawnBy}</text>

      <line x1={x + col1} y1={tbY + 28} x2={x + col2} y2={tbY + 28} stroke="black" strokeWidth={0.3} />

      <text x={x + col1 + 6} y={tbY + 38} fontSize={7} fill="black" opacity={0.5}>CHECKED BY</text>
      <text x={x + col1 + 6} y={tbY + 49} fontSize={9} fill="black">{project.checkedBy}</text>

      <line x1={x + col1} y1={tbY + 53} x2={x + col2} y2={tbY + 53} stroke="black" strokeWidth={0.3} />

      <text x={x + col1 + 6} y={tbY + 62} fontSize={7} fill="black" opacity={0.5}>ENGINEER</text>
      <text x={x + col1 + 6} y={tbY + 72} fontSize={9} fill="black">{project.engineer}</text>

      <line x1={x + col1} y1={tbY + 76} x2={x + col2} y2={tbY + 76} stroke="black" strokeWidth={0.3} />

      <text x={x + col1 + 6} y={tbY + 85} fontSize={7} fill="black" opacity={0.5}>DATE</text>
      <text x={x + col1 + 6} y={tbY + 95} fontSize={9} fill="black">{project.dateCreated}</text>

      <line x1={x + col1} y1={tbY + 99} x2={x + col2} y2={tbY + 99} stroke="black" strokeWidth={0.3} />

      <text x={x + col1 + 6} y={tbY + 108} fontSize={7} fill="black" opacity={0.5}>PROJECT NO.</text>
      <text x={x + col1 + 6} y={tbY + 117} fontSize={9} fill="black">{project.projectNumber}</text>

      {/* ─── Column 3: PE Stamp placeholder ─── */}
      <rect x={x + col2 + 8} y={tbY + 6} width={col3 - col2 - 16} height={col3 - col2 - 16} fill="none" stroke="black" strokeWidth={0.3} strokeDasharray="4,2" rx={2} />
      <text x={x + (col2 + col3) / 2} y={tbY + (col3 - col2) / 2 + 2} textAnchor="middle" fontSize={6} fill="black" opacity={0.3}>
        PE STAMP
      </text>
      <text x={x + col2 + 6} y={tbY + 108} fontSize={7} fill="black" opacity={0.5}>REV.</text>
      <text x={x + col2 + 30} y={tbY + 108} fontSize={11} fontWeight="bold" fill="black">{project.revisionNumber}</text>

      {/* ─── Column 4: Sheet title + number ─── */}
      <text x={x + col3 + 6} y={tbY + 11} fontSize={7} fill="black" opacity={0.5}>SHEET TITLE</text>
      <text x={x + col3 + 6} y={tbY + 26} fontSize={9} fontWeight="bold" fill="black">
        {sheetTitle}
      </text>
      <text x={x + col3 + 6} y={tbY + 40} fontSize={7} fill="black" opacity={0.5}>
        {project.stateStandard} Shop Drawing
      </text>

      <line x1={x + col3} y1={tbY + 50} x2={x + width} y2={tbY + 50} stroke="black" strokeWidth={0.3} />

      {/* Sheet number */}
      <text x={x + col3 + (width - col3) / 2} y={tbY + 90} textAnchor="middle" fontSize={28} fontWeight="bold" fill="black">
        {sheetNumber}
      </text>
      <text x={x + col3 + (width - col3) / 2} y={tbY + 108} textAnchor="middle" fontSize={9} fill="black" opacity={0.5}>
        OF {totalSheets}
      </text>
    </g>
  );
}
