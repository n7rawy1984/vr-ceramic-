import { useState } from 'react';
import type { MaterialProduct } from '../catalog/types';
import { generateCeramicCanvas } from '../textures/generateCeramicTexture';
const swatches=new Map<string,string>();
export function CeramicThumbnail({product}:{product:MaterialProduct}){
  const [failed,setFailed]=useState(false);
  let src=product.thumbnail;
  if(!src||failed){
    const key=product.sourceId??product.id;
    src=swatches.get(key);
    if(!src&&product.source!=='upload'){
      src=generateCeramicCanvas(product.proceduralStyle,product.sourceAspect?.width??product.tileWidth,product.sourceAspect?.height??product.tileHeight,128).toDataURL('image/png');swatches.set(key,src);
      while(swatches.size>36)swatches.delete(swatches.keys().next().value!);
    }
  }
  return src?<img className="ceramic-thumb" src={src} alt={product.name} onError={()=>setFailed(true)} draggable={false}/>:<span className="ceramic-thumb">Image unavailable</span>;
}
