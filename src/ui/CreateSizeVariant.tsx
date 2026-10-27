import { useState } from 'react';
import { localTileLibrary } from '../tiles/demoLibrary';
import type { MaterialSource,PhysicalVariant,ProductKind } from '../tiles/variantModel';
export function CreateSizeVariant({source,onCreated,onCancel}:{source:MaterialSource;onCreated:(v:PhysicalVariant)=>void;onCancel:()=>void}){
  const [name,setName]=useState(`${source.name} size`),[width,setWidth]=useState('600'),[height,setHeight]=useState('600'),[kind,setKind]=useState<ProductKind>('tile'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  return <form className="size-variant-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const v=await localTileLibrary.createVariant(source.id,{name,widthMm:width.trim()?Number(width):NaN,heightMm:height.trim()?Number(height):NaN,productKind:kind});onCreated(v);}catch(e){setError(e instanceof Error?e.message:'Could not create this size.');}finally{setBusy(false);}}}>
    <h4>Create Size Variant · {source.name}</h4><fieldset disabled={busy}>
      <label>Name<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>Product Kind<select value={kind} onChange={e=>setKind(e.target.value as ProductKind)}><option value="tile">Tile</option><option value="slab">Slab</option></select></label>
      <label>Width (mm)<input required type="number" min=".001" max="100000" step=".001" value={width} onChange={e=>setWidth(e.target.value)}/></label>
      <label>Height (mm)<input required type="number" min=".001" max="100000" step=".001" value={height} onChange={e=>setHeight(e.target.value)}/></label>
    </fieldset><p className="tile-help">Creates a new physical size using the same image. The original size and image stay unchanged.</p>
    {error&&<p className="tile-error" role="alert">{error}</p>}<button className="hud-button hud-button-primary" disabled={busy} type="submit">Create Size</button><button className="hud-button" disabled={busy} type="button" onClick={onCancel}>Cancel</button>
  </form>;
}
