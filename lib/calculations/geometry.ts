import { CulvertGeometry, UnitConfig, ComputedValues, ReinforcementBar } from "../types/culvert";
import { barWeightPerFoot } from "./quantities";

export function computeOutsideDimensions(geo: CulvertGeometry) {
  const outsideWidth =
    geo.cellCount === 1
      ? geo.wallThickness + geo.span + geo.wallThickness
      : geo.wallThickness +
        geo.span * geo.cellCount +
        geo.wallThickness * (geo.cellCount - 1) +
        geo.bufferZoneWidth * (geo.cellCount - 1) +
        geo.wallThickness;
  const outsideHeight =
    geo.bottomSlabThickness + geo.rise + geo.topSlabThickness;
  return { outsideWidth, outsideHeight };
}

export function computeConcreteVolume(
  geo: CulvertGeometry,
  unitLength: number
): number {
  const { outsideWidth, outsideHeight } = computeOutsideDimensions(geo);
  const solidArea = outsideWidth * outsideHeight;
  const openingArea = geo.span * geo.rise * geo.cellCount;
  const haunchArea =
    0.5 * geo.haunchWidth * geo.haunchHeight * 4 * geo.cellCount;
  const netArea = solidArea - openingArea - haunchArea;
  // cubic inches to cubic yards: /46656
  return (netArea * unitLength) / 46656;
}

export function computeSteelWeight(
  bars: ReinforcementBar[],
): number {
  return bars.reduce((total, bar) => {
    const weightPerFt = barWeightPerFoot(bar.barSize);
    return total + bar.quantity * (bar.length / 12) * weightPerFt;
  }, 0);
}

export function computeUnitWeight(
  concreteVolumeCY: number,
  steelWeightLbs: number
): number {
  // 1 CY = 27 CF, concrete weighs ~150 lb/cf
  return concreteVolumeCY * 27 * 150 + steelWeightLbs;
}

export function computeAll(
  geo: CulvertGeometry,
  units: UnitConfig,
  bars: ReinforcementBar[]
): ComputedValues {
  const { outsideWidth, outsideHeight } = computeOutsideDimensions(geo);
  const concreteVolumePerUnit = computeConcreteVolume(geo, units.unitLength);
  const steelWeightPerUnit = computeSteelWeight(bars);
  const unitWeight = computeUnitWeight(concreteVolumePerUnit, steelWeightPerUnit);
  const totalUnitCount =
    units.standardUnitCount + units.inletUnitCount + units.outletUnitCount;

  return {
    outsideWidth,
    outsideHeight,
    concreteVolumePerUnit,
    steelWeightPerUnit,
    unitWeight,
    totalConcreteVolume: concreteVolumePerUnit * totalUnitCount,
    totalSteelWeight: steelWeightPerUnit * totalUnitCount,
    totalUnitCount,
  };
}
