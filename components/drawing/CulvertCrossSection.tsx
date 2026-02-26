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
  idPrefix?: string;
  /** Currently highlighted bar ID (workspace only) */
  highlightedBarId?: string | null;
  onBarClick?: (barId: string) => void;
}

export function CulvertCrossSection({
  geometry: geo,
  materials: mat,
  reinforcement: bars,
  width = 900,
  height = 700,
  idPrefix = "cs",
  highlightedBarId,
  onBarClick,
}: CulvertCrossSectionProps) {
  const { outsideWidth, outsideHeight } = computeOutsideDimensions(geo);
  // Reserve extra bottom margin for material notes box below dimension chains
  const notesH = 100;
  const scale = autoScale(outsideWidth, outsideHeight, width, height, notesH);
  const gridId = `${idPrefix}-grid`;
  const hatchId = `${idPrefix}-hatch`;

  // Position notes/scale relative to actual drawing bottom + dimension chain offset
  const drawingBottom = toSvgY(outsideHeight, scale);
  const belowDimensions = drawingBottom + 80; // 65px dim chains + 15px gap
  const notesY = Math.min(belowDimensions, height - notesH - 10);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      style={{ fontFamily: "'Courier New', Courier, monospace", display: "block" }}
    >
      <defs>
        {/* Engineering paper grid — subtle */}
        <pattern id={gridId} width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            style={{ stroke: "var(--draw-grid)" }}
            strokeWidth={0.5}
          />
        </pattern>

        {/* Concrete section hatch — denser, ASME-style 45° crosshatch */}
        <pattern id={hatchId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" style={{ stroke: "var(--draw-hatch)" }} strokeWidth={0.6} />
        </pattern>
      </defs>

      {/* Canvas background — transparent in engineering-canvas (viewport provides bg), white in print */}
      <rect width={width} height={height} style={{ fill: "var(--draw-bg, transparent)" }} />
      {/* Grid overlay */}
      <rect width={width} height={height} fill={`url(#${gridId})`} />

      {/* Title block */}
      <text
        x={width / 2} y={22}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        letterSpacing={2}
        style={{ fill: "var(--draw-text)" }}
      >
        REINFORCEMENT CROSS SECTION
      </text>
      <text
        x={width / 2} y={38}
        textAnchor="middle"
        fontSize={9}
        letterSpacing={0.5}
        style={{ fill: "var(--draw-text-dim)" }}
      >
        {formatFeetInches(geo.span)} × {formatFeetInches(geo.rise)} BOX CULVERT ·{" "}
        {geo.cellCount === 1 ? "SINGLE" : geo.cellCount === 2 ? "DOUBLE" : "TRIPLE"} CELL
      </text>

      {/* Concrete profile with ASME line weights */}
      <ConcreteProfile
        geo={geo}
        scale={scale}
        outsideWidth={outsideWidth}
        outsideHeight={outsideHeight}
        hatchId={hatchId}
      />

      {/* Rebar dots */}
      <BarDots
        geo={geo}
        mat={mat}
        bars={bars}
        scale={scale}
        outsideWidth={outsideWidth}
        outsideHeight={outsideHeight}
        highlightedBarId={highlightedBarId ?? null}
        onBarClick={onBarClick}
      />

      {/* Callout leaders */}
      <CalloutLeaders
        geo={geo}
        mat={mat}
        bars={bars}
        scale={scale}
        outsideWidth={outsideWidth}
        outsideHeight={outsideHeight}
      />

      {/* Dimension chains */}
      <DimensionChains
        geo={geo}
        scale={scale}
        outsideWidth={outsideWidth}
        outsideHeight={outsideHeight}
      />

      {/* Material notes box */}
      <MaterialNotes mat={mat} x={12} y={height - 115} />

      <ScaleIndicator ppi={scale.ppi} x={width - 185} y={height - 28} />
    </svg>
  );
}

/* ─── Concrete Profile ───────────────────────────────────────────────── */

function ConcreteProfile({
  geo, scale, outsideWidth, outsideHeight, hatchId,
}: {
  geo: CulvertGeometry; scale: DrawingScale;
  outsideWidth: number; outsideHeight: number; hatchId: string;
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
      {/* Concrete fill (hatch pattern) — evenodd clips to concrete section only */}
      <path
        d={`${outerPath} ${innerPath}`}
        fill={`url(#${hatchId})`}
        fillRule="evenodd"
        stroke="none"
      />

      {/* Void fill — covers any hatch bleed */}
      <path
        d={innerPath}
        style={{ fill: "var(--draw-fill-void)" }}
        stroke="none"
      />

      {/* Object line — outer profile (ASME: thick continuous, 0.7mm equiv) */}
      <rect
        x={ox} y={oy}
        width={ow} height={oh}
        fill="none"
        style={{ stroke: "var(--draw-stroke-heavy)" }}
        strokeWidth={2.5}
        strokeLinejoin="miter"
      />

      {/* Object line — inner haunch void outline (slightly lighter than outer) */}
      <path
        d={innerPath}
        fill="none"
        style={{ stroke: "var(--draw-stroke-heavy)" }}
        strokeWidth={1.8}
        strokeLinejoin="miter"
      />

      {/* Haunch corner callout dots */}
      {hw > 0 && hh > 0 && (
        <g style={{ fill: "var(--draw-stroke-medium)" }}>
          {/* Top-left haunch corner mark */}
          <polyline
            points={`${ix1},${iy1 + hhS} ${ix1 + hwS},${iy1}`}
            fill="none"
            style={{ stroke: "var(--draw-stroke-medium)" }}
            strokeWidth={1.2}
          />
          <polyline
            points={`${ix2 - hwS},${iy1} ${ix2},${iy1 + hhS}`}
            fill="none"
            style={{ stroke: "var(--draw-stroke-medium)" }}
            strokeWidth={1.2}
          />
          <polyline
            points={`${ix1},${iy2 - hhS} ${ix1 + hwS},${iy2}`}
            fill="none"
            style={{ stroke: "var(--draw-stroke-medium)" }}
            strokeWidth={1.2}
          />
          <polyline
            points={`${ix2 - hwS},${iy2} ${ix2},${iy2 - hhS}`}
            fill="none"
            style={{ stroke: "var(--draw-stroke-medium)" }}
            strokeWidth={1.2}
          />
        </g>
      )}

      {/* Center lines — long-dash-short-dash, ASME Y14.2 style */}
      <line
        x1={toSvgX(outsideWidth / 2, scale)} y1={oy - 16}
        x2={toSvgX(outsideWidth / 2, scale)} y2={oy + oh + 16}
        style={{ stroke: "var(--draw-stroke-center)" }}
        strokeWidth={0.5}
        strokeDasharray="12,3,2,3"
      />
      <line
        x1={ox - 16} y1={toSvgY(outsideHeight / 2, scale)}
        x2={ox + ow + 16} y2={toSvgY(outsideHeight / 2, scale)}
        style={{ stroke: "var(--draw-stroke-center)" }}
        strokeWidth={0.5}
        strokeDasharray="12,3,2,3"
      />
      {/* CL symbol labels */}
      <text
        x={toSvgX(outsideWidth / 2, scale) + 4}
        y={oy - 20}
        fontSize={7}
        fontFamily="'Courier New', Courier, monospace"
        style={{ fill: "var(--draw-center)" }}
        letterSpacing={0.5}
      >
        ℄
      </text>
    </g>
  );
}

/* ─── Bar Dots (no inline labels — callouts handled separately) ───────── */

interface BarDotData {
  cx: number;
  cy: number;
  barSize: number;
  barId: string;
}

function collectBarDots(
  geo: CulvertGeometry,
  mat: MaterialSpec,
  bars: ReinforcementBar[],
  scale: DrawingScale,
  outsideWidth: number,
  outsideHeight: number
): BarDotData[] {
  const wt = geo.wallThickness;
  const ts = geo.topSlabThickness;
  const bs = geo.bottomSlabThickness;
  const hw = geo.haunchWidth;
  const hh = geo.haunchHeight;

  const dots: BarDotData[] = [];

  for (const bar of bars) {
    const loc = bar.location.toLowerCase();
    const qty = bar.quantity;
    const spacing = bar.spacing;

    if (bar.zone === "top_slab") {
      const y = loc.includes("exterior") ? mat.coverTopSlabExterior : ts - mat.coverTopSlabInterior;
      const startX = wt + hw + (spacing > 0 ? spacing / 2 : 2);
      const step = spacing > 0 ? spacing : (geo.span - 2 * hw) / Math.max(qty - 1, 1);
      for (let i = 0; i < qty; i++) {
        dots.push({ cx: toSvgX(startX + i * step, scale), cy: toSvgY(y, scale), barSize: bar.barSize, barId: bar.id });
      }
    } else if (bar.zone === "bottom_slab") {
      const y = loc.includes("exterior")
        ? outsideHeight - mat.coverBottomSlabExterior
        : outsideHeight - bs + mat.coverBottomSlabInterior;
      const startX = wt + hw + (spacing > 0 ? spacing / 2 : 2);
      const step = spacing > 0 ? spacing : (geo.span - 2 * hw) / Math.max(qty - 1, 1);
      for (let i = 0; i < qty; i++) {
        dots.push({ cx: toSvgX(startX + i * step, scale), cy: toSvgY(y, scale), barSize: bar.barSize, barId: bar.id });
      }
    } else if (bar.zone === "left_wall" || bar.zone === "right_wall") {
      const isExt = loc.includes("exterior");
      const leftX = isExt ? mat.coverWallExterior : wt - mat.coverWallInterior;
      const rightX = isExt ? outsideWidth - mat.coverWallExterior : wt + geo.span + mat.coverWallInterior;
      const startY = ts + hh + (spacing > 0 ? spacing / 2 : 2);
      const availH = geo.rise - 2 * hh;
      const step = spacing > 0 ? spacing : availH / Math.max(qty - 1, 1);
      for (let i = 0; i < qty; i++) {
        const y = startY + i * step;
        dots.push({ cx: toSvgX(leftX, scale), cy: toSvgY(y, scale), barSize: bar.barSize, barId: bar.id });
        dots.push({ cx: toSvgX(rightX, scale), cy: toSvgY(y, scale), barSize: bar.barSize, barId: bar.id });
      }
    } else if (bar.zone === "haunch") {
      const isTop = loc.includes("top");
      if (isTop) {
        dots.push(
          { cx: toSvgX(wt + hw * 0.35, scale), cy: toSvgY(ts + hh * 0.35, scale), barSize: bar.barSize, barId: bar.id },
          { cx: toSvgX(wt + geo.span - hw * 0.35, scale), cy: toSvgY(ts + hh * 0.35, scale), barSize: bar.barSize, barId: bar.id },
        );
      } else {
        const bsH = geo.bottomSlabThickness;
        dots.push(
          { cx: toSvgX(wt + hw * 0.35, scale), cy: toSvgY(outsideHeight - bsH - hh * 0.35, scale), barSize: bar.barSize, barId: bar.id },
          { cx: toSvgX(wt + geo.span - hw * 0.35, scale), cy: toSvgY(outsideHeight - bsH - hh * 0.35, scale), barSize: bar.barSize, barId: bar.id },
        );
      }
    } else if (bar.zone === "longitudinal") {
      if (loc.includes("top")) {
        dots.push({ cx: toSvgX(outsideWidth * 0.15, scale), cy: toSvgY(ts / 2, scale), barSize: bar.barSize, barId: bar.id });
      } else if (loc.includes("bottom")) {
        dots.push({ cx: toSvgX(outsideWidth * 0.15, scale), cy: toSvgY(outsideHeight - geo.bottomSlabThickness / 2, scale), barSize: bar.barSize, barId: bar.id });
      } else {
        dots.push({ cx: toSvgX(wt / 2, scale), cy: toSvgY(outsideHeight * 0.4, scale), barSize: bar.barSize, barId: bar.id });
      }
    }
  }

  return dots;
}

function BarDots({
  geo, mat, bars, scale, outsideWidth, outsideHeight, highlightedBarId, onBarClick,
}: {
  geo: CulvertGeometry; mat: MaterialSpec; bars: ReinforcementBar[];
  scale: DrawingScale; outsideWidth: number; outsideHeight: number;
  highlightedBarId: string | null;
  onBarClick?: (barId: string) => void;
}) {
  const dots = collectBarDots(geo, mat, bars, scale, outsideWidth, outsideHeight);
  return (
    <g>
      {dots.map((dot, i) => (
        <RebarSymbol
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          barSize={dot.barSize}
          scale={scale.ppi}
          barId={dot.barId}
          highlighted={dot.barId === highlightedBarId}
          onClick={onBarClick ? () => onBarClick(dot.barId) : undefined}
        />
      ))}
    </g>
  );
}

/* ─── Callout Leaders ────────────────────────────────────────────────── */

interface CalloutEntry {
  barId: string;
  anchorX: number;
  anchorY: number;
  side: "left" | "right" | "top" | "bottom";
  label: string;
}

function buildCallouts(
  geo: CulvertGeometry,
  mat: MaterialSpec,
  bars: ReinforcementBar[],
  scale: DrawingScale,
  outsideWidth: number,
  outsideHeight: number
): CalloutEntry[] {
  const wt = geo.wallThickness;
  const ts = geo.topSlabThickness;
  const bs = geo.bottomSlabThickness;
  const hw = geo.haunchWidth;
  const hh = geo.haunchHeight;
  const seenMarks = new Set<string>();
  const callouts: CalloutEntry[] = [];

  for (const bar of bars) {
    if (seenMarks.has(bar.barMark)) continue;
    seenMarks.add(bar.barMark);

    const loc = bar.location.toLowerCase();
    const label = `${bar.barMark}  #${bar.barSize}${bar.spacing > 0 ? ` @ ${bar.spacing}" O.C.` : ""}`;

    if (bar.zone === "top_slab") {
      const y = loc.includes("exterior") ? mat.coverTopSlabExterior : ts - mat.coverTopSlabInterior;
      const startX = wt + hw + (bar.spacing > 0 ? bar.spacing / 2 : 2);
      callouts.push({
        barId: bar.id,
        anchorX: toSvgX(startX, scale),
        anchorY: toSvgY(y, scale),
        side: "top",
        label,
      });
    } else if (bar.zone === "bottom_slab") {
      const y = loc.includes("exterior")
        ? outsideHeight - mat.coverBottomSlabExterior
        : outsideHeight - bs + mat.coverBottomSlabInterior;
      const startX = wt + hw + (bar.spacing > 0 ? bar.spacing / 2 : 2);
      callouts.push({
        barId: bar.id,
        anchorX: toSvgX(startX, scale),
        anchorY: toSvgY(y, scale),
        side: "bottom",
        label,
      });
    } else if (bar.zone === "left_wall") {
      // Exterior left wall bar → label on left
      const isExt = loc.includes("exterior");
      const barX = isExt ? mat.coverWallExterior : wt - mat.coverWallInterior;
      const startY = ts + hh + (bar.spacing > 0 ? bar.spacing / 2 : 2);
      callouts.push({
        barId: bar.id,
        anchorX: toSvgX(barX, scale),
        anchorY: toSvgY(startY, scale),
        side: "left",
        label,
      });
    } else if (bar.zone === "right_wall") {
      // Interior right wall bar → label on right
      const isExt = loc.includes("exterior");
      const barX = isExt ? outsideWidth - mat.coverWallExterior : wt + geo.span + mat.coverWallInterior;
      const startY = ts + hh + (bar.spacing > 0 ? bar.spacing / 2 : 2);
      callouts.push({
        barId: bar.id,
        anchorX: toSvgX(barX, scale),
        anchorY: toSvgY(startY, scale),
        side: "right",
        label,
      });
    } else if (bar.zone === "haunch") {
      const isTop = loc.includes("top");
      const anchorX = toSvgX(wt + hw * 0.35, scale);
      const anchorY = isTop
        ? toSvgY(ts + hh * 0.35, scale)
        : toSvgY(outsideHeight - bs - hh * 0.35, scale);
      callouts.push({ barId: bar.id, anchorX, anchorY, side: "left", label });
    } else if (bar.zone === "longitudinal") {
      if (loc.includes("top")) {
        callouts.push({ barId: bar.id, anchorX: toSvgX(outsideWidth * 0.15, scale), anchorY: toSvgY(ts / 2, scale), side: "left", label });
      } else if (loc.includes("bottom")) {
        callouts.push({ barId: bar.id, anchorX: toSvgX(outsideWidth * 0.15, scale), anchorY: toSvgY(outsideHeight - bs / 2, scale), side: "left", label });
      } else {
        callouts.push({ barId: bar.id, anchorX: toSvgX(wt / 2, scale), anchorY: toSvgY(outsideHeight * 0.4, scale), side: "left", label });
      }
    }
  }

  return callouts;
}

function CalloutLeaders({
  geo, mat, bars, scale, outsideWidth, outsideHeight,
}: {
  geo: CulvertGeometry; mat: MaterialSpec; bars: ReinforcementBar[];
  scale: DrawingScale; outsideWidth: number; outsideHeight: number;
}) {
  const callouts = buildCallouts(geo, mat, bars, scale, outsideWidth, outsideHeight);

  const secLeft = toSvgX(0, scale);
  const secRight = toSvgX(outsideWidth, scale);
  const secTop = toSvgY(0, scale);
  const secBottom = toSvgY(outsideHeight, scale);

  // Label column positions — far enough to clear dimension lines
  const leftLabelX = Math.max(secLeft - 90, 10);
  const rightLabelX = secRight + 90;
  const topLabelBaseY = Math.max(secTop - 52, 48);
  const bottomLabelBaseY = secBottom + 52;

  const leftGroup = callouts.filter((c) => c.side === "left").sort((a, b) => a.anchorY - b.anchorY);
  const rightGroup = callouts.filter((c) => c.side === "right").sort((a, b) => a.anchorY - b.anchorY);
  const topGroup = callouts.filter((c) => c.side === "top").sort((a, b) => a.anchorX - b.anchorX);
  const bottomGroup = callouts.filter((c) => c.side === "bottom").sort((a, b) => a.anchorX - b.anchorX);

  const labelSpacingV = 18;
  const labelSpacingH = 80;

  const elements: React.ReactNode[] = [];

  // Section height available for left/right stacking
  const secHeight = secBottom - secTop;
  // Center the label stack vertically in the section
  const leftTotalH = leftGroup.length * labelSpacingV;
  const leftStartY = secTop + (secHeight - leftTotalH) / 2 + labelSpacingV / 2;

  const rightTotalH = rightGroup.length * labelSpacingV;
  const rightStartY = secTop + (secHeight - rightTotalH) / 2 + labelSpacingV / 2;

  const bendGap = 18; // how far from edge to first bend

  leftGroup.forEach((c, i) => {
    const labelY = leftStartY + i * labelSpacingV;
    const bendX = secLeft - bendGap;
    elements.push(
      <g key={`left-${c.barId}-${i}`}>
        {/* Anchor dot */}
        <circle cx={c.anchorX} cy={c.anchorY} r={2.5} style={{ fill: "var(--draw-dim)" }} />
        {/* Leader: diagonal to bend, then horizontal to label */}
        <polyline
          points={`${c.anchorX},${c.anchorY} ${bendX},${labelY} ${leftLabelX + 4},${labelY}`}
          fill="none"
          style={{ stroke: "var(--draw-dim)" }}
          strokeWidth={0.55}
        />
        {/* Label text */}
        <text
          x={leftLabelX}
          y={labelY + 3.5}
          textAnchor="end"
          fontSize={8.5}
          letterSpacing={0.2}
          style={{ fill: "var(--draw-text)" }}
        >
          {c.label}
        </text>
      </g>
    );
  });

  rightGroup.forEach((c, i) => {
    const labelY = rightStartY + i * labelSpacingV;
    const bendX = secRight + bendGap;
    elements.push(
      <g key={`right-${c.barId}-${i}`}>
        <circle cx={c.anchorX} cy={c.anchorY} r={2.5} style={{ fill: "var(--draw-dim)" }} />
        <polyline
          points={`${c.anchorX},${c.anchorY} ${bendX},${labelY} ${rightLabelX - 4},${labelY}`}
          fill="none"
          style={{ stroke: "var(--draw-dim)" }}
          strokeWidth={0.55}
        />
        <text
          x={rightLabelX}
          y={labelY + 3.5}
          textAnchor="start"
          fontSize={8.5}
          letterSpacing={0.2}
          style={{ fill: "var(--draw-text)" }}
        >
          {c.label}
        </text>
      </g>
    );
  });

  topGroup.forEach((c, i) => {
    const labelY = topLabelBaseY - i * labelSpacingV;
    const bendY = secTop - bendGap;
    elements.push(
      <g key={`top-${c.barId}-${i}`}>
        <circle cx={c.anchorX} cy={c.anchorY} r={2.5} style={{ fill: "var(--draw-dim)" }} />
        <polyline
          points={`${c.anchorX},${c.anchorY} ${c.anchorX + i * labelSpacingH},${bendY} ${c.anchorX + i * labelSpacingH},${labelY + 2}`}
          fill="none"
          style={{ stroke: "var(--draw-dim)" }}
          strokeWidth={0.55}
        />
        <text
          x={c.anchorX + i * labelSpacingH}
          y={labelY - 2}
          textAnchor="middle"
          fontSize={8.5}
          letterSpacing={0.2}
          style={{ fill: "var(--draw-text)" }}
        >
          {c.label}
        </text>
      </g>
    );
  });

  bottomGroup.forEach((c, i) => {
    const labelY = bottomLabelBaseY + i * labelSpacingV;
    const bendY = secBottom + bendGap;
    elements.push(
      <g key={`bot-${c.barId}-${i}`}>
        <circle cx={c.anchorX} cy={c.anchorY} r={2.5} style={{ fill: "var(--draw-dim)" }} />
        <polyline
          points={`${c.anchorX},${c.anchorY} ${c.anchorX + i * labelSpacingH},${bendY} ${c.anchorX + i * labelSpacingH},${labelY - 2}`}
          fill="none"
          style={{ stroke: "var(--draw-dim)" }}
          strokeWidth={0.55}
        />
        <text
          x={c.anchorX + i * labelSpacingH}
          y={labelY + 10}
          textAnchor="middle"
          fontSize={8.5}
          letterSpacing={0.2}
          style={{ fill: "var(--draw-text)" }}
        >
          {c.label}
        </text>
      </g>
    );
  });

  return <g>{elements}</g>;
}

/* ─── Material Notes ─────────────────────────────────────────────────── */

function MaterialNotes({ mat, x, y }: { mat: MaterialSpec; x: number; y: number }) {
  const lines = [
    `f'c = ${mat.concreteStrength.toLocaleString()} PSI`,
    `fy = ${mat.rebarGrade},000 PSI (${mat.rebarSpec})`,
    `Cover — Top Ext.: ${formatInches(mat.coverTopSlabExterior)}`,
    `         Top Int.: ${formatInches(mat.coverTopSlabInterior)}`,
    `        All Other: ${formatInches(mat.coverWallExterior)}`,
  ];

  const boxH = lines.length * 13 + 22;
  return (
    <g>
      <rect
        x={x} y={y}
        width={195} height={boxH}
        style={{ fill: "var(--draw-fill-void)", stroke: "var(--draw-stroke-thin)" }}
        strokeWidth={0.6}
        rx={0}
      />
      <rect
        x={x} y={y}
        width={195} height={16}
        style={{ fill: "var(--draw-hatch)" }}
        stroke="none"
      />
      <text x={x + 6} y={y + 11} fontSize={8} fontWeight="bold" letterSpacing={1} style={{ fill: "var(--draw-text)" }}>
        MATERIAL NOTES
      </text>
      {lines.map((line, i) => (
        <text key={i} x={x + 6} y={y + 26 + i * 13} fontSize={7.5} style={{ fill: "var(--draw-text)" }} letterSpacing={0.2}>
          {line}
        </text>
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
  const rx = toSvgX(outsideWidth, scale);

  return (
    <g>
      {/* Bottom horizontal chain: wall | clear span | wall */}
      <DimensionLine x1={toSvgX(0, scale)} y1={botY} x2={toSvgX(wt, scale)} y2={botY} label={formatInches(wt)} offset={38} side="bottom" fontSize={9} />
      <DimensionLine x1={toSvgX(wt, scale)} y1={botY} x2={toSvgX(wt + geo.span, scale)} y2={botY} label={formatFeetInches(geo.span)} offset={38} side="bottom" fontSize={9} />
      <DimensionLine x1={toSvgX(wt + geo.span, scale)} y1={botY} x2={toSvgX(outsideWidth, scale)} y2={botY} label={formatInches(wt)} offset={38} side="bottom" fontSize={9} />
      {/* Overall outside width */}
      <DimensionLine x1={toSvgX(0, scale)} y1={botY} x2={toSvgX(outsideWidth, scale)} y2={botY} label={formatFeetInches(outsideWidth)} offset={62} side="bottom" fontSize={10} />

      {/* Right vertical chain: top slab | clear rise | bottom slab */}
      <DimensionLine x1={rx} y1={toSvgY(0, scale)} x2={rx} y2={toSvgY(ts, scale)} label={formatInches(ts)} offset={38} side="right" fontSize={9} />
      <DimensionLine x1={rx} y1={toSvgY(ts, scale)} x2={rx} y2={toSvgY(ts + geo.rise, scale)} label={formatFeetInches(geo.rise)} offset={38} side="right" fontSize={9} />
      <DimensionLine x1={rx} y1={toSvgY(ts + geo.rise, scale)} x2={rx} y2={toSvgY(outsideHeight, scale)} label={formatInches(bs)} offset={38} side="right" fontSize={9} />
      {/* Overall outside height */}
      <DimensionLine x1={rx} y1={toSvgY(0, scale)} x2={rx} y2={toSvgY(outsideHeight, scale)} label={formatFeetInches(outsideHeight)} offset={62} side="right" fontSize={10} />

      {/* Haunch dimension */}
      {geo.haunchWidth > 0 && (
        <DimensionLine
          x1={toSvgX(wt, scale)} y1={toSvgY(ts, scale)}
          x2={toSvgX(wt + geo.haunchWidth, scale)} y2={toSvgY(ts, scale)}
          label={formatInches(geo.haunchWidth)}
          offset={14} side="top" fontSize={8}
        />
      )}
    </g>
  );
}
