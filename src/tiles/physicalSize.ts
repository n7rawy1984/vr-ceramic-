import { validDimensionMm } from '../../shared/tileAsset.ts';
import type { MaterialProduct } from '../catalog/types.ts';
/** Assignment-local physical dimensions; never an image or library mutation. */
export type PhysicalSize={widthMm:number;heightMm:number};
export type PhysicalAssignment={tileAssetId:string;physicalOverride?:PhysicalSize};
export function validPhysicalSize(value:unknown):value is PhysicalSize {
  if(!value||typeof value!=='object')return false;const s=value as PhysicalSize;
  return validDimensionMm(s.widthMm)&&validDimensionMm(s.heightMm);
}
/** The single physical-size rule used by compilers, renderers and quality UI. */
export function effectiveSize<T extends PhysicalSize>(library:T,override?:PhysicalSize):T {
  return override?{...library,widthMm:override.widthMm,heightMm:override.heightMm}:library;
}
export function effectiveProduct(product:MaterialProduct,override?:PhysicalSize):MaterialProduct {
  if(!override)return product;
  const size=effectiveSize({widthMm:product.physicalSizeMm?.width??product.tileWidth*10,heightMm:product.physicalSizeMm?.height??product.tileHeight*10},override);
  return {...product,tileWidth:size.widthMm/10,tileHeight:size.heightMm/10,physicalSizeMm:{width:size.widthMm,height:size.heightMm}};
}
