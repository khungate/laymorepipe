"use client";

import React from "react";
import { ComputedValues } from "@/lib/types/culvert";
import { formatFeetInches } from "@/lib/calculations/quantities";

interface ComputedValuesPanelProps {
  values: ComputedValues;
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-mono font-medium">
        {value}
        {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

export function ComputedValuesPanel({ values }: ComputedValuesPanelProps) {
  return (
    <div className="space-y-1 text-foreground">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Computed Values
      </p>
      <Stat
        label="Outside Width"
        value={formatFeetInches(values.outsideWidth)}
      />
      <Stat
        label="Outside Height"
        value={formatFeetInches(values.outsideHeight)}
      />
      <div className="border-t border-border my-2" />
      <Stat
        label="Concrete / Unit"
        value={values.concreteVolumePerUnit.toFixed(3)}
        unit="CY"
      />
      <Stat
        label="Steel / Unit"
        value={Math.round(values.steelWeightPerUnit).toLocaleString()}
        unit="lbs"
      />
      <Stat
        label="Unit Weight"
        value={Math.round(values.unitWeight).toLocaleString()}
        unit="lbs"
      />
      <div className="border-t border-border my-2" />
      <Stat
        label="Total Units"
        value={String(values.totalUnitCount)}
      />
      <Stat
        label="Total Concrete"
        value={values.totalConcreteVolume.toFixed(2)}
        unit="CY"
      />
      <Stat
        label="Total Steel"
        value={Math.round(values.totalSteelWeight).toLocaleString()}
        unit="lbs"
      />
    </div>
  );
}
