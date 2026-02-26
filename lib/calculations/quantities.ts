// Bar weight per linear foot (lbs)
const BAR_WEIGHTS: Record<number, number> = {
  3: 0.376,
  4: 0.668,
  5: 1.043,
  6: 1.502,
  7: 2.044,
  8: 2.67,
  9: 3.4,
  10: 4.303,
  11: 5.313,
};

// Bar diameter in inches
const BAR_DIAMETERS: Record<number, number> = {
  3: 0.375,
  4: 0.5,
  5: 0.625,
  6: 0.75,
  7: 0.875,
  8: 1.0,
  9: 1.128,
  10: 1.27,
  11: 1.41,
};

export function barWeightPerFoot(barSize: number): number {
  return BAR_WEIGHTS[barSize] ?? 0;
}

export function barDiameter(barSize: number): number {
  return BAR_DIAMETERS[barSize] ?? 0;
}

/**
 * Format inches to feet-inches string (e.g., 58 -> 4'-10")
 */
export function formatFeetInches(inches: number): string {
  const totalInches = Math.round(inches);
  const feet = Math.floor(totalInches / 12);
  const remainingInches = totalInches % 12;
  if (feet === 0) return `${remainingInches}"`;
  if (remainingInches === 0) return `${feet}'-0"`;
  return `${feet}'-${remainingInches}"`;
}

/**
 * Format a fractional inch dimension (e.g., 2.5 -> 2 1/2")
 */
export function formatInches(value: number): string {
  const whole = Math.floor(value);
  const frac = value - whole;
  if (frac === 0) return `${whole}"`;
  if (Math.abs(frac - 0.5) < 0.01) return `${whole} 1/2"`;
  if (Math.abs(frac - 0.25) < 0.01) return `${whole} 1/4"`;
  if (Math.abs(frac - 0.75) < 0.01) return `${whole} 3/4"`;
  if (Math.abs(frac - 0.125) < 0.01) return `${whole} 1/8"`;
  if (Math.abs(frac - 0.375) < 0.01) return `${whole} 3/8"`;
  if (Math.abs(frac - 0.625) < 0.01) return `${whole} 5/8"`;
  if (Math.abs(frac - 0.875) < 0.01) return `${whole} 7/8"`;
  return `${value.toFixed(2)}"`;
}
