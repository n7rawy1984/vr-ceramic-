/** All domain lengths/areas are surface-local millimeters / square millimeters. */
export type RectMm = { xMm: number; yMm: number; widthMm: number; heightMm: number };
export type Orientation = 0 | 90;
export type ZoneId = "field" | "border" | "centerFrame" | "center";
export type Surface = { id: string; widthMm: number; heightMm: number };
export type LayoutAsset = { id: string; widthMm: number; heightMm: number };
export type FloorInstallation = {
  surfaceId: string;
  jointWidthMm: number;
  field: { tileAssetId: string; orientation: Orientation; pattern: "straight" };
  /** Internal legacy perimeter path; not exposed by the approved workflow. */
  border: { enabled: boolean; tileAssetId: string; widthMm: number; orientationRule: "follow-side" };
  centerFrame: { enabled: boolean; tileAssetId: string; widthMm: number; orientationRule: "follow-side" };
  center: { enabled: boolean; tileAssetId: string; widthMm: number; heightMm: number; position: "center"; orientation: Orientation };
};
export type CompiledTilePlacement = RectMm & {
  id: string;
  /** Several visible pieces can belong to the same original tile body. */
  sourceTileId: string;
  zoneId: ZoneId;
  segment: string;
  tileAssetId: string;
  rotationDeg: Orientation;
  fullTile: boolean;
  /** Unclipped oriented tile body in surface coordinates. Never stretch a cut image. */
  tileBounds: RectMm;
  /** Crop in original, unrotated asset-body mm, before installation rotation. */
  sourceRect: RectMm;
};
export type CompiledLayout = {
  surface: Surface;
  placements: CompiledTilePlacement[];
  /** Disjoint physical joint rectangles, including lower-priority zone seams. */
  joints: RectMm[];
  zones: { id: ZoneId; bounds: RectMm; regions: RectMm[] }[];
  tileAreaMm2: number;
  jointAreaMm2: number;
};
export type CompileResult = { ok: true; layout: CompiledLayout } | { ok: false; errors: string[] };

export function defaultInstallation(surfaceId: string, fieldId: string, borderId: string, centerId: string): FloorInstallation {
  return {
    surfaceId, jointWidthMm: 3,
    field: { tileAssetId: fieldId, pattern: "straight", orientation: 0 },
    border: { enabled: false, tileAssetId: borderId, widthMm: 100, orientationRule: "follow-side" },
    centerFrame: { enabled: false, tileAssetId: borderId, widthMm: 100, orientationRule: "follow-side" },
    center: { enabled: false, tileAssetId: centerId, widthMm: 1200, heightMm: 1200, position: "center", orientation: 0 },
  };
}
