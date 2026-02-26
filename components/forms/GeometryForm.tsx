"use client";

import React, { useState } from "react";
import { CulvertGeometry } from "@/lib/types/culvert";
import { StateStandard, StandardSize } from "@/lib/standards/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NumField } from "./NumField";
import { Ruler } from "lucide-react";

interface GeometryFormProps {
  geometry: CulvertGeometry;
  onChange: (geo: CulvertGeometry) => void;
  /** Current state standard (for quick size selector) */
  standard?: StateStandard;
  /** Called when user selects a standard size (span/rise/walls + covers) */
  onApplyStandardSize?: (size: StandardSize) => void;
}

export function GeometryForm({
  geometry: geo,
  onChange,
  standard,
  onApplyStandardSize,
}: GeometryFormProps) {
  const update = (patch: Partial<CulvertGeometry>) =>
    onChange({ ...geo, ...patch });

  const sizes = standard?.standardSizes ?? [];

  return (
    <div className="space-y-4">
      {/* Quick Size Selector */}
      {sizes.length > 0 && (
        <QuickSizeSelector
          sizes={sizes}
          standardName={standard?.name ?? ""}
          currentSpan={geo.span}
          currentRise={geo.rise}
          onSelect={(size) => {
            if (onApplyStandardSize) {
              onApplyStandardSize(size);
            }
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Structure Type</Label>
          <Select
            value={geo.structureType}
            onValueChange={(v) =>
              update({ structureType: v as CulvertGeometry["structureType"] })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="box_culvert_4sided">4 Sided Box Culvert</SelectItem>
              <SelectItem value="rigid_frame_3sided">3 Sided Rigid Frame</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cell Count</Label>
          <Select
            value={String(geo.cellCount)}
            onValueChange={(v) => update({ cellCount: Number(v) as 1 | 2 | 3 })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Single</SelectItem>
              <SelectItem value="2">Double</SelectItem>
              <SelectItem value="3">Triple</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumField label="Clear Span" value={geo.span} onChange={(v) => update({ span: v })} />
        <NumField label="Clear Rise" value={geo.rise} onChange={(v) => update({ rise: v })} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumField label="Wall Thickness" value={geo.wallThickness} onChange={(v) => update({ wallThickness: v })} />
        <NumField label="Top Slab" value={geo.topSlabThickness} onChange={(v) => update({ topSlabThickness: v })} />
        <NumField label="Bottom Slab" value={geo.bottomSlabThickness} onChange={(v) => update({ bottomSlabThickness: v })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumField label="Haunch Width" value={geo.haunchWidth} onChange={(v) => update({ haunchWidth: v })} />
        <NumField label="Haunch Height" value={geo.haunchHeight} onChange={(v) => update({ haunchHeight: v })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumField label="Fill Height" value={geo.fillHeight} onChange={(v) => update({ fillHeight: v })} />
        <NumField label="Skew Angle" value={geo.skewAngle} onChange={(v) => update({ skewAngle: v })} unit="deg" />
      </div>

      {geo.cellCount > 1 && (
        <NumField label="Buffer Zone Width" value={geo.bufferZoneWidth} onChange={(v) => update({ bufferZoneWidth: v })} />
      )}
    </div>
  );
}

/* ─── Quick Size Selector ─────────────────────────────────────────────── */

interface QuickSizeSelectorProps {
  sizes: StandardSize[];
  standardName: string;
  currentSpan: number;
  currentRise: number;
  onSelect: (size: StandardSize) => void;
}

function QuickSizeSelector({
  sizes,
  standardName,
  currentSpan,
  currentRise,
  onSelect,
}: QuickSizeSelectorProps) {
  const [open, setOpen] = useState(false);

  // Find if current size matches a standard
  const matchedLabel = sizes.find(
    (s) => s.span === currentSpan && s.rise === currentRise
  )?.label;

  return (
    <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Ruler className="h-3.5 w-3.5 text-primary shrink-0" />
          <div>
            <div className="text-xs font-semibold">
              {standardName} Standard Sizes
            </div>
            {matchedLabel ? (
              <div className="text-[10px] text-primary font-mono font-medium">
                ✓ {matchedLabel}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground">
                Click to pick a standard size
              </div>
            )}
          </div>
        </div>
        <span className="text-muted-foreground text-xs ml-2">{open ? "▲" : "▼"}</span>
      </button>

      {/* Size grid */}
      {open && (
        <div className="border-t border-border p-2">
          <div className="grid grid-cols-4 gap-1 max-h-[200px] overflow-y-auto">
            {sizes.map((size) => {
              const isActive = size.span === currentSpan && size.rise === currentRise;
              return (
                <button
                  key={size.label}
                  onClick={() => {
                    onSelect(size);
                    setOpen(false);
                  }}
                  className={`
                    px-1.5 py-2 rounded text-center text-[11px] font-mono font-medium
                    border transition-colors leading-tight
                    ${isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:bg-primary/10 hover:border-primary/40"
                    }
                  `}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground px-1">
            Selecting a standard size sets span, rise, wall &amp; slab thicknesses, haunch (8″×8″), and cover requirements.
          </div>
        </div>
      )}
    </div>
  );
}
