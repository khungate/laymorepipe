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
 * with proportional margins for dimensions and labels.
 */
export function autoScale(
  outsideWidth: number,
  outsideHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  /** Extra bottom margin for notes/scale indicator below dimension chains */
  extraBottomMargin = 0
): DrawingScale {
  // Proportional margins that work for both interactive and print viewports
  const marginX = Math.min(200, Math.max(80, viewportWidth * 0.15));
  const marginTop = Math.min(180, Math.max(60, viewportHeight * 0.12));
  const marginBottom = Math.min(180, Math.max(80, viewportHeight * 0.18)) + extraBottomMargin;
  const availW = viewportWidth - marginX * 2;
  const availH = viewportHeight - marginTop - marginBottom;
  const ppi = Math.min(availW / outsideWidth, availH / outsideHeight);

  // Center horizontally, anchor to top margin vertically
  const drawnW = outsideWidth * ppi;
  const drawnH = outsideHeight * ppi;
  const originX = marginX + (availW - drawnW) / 2;
  const originY = marginTop + (availH - drawnH) / 2;

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
