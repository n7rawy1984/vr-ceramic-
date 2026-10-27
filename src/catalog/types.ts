import type { ProductKind, ImageTransform } from '../tiles/variantModel.ts';
/** Categories the configurator can present today or in the near future. */
export type MaterialCategory =
  | "floor"
  | "wall"
  | "paint"
  | "marble"
  | "wood"
  | "wallpaper"
  | "door"
  | "ceiling"
  | "fixture"
  | "furniture"
  | "lighting";

/** Procedural texture styles the demo texture generator knows how to render. */
export type ProceduralStyle = "marble" | "travertine" | "darkstone";

/** Customer-facing finish label, shown in the catalog and info panels. */
export type MaterialFinish = "polished" | "matte" | "satin" | "honed";

export interface MaterialProduct {
  sourceId?:string;
  productKind?:ProductKind;
  pixelWidth?:number|null;
  pixelHeight?:number|null;
  imageTransform?:ImageTransform;
  /** Fixed procedural source aspect, independent of physical variant size. */
  sourceAspect?:{width:number;height:number};
  source?: "demo" | "upload";
  /** Uploaded metadata stays canonical mm; legacy demo display sizes stay cm. */
  physicalSizeMm?: { width: number; height: number };
  id: string;
  name: string;
  code: string;
  category: MaterialCategory;
  /** Physical tile width, in centimeters. */
  tileWidth: number;
  /** Physical tile height (depth), in centimeters. */
  tileHeight: number;
  /** Path under /public that a real texture file can be dropped into. */
  texture: string;
  /** Path under /public for the catalog thumbnail; falls back to a generated swatch. */
  thumbnail?: string;
  /** Base color used by the procedural fallback texture and as a tint. */
  baseColor: string;
  /** Which procedural generator to use when `texture` cannot be loaded. */
  proceduralStyle: ProceduralStyle;
  /** Grout line width in centimeters. */
  groutWidth?: number;
  /** Grout line color. */
  groutColor?: string;
  /** Optional path under /public for a real normal map. Omit to skip normal mapping. */
  normalTexture?: string;
  /** Optional path under /public for a real roughness map. Omit to use `roughnessValue`. */
  roughnessTexture?: string;
  /** Scalar roughness used when no roughness map is supplied. 0 = mirror, 1 = fully matte. */
  roughnessValue?: number;
  /** Rotates the tile texture (and its grout grid) by this many degrees. */
  textureRotationDeg?: number;
  /** Customer-facing finish label shown in the UI (e.g. "Polished"). */
  finish?: MaterialFinish;
  /** Subtle deterministic per-tile brightness variation, 0–1 (0 = perfectly
   * uniform tiles, ~0.05 = realistic natural variation). Defaults to 0.05. */
  tileVariation?: number;
}

export interface RoomDesign {
  id: string;
  name: string;
  width: number;
  length: number;
  height: number;
}
