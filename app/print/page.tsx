"use client";

import React, { useEffect, useState } from "react";
import { CulvertDesign } from "@/lib/types/culvert";
import { DEFAULT_DESIGN } from "@/lib/drawing/defaults";
import { computeAll } from "@/lib/calculations/geometry";
import { CulvertCrossSection } from "@/components/drawing/CulvertCrossSection";
import { PlanView } from "@/components/drawing/PlanView";
import { BarScheduleTable } from "@/components/drawing/BarScheduleTable";
import { SheetBorder, SheetSize, SHEET_DIMS } from "@/components/drawing/SheetBorder";
import { VDOT } from "@/lib/standards/vdot";

export default function PrintPage() {
  const [design, setDesign] = useState<CulvertDesign | null>(null);
  const [sheetSize, setSheetSize] = useState<SheetSize>("TABLOID");

  useEffect(() => {
    // Read design data from sessionStorage (set by main page before navigating)
    const stored = sessionStorage.getItem("permatile-print-design");
    const storedSize = sessionStorage.getItem("permatile-print-size");
    if (stored) {
      setDesign(JSON.parse(stored));
    } else {
      setDesign(DEFAULT_DESIGN);
    }
    if (storedSize) {
      setSheetSize(storedSize as SheetSize);
    }
  }, []);

  useEffect(() => {
    // Auto-trigger print dialog once rendered
    if (design) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [design]);

  if (!design) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-black font-mono">
        Loading drawing set...
      </div>
    );
  }

  const computed = computeAll(design.geometry, design.units, design.reinforcement);
  const totalSheets = 4;

  // Derive content area from sheet dims (margin=36, inner padding=20, inner border=4, title block=120)
  const dims = SHEET_DIMS[sheetSize];
  const margin = 36;
  const padding = 24; // 20 content offset + 4 inner border
  const titleBlockH = 120;
  const contentW = dims.w - 2 * margin - 2 * padding;
  const contentH = dims.h - 2 * margin - 2 * padding - titleBlockH;

  return (
    <div className="bg-white print-sheets">
      <style>{`
        @media print {
          @page {
            size: ${sheetSize === "ARCH_D" ? "36in 24in" : "17in 11in"} landscape;
            margin: 0;
          }
          body { margin: 0; padding: 0; }
          .print-sheets > svg { page-break-after: always; }
          .print-sheets > svg:last-child { page-break-after: auto; }
          .no-print { display: none !important; }
        }
        @media screen {
          .print-sheets { display: flex; flex-direction: column; align-items: center; gap: 40px; padding: 40px; background: #e5e5e5; }
          .print-sheets > svg { box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        }
      `}</style>

      {/* Print controls (hidden when printing) */}
      <div className="no-print" style={{
        position: "fixed", top: 16, right: 16, zIndex: 50,
        display: "flex", gap: 8, fontFamily: "system-ui",
      }}>
        <select
          value={sheetSize}
          onChange={(e) => setSheetSize(e.target.value as SheetSize)}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
        >
          <option value="TABLOID">11&quot; x 17&quot;</option>
          <option value="ARCH_D">24&quot; x 36&quot;</option>
        </select>
        <button
          onClick={() => window.print()}
          style={{
            padding: "6px 16px", borderRadius: 6, border: "none",
            background: "#dc2626", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{
            padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc",
            background: "white", fontSize: 13, cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      {/* Sheet 1: Reinforcement Cross Section */}
      <SheetBorder
        size={sheetSize}
        project={design.project}
        geometry={design.geometry}
        units={design.units}
        sheetNumber={1}
        totalSheets={totalSheets}
        sheetTitle="REINFORCEMENT CROSS SECTION"
      >
        <CulvertCrossSection
          geometry={design.geometry}
          materials={design.materials}
          reinforcement={design.reinforcement}
          width={contentW}
          height={contentH}
          idPrefix="s1-cs"
        />
      </SheetBorder>

      {/* Sheet 2: Standard Unit Plan View */}
      <SheetBorder
        size={sheetSize}
        project={design.project}
        geometry={design.geometry}
        units={design.units}
        sheetNumber={2}
        totalSheets={totalSheets}
        sheetTitle="STANDARD UNIT PLAN VIEW"
      >
        <PlanView
          geometry={design.geometry}
          units={design.units}
          unitType="standard"
          width={contentW}
          height={contentH}
          idPrefix="s2-pv"
        />
      </SheetBorder>

      {/* Sheet 3: Inlet / Outlet Plan Views */}
      <SheetBorder
        size={sheetSize}
        project={design.project}
        geometry={design.geometry}
        units={design.units}
        sheetNumber={3}
        totalSheets={totalSheets}
        sheetTitle="INLET / OUTLET PLAN VIEWS"
      >
        <g>
          <PlanView
            geometry={design.geometry}
            units={design.units}
            unitType="inlet"
            width={contentW / 2}
            height={contentH}
            idPrefix="s3-inlet"
          />
          <g transform={`translate(${contentW / 2}, 0)`}>
            <PlanView
              geometry={design.geometry}
              units={design.units}
              unitType="outlet"
              width={contentW / 2}
              height={contentH}
              idPrefix="s3-outlet"
            />
          </g>
        </g>
      </SheetBorder>

      {/* Sheet 4: Steel Reinforcement Summary */}
      <SheetBorder
        size={sheetSize}
        project={design.project}
        geometry={design.geometry}
        units={design.units}
        sheetNumber={4}
        totalSheets={totalSheets}
        sheetTitle="REINFORCEMENT SCHEDULE"
      >
        <BarScheduleTable
          bars={design.reinforcement}
          totalUnits={computed.totalUnitCount}
          x={40}
          y={60}
        />

        {/* General notes */}
        {(() => {
          // Calculate total table height accounting for bent bar rows
          const tableH = design.reinforcement.reduce((sum, bar) => sum + (bar.shape !== "straight" ? 50 : 18), 0);
          const notesY = 60 + 22 + tableH + 18 + 40; // header + rows + totals + gap
          return (
            <g>
              <text x={40} y={notesY} fontSize={11} fontWeight="bold" letterSpacing={1} fill="black">
                GENERAL NOTES
              </text>
              {VDOT.generalNotes.map((note, i) => (
                <text key={i} x={40} y={notesY + 20 + i * 16} fontSize={8} fill="black">
                  {i + 1}. {note}
                </text>
              ))}
            </g>
          );
        })()}
      </SheetBorder>
    </div>
  );
}
