export interface FillCategory {
  min: number;
  max: number;
  label: string;
  corrosionProtection?: boolean;
}

export interface StandardSize {
  span: number;        // inches
  rise: number;        // inches
  wallThickness: number;
  topSlabThickness: number;
  bottomSlabThickness: number;
  label: string;       // e.g. "6'×4'"
}

export interface StateStandard {
  name: string;
  designCode: string;
  covers: {
    topSlabExterior: number;
    topSlabInterior: number;
    bottomSlabExterior: number;
    bottomSlabInterior: number;
    wallExterior: number;
    wallInterior: number;
  };
  minConcreteStrength: number;
  rebarGrade: number;
  fillCategories: FillCategory[];
  bufferZone: { min: number; max: number };
  maxLiftHoles: number;
  barDimensionConvention: "out_to_out" | "center_to_center";
  gasketSpec: string;
  qcStampRequired: boolean;
  generalNotes: string[];
  standardSizes?: StandardSize[];
}
