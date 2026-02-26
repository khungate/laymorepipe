"use client";

import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { CulvertDesign } from "@/lib/types/culvert";
import { StandardSize } from "@/lib/standards/types";
import { DEFAULT_DESIGN } from "@/lib/drawing/defaults";
import { computeAll } from "@/lib/calculations/geometry";
import { saveDesign, loadDesign, clearDesign, exportDesignJSON, importDesignJSON } from "@/lib/persistence/storage";
import { useUndoRedo } from "@/lib/hooks/useUndoRedo";
import { validateDesign } from "@/lib/validation/validate";
import { ALL_STANDARDS } from "@/lib/standards";
import { CulvertCrossSection } from "@/components/drawing/CulvertCrossSection";
import { PlanView } from "@/components/drawing/PlanView";
import { DrawingViewport } from "@/components/drawing/DrawingViewport";
import { GeometryForm } from "@/components/forms/GeometryForm";
import { UnitsForm } from "@/components/forms/UnitsForm";
import { MaterialsForm } from "@/components/forms/MaterialsForm";
import { ReinforcementTable } from "@/components/forms/ReinforcementTable";
import { ProjectInfoForm } from "@/components/forms/ProjectInfoForm";
import { ComputedValuesPanel } from "@/components/ComputedValues";
import { ValidationPanel } from "@/components/ValidationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatFeetInches } from "@/lib/calculations/quantities";
import { FileDown, Ruler, Check, Undo2, Redo2, Upload, Download, FilePlus } from "lucide-react";

type DrawingView = "cross-section" | "plan-standard" | "plan-inlet" | "plan-outlet";

/* ─── Structure Summary Card ────────────────────────────────────────── */

function StructureSummary({
  design,
  computed,
}: {
  design: CulvertDesign;
  computed: ReturnType<typeof computeAll>;
}) {
  const geo = design.geometry;
  const units = design.units;
  const proj = design.project;

  const cellLabel =
    geo.cellCount === 1 ? "Single Cell" : geo.cellCount === 2 ? "Double Cell" : "Triple Cell";

  const statusColor: Record<string, string> = {
    draft: "text-amber-500",
    submitted: "text-blue-400",
    approved: "text-emerald-400",
  };

  return (
    <div
      className="rounded-sm px-3 py-2.5 border border-border/60"
      style={{
        background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)/40) 100%)",
      }}
    >
      {/* Size line */}
      <div className="font-mono font-bold text-sm tracking-tight leading-none mb-1" style={{ letterSpacing: "-0.01em" }}>
        {formatFeetInches(geo.span)} × {formatFeetInches(geo.rise)} × {formatFeetInches(units.totalLength)}
      </div>

      {/* Type line */}
      <div className="text-xs text-muted-foreground font-medium mb-2">
        {cellLabel} Box Culvert
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold bg-muted text-foreground">
          {computed.totalUnitCount} units
        </span>
        <span className="text-muted-foreground text-[10px]">·</span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold bg-primary/10 text-primary">
          {proj.stateStandard}
        </span>
        <span className="text-muted-foreground text-[10px]">·</span>
        <span className={`text-[10px] font-semibold capitalize ${statusColor[proj.status] ?? "text-muted-foreground"}`}>
          {proj.status}
        </span>
      </div>
    </div>
  );
}

/* ─── Main Workspace ────────────────────────────────────────────────── */

export default function WorkspacePage() {
  const {
    state: design,
    set: setDesign,
    replace: replaceDesign,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<CulvertDesign>(DEFAULT_DESIGN);

  const [activeView, setActiveView] = useState<DrawingView>("cross-section");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [highlightedBarId, setHighlightedBarId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadDesign();
    if (saved) replaceDesign(saved);
    isInitialLoad.current = false;
  }, [replaceDesign]);

  // Debounce-save on every state change
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDesign(design);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [design]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === "Escape") setHighlightedBarId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const computed = useMemo(
    () => computeAll(design.geometry, design.units, design.reinforcement),
    [design.geometry, design.units, design.reinforcement]
  );

  // Resolve current standard from project setting
  const currentStandard = useMemo(
    () => ALL_STANDARDS[design.project.stateStandard] ?? ALL_STANDARDS["VDOT"],
    [design.project.stateStandard]
  );

  const validation = useMemo(
    () => validateDesign(design, currentStandard),
    [design, currentStandard]
  );

  // Apply standard size: sets geometry dimensions + material covers + haunch default
  const handleApplyStandardSize = useCallback(
    (size: StandardSize) => {
      setDesign((d) => ({
        ...d,
        geometry: {
          ...d.geometry,
          span: size.span,
          rise: size.rise,
          wallThickness: size.wallThickness,
          topSlabThickness: size.topSlabThickness,
          bottomSlabThickness: size.bottomSlabThickness,
          haunchWidth: 8,
          haunchHeight: 8,
        },
        materials: {
          ...d.materials,
          coverTopSlabExterior: currentStandard.covers.topSlabExterior,
          coverTopSlabInterior: currentStandard.covers.topSlabInterior,
          coverBottomSlabExterior: currentStandard.covers.bottomSlabExterior,
          coverBottomSlabInterior: currentStandard.covers.bottomSlabInterior,
          coverWallExterior: currentStandard.covers.wallExterior,
          coverWallInterior: currentStandard.covers.wallInterior,
        },
      }));
    },
    [setDesign, currentStandard]
  );

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importDesignJSON(file);
      replaceDesign(imported);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to import");
    }
    e.target.value = "";
  };

  const viewButtons: { key: DrawingView; label: string }[] = [
    { key: "cross-section", label: "Cross Section" },
    { key: "plan-standard", label: "Standard Unit" },
    { key: "plan-inlet", label: "Inlet Unit" },
    { key: "plan-outlet", label: "Outlet Unit" },
  ];

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

      {/* Top bar */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm tracking-tight">Permatile</span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-xs text-muted-foreground font-mono">
            {formatFeetInches(design.geometry.span)} × {formatFeetInches(design.geometry.rise)} × {formatFeetInches(design.units.totalLength)}{" "}
            {design.geometry.cellCount > 1 ? `${design.geometry.cellCount} Cell` : "Single Cell"} Box Culvert
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            if (confirm("Start a new design? Current design will be cleared.")) {
              clearDesign();
              replaceDesign(DEFAULT_DESIGN);
            }
          }} title="New Design">
            <FilePlus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileInputRef.current?.click()} title="Import JSON">
            <Upload className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => exportDesignJSON(design)} title="Export JSON">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Separator orientation="vertical" className="h-5 mx-1" />
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in mr-1">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              sessionStorage.setItem("permatile-print-design", JSON.stringify(design));
              window.open("/print", "_blank");
            }}
          >
            <FileDown className="h-3.5 w-3.5 mr-1.5" />
            Generate PDF
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Drawing viewport (center) */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* View switcher */}
          <div
            className="flex items-center gap-1 px-3 py-1.5 border-b border-border shrink-0"
            style={{ background: "rgba(0,0,0,0.25)", borderColor: "rgba(100,140,200,0.15)" }}
          >
            {viewButtons.map((vb) => (
              <button
                key={vb.key}
                onClick={() => setActiveView(vb.key)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeView === vb.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {vb.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            <DrawingViewport>
              {activeView === "cross-section" && (
                <CulvertCrossSection
                  geometry={design.geometry}
                  materials={design.materials}
                  reinforcement={design.reinforcement}
                  width={900}
                  height={700}
                  highlightedBarId={highlightedBarId}
                  onBarClick={(id) =>
                    setHighlightedBarId((prev) => (prev === id ? null : id))
                  }
                />
              )}
              {activeView === "plan-standard" && (
                <PlanView geometry={design.geometry} units={design.units} unitType="standard" />
              )}
              {activeView === "plan-inlet" && (
                <PlanView geometry={design.geometry} units={design.units} unitType="inlet" />
              )}
              {activeView === "plan-outlet" && (
                <PlanView geometry={design.geometry} units={design.units} unitType="outlet" />
              )}
            </DrawingViewport>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[380px] border-l border-border flex flex-col shrink-0">
          {/* ── TOP: Structure summary + computed values ── */}
          <div className="shrink-0 border-b border-border">
            <div className="p-3 space-y-3">
              <StructureSummary design={design} computed={computed} />
              <ComputedValuesPanel values={computed} />
            </div>
          </div>

          {/* ── MIDDLE: Tab forms ── */}
          <Tabs defaultValue="geometry" className="flex flex-col flex-1 min-h-0">
            <TabsList className="mx-3 mt-2 shrink-0">
              <TabsTrigger value="geometry" className="text-xs">Geometry</TabsTrigger>
              <TabsTrigger value="units" className="text-xs">Units</TabsTrigger>
              <TabsTrigger value="materials" className="text-xs">Materials</TabsTrigger>
              <TabsTrigger value="rebar" className="text-xs">Rebar</TabsTrigger>
              <TabsTrigger value="project" className="text-xs">Project</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3">
                <TabsContent value="geometry" className="mt-0">
                  <GeometryForm
                    geometry={design.geometry}
                    onChange={(geometry) => setDesign((d) => ({ ...d, geometry }))}
                    standard={currentStandard}
                    onApplyStandardSize={handleApplyStandardSize}
                  />
                </TabsContent>

                <TabsContent value="units" className="mt-0">
                  <UnitsForm
                    units={design.units}
                    onChange={(units) => setDesign((d) => ({ ...d, units }))}
                  />
                </TabsContent>

                <TabsContent value="materials" className="mt-0">
                  <MaterialsForm
                    materials={design.materials}
                    onChange={(materials) => setDesign((d) => ({ ...d, materials }))}
                  />
                </TabsContent>

                <TabsContent value="rebar" className="mt-0">
                  <ReinforcementTable
                    bars={design.reinforcement}
                    onChange={(reinforcement) => setDesign((d) => ({ ...d, reinforcement }))}
                    highlightedBarId={highlightedBarId}
                    onHighlight={setHighlightedBarId}
                  />
                </TabsContent>

                <TabsContent value="project" className="mt-0">
                  <ProjectInfoForm
                    project={design.project}
                    onChange={(project) => setDesign((d) => ({ ...d, project }))}
                  />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          {/* ── BOTTOM: Validation ── */}
          <ValidationPanel result={validation} />
        </div>
      </div>
    </div>
  );
}
