import type { MaterialProduct } from "../catalog/types.ts";
import { mmToCm } from "../utils/units.ts";
import type { TileAssetView, TileFinish } from "../../shared/tileAsset.ts";
export const UPLOAD_ROUGHNESS: Record<TileFinish, number> = { polished: 0.28, satin: 0.42, honed: 0.6, matte: 0.82 };
/** Compatibility adapter: display fields stay cm; the renderer uses physicalSizeMm. */
export function tileToProduct(tile: TileAssetView): MaterialProduct {
  return {
    id: tile.id, name: tile.name, code: "Uploaded tile", category: "floor",
    tileWidth: mmToCm(tile.width_mm), tileHeight: mmToCm(tile.height_mm),
    physicalSizeMm: { width: tile.width_mm, height: tile.height_mm },
    texture: tile.imageUrl ?? "", thumbnail: tile.imageUrl ?? undefined,
    source: "upload", baseColor: "#ffffff", proceduralStyle: "marble",
    roughnessValue: UPLOAD_ROUGHNESS[tile.finish], finish: tile.finish,
    groutWidth: 0.4, groutColor: "#999999", tileVariation: 0.05,
    // Image preparation is baked into stored pixels. It must not rotate grout.
    textureRotationDeg: 0,
  };
}
