import { useState } from 'react';
import type { MaterialProduct } from '../catalog/types';
import { localTileLibrary } from '../tiles/demoLibrary';
export function MatchingSize({product,widthMm,heightMm,onCreated}:{product?:MaterialProduct;widthMm:number;heightMm:number;onCreated:(id:string)=>void}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  if(!product||!Number.isFinite(widthMm)||!Number.isFinite(heightMm)||!product.sourceId)return null;
  return <div className="matching-size"><p className="design-hint">Create {widthMm} × {heightMm} mm Tile from {product.name}. Its original size stays available.</p><button className="hud-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const v=await localTileLibrary.createVariant(product.sourceId!,{name:`${product.name} ${widthMm}×${heightMm}`.slice(0,120),widthMm,heightMm,productKind:'tile'});onCreated(v.id);}catch(e){setError(e instanceof Error?e.message:'Could not create a matching size.');}finally{setBusy(false);}}}>Create matching size variant</button>{error&&<p role="alert" className="design-error">{error}</p>}</div>;
}
