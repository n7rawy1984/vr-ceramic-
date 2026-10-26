/** Persistent tile metadata uses millimeters. No commercial catalog/account model. */
export const MAX_IMAGE_BYTES = 5_000_000;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MATERIAL_TYPES = ["Ceramic", "Porcelain", "Marble", "Natural Stone", "Decorative"] as const;
export const FINISHES = ["polished", "matte", "satin", "honed"] as const;
export type ImageMime = typeof IMAGE_TYPES[number];
export type TileFinish = typeof FINISHES[number];
export type CropData = { x: number; y: number; width: number; height: number };
export interface TileAsset {
  id: string;
  name: string;
  storage_path: string;
  source_filename: string | null;
  mime_type: ImageMime;
  file_size: number;
  width_mm: number;
  height_mm: number;
  material_type: string | null;
  finish: TileFinish;
  /** Preparation metadata: crop then clockwise rotation are baked into stored pixels. */
  image_rotation: number;
  crop_data: CropData | null;
  created_at: string;
  updated_at: string;
}
export interface TileAssetView extends TileAsset {
  imageUrl: string | null;
  imageUrlExpiresAt: number | null;
  imageError?: string;
}
export function validImage(mime: unknown, size: unknown): mime is ImageMime {
  return IMAGE_TYPES.includes(mime as ImageMime) && Number.isInteger(size) && Number(size) > 0 && Number(size) <= MAX_IMAGE_BYTES;
}
export function validDimensionMm(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0.001 && value <= 100_000 && Number(value.toFixed(3)) === value;
}
export function validCrop(value: unknown): value is CropData | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const { x, y, width, height } = value as CropData;
  return [x, y, width, height].every(Number.isFinite) && x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 1.000000001 && y + height <= 1.000000001;
}
