"use client";

import React from "react";
import { CulvertGeometry, MaterialSpec, ReinforcementBar } from "@/lib/types/culvert";
import { computeOutsideDimensions } from "@/lib/calculations/geometry";
import { autoScale, toSvgX, toSvgY, toSvgLen, DrawingScale } from "@/lib/drawing/scale";
import { formatFeetInches, formatInches } from "@/lib/calculations/quantities";
import { DimensionLine } from "./DimensionLine";
import { RebarSymbol } from "./RebarSymbol";
import { ScaleIndicator } from "./ScaleIndicator";

interface CulvertCrossSectionProps {
  geometry: CulvertGeometry;
  materials: MaterialSpec;
  reinforcement: ReinforcementBar[];
  width?: number;
  height?: number;
  /** Unique prefix for SVG pattern IDs (avoids collisions in print) */
  idPrefix?: string;
}

export function CulvertCrossSection({
  geometry: geo,
  materials: mat,
  reinforcement: bars,
  width = 900,
  height = 700,
  idPrefix = "cs",
}: CulvertCrossSectionProps) {
  const { outsideWidth, outsideHeight } = computeOutsideDimensions(geo);
  const scale = autoScale(outsideWidth, outsideHeight, width, height);
  const gridId = `${idPrefix}-grid`;
  const hatchId = `${idPrefix}-hatch`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      className="text-foreground"
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      <defs>
        <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth={0.15} opacity={0.12} />
        </pattern>
        <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth={0.2} opacity={0.1} />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#${gridId})`} />

      <ConcreteProfile geo={geo} scale={scale} outsideWidth={outsideWidth} outsideHeight={outsideHeight} hatchId={hatchId} />
      <DistributedRebar geo={geo} mat={mat} bars={bars} scale={scale} outsideWidth={outsideWidth} outsideHeight={outsideHeight} />
      <DimensionChains geo={geo} scale={scale} outsideWidth={outsideWidth} outsideHeight={outsideHeight} />

      {/* Title */}
      <text x={width / 2} y={24} textAnchor="middle" fontSize={13} fontWeight="bold" fill="currentColor" letterSpacing={1.5}>
        REINFORCEMENT CROSS SECTION
      </text>
      <text x={width / 2} y={40} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.7}>
        {formatFeetInches(geo.span)} x {formatFeetInches(geo.rise)} Box Culvert
      </text>

      <MaterialNotes mat={mat} x={12} y={height - 110} />
      <ScaleIndicator ppi={scale.ppi} x={width - 180} y={height - 30} />
    </svg>
  );
}

/* ─── Material Notes ─────────────────────────────────────────────────── */

function MaterialNotes({ mat, x, y }: { mat: MaterialSpec; x: number; y: number }) {
  const lines = [
    `f'c = ${mat.concreteStrength.toLocaleString()} PSI`,
    `fy = ${mat.rebarGrade},000 PSI (${mat.rebarSpec})`,
    `Cover: Top Ext. ${formatInches(mat.coverTopSlabExterior)}`,
    `       Top Int. ${formatInches(mat.coverTopSlabInterior)}`,
    `       All others ${formatInches(mat.coverWallExterior)}`,
  ];

  return (
    <g>
      <rect x={x} y={y} width={190} height={lines.length * 14 + 20} fill="var(--background)" stroke="currentColor" strokeWidth={0.5} opacity={0.95} rx={2} />
      <text x={x + 6} y={y + 14} fontSize={8} fontWeight="bold" fill="currentColor" letterSpacing={0.5}>MATERIAL NOTES</text>
      {lines.map((line, i) => (
        <text key={i} x={x + 6} y={y + 28 + i * 14} fontSize={8} fill="currentColor" opacity={0.8}>{line}</text>
      ))}
    </g>
  );
}

/* ─── Concrete Profile ───────────────────────────────────────────────── */

function ConcreteProfile({
  geo, scale, outsideWidth, outsideHeight, hatchId,
}: {
  geo: CulvertGeometry; scale: DrawingScale; outsideWidth: number; outsideHeight: number; hatchId: string;
}) {
  const wt = geo.wallThickness;
  const ts = geo.topSlabThickness;
  const hw = geo.haunchWidth;
  const hh = geo.haunchHeight;

  const ox = toSvgX(0, scale);
  const oy = toSvgY(0, scale);
  const ow = toSvgLen(outsideWidth, scale);
  const oh = toSvgLen(outsideHeight, scale);

  const ix1 = toSvgX(wt, scale);
  const iy1 = toSvgY(ts, scale);
  const ix2 = toSvgX(wt + geo.span, scale);
  const iy2 = toSvgY(ts + geo.rise, scale);
  const hwS = toSvgLen(hw, scale);
  const hhS = toSvgLen(hh, scale);

  const innerPath = [
    `M ${ix1 + hwS} ${iy1}`,
    `L ${ix2 - hwS} ${iy1}`,
    `L ${ix2} ${iy1 + hhS}`,
    `L ${ix2} ${iy2 - hhS}`,
    `L ${ix2 - hwS} ${iy2}`,
    `L ${ix1 + hwS} ${iy2}`,
    `L ${ix1} ${iy2 - hhS}`,
    `L ${ix1} ${iy1 + hhS}`,
    `Z`,
  ].join(" ");

  const outerPath = `M ${ox} ${oy} L ${ox + ow} ${oy} L ${ox + ow} ${oy + oh} L ${ox} ${oy + oh} Z`;

  return (
    <g>
      <path d={`${outerPath} ${innerPath}`} fill={`url(#${hatchId})`} fillRule="evenodd" stroke="none" />
      <rect x={ox} y={oy} width={ow} height={oh} fill="none" stroke="currentColor" strokeWidth={2} />
      <path d={innerPath} fill="var(--background)" stroke="currentColor" strokeWidth={1.5} />
      {/* Center lines */}
      <line x1={toSvgX(outsideWidth / 2, scale)} y1={oy - 12} x2={toSvgX(outsideWidth / 2, scale)} y2={oy + oh + 12} stroke="currentColor" strokeWidth={0.35} strokeDasharray="10,3,2,3" opacity={0.35} />
      <line x1={ox - 12} y1={toSvgY(outsideHeight / 2, scale)} x2={ox + ow + 12} y2={toSvgY(outsideHeight / 2, scale)} stroke="currentColor" strokeWidth={0.35} strokeDasharray="10,3,2,3" opacity={0.35} />
    </g>
  );
}

/* ─── Distributed Reinforcement Bars ─────────────────────────────────── */

interface BarDot {
  cx: number;
  cy: number;
  barSize: number;
  label?: string;
  labelSide: "left" | "right" | "top" | "bottom";
}

function DistributedRebar({
  geo, mat, bars, scale, outsideWidth, outsideHeight,
}: {
  geo: CulvertGeometry; mat: MaterialSpec; bars: ReinforcementBar[];
  scale: DrawingScale; outsideWidth: number; outsideHeight: number;
}) {
  const wt = geo.wallThickness;
  const ts = geo.topSlabThickness;
  const bs = geo.bottomSlabThickness;
  const hw = geo.haunchWidth;
  const hh = geo.haunchHeight;

  const dots: BarDot[] = [];
  const labeled = new Set<string>();

  for (const bar of bars) {
    const loc = bar.location.toLowerCase();
    const qty = bar.quantity;
    const spacing = bar.spacing;
    const mark = bar.barMark;
    const isFirst = !labeled.has(mark);

    const makeLabel = () => {
      if (!isFirst) return undefined;
      labeled.add(mark);
      return `${mark} #${bar.barSize}${spacing > 0 ? ` @ ${spacing}" O.C.` : ""}`;
    };

    if (bar.zone === "top_slab") {
      // Distribute horizontally across the slab
      const y = loc.includes("exterior") ? mat.coverTopSlabExterior : ts - mat.coverTopSlabInterior;
      const labelSide: "top" | "bottom" = loc.includes("exterior") ? "top" : "bottom";
      const startX = wt + hw + (spacing > 0 ? spacing / 2 : 2);

      for (let i = 0; i < qty; i++) {
        const x = startX + i * (spacing || (geo.span - 2 * hw) / Math.max(qty - 1, 1));
        dots.push({
          cx: toSvgX(x, scale),
          cy: toSvgY(y, scale),
          barSize: bar.barSize,
          label: i === 0 ? makeLabel() : undefined,
          labelSide,
        });
      }
    } else if (bar.zone === "bottom_slab") {
      const y = loc.includes("exterior")
        ? outsideHeight - mat.coverBottomSlabExterior
        : outsideHeight - bs + mat.coverBottomSlabInterior;
      const labelSide: "top" | "bottom" = loc.includes("exterior") ? "bottom" : "top";
      const startX = wt + hw + (spacing > 0 ? spacing / 2 : 2);

      for (let i = 0; i < qty; i++) {
        const x = startX + i * (spacing || (geo.span - 2 * hw) / Math.max(qty - 1, 1));
        dots.push({
          cx: toSvgX(x, scale),
          cy: toSvgY(y, scale),
          barSize: bar.barSize,
          label: i === 0 ? makeLabel() : undefined,
          labelSide,
        });
      }
    } else if (bar.zone === "left_wall" || bar.zone === "right_wall") {
      // Wall bars: distribute vertically, then mirror on both walls
      const isExt = loc.includes("exterior");
      const leftX = isExt ? mat.coverWallExterior : wt - mat.coverWallInterior;
      const rightX = isExt ? outsideWidth - mat.coverWallExterior : wt + geo.span + mat.coverWallInterior;
      const startY = ts + hh + (spacing > 0 ? spacing / 2 : 2);
      const availH = geo.rise - 2 * hh;

      const label = makeLabel();

      for (let i = 0; i < qty; i++) {
        const y = startY + i * (spacing || availH / Math.max(qty - 1, 1));
        // Left wall
        dots.push({
          cx: toSvgX(leftX, scale),
          cy: toSvgY(y, scale),
          barSize: bar.barSize,
          label: i === 0 ? label : undefined,
          labelSide: "left",
        });
        // Right wall (mirror, no label)
        dots.push({
          cx: toSvgX(rightX, scale),
          cy: toSvgY(y, scale),
          barSize: bar.barSize,
          labelSide: "right",
        });
      }
    } else if (bar.zone === "haunch") {
      const isTop = loc.includes("top");
      const label = makeLabel();

      // Haunch bars at all 4 (or 2 top / 2 bottom) corners
      if (isTop) {
        dots.push(
          { cx: toSvgX(wt + hw * 0.35, scale), cy: toSvgY(ts + hh * 0.35, scale), barSize: bar.barSize, label, labelSide: "left" },
          { cx: toSvgX(wt + geo.span - hw * 0.35, scale), cy: toSvgY(ts + hh * 0.35, scale), barSize: bar.barSize, labelSide: "right" },
        );
      } else {
        dots.push(
          { cx: toSvgX(wt + hw * 0.35, scale), cy: toSvgY(outsideHeight - bs - hh * 0.35, scale), barSize: bar.barSize, label, labelSide: "left" },
          { cx: toSvgX(wt + geo.span - hw * 0.35, scale), cy: toSvgY(outsideHeight - bs - hh * 0.35, scale), barSize: bar.barSize, labelSide: "right" },
        );
      }
    } else if (bar.zone === "longitudinal") {
      // Longitudinal bars appear as dots in cross section at specific locations
      const label = makeLabel();
      if (loc.includes("top")) {
        // Place in top slab area
        dots.push({
          cx: toSvgX(outsideWidth * 0.15, scale),
          cy: toSvgY(ts / 2, scale),
          barSize: bar.barSize,
          label,
          labelSide: "left",
        });
      } else if (loc.includes("bottom")) {
        dots.push({
          cx: toSvgX(outsideWidth * 0.15, scale),
          cy: toSvgY(outsideHeight - bs / 2, scale),
          barSize: bar.barSize,
          label,
          labelSide: "left",
        });
      } else if (loc.includes("wall")) {
        dots.push({
          cx: toSvgX(wt / 2, scale),
          cy: toSvgY(outsideHeight * 0.4, scale),
          barSize: bar.barSize,
          label,
          labelSide: "left",
        });
      }
    }
  }

  return (
    <g>
      {dots.map((dot, i) => (
        <RebarSymbol
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          barSize={dot.barSize}
          scale={scale.ppi}
          label={dot.label}
          labelSide={dot.labelSide}
          compact={!dot.label}
        />
      ))}
    </g>
  );
}

/* ─── Dimension Chains ───────────────────────────────────────────────── */

function DimensionChains({
  geo, scale, outsideWidth, outsideHeight,
}: {
  geo: CulvertGeometry; scale: DrawingScale; outsideWidth: number; outsideHeight: number;
}) {
  const wt = geo.wallThickness;
  const ts = geo.topSlabThickness;
  const bs = geo.bottomSlabThickness;
  const botY = toSvgY(outsideHeight, scale);

  return (
    <g>
      {/* Bottom horizontal: wall | span | wall */}
      <DimensionLine x1={toSvgX(0, scale)} y1={botY} x2={toSvgX(wt, scale)} y2={botY} label={formatInches(wt)} offset={40} side="bottom" />
      <DimensionLine x1={toSvgX(wt, scale)} y1={botY} x2={toSvgX(wt + geo.span, scale)} y2={botY} label={formatFeetInches(geo.span)} offset={40} side="bottom" />
      <DimensionLine x1={toSvgX(wt + geo.span, scale)} y1={botY} x2={toSvgX(outsideWidth, scale)} y2={botY} label={formatInches(wt)} offset={40} side="bottom" />
      {/* Overall width */}
      <DimensionLine x1={toSvgX(0, scale)} y1={botY} x2={toSvgX(outsideWidth, scale)} y2={botY} label={formatFeetInches(outsideWidth)} offset={65} side="bottom" />

      {/* Right vertical: top slab | rise | bottom slab */}
      {(() => {
        const rx = toSvgX(outsideWidth, scale);
        return (
          <>
            <DimensionLine x1={rx} y1={toSvgY(0, scale)} x2={rx} y2={toSvgY(ts, scale)} label={formatInches(ts)} offset={40} side="right" />
            <DimensionLine x1={rx} y1={toSvgY(ts, scale)} x2={rx} y2={toSvgY(ts + geo.rise, scale)} label={formatFeetInches(geo.rise)} offset={40} side="right" />
            <DimensionLine x1={rx} y1={toSvgY(ts + geo.rise, scale)} x2={rx} y2={toSvgY(outsideHeight, scale)} label={formatInches(bs)} offset={40} side="right" />
            <DimensionLine x1={rx} y1={toSvgY(0, scale)} x2={rx} y2={toSvgY(outsideHeight, scale)} label={formatFeetInches(outsideHeight)} offset={65} side="right" />
          </>
        );
      })()}

      {/* Haunch dimension */}
      {geo.haunchWidth > 0 && (
        <DimensionLine
          x1={toSvgX(wt, scale)} y1={toSvgY(ts, scale)}
          x2={toSvgX(wt + geo.haunchWidth, scale)} y2={toSvgY(ts, scale)}
          label={formatInches(geo.haunchWidth)} offset={16} side="top"
        />
      )}
    </g>
  );
}
