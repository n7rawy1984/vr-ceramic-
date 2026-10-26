/** Centimeters to meters, since the scene graph is authored in meters. */
export function cmToM(cm: number): number {
  return cm / 100;
}

/** UI centimeters → canonical persistent millimeters (up to 0.001 mm). */
export function cmToMm(cm: number): number { return Number((cm * 10).toFixed(3)); }
export function mmToCm(mm: number): number { return mm / 10; }
/** Canonical millimeters → scene meters, only at the rendering boundary. */
export function mmToM(mm: number): number { return mm / 1000; }
