"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: number;
  min?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

export function NumField({
  label,
  value,
  onChange,
  unit = '"',
  step = 1,
  min = 0,
  error,
  hint,
  disabled,
}: NumFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step={step}
          min={min}
          disabled={disabled}
          className={`h-8 text-sm font-mono ${error ? "border-destructive" : ""}`}
        />
        {unit && <span className="text-xs text-muted-foreground w-4 shrink-0">{unit}</span>}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
