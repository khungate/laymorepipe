import { CulvertDesign } from "../types/culvert";
import { StateStandard } from "../standards/types";

export type Severity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: Severity;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export function validateDesign(
  design: CulvertDesign,
  standard: StateStandard
): ValidationResult {
  const issues: ValidationIssue[] = [];

  const { geometry: geo, units, materials: mat, reinforcement: bars } = design;

  // Concrete strength
  if (mat.concreteStrength < standard.minConcreteStrength) {
    issues.push({
      severity: "error",
      field: "materials.concreteStrength",
      message: `f'c must be at least ${standard.minConcreteStrength.toLocaleString()} psi per ${standard.name}`,
    });
  }

  // Rebar grade
  if (mat.rebarGrade < standard.rebarGrade) {
    issues.push({
      severity: "error",
      field: "materials.rebarGrade",
      message: `Rebar grade must be at least ${standard.rebarGrade} per ${standard.name}`,
    });
  }

  // Cover compliance
  const coverChecks: { field: string; actual: number; required: number; label: string }[] = [
    { field: "materials.coverTopSlabExterior", actual: mat.coverTopSlabExterior, required: standard.covers.topSlabExterior, label: "Top slab exterior" },
    { field: "materials.coverTopSlabInterior", actual: mat.coverTopSlabInterior, required: standard.covers.topSlabInterior, label: "Top slab interior" },
    { field: "materials.coverBottomSlabExterior", actual: mat.coverBottomSlabExterior, required: standard.covers.bottomSlabExterior, label: "Bottom slab exterior" },
    { field: "materials.coverBottomSlabInterior", actual: mat.coverBottomSlabInterior, required: standard.covers.bottomSlabInterior, label: "Bottom slab interior" },
    { field: "materials.coverWallExterior", actual: mat.coverWallExterior, required: standard.covers.wallExterior, label: "Wall exterior" },
    { field: "materials.coverWallInterior", actual: mat.coverWallInterior, required: standard.covers.wallInterior, label: "Wall interior" },
  ];

  for (const c of coverChecks) {
    if (c.actual < c.required) {
      issues.push({
        severity: "error",
        field: c.field,
        message: `${c.label} cover ${c.actual}" is less than ${standard.name} minimum ${c.required}"`,
      });
    }
  }

  // Fill height / corrosion check
  const fillCat = standard.fillCategories.find(
    (fc) => geo.fillHeight >= fc.min && geo.fillHeight < fc.max
  );
  if (fillCat?.corrosionProtection && !mat.corrosionProtection) {
    issues.push({
      severity: "warning",
      field: "materials.corrosionProtection",
      message: `Fill height ${fillCat.label} may require corrosion protection per ${standard.name}`,
    });
  }
  if (!fillCat) {
    issues.push({
      severity: "warning",
      field: "geometry.fillHeight",
      message: `Fill height ${geo.fillHeight}" is outside ${standard.name} standard fill categories`,
    });
  }

  // Buffer zone range (multi-cell)
  if (geo.cellCount > 1) {
    if (geo.bufferZoneWidth < standard.bufferZone.min || geo.bufferZoneWidth > standard.bufferZone.max) {
      issues.push({
        severity: "error",
        field: "geometry.bufferZoneWidth",
        message: `Buffer zone must be ${standard.bufferZone.min}" to ${standard.bufferZone.max}" per ${standard.name}`,
      });
    }
  }

  // Unit count vs total length cross-check
  const totalFromUnits = (units.standardUnitCount + units.inletUnitCount + units.outletUnitCount) * units.unitLength;
  if (units.totalLength > 0 && Math.abs(totalFromUnits - units.totalLength) > 1) {
    issues.push({
      severity: "warning",
      field: "units.totalLength",
      message: `Total length (${units.totalLength}") does not match unit count x unit length (${totalFromUnits}")`,
    });
  }

  // Bar spacing minimums
  for (const bar of bars) {
    if (bar.spacing > 0 && bar.spacing < 3) {
      issues.push({
        severity: "warning",
        field: `reinforcement.${bar.barMark || bar.id}`,
        message: `Bar ${bar.barMark || "?"} spacing ${bar.spacing}" is less than 3" minimum`,
      });
    }
    if (bar.length <= 0 && bar.barMark) {
      issues.push({
        severity: "info",
        field: `reinforcement.${bar.barMark}`,
        message: `Bar ${bar.barMark} has no length specified`,
      });
    }
  }

  // Geometry sanity
  if (geo.span <= 0) {
    issues.push({ severity: "error", field: "geometry.span", message: "Span must be greater than 0" });
  }
  if (geo.rise <= 0) {
    issues.push({ severity: "error", field: "geometry.rise", message: "Rise must be greater than 0" });
  }
  if (geo.wallThickness <= 0) {
    issues.push({ severity: "error", field: "geometry.wallThickness", message: "Wall thickness must be greater than 0" });
  }
  if (geo.topSlabThickness <= 0) {
    issues.push({ severity: "error", field: "geometry.topSlabThickness", message: "Top slab thickness must be greater than 0" });
  }
  if (geo.bottomSlabThickness <= 0) {
    issues.push({ severity: "error", field: "geometry.bottomSlabThickness", message: "Bottom slab thickness must be greater than 0" });
  }
  if (geo.haunchWidth > geo.span / 2) {
    issues.push({ severity: "warning", field: "geometry.haunchWidth", message: "Haunch width exceeds half the span" });
  }

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}
