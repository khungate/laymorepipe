"use client";

import React from "react";
import { ComputedValues } from "@/lib/types/culvert";
import { formatFeetInches } from "@/lib/calculations/quantities";

interface ComputedValuesPanelProps {
  values: ComputedValues;
}

interface StatRowProps {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}

function StatRow({ label, value, unit, accent }: StatRowProps) {
  return (
    <div className="flex justify-between items-baseline py-0.5">
      <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
      <span
        className="text-sm font-mono font-semibold leading-tight tabular-nums"
        style={{ color: accent ? "hsl(var(--primary))" : undefined }}
      >
        {value}
        {unit && (
          <span className="text-[10px] font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

export function ComputedValuesPanel({ values }: ComputedValuesPanelProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
          Computed Values
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Dimensions */}
      <div className="space-y-px mb-2">
        <StatRow label="Outside Width" value={formatFeetInches(values.outsideWidth)} />
        <StatRow label="Outside Height" value={formatFeetInches(values.outsideHeight)} />
      </div>

      <div className="border-t border-border my-2" />

      {/* Per-unit quantities */}
      <div className="space-y-px mb-2">
        <StatRow
          label="Concrete / Unit"
          value={values.concreteVolumePerUnit.toFixed(3)}
          unit="CY"
          accent
        />
        <StatRow
          label="Steel / Unit"
          value={Math.round(values.steelWeightPerUnit).toLocaleString()}
          unit="lbs"
        />
        <StatRow
          label="Unit Weight"
          value={Math.round(values.unitWeight).toLocaleString()}
          unit="lbs"
        />
      </div>

      <div className="border-t border-border my-2" />

      {/* Project totals */}
      <div className="space-y-px">
        <StatRow label="Total Units" value={String(values.totalUnitCount)} />
        <StatRow
          label="Total Concrete"
          value={values.totalConcreteVolume.toFixed(2)}
          unit="CY"
          accent
        />
        <StatRow
          label="Total Steel"
          value={Math.round(values.totalSteelWeight).toLocaleString()}
          unit="lbs"
        />
      </div>
    </div>
  );
}
