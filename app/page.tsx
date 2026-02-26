"use client";

import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { CulvertDesign } from "@/lib/types/culvert";
import { StandardSize } from "@/lib/standards/types";
import { DEFAULT_DESIGN } from "@/lib/drawing/defaults";
import { computeAll } from "@/lib/calculations/geometry";
import { saveDesign, loadDesign, clearDesign, exportDesignJSON, importDesignJSON } from "@/lib/persistence/storage";
import { useUndoRedo } from "@/lib/hooks/useUndoRedo";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
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
import { MobileBottomSheet } from "@/components/workspace/MobileBottomSheet";
import { TabletSlideOver } from "@/components/workspace/TabletSlideOver";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFeetInches } from "@/lib/calculations/quantities";
import {
  FileDown,
  Ruler,
  Check,
  Undo2,
  Redo2,
  Upload,
  Download,
  FilePlus,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  PanelRight,
  MoreHorizontal,
} from "lucide-react";
import { useTheme } from "next-themes";

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
      <div
        className="font-mono font-bold text-sm tracking-tight leading-none mb-1"
        style={{ letterSpacing: "-0.01em" }}
      >
        {formatFeetInches(geo.span)} × {formatFeetInches(geo.rise)} × {formatFeetInches(units.totalLength)}
      </div>

      {/* Type line */}
      <div className="text-xs text-muted-foreground font-medium mb-2">{cellLabel} Box Culvert</div>

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

/* ─── Accordion Section ─────────────────────────────────────────────── */

interface AccordionSectionProps {
  title: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, summary, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/50 transition-colors"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          {!isOpen && summary && (
            <span className="text-[10px] text-foreground/60 font-mono truncate max-w-[130px]">
              {summary}
            </span>
          )}
          <ChevronDown
            className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-200 ${
              isOpen ? "" : "-rotate-90"
            }`}
          />
        </div>
      </button>

      {/* Smooth height animation via CSS grid-template-rows trick */}
      <div
        className="grid"
        style={{
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 200ms ease",
        }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-3 pt-2 pb-3">{children}</div>
        </div>
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
  const { theme, setTheme } = useTheme();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sidebar collapse / resize state (desktop only) ────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isDragging, setIsDragging] = useState(false);
  const isFirstCollapsedSave = useRef(true);
  const isFirstWidthSave = useRef(true);

  // ── Responsive state ──────────────────────────────────────────────
  // `mounted` prevents SSR/hydration mismatch: we default to desktop layout
  // until the client knows the actual viewport size.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isMobileQuery = useMediaQuery("(max-width: 767px)");
  const isTabletQuery = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  const isMobile = mounted && isMobileQuery;
  const isTablet = mounted && isTabletQuery;
  const isDesktop = !isMobile && !isTablet;

  // Tablet slide-over open state
  const [tabletPanelOpen, setTabletPanelOpen] = useState(false);

  // ── Accordion open/closed state ───────────────────────────────────
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    geometry: true,
    units: false,
    materials: false,
    rebar: false,
    project: false,
  });

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Load design from localStorage on mount
  useEffect(() => {
    const saved = loadDesign();
    if (saved) replaceDesign(saved);
    isInitialLoad.current = false;
  }, [replaceDesign]);

  // Debounce-save design on every state change
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

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const collapsed = localStorage.getItem("permatile-sidebar-collapsed") === "true";
    const rawWidth = parseInt(localStorage.getItem("permatile-sidebar-width") ?? "380", 10);
    const width = isNaN(rawWidth) ? 380 : Math.max(300, Math.min(500, rawWidth));
    setSidebarCollapsed(collapsed);
    setSidebarWidth(width);
  }, []);

  // Persist sidebar collapsed (skip initial render to avoid stomping loaded value)
  useEffect(() => {
    if (isFirstCollapsedSave.current) {
      isFirstCollapsedSave.current = false;
      return;
    }
    localStorage.setItem("permatile-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Persist sidebar width (skip initial render)
  useEffect(() => {
    if (isFirstWidthSave.current) {
      isFirstWidthSave.current = false;
      return;
    }
    localStorage.setItem("permatile-sidebar-width", String(sidebarWidth));
  }, [sidebarWidth]);

  // Keyboard shortcuts
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
      if (e.key === "Escape") setHighlightedBarId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const computed = useMemo(
    () => computeAll(design.geometry, design.units, design.reinforcement),
    [design.geometry, design.units, design.reinforcement]
  );

  const currentStandard = useMemo(
    () => ALL_STANDARDS[design.project.stateStandard] ?? ALL_STANDARDS["VDOT"],
    [design.project.stateStandard]
  );

  const validation = useMemo(
    () => validateDesign(design, currentStandard),
    [design, currentStandard]
  );

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

  // ── Sidebar drag-to-resize (desktop only) ─────────────────────────
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;
      setIsDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = startX - ev.clientX;
        const newWidth = Math.max(300, Math.min(500, startWidth + delta));
        setSidebarWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [sidebarWidth]
  );

  // ── Accordion summary strings ─────────────────────────────────────
  const geo = design.geometry;
  const cellShort =
    geo.cellCount === 1 ? "Single" : geo.cellCount === 2 ? "Double" : "Triple";
  const geometrySummary = `${formatFeetInches(geo.span)}×${formatFeetInches(geo.rise)} ${cellShort}`;
  const totalUnits =
    design.units.standardUnitCount +
    design.units.inletUnitCount +
    design.units.outletUnitCount;
  const unitsSummary = `${totalUnits} units / ${formatFeetInches(design.units.totalLength)}`;
  const materialsSummary = `${design.materials.concreteStrength} PSI / Gr ${design.materials.rebarGrade}`;
  const rebarCount = design.reinforcement.length;
  const rebarSummary = `${rebarCount} bar${rebarCount !== 1 ? "s" : ""}`;
  const projectSummary = design.project.projectName || "Untitled";

  const viewButtons: { key: DrawingView; label: string }[] = [
    { key: "cross-section", label: "Cross Section" },
    { key: "plan-standard", label: "Standard Unit" },
    { key: "plan-inlet", label: "Inlet Unit" },
    { key: "plan-outlet", label: "Outlet Unit" },
  ];

  // Smooth transition — disabled while resizing to avoid jank
  const sidebarTransition = isDragging ? "none" : "width 250ms ease";
  const toggleTransition = isDragging ? "none" : "right 250ms ease";

  // ── Shared sidebar content (rendered in desktop / tablet / mobile) ─
  //
  // This JSX node is passed as children to whichever container is active:
  // the desktop sidebar div, TabletSlideOver, or MobileBottomSheet.
  // It is only mounted once — no DOM duplication.
  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* 1. Structure summary */}
      <div className="shrink-0 p-3 border-b border-border">
        <StructureSummary design={design} computed={computed} />
      </div>

      {/* 2. Accordion sections (scrollable) */}
      <ScrollArea className="flex-1 min-h-0">
        <div>
          <AccordionSection
            title="Geometry"
            summary={geometrySummary}
            isOpen={openSections.geometry}
            onToggle={() => toggleSection("geometry")}
          >
            <GeometryForm
              geometry={design.geometry}
              onChange={(geometry) => setDesign((d) => ({ ...d, geometry }))}
              standard={currentStandard}
              standardName={design.project.stateStandard}
              onChangeStandard={(name) =>
                setDesign((d) => ({
                  ...d,
                  project: { ...d.project, stateStandard: name },
                }))
              }
              onApplyStandardSize={handleApplyStandardSize}
            />
          </AccordionSection>

          <AccordionSection
            title="Units"
            summary={unitsSummary}
            isOpen={openSections.units}
            onToggle={() => toggleSection("units")}
          >
            <UnitsForm
              units={design.units}
              onChange={(units) => setDesign((d) => ({ ...d, units }))}
            />
          </AccordionSection>

          <AccordionSection
            title="Materials"
            summary={materialsSummary}
            isOpen={openSections.materials}
            onToggle={() => toggleSection("materials")}
          >
            <MaterialsForm
              materials={design.materials}
              onChange={(materials) => setDesign((d) => ({ ...d, materials }))}
            />
          </AccordionSection>

          <AccordionSection
            title="Rebar"
            summary={rebarSummary}
            isOpen={openSections.rebar}
            onToggle={() => toggleSection("rebar")}
          >
            <ReinforcementTable
              bars={design.reinforcement}
              onChange={(reinforcement) =>
                setDesign((d) => ({ ...d, reinforcement }))
              }
              highlightedBarId={highlightedBarId}
              onHighlight={setHighlightedBarId}
            />
          </AccordionSection>

          <AccordionSection
            title="Project"
            summary={projectSummary}
            isOpen={openSections.project}
            onToggle={() => toggleSection("project")}
          >
            <ProjectInfoForm
              project={design.project}
              onChange={(project) => setDesign((d) => ({ ...d, project }))}
            />
          </AccordionSection>
        </div>
      </ScrollArea>

      {/* 3. Computed values — pinned at bottom */}
      <div className="shrink-0 border-t border-border bg-background">
        <div className="px-3 py-2.5">
          <ComputedValuesPanel values={computed} />
        </div>
      </div>

      {/* 4. Validation */}
      <div className="shrink-0">
        <ValidationPanel result={validation} />
      </div>
    </div>
  );

  // ── Shared overflow/more menu (tablet + mobile) ───────────────────
  const overflowMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="More options">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => {
            if (confirm("Start a new design? Current design will be cleared.")) {
              clearDesign();
              replaceDesign(DEFAULT_DESIGN);
            }
          }}
        >
          <FilePlus className="h-4 w-4 mr-2" />
          New Design
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Import JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportDesignJSON(design)}>
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 mr-2" />
          ) : (
            <Moon className="h-4 w-4 mr-2" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            sessionStorage.setItem("permatile-print-design", JSON.stringify(design));
            window.open("/print", "_blank");
          }}
        >
          <FileDown className="h-4 w-4 mr-2" />
          Generate PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="h-screen max-w-[100vw] flex flex-col bg-background text-foreground overflow-hidden">
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 gap-2">

        {/* Logo — always visible */}
        <div className="flex items-center gap-2 shrink-0">
          <Ruler className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm tracking-tight">Permatile</span>
        </div>

        {/* Dimensions — desktop and tablet; hidden on mobile (shown in bottom sheet summary) */}
        {!isMobile && (
          <>
            <Separator orientation="vertical" className="h-5 mx-1 shrink-0" />
            <span className={`text-xs text-muted-foreground font-mono min-w-0 ${isTablet ? "truncate max-w-[200px]" : ""}`}>
              {formatFeetInches(design.geometry.span)} × {formatFeetInches(design.geometry.rise)} ×{" "}
              {formatFeetInches(design.units.totalLength)}{" "}
              {design.geometry.cellCount > 1
                ? `${design.geometry.cellCount} Cell`
                : "Single Cell"}{" "}
              Box Culvert
            </span>
          </>
        )}

        {/* ── Desktop actions (≥1024px) ─────────────────────────────── */}
        {isDesktop && (
          <div className="flex items-center gap-1 ml-auto shrink-0 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (confirm("Start a new design? Current design will be cleared.")) {
                  clearDesign();
                  replaceDesign(DEFAULT_DESIGN);
                }
              }}
              title="New Design"
            >
              <FilePlus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              title="Import JSON"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exportDesignJSON(design)}
              title="Export JSON"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={mounted ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : undefined}
            >
              {mounted ? (
                theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />
              ) : (
                <span className="h-3.5 w-3.5" />
              )}
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
            {sidebarCollapsed && (
              <>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSidebarCollapsed(false)}
                  title="Show panel"
                >
                  <PanelRight className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* ── Tablet actions (768-1023px): undo/redo + panel toggle + overflow ── */}
        {isTablet && (
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in mr-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTabletPanelOpen((o) => !o)}
              title="Toggle panel"
            >
              <PanelRight className="h-3.5 w-3.5" />
            </Button>
            {overflowMenu}
          </div>
        )}

        {/* ── Mobile actions (<768px): undo/redo + more menu ─────────── */}
        {isMobile && (
          <div className="flex items-center gap-0.5 ml-auto shrink-0">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in mr-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            {overflowMenu}
          </div>
        )}
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* ── Drawing viewport — always fills available width ─────────── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* View switcher
              Desktop: compact, fixed height
              Mobile/Tablet: overflow-x-auto, 44px min touch target
          */}
          <div
            className={`flex items-center border-b border-border/50 bg-muted/30 shrink-0 ${
              isMobile || isTablet
                ? "gap-1 px-2 overflow-x-auto"
                : "gap-1 px-3 py-1.5"
            }`}
            style={isMobile || isTablet ? { WebkitOverflowScrolling: "touch" } : undefined}
          >
            {viewButtons.map((vb) => (
              <button
                key={vb.key}
                onClick={() => setActiveView(vb.key)}
                className={`rounded text-xs font-medium transition-colors shrink-0 ${
                  isMobile || isTablet
                    ? "min-h-[44px] px-3 py-2"
                    : "px-2.5 py-1"
                } ${
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

        {/* ── Desktop: sidebar collapse toggle + sidebar ──────────────── */}
        {isDesktop && (
          <>
            {/* Sidebar collapse toggle — floats at left edge of sidebar */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className={`absolute z-20 top-1/2 -translate-y-1/2 flex items-center justify-center bg-background border border-border rounded-sm shadow-sm hover:bg-muted transition-all duration-200 ${
                sidebarCollapsed ? "h-10 w-6" : "h-8 w-3.5"
              }`}
              style={{
                right: sidebarCollapsed ? 0 : sidebarWidth,
                transition: toggleTransition,
              }}
              title={sidebarCollapsed ? "Show panel" : "Hide panel"}
            >
              <ChevronRight
                className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
                  sidebarCollapsed ? "" : "rotate-180"
                }`}
              />
            </button>

            {/* Right sidebar */}
            <div
              className="flex flex-col shrink-0 overflow-hidden"
              style={{
                width: sidebarCollapsed ? 0 : sidebarWidth,
                transition: sidebarTransition,
              }}
            >
              {/*
                Inner div has a fixed width equal to sidebarWidth.
                The outer container clips it via overflow:hidden during collapse,
                so content doesn't reflow as the panel animates.
              */}
              <div className="flex h-full" style={{ width: sidebarWidth }}>
                {/* Resize drag handle — 3px wide strip on the left edge */}
                <div
                  className="w-[3px] shrink-0 cursor-col-resize bg-border hover:bg-primary/40 transition-colors"
                  onMouseDown={handleResizeStart}
                  title="Drag to resize"
                />

                {/* Sidebar content panel */}
                <div className="flex-1 flex flex-col overflow-hidden bg-background min-w-0">
                  {sidebarContent}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Tablet: slide-over panel (768-1023px) ─────────────────── */}
        {isTablet && (
          <TabletSlideOver
            open={tabletPanelOpen}
            onClose={() => setTabletPanelOpen(false)}
          >
            {sidebarContent}
          </TabletSlideOver>
        )}

        {/* ── Mobile: bottom sheet (<768px) ─────────────────────────── */}
        {isMobile && (
          <MobileBottomSheet>
            {sidebarContent}
          </MobileBottomSheet>
        )}
      </div>
    </div>
  );
}
