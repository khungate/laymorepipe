"use client";

import React from "react";
import { UnitConfig } from "@/lib/types/culvert";
import { NumField } from "./NumField";

interface UnitsFormProps {
  units: UnitConfig;
  onChange: (units: UnitConfig) => void;
}

export function UnitsForm({ units, onChange }: UnitsFormProps) {
  const update = (patch: Partial<UnitConfig>) =>
    onChange({ ...units, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Unit Length" value={units.unitLength} onChange={(v) => update({ unitLength: v })} />
        <NumField label="Total Length" value={units.totalLength} onChange={(v) => update({ totalLength: v })} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumField label="Standard Units" value={units.standardUnitCount} onChange={(v) => update({ standardUnitCount: v })} unit="" min={0} />
        <NumField label="Inlet Units" value={units.inletUnitCount} onChange={(v) => update({ inletUnitCount: v })} unit="" min={0} />
        <NumField label="Outlet Units" value={units.outletUnitCount} onChange={(v) => update({ outletUnitCount: v })} unit="" min={0} />
      </div>
    </div>
  );
}
