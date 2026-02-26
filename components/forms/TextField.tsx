"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
}: TextFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 text-sm ${error ? "border-destructive" : ""}`}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
