/** Centimeters to meters, since the scene graph is authored in meters. */
export function cmToM(cm: number): number {
  return cm / 100;
}

/** UI centimeters → canonical persistent millimeters (up to 0.001 mm). */
export function cmToMm(cm: number): number { return Number((cm * 10).toFixed(3)); }
export function mmToCm(mm: number): number { return mm / 10; }
/** Canonical millimeters → scene meters, only at the rendering boundary. */
export function mmToM(mm: number): number { return mm / 1000; }
/** Scene-authored room meters → canonical domain millimeters, at the surface adapter. */
export function mToMm(m: number): number { return Number((m * 1000).toFixed(3)); }
