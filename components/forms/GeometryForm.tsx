"use client";

import React from "react";
import { CulvertGeometry } from "@/lib/types/culvert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumField } from "./NumField";

interface GeometryFormProps {
  geometry: CulvertGeometry;
  onChange: (geo: CulvertGeometry) => void;
}

export function GeometryForm({ geometry: geo, onChange }: GeometryFormProps) {
  const update = (patch: Partial<CulvertGeometry>) =>
    onChange({ ...geo, ...patch });

  return (
    <div className="space-y-4">
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
