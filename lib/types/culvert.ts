// All dimensions in inches internally

export interface CulvertGeometry {
  structureType: "box_culvert_4sided" | "rigid_frame_3sided";
  cellCount: 1 | 2 | 3;
  span: number;
  rise: number;
  wallThickness: number;
  topSlabThickness: number;
  bottomSlabThickness: number;
  haunchWidth: number;
  haunchHeight: number;
  fillHeight: number;
  skewAngle: number;
  // Multi-barrel
  bufferZoneWidth: number;
  // Rigid frame only
  footingWidth: number;
  footingDepth: number;
  keywayWidth: number;
  keywayDepth: number;
}

export interface UnitConfig {
  unitLength: number;
  totalLength: number;
  standardUnitCount: number;
  inletUnitCount: number;
  outletUnitCount: number;
}

export interface MaterialSpec {
  concreteStrength: number;
  rebarGrade: number;
  rebarSpec: string;
  corrosionProtection: boolean;
  gasketSpec: string;
  coverTopSlabExterior: number;
  coverTopSlabInterior: number;
  coverBottomSlabExterior: number;
  coverBottomSlabInterior: number;
  coverWallExterior: number;
  coverWallInterior: number;
}

export type BarShape = "straight" | "L" | "U" | "Z";
export type BarZone =
  | "top_slab"
  | "bottom_slab"
  | "left_wall"
  | "right_wall"
  | "haunch"
  | "longitudinal";
export type SteelType = "black" | "epoxy" | "galvanized" | "low_carbon_chromium";

export interface ReinforcementBar {
  id: string;
  barMark: string;
  barSize: number;
  quantity: number;
  spacing: number;
  length: number;
  shape: BarShape;
  leg1: number | null;
  leg2: number | null;
  location: string;
  steelType: SteelType;
  zone: BarZone;
}

export interface Revision {
  number: number;
  date: string;
  description: string;
  by: string;
}

export interface ProjectInfo {
  projectName: string;
  clientName: string;
  projectNumber: string;
  engineer: string;
  location: string;
  stateStandard: string;
  dateCreated: string;
  dateModified: string;
  status: "draft" | "submitted" | "approved";
  drawnBy: string;
  checkedBy: string;
  approvedBy: string;
  revisionNumber: number;
  revisions?: Revision[];
}

export interface CulvertDesign {
  geometry: CulvertGeometry;
  units: UnitConfig;
  materials: MaterialSpec;
  reinforcement: ReinforcementBar[];
  project: ProjectInfo;
}

// Computed values
export interface ComputedValues {
  outsideWidth: number;
  outsideHeight: number;
  concreteVolumePerUnit: number; // cubic yards
  steelWeightPerUnit: number; // lbs
  unitWeight: number; // lbs
  totalConcreteVolume: number;
  totalSteelWeight: number;
  totalUnitCount: number;
}
