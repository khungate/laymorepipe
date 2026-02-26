"use client";

import React from "react";
import { CulvertGeometry, UnitConfig } from "@/lib/types/culvert";
import { computeOutsideDimensions } from "@/lib/calculations/geometry";
import { formatFeetInches, formatInches } from "@/lib/calculations/quantities";
import { DimensionLine } from "./DimensionLine";
import { ScaleIndicator } from "./ScaleIndicator";

interface PlanViewProps {
  geometry: CulvertGeometry;
  units: UnitConfig;
  unitType: "standard" | "inlet" | "outlet";
  width?: number;
  height?: number;
  /** Unique prefix for SVG pattern IDs (avoids collisions in print) */
  idPrefix?: string;
}

export function PlanView({
  geometry: geo,
  units,
  unitType,
  width = 900,
  height = 500,
  idPrefix = "pv",
}: PlanViewProps) {
  const { outsideWidth } = computeOutsideDimensions(geo);
  const unitLen = units.unitLength;
  const wt = geo.wallThickness;

  // Scale to fit
  const marginX = 120;
  const marginY = 100;
  const availW = width - marginX * 2;
  const availH = height - marginY * 2;
  const ppi = Math.min(availW / outsideWidth, availH / unitLen);

  const ox = marginX + (availW - outsideWidth * ppi) / 2;
  const oy = marginY + (availH - unitLen * ppi) / 2;
  const ow = outsideWidth * ppi;
  const oh = unitLen * ppi;

  const x = (realX: number) => ox + realX * ppi;
  const y = (realY: number) => oy + realY * ppi;

  // Lift hole positions (1/3 from each end, centered on walls)
  const liftHoles: Array<{ x: number; y: number }> = [];
  const lh1Y = unitLen / 3;
  const lh2Y = (unitLen * 2) / 3;
  liftHoles.push(
    { x: wt / 2, y: lh1Y },
    { x: wt / 2, y: lh2Y },
    { x: outsideWidth - wt / 2, y: lh1Y },
    { x: outsideWidth - wt / 2, y: lh2Y }
  );

  // Tongue on top (y=0), groove on bottom (y=unitLen) for standard
  const tongueEnd = unitType === "outlet" ? "bottom" : "top";
  const grooveEnd = unitType === "outlet" ? "top" : "bottom";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      className="text-foreground"
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      <defs>
        <pattern id={`${idPrefix}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth={0.15} opacity={0.12} />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#${idPrefix}-grid)`} />

      {/* Title */}
      <text x={width / 2} y={24} textAnchor="middle" fontSize={13} fontWeight="bold" fontFamily="'Courier New', monospace" fill="currentColor" letterSpacing={1.5}>
        {unitType.toUpperCase()} UNIT PLAN VIEW
      </text>
      <text x={width / 2} y={40} textAnchor="middle" fontSize={10} fontFamily="'Courier New', monospace" fill="currentColor" opacity={0.7}>
        Top of Slab (Looking Down)
      </text>

      {/* Outer outline */}
      <rect x={ox} y={oy} width={ow} height={oh} fill="none" stroke="currentColor" strokeWidth={2} />

      {/* Tongue/groove stepped geometry */}
      <TongueGrooveDetail
        ox={ox} ow={ow} oy={oy} oh={oh}
        tongueEnd={tongueEnd}
        ppi={ppi}
        wt={wt}
      />

      {/* Wall locations (dashed lines) */}
      <line x1={x(wt)} y1={oy} x2={x(wt)} y2={oy + oh} stroke="currentColor" strokeWidth={0.5} strokeDasharray="6,3" opacity={0.5} />
      <line x1={x(outsideWidth - wt)} y1={oy} x2={x(outsideWidth - wt)} y2={oy + oh} stroke="currentColor" strokeWidth={0.5} strokeDasharray="6,3" opacity={0.5} />

      {/* Multi-cell interior walls */}
      {geo.cellCount > 1 && Array.from({ length: geo.cellCount - 1 }).map((_, i) => {
        const wallX = wt + (i + 1) * (geo.span + wt);
        return (
          <g key={`iw-${i}`}>
            <line x1={x(wallX)} y1={oy} x2={x(wallX)} y2={oy + oh} stroke="currentColor" strokeWidth={1.5} />
            <line x1={x(wallX + wt)} y1={oy} x2={x(wallX + wt)} y2={oy + oh} stroke="currentColor" strokeWidth={0.5} strokeDasharray="6,3" opacity={0.5} />
          </g>
        );
      })}

      {/* Lift holes */}
      {liftHoles.map((lh, i) => (
        <g key={i}>
          <circle cx={x(lh.x)} cy={y(lh.y)} r={4} fill="none" stroke="currentColor" strokeWidth={1} />
          <line x1={x(lh.x) - 2} y1={y(lh.y)} x2={x(lh.x) + 2} y2={y(lh.y)} stroke="currentColor" strokeWidth={0.5} />
          <line x1={x(lh.x)} y1={y(lh.y) - 2} x2={x(lh.x)} y2={y(lh.y) + 2} stroke="currentColor" strokeWidth={0.5} />
        </g>
      ))}

      {/* Tongue / Groove labels */}
      <text
        x={ox + ow / 2}
        y={tongueEnd === "top" ? oy - 8 : oy + oh + 16}
        textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.7}
      >
        TONGUE END
      </text>
      <text
        x={ox + ow / 2}
        y={grooveEnd === "top" ? oy - 8 : oy + oh + 16}
        textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.7}
      >
        GROOVE END
      </text>

      {/* Flow direction arrow */}
      <g>
        <line x1={ox + ow + 30} y1={oy + oh * 0.3} x2={ox + ow + 30} y2={oy + oh * 0.7} stroke="currentColor" strokeWidth={1} />
        <path
          d={`M ${ox + ow + 26} ${oy + oh * 0.65} L ${ox + ow + 30} ${oy + oh * 0.7} L ${ox + ow + 34} ${oy + oh * 0.65}`}
          fill="none" stroke="currentColor" strokeWidth={1}
        />
        <text x={ox + ow + 30} y={oy + oh * 0.8} textAnchor="middle" fontSize={7} fill="currentColor" opacity={0.7}>
          FLOW
        </text>
      </g>

      {/* Center line */}
      <line
        x1={x(outsideWidth / 2)} y1={oy - 10}
        x2={x(outsideWidth / 2)} y2={oy + oh + 10}
        stroke="currentColor" strokeWidth={0.35} strokeDasharray="10,3,2,3" opacity={0.35}
      />

      {/* Dimensions */}
      <DimensionLine
        x1={ox} y1={oy + oh}
        x2={ox + ow} y2={oy + oh}
        label={formatFeetInches(outsideWidth)}
        offset={40} side="bottom"
      />
      <DimensionLine
        x1={ox} y1={oy}
        x2={ox} y2={oy + oh}
        label={formatFeetInches(unitLen)}
        offset={40} side="left"
      />

      {/* Lift hole label */}
      <text x={x(liftHoles[0].x) + 10} y={y(liftHoles[0].y) - 10} fontSize={7} fill="currentColor" opacity={0.6}>
        LIFT HOLE (TYP.)
      </text>

      <ScaleIndicator ppi={ppi} x={width - 180} y={height - 30} />
    </svg>
  );
}

/** Draws stepped tongue/groove geometry at the ends of the unit */
function TongueGrooveDetail({
  ox, ow, oy, oh, tongueEnd, ppi, wt,
}: {
  ox: number; ow: number; oy: number; oh: number;
  tongueEnd: "top" | "bottom"; ppi: number; wt: number;
}) {
  // Step depth and offset in SVG units
  const stepD = Math.max(1.5 * ppi, 3); // ~1.5" real step
  const stepInset = wt * ppi * 0.3; // inset from wall edges

  const tongueY = tongueEnd === "top" ? oy : oy + oh;
  const grooveY = tongueEnd === "top" ? oy + oh : oy;
  const tDir = tongueEnd === "top" ? -1 : 1; // tongue extends outward
  const gDir = tongueEnd === "top" ? 1 : -1;

  return (
    <g>
      {/* Tongue: stepped line at tongue end */}
      <path
        d={`M ${ox + stepInset} ${tongueY}
            L ${ox + stepInset} ${tongueY + tDir * stepD}
            L ${ox + ow - stepInset} ${tongueY + tDir * stepD}
            L ${ox + ow - stepInset} ${tongueY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.8}
      />
      {/* Groove: stepped line at groove end */}
      <path
        d={`M ${ox + stepInset} ${grooveY}
            L ${ox + stepInset} ${grooveY + gDir * stepD}
            L ${ox + ow - stepInset} ${grooveY + gDir * stepD}
            L ${ox + ow - stepInset} ${grooveY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.8}
        strokeDasharray="4,2"
      />
    </g>
  );
}
