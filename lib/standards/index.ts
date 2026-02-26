import { StateStandard } from "./types";
import { VDOT } from "./vdot";
import { NCDOT } from "./ncdot";
import { WVDOH } from "./wvdoh";

export { VDOT, NCDOT, WVDOH };
export type { StateStandard, StandardSize, FillCategory } from "./types";

export const ALL_STANDARDS: Record<string, StateStandard> = {
  VDOT,
  NCDOT,
  WVDOH,
};

export const STANDARD_NAMES = Object.keys(ALL_STANDARDS);
