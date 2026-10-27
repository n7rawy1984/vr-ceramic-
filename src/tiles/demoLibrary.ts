import { create } from "zustand";
import { validImage, validDimensionMm, validCrop, FINISHES, MATERIAL_TYPES, type TileAssetView, type TileFinish, type CropData } from "../../shared/tileAsset.ts";

type DemoTileInput = { blob: Blob; name: string; filename: string; widthMm: number; heightMm: number; materialType: string; finish: TileFinish; rotation: number; crop: CropData | null };
/** Memory only: survives panel remounts, resets with the document. No storage/API calls. */
export const useDemoLibrary = create<{ tiles: TileAssetView[] }>(() => ({ tiles: [] }));
function publish(tiles: TileAssetView[]) {
  useDemoLibrary.setState({ tiles });
}
export function saveDemoTile(input: DemoTileInput): TileAssetView {
  const { blob, name, filename, widthMm, heightMm, materialType, finish, rotation, crop } = input;
  if (!validImage(blob.type, blob.size) || !validDimensionMm(widthMm) || !validDimensionMm(heightMm) || !name.trim() || name.trim().length > 120 || !MATERIAL_TYPES.includes(materialType as typeof MATERIAL_TYPES[number]) || !FINISHES.includes(finish) || ![0,90,180,270].includes(rotation) || !validCrop(crop)) throw Error("Check the image, tile details and dimensions.");
  const id = crypto.randomUUID(), timestamp = new Date().toISOString();
  const tile: TileAssetView = { id, name: name.trim(), storage_path: "", source_filename: filename, mime_type: blob.type, file_size: blob.size, width_mm: widthMm, height_mm: heightMm, material_type: materialType, finish, image_rotation: rotation, crop_data: crop, created_at: timestamp, updated_at: timestamp, imageUrl: URL.createObjectURL(blob), imageUrlExpiresAt: null };
  publish([tile, ...useDemoLibrary.getState().tiles]);
  return tile;
}
export function removeDemoTile(id: string) {
  const tiles = useDemoLibrary.getState().tiles;
  const tile = tiles.find(t => t.id === id);
  publish(tiles.filter(t => t.id !== id));
  if (tile?.imageUrl) URL.revokeObjectURL(tile.imageUrl);
}
