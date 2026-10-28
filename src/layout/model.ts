import type { DecorativePanel, PointMm } from '../panels/model.ts';
import type { CompiledPanel } from '../panels/compiler.ts';
import type { PhysicalSize } from '../tiles/physicalSize.ts';
/** Material references named tileAssetId identify physical variants (never image sources). */
/** All domain lengths/areas are surface-local millimeters / square millimeters. */
export type RectMm = { xMm: number; yMm: number; widthMm: number; heightMm: number };
export type Orientation = 0 | 90;
export type ZoneId = "field" | "border" | "centerFrame" | "center";
export type Surface = { id: string; widthMm: number; heightMm: number };
export type LayoutAsset = { id: string; widthMm: number; heightMm: number; productKind?: "tile"|"slab" };
export const LAYOUT_PATTERNS = ["straight", "running-bond-50", "running-bond-33", "checker", "modular"] as const;
export type LayoutPattern = typeof LAYOUT_PATTERNS[number];
export type ModularSlot = { tileAssetId: string; physicalOverride?:PhysicalSize; orientation: Orientation };
export type ModularInstallation = { preset: "multi-size"; b: ModularSlot; c: ModularSlot; d?: ModularSlot };
export type FloorInstallation = {
  surfaceId: string;
  jointWidthMm: number;
  /** Field asset/orientation also supply Modular Tile A. Optional D replaces one C. */
  field: { tileAssetId: string; physicalOverride?:PhysicalSize; orientation: Orientation; pattern: LayoutPattern; secondaryTileAssetId?: string; secondaryPhysicalOverride?:PhysicalSize; modular?: ModularInstallation };
  /** Internal legacy perimeter path; not exposed by the approved workflow. */
  border: { enabled: boolean; tileAssetId: string; physicalOverride?:PhysicalSize; widthMm: number; orientationRule: "follow-side" };
  centerFrame: { enabled: boolean; tileAssetId: string; physicalOverride?:PhysicalSize; widthMm: number; orientationRule: "follow-side" };
  center: { enabled: boolean; tileAssetId: string; physicalOverride?:PhysicalSize; widthMm: number; heightMm: number; position: "center"; orientation: Orientation; panel?:DecorativePanel };
};
export type CompiledTilePlacement = RectMm & {
  polygon?:PointMm[];
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
  joints: (RectMm & {polygon?:PointMm[]})[];
  decorative?:{definition:DecorativePanel;compiled:CompiledPanel;origin:PointMm};
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
