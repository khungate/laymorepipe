"use client";

import React from "react";
import { MaterialSpec } from "@/lib/types/culvert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { NumField } from "./NumField";

interface MaterialsFormProps {
  materials: MaterialSpec;
  onChange: (mat: MaterialSpec) => void;
}

export function MaterialsForm({ materials: mat, onChange }: MaterialsFormProps) {
  const update = (patch: Partial<MaterialSpec>) =>
    onChange({ ...mat, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <NumField label="f'c (psi)" value={mat.concreteStrength} onChange={(v) => update({ concreteStrength: v })} unit="psi" step={500} />
        <NumField label="Rebar Grade" value={mat.rebarGrade} onChange={(v) => update({ rebarGrade: v })} unit="" step={10} />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Rebar Spec</Label>
        <Select value={mat.rebarSpec} onValueChange={(v) => update({ rebarSpec: v })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ASTM A615">ASTM A615</SelectItem>
            <SelectItem value="ASTM A706">ASTM A706</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <p className="text-xs font-medium text-muted-foreground">Concrete Cover</p>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Top Slab Ext." value={mat.coverTopSlabExterior} onChange={(v) => update({ coverTopSlabExterior: v })} step={0.5} />
        <NumField label="Top Slab Int." value={mat.coverTopSlabInterior} onChange={(v) => update({ coverTopSlabInterior: v })} step={0.5} />
        <NumField label="Bot. Slab Ext." value={mat.coverBottomSlabExterior} onChange={(v) => update({ coverBottomSlabExterior: v })} step={0.5} />
        <NumField label="Bot. Slab Int." value={mat.coverBottomSlabInterior} onChange={(v) => update({ coverBottomSlabInterior: v })} step={0.5} />
        <NumField label="Wall Ext." value={mat.coverWallExterior} onChange={(v) => update({ coverWallExterior: v })} step={0.5} />
        <NumField label="Wall Int." value={mat.coverWallInterior} onChange={(v) => update({ coverWallInterior: v })} step={0.5} />
      </div>
    </div>
  );
}
