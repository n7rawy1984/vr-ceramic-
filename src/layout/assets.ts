import type { MaterialProduct } from "../catalog/types.ts";
import type { LayoutAsset } from "./model.ts";
import { cmToMm } from "../utils/units.ts";
export function layoutAsset(product: MaterialProduct): LayoutAsset {
  return { id: product.id, widthMm: product.physicalSizeMm?.width ?? cmToMm(product.tileWidth), heightMm: product.physicalSizeMm?.height ?? cmToMm(product.tileHeight) };
}
