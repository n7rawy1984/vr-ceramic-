import type { MaterialProduct } from "../catalog/types.ts";
import type { LayoutAsset } from "./model.ts";
import { cmToMm } from "../utils/units.ts";
export function layoutAsset(product: MaterialProduct): LayoutAsset {
  return { productKind:product.productKind??"tile", id: product.id, widthMm: product.physicalSizeMm?.width ?? cmToMm(product.tileWidth), heightMm: product.physicalSizeMm?.height ?? cmToMm(product.tileHeight) };
}

/** Cache only geometry-relevant facts for referenced variants; library additions are not layout edits. */
export function installationAssetKey(i:import('./model.ts').FloorInstallation,products:MaterialProduct[]):string {
  const ids=new Set([i.field.tileAssetId,i.field.secondaryTileAssetId,i.field.modular?.b.tileAssetId,i.field.modular?.c.tileAssetId,i.field.modular?.d?.tileAssetId,i.border.tileAssetId,i.centerFrame.tileAssetId,i.center.tileAssetId].filter(Boolean));
  return JSON.stringify(products.filter(p=>ids.has(p.id)).map(layoutAsset).sort((a,b)=>a.id.localeCompare(b.id)));
}
