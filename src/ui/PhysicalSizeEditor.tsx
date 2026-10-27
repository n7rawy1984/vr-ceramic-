import { useEffect, useRef, useState } from 'react';
import type { MaterialProduct } from '../catalog/types';
import { effectiveProduct, validPhysicalSize, type PhysicalSize } from '../tiles/physicalSize';
import { layoutAsset } from '../layout/assets';
import { localTileLibrary } from '../tiles/demoLibrary';
import { ImageQuality } from './ImageQuality';
export function PhysicalSizeEditor({product,override,onChange,onSaved,draft=false,label='Physical size'}:{product:MaterialProduct;override?:PhysicalSize;onChange:(size:PhysicalSize|undefined)=>void;onSaved:(id:string)=>void;draft?:boolean;label?:string}){
  const library=layoutAsset(product),initial=layoutAsset(effectiveProduct(product,override));
  const [width,setWidth]=useState(String(initial.widthMm)),[height,setHeight]=useState(String(initial.heightMm)),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const emitted=useRef(override);
  useEffect(()=>{if(override!==emitted.current){const s=layoutAsset(effectiveProduct(product,override));setWidth(String(s.widthMm));setHeight(String(s.heightMm));}emitted.current=override;},[override,product]);
  const size={widthMm:width.trim()?Number(width):NaN,heightMm:height.trim()?Number(height):NaN},valid=validPhysicalSize(size);
  const publish=(s:PhysicalSize|undefined)=>{emitted.current=s;onChange(s);};
  const edit=(w:string,h:string)=>{setWidth(w);setHeight(h);setError('');if(draft)publish({widthMm:w.trim()?Number(w):NaN,heightMm:h.trim()?Number(h):NaN});};
  return <details className="project-physical-size" data-size-editor={label}><summary>{label} · {initial.widthMm} × {initial.heightMm} mm{override?' · Project size':''}</summary>
    <p className="design-hint">Library size: {library.widthMm} × {library.heightMm} mm · {product.productKind==='slab'?'Slab':'Tile'}</p>
    <div className="project-size-inputs"><label>Use in this project · Width (mm)<input aria-label={`${label} width (mm)`} type="number" min=".001" max="100000" step=".001" value={width} disabled={busy} onChange={e=>edit(e.target.value,height)}/></label><label>Height (mm)<input aria-label={`${label} height (mm)`} type="number" min=".001" max="100000" step=".001" value={height} disabled={busy} onChange={e=>edit(width,e.target.value)}/></label></div>
    {valid?<ImageQuality product={effectiveProduct(product,size)}/>:<p className="design-error">Enter dimensions from 0.001 to 100000 mm, with up to 3 decimal places.</p>}
    {!draft&&<button className="hud-button" disabled={busy||!valid} onClick={()=>publish(size)}>Apply Size</button>}
    <button className="hud-button" disabled={busy} onClick={()=>{setWidth(String(library.widthMm));setHeight(String(library.heightMm));publish(undefined);setError('');}}>Reset to Library Size</button>
    <button className="hud-button" disabled={busy||!valid} onClick={async()=>{setBusy(true);setError('');try{const state=localTileLibrary.useLibrary.getState(),source=state.sources.find(s=>s.id===product.sourceId);if(!source)throw Error('Open My Tiles to load this material.');const base=`${source.name} ${size.widthMm}×${size.heightMm}`.slice(0,112);let name=base,n=2;while(state.variants.some(v=>!v.deleted&&v.name===name))name=`${base} (${n++})`;const v=await localTileLibrary.createVariant(source.id,{name,...size,productKind:product.productKind??'tile'},product.imageTransform);onSaved(v.id);}catch(e){setError(e instanceof Error?e.message:'Could not save this size.');}finally{setBusy(false);}}}>Save as New Size</button>
    <p className="design-hint">{draft?'Size edits apply with the design’s Apply button.':'Apply Size changes this project only.'} Save as New Size also adds a reusable size to My Tiles.</p>{error&&<p className="design-error" role="alert">{error}</p>}
  </details>;
}
