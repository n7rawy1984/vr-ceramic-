import type { MaterialProduct } from '../catalog/types';
import { layoutAsset } from '../layout/assets';
import { imageQuality } from '../tiles/variantModel';
export function ImageQuality({product}:{product?:MaterialProduct}){
  if(!product)return null;const size=layoutAsset(product),q=imageQuality({pixelWidth:product.pixelWidth??null,pixelHeight:product.pixelHeight??null},{...size,transform:product.imageTransform});
  return <div className="image-quality"><small>Image quality: {q.label}{q.pixelsPerMm!==null?` · ${Number(q.pixelsPerMm.toFixed(2))} px/mm`:''}</small>{q.warning&&<p className="design-hint">{q.warning}</p>}</div>;
}
