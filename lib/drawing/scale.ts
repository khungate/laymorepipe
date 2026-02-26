/**
 * Drawing scale utilities.
 * Maps real-world inches to SVG coordinate units.
 */

export interface DrawingScale {
  /** Pixels per inch of real-world dimension */
  ppi: number;
  /** Drawing origin X (left padding in SVG coords) */
  originX: number;
  /** Drawing origin Y (top padding in SVG coords) */
  originY: number;
}

/**
 * Auto-compute a scale that fits the culvert within the given SVG viewport
 * with generous margins for dimensions and labels.
 */
export function autoScale(
  outsideWidth: number,
  outsideHeight: number,
  viewportWidth: number,
  viewportHeight: number
): DrawingScale {
  // Reserve margin for dimension lines and labels
  const marginX = 200;
  const marginY = 180;
  const availW = viewportWidth - marginX * 2;
  const availH = viewportHeight - marginY * 2;
  const ppi = Math.min(availW / outsideWidth, availH / outsideHeight);

  // Center the drawing
  const drawnW = outsideWidth * ppi;
  const drawnH = outsideHeight * ppi;
  const originX = marginX + (availW - drawnW) / 2;
  const originY = marginY + (availH - drawnH) / 2;

  return { ppi, originX, originY };
}

/** Convert real-world X (inches from left edge of culvert) to SVG X */
export function toSvgX(realX: number, scale: DrawingScale): number {
  return scale.originX + realX * scale.ppi;
}

/** Convert real-world Y (inches from top edge of culvert) to SVG Y */
export function toSvgY(realY: number, scale: DrawingScale): number {
  return scale.originY + realY * scale.ppi;
}

/** Convert a real dimension to SVG length */
export function toSvgLen(realLen: number, scale: DrawingScale): number {
  return realLen * scale.ppi;
}
