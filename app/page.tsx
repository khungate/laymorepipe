"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { CulvertDesign } from "@/lib/types/culvert";
import { DEFAULT_DESIGN } from "@/lib/drawing/defaults";
import { computeAll } from "@/lib/calculations/geometry";
import { saveDesign, loadDesign, clearDesign, exportDesignJSON, importDesignJSON } from "@/lib/persistence/storage";
import { useUndoRedo } from "@/lib/hooks/useUndoRedo";
import { validateDesign } from "@/lib/validation/validate";
import { VDOT } from "@/lib/standards/vdot";
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

export default function WorkspacePage() {
  const { state: design, set: setDesign, replace: replaceDesign, undo, redo, canUndo, canRedo } = useUndoRedo<CulvertDesign>(DEFAULT_DESIGN);
  const [activeView, setActiveView] = useState<DrawingView>("cross-section");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadDesign();
    if (saved) replaceDesign(saved);
    isInitialLoad.current = false;
  }, [replaceDesign]);

  // Debounce-save on every state change (500ms)
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

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const computed = useMemo(
    () => computeAll(design.geometry, design.units, design.reinforcement),
    [design.geometry, design.units, design.reinforcement]
  );

  const validation = useMemo(
    () => validateDesign(design, VDOT),
    [design]
  );

  const structureLabel = `${formatFeetInches(design.geometry.span)} x ${formatFeetInches(design.geometry.rise)} x ${formatFeetInches(design.units.totalLength)}`;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importDesignJSON(file);
      replaceDesign(imported);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to import");
    }
    // Reset input so the same file can be re-imported
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
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

      {/* Top bar */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm tracking-tight">Permatile</span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm text-muted-foreground font-mono">
            {structureLabel} {design.geometry.cellCount > 1 ? `${design.geometry.cellCount} Cell` : "Single Cell"} Box Culvert
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Undo / Redo */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* File operations */}
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
          {/* View switcher bar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/20 shrink-0">
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
                />
              )}
              {activeView === "plan-standard" && (
                <PlanView
                  geometry={design.geometry}
                  units={design.units}
                  unitType="standard"
                />
              )}
              {activeView === "plan-inlet" && (
                <PlanView
                  geometry={design.geometry}
                  units={design.units}
                  unitType="inlet"
                />
              )}
              {activeView === "plan-outlet" && (
                <PlanView
                  geometry={design.geometry}
                  units={design.units}
                  unitType="outlet"
                />
              )}
            </DrawingViewport>
          </div>
        </div>

        {/* Right panel: Parameter forms */}
        <div className="w-[380px] border-l border-border flex flex-col shrink-0">
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
                    onChange={(reinforcement) =>
                      setDesign((d) => ({ ...d, reinforcement }))
                    }
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

          {/* Validation panel */}
          <ValidationPanel result={validation} />

          {/* Computed values at bottom of right panel */}
          <div className="border-t border-border p-3 shrink-0">
            <ComputedValuesPanel values={computed} />
          </div>
        </div>
      </div>
    </div>
  );
}
