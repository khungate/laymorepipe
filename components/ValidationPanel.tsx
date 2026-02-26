"use client";

import React from "react";
import { ValidationResult, Severity } from "@/lib/validation/validate";
import { AlertTriangle, XCircle, Info, ChevronDown, ChevronRight } from "lucide-react";

interface ValidationPanelProps {
  result: ValidationResult;
}

const SEVERITY_CONFIG: Record<Severity, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
};

export function ValidationPanel({ result }: ValidationPanelProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (result.issues.length === 0) return null;

  const errorCount = result.issues.filter((i) => i.severity === "error").length;
  const warnCount = result.issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="font-medium">Validation</span>
        {errorCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-medium">
            {errorCount} {errorCount === 1 ? "error" : "errors"}
          </span>
        )}
        {warnCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-medium">
            {warnCount} {warnCount === 1 ? "warning" : "warnings"}
          </span>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1 max-h-[200px] overflow-auto">
          {result.issues.map((issue, i) => {
            const cfg = SEVERITY_CONFIG[issue.severity];
            const Icon = cfg.icon;
            return (
              <div key={i} className={`flex items-start gap-1.5 px-2 py-1 rounded text-xs ${cfg.bg}`}>
                <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${cfg.color}`} />
                <span className="text-foreground/80">{issue.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
