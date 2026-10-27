import { useEffect,useRef,useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocalTileLibrary,localTileLibrary } from '../tiles/demoLibrary';
import { builtinVariants } from '../tiles/localTileRepository';
import { FLOOR_CERAMICS } from '../catalog/materials';
import { selectSimpleMaterial } from '../state/selectSimpleMaterial';
import { TileUploadForm } from './TileUploadForm';
import { CreateSizeVariant } from './CreateSizeVariant';
import { ImageQuality } from './ImageQuality';
import { CeramicThumbnail } from './CeramicThumbnail';
export function DemoTileLibrary({open,onClose}:{open:boolean;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null),state=useLocalTileLibrary(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[creating,setCreating]=useState<string|null>(null);
  useEffect(()=>{if(!open)return;const e=dialog.current;e?.showModal();return()=>e?.close();},[open]);
  if(!open)return null;
  const products=[...FLOOR_CERAMICS,...state.products],variants=[...builtinVariants(),...state.variants.filter(v=>!v.deleted)];
  const action=async(fn:()=>Promise<unknown>)=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'Could not update this material.');}finally{setBusy(false);}};
  return createPortal(<dialog ref={dialog} className="tile-library-dialog" aria-labelledby="demo-library-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
    <header className="tile-library-header"><div><span className="tile-eyebrow">Your materials</span><h2 id="demo-library-title">My Tiles</h2></div><button className="hud-button" disabled={busy} onClick={onClose} aria-label="Close tile library">Close</button></header>
    <p className="tile-help">Materials and sizes saved on this device. Different sizes share the same image.</p>
    {(error||state.error)&&<p className="tile-error" role="alert">{error||state.error}</p>}{state.status==='error'&&<button className="hud-button" onClick={()=>void localTileLibrary.hydrate()}>Retry My Tiles</button>}
    <div className="tile-library-columns"><TileUploadForm localOnly disabled={busy||state.status!=='ready'} onSaved={()=>{}} onExpired={()=>{}} onBusy={setBusy}/>
      <section className="saved-tile-library" aria-label="Materials and sizes"><h3>Materials <span>({state.sources.length})</span></h3>
        <div className="saved-tile-grid">{state.sources.map(source=>{
          const sizes=variants.filter(v=>v.sourceId===source.id),product=products.find(p=>p.sourceId===source.id);
          return <article className="saved-tile-card material-card" key={source.id} data-source-id={source.id}>
            {product&&<CeramicThumbnail product={product}/>}<h4>{source.name}</h4><p>{source.materialType} · {source.finish} {source.pixelWidth?`· ${source.pixelWidth} × ${source.pixelHeight} pixels`:''}</p>
            <details open={creating===source.id}><summary>Sizes ({sizes.length})</summary>{sizes.map(v=>{
              const p=products.find(p=>p.id===v.id);return <div className="material-size" key={v.id} data-variant-id={v.id}><strong>{v.name}</strong><p>{v.widthMm} × {v.heightMm} mm · {v.productKind==='slab'?'Slab':'Tile'}</p><ImageQuality product={p}/><div>
                <button className="hud-button hud-button-primary" disabled={busy} onClick={()=>{selectSimpleMaterial(v.id);onClose();}}>Apply</button>
                {!v.id.startsWith('ceramic-')&&<><button className="hud-button" disabled={busy} onClick={()=>{const name=window.prompt('Size name',v.name);if(name!==null)void action(()=>localTileLibrary.renameVariant(v.id,name));}}>Rename</button><button className="hud-button tile-delete" disabled={busy} onClick={()=>{if(window.confirm('Delete this size? Other sizes and the image are kept. Saved designs using this size will use a fallback.'))void action(()=>localTileLibrary.remove(v.id));}}>Delete Size</button></>}
              </div></div>;
            })}</details>
            {creating===source.id?<CreateSizeVariant source={source} onCreated={()=>setCreating(null)} onCancel={()=>setCreating(null)}/>:<button className="hud-button" disabled={busy} onClick={()=>setCreating(source.id)}>Create Size Variant</button>}
            {!source.builtinProductId&&<button className="hud-button tile-delete" disabled={busy||sizes.length>0} title={sizes.length?'Delete sizes first. Images used by saved projects are protected.':''} onClick={()=>{if(window.confirm('Delete this material image? This is only allowed when no sizes or saved projects reference it.'))void action(()=>localTileLibrary.removeSource(source.id));}}>Delete Material</button>}
          </article>;
        })}</div>
      </section>
    </div>
  </dialog>,document.body);
}
