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

  // Scale to fit with margins for labels
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

  const lh1Y = unitLen / 3;
  const lh2Y = (unitLen * 2) / 3;
  const liftHoles = [
    { x: wt / 2, y: lh1Y },
    { x: wt / 2, y: lh2Y },
    { x: outsideWidth - wt / 2, y: lh1Y },
    { x: outsideWidth - wt / 2, y: lh2Y },
  ];

  const tongueEnd = unitType === "outlet" ? "bottom" : "top";
  const grooveEnd = unitType === "outlet" ? "top" : "bottom";

  const gridId = `${idPrefix}-grid`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      style={{ fontFamily: "'Courier New', Courier, monospace", display: "block" }}
    >
      <defs>
        <pattern id={gridId} width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            style={{ stroke: "var(--draw-grid)" }}
            strokeWidth={0.5}
          />
        </pattern>
      </defs>

      {/* Canvas background */}
      <rect width={width} height={height} style={{ fill: "var(--draw-bg, transparent)" }} />
      <rect width={width} height={height} fill={`url(#${gridId})`} />

      {/* Title */}
      <text
        x={width / 2} y={22}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        letterSpacing={2}
        style={{ fill: "var(--draw-text)" }}
      >
        {unitType.toUpperCase()} UNIT — PLAN VIEW
      </text>
      <text
        x={width / 2} y={38}
        textAnchor="middle"
        fontSize={9}
        letterSpacing={0.5}
        style={{ fill: "var(--draw-text-dim)" }}
      >
        TOP OF SLAB (LOOKING DOWN) · UNIT LENGTH: {formatFeetInches(unitLen)}
      </text>

      {/* Top slab surface — concrete fill with hatch */}
      <rect
        x={ox} y={oy}
        width={ow} height={oh}
        style={{ fill: "var(--draw-fill-void)", stroke: "var(--draw-stroke-heavy)" }}
        strokeWidth={2.5}
      />

      {/* Tongue/groove detail */}
      <TongueGrooveDetail
        ox={ox} ow={ow} oy={oy} oh={oh}
        tongueEnd={tongueEnd}
        ppi={ppi}
        wt={wt}
      />

      {/* Wall position dashed lines (hidden lines per ASME) */}
      <line
        x1={x(wt)} y1={oy} x2={x(wt)} y2={oy + oh}
        style={{ stroke: "var(--draw-stroke-medium)" }}
        strokeWidth={0.7}
        strokeDasharray="8,3"
      />
      <line
        x1={x(outsideWidth - wt)} y1={oy} x2={x(outsideWidth - wt)} y2={oy + oh}
        style={{ stroke: "var(--draw-stroke-medium)" }}
        strokeWidth={0.7}
        strokeDasharray="8,3"
      />

      {/* Multi-cell interior walls */}
      {geo.cellCount > 1 && Array.from({ length: geo.cellCount - 1 }).map((_, i) => {
        const wallX = wt + (i + 1) * (geo.span + wt);
        return (
          <g key={`iw-${i}`}>
            <line
              x1={x(wallX)} y1={oy} x2={x(wallX)} y2={oy + oh}
              style={{ stroke: "var(--draw-stroke-heavy)" }}
              strokeWidth={1.5}
            />
            <line
              x1={x(wallX + wt)} y1={oy} x2={x(wallX + wt)} y2={oy + oh}
              style={{ stroke: "var(--draw-stroke-medium)" }}
              strokeWidth={0.7}
              strokeDasharray="8,3"
            />
          </g>
        );
      })}

      {/* Centerline */}
      <line
        x1={x(outsideWidth / 2)} y1={oy - 14}
        x2={x(outsideWidth / 2)} y2={oy + oh + 14}
        style={{ stroke: "var(--draw-stroke-center)" }}
        strokeWidth={0.5}
        strokeDasharray="12,3,2,3"
      />

      {/* Lift holes */}
      {liftHoles.map((lh, i) => (
        <g key={i}>
          <circle
            cx={x(lh.x)} cy={y(lh.y)} r={5}
            fill="none"
            style={{ stroke: "var(--draw-stroke-medium)" }}
            strokeWidth={1}
          />
          <line
            x1={x(lh.x) - 2.5} y1={y(lh.y)}
            x2={x(lh.x) + 2.5} y2={y(lh.y)}
            style={{ stroke: "var(--draw-stroke-medium)" }}
            strokeWidth={0.7}
          />
          <line
            x1={x(lh.x)} y1={y(lh.y) - 2.5}
            x2={x(lh.x)} y2={y(lh.y) + 2.5}
            style={{ stroke: "var(--draw-stroke-medium)" }}
            strokeWidth={0.7}
          />
        </g>
      ))}

      {/* End labels */}
      <text
        x={ox + ow / 2}
        y={tongueEnd === "top" ? oy - 10 : oy + oh + 18}
        textAnchor="middle"
        fontSize={8}
        letterSpacing={0.5}
        style={{ fill: "var(--draw-text-dim)" }}
      >
        TONGUE END
      </text>
      <text
        x={ox + ow / 2}
        y={grooveEnd === "top" ? oy - 10 : oy + oh + 18}
        textAnchor="middle"
        fontSize={8}
        letterSpacing={0.5}
        style={{ fill: "var(--draw-text-dim)" }}
      >
        GROOVE END
      </text>

      {/* Flow direction arrow */}
      <g>
        <line
          x1={ox + ow + 35} y1={oy + oh * 0.28}
          x2={ox + ow + 35} y2={oy + oh * 0.72}
          style={{ stroke: "var(--draw-stroke-thin)" }}
          strokeWidth={1}
        />
        <path
          d={`M ${ox + ow + 30} ${oy + oh * 0.67} L ${ox + ow + 35} ${oy + oh * 0.72} L ${ox + ow + 40} ${oy + oh * 0.67}`}
          fill="none"
          style={{ stroke: "var(--draw-stroke-thin)" }}
          strokeWidth={1}
        />
        <text
          x={ox + ow + 35} y={oy + oh * 0.82}
          textAnchor="middle"
          fontSize={7}
          letterSpacing={0.5}
          style={{ fill: "var(--draw-text-dim)" }}
        >
          FLOW
        </text>
      </g>

      {/* Lift hole label */}
      <text
        x={x(liftHoles[0].x) + 12}
        y={y(liftHoles[0].y) - 10}
        fontSize={7}
        letterSpacing={0.3}
        style={{ fill: "var(--draw-text-dim)" }}
      >
        LIFT HOLE (TYP.)
      </text>

      {/* Dimensions */}
      <DimensionLine
        x1={ox} y1={oy + oh}
        x2={ox + ow} y2={oy + oh}
        label={formatFeetInches(outsideWidth)}
        offset={40} side="bottom" fontSize={9}
      />
      <DimensionLine
        x1={ox} y1={oy}
        x2={ox} y2={oy + oh}
        label={formatFeetInches(unitLen)}
        offset={40} side="left" fontSize={9}
      />

      <ScaleIndicator ppi={ppi} x={width - 185} y={height - 28} />
    </svg>
  );
}

function TongueGrooveDetail({
  ox, ow, oy, oh, tongueEnd, ppi, wt,
}: {
  ox: number; ow: number; oy: number; oh: number;
  tongueEnd: "top" | "bottom"; ppi: number; wt: number;
}) {
  const stepD = Math.max(1.5 * ppi, 3);
  const stepInset = wt * ppi * 0.3;

  const tongueY = tongueEnd === "top" ? oy : oy + oh;
  const grooveY = tongueEnd === "top" ? oy + oh : oy;
  const tDir = tongueEnd === "top" ? -1 : 1;
  const gDir = tongueEnd === "top" ? 1 : -1;

  return (
    <g>
      <path
        d={`M ${ox + stepInset} ${tongueY}
            L ${ox + stepInset} ${tongueY + tDir * stepD}
            L ${ox + ow - stepInset} ${tongueY + tDir * stepD}
            L ${ox + ow - stepInset} ${tongueY}`}
        fill="none"
        style={{ stroke: "var(--draw-stroke-medium)" }}
        strokeWidth={0.9}
      />
      <path
        d={`M ${ox + stepInset} ${grooveY}
            L ${ox + stepInset} ${grooveY + gDir * stepD}
            L ${ox + ow - stepInset} ${grooveY + gDir * stepD}
            L ${ox + ow - stepInset} ${grooveY}`}
        fill="none"
        style={{ stroke: "var(--draw-stroke-medium)" }}
        strokeWidth={0.9}
        strokeDasharray="5,2"
      />
    </g>
  );
}
