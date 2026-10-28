import {useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useStore} from 'zustand';
import {xrStore} from '../xr/store';
import {panelLibrary} from '../panels/repository';
import {compileDecorativePanel,compilePanelGeometry,panelGeometryKey} from '../panels/compiler';
import {DEFAULT_ARTWORK_TRANSFORM,type DecorativePanel} from '../panels/model';
import {drawPanel,panelPath} from '../panels/render';
import {useArtwork} from '../panels/images';
import {artworkQuality} from '../panels/mapping';
import {useFloorDesign} from '../layout/useFloorDesign';
import {layoutAsset} from '../layout/assets';
import {validImage} from '../../shared/tileAsset';
function PanelPreview({panel}:{panel:DecorativePanel}){
  const {image,source,error}=useArtwork(panel.artworkSourceId),canvas=useRef<HTMLCanvasElement>(null);
  const key=panelGeometryKey(panel);
  const compiled=useMemo(()=>{try{return {value:compilePanelGeometry(key),error:''};}catch(e){return {value:null,error:(e as Error).message};}},[key]); // artwork transform does not affect physical compilation
  useEffect(()=>{const c=canvas.current;if(!c||!compiled.value)return;const value=compiled.value;
    const draw=()=>{const w=c.clientWidth,h=c.clientHeight,dpr=Math.min(devicePixelRatio||1,1.5);c.width=w*dpr;c.height=h*dpr;const x=c.getContext('2d');if(!x||!w||!h)return;x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);const scale=Math.min((w-44)/panel.widthMm,(h-60)/panel.heightMm);if(scale<=0)return;x.fillStyle='#334155';x.font='13px system-ui';x.textAlign='center';x.fillText(`${panel.widthMm} × ${panel.heightMm} mm · ${value.tiles.length} physical pieces`,w/2,24);x.translate((w-panel.widthMm*scale)/2,(h-panel.heightMm*scale)/2+12);x.scale(scale,scale);drawPanel(x,value,panel,image);panelPath(x,value.boundary);x.strokeStyle='#263444';x.lineWidth=1/scale;x.stroke();};draw();const observer=new ResizeObserver(draw);observer.observe(c);return()=>observer.disconnect();
  },[compiled,panel,image]);
  const quality=source?artworkQuality(panel,source):null;
  return <section className="panel-preview"><canvas ref={canvas} role="img" aria-label="Compiled decorative panel preview" data-panel-piece-count={compiled.value?.tiles.length??0}/><p role="status">{quality?`${quality.label} · ${quality.pixelsPerMm?.toFixed(2)} px/mm. ${quality.warning}`:'Upload or select artwork to preview its detail.'}</p>{(compiled.error||error)&&<p role="alert">{compiled.error||error}</p>}</section>;
}
function PanelStudioDialog({close}:{close():void}){
  const dialog=useRef<HTMLDialogElement>(null),library=useStore(panelLibrary.store),{products}=useFloorDesign();
  const [draft,setDraft]=useState<DecorativePanel|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[removing,setRemoving]=useState<string|null>(null),[rename,setRename]=useState<{id:string;name:string}|null>(null);
  useEffect(()=>{void panelLibrary.hydrate();const d=dialog.current;d?.showModal();return()=>d?.close();},[]);
  const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError('');try{await fn();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const update=(change:Partial<DecorativePanel>)=>{setDraft(p=>p?{...p,...change}:p);setError('');};
  const newPanel=()=>{const product=products.find(p=>p.id==='ceramic-02')??products[0],size=layoutAsset(product);setDraft({version:1,id:crypto.randomUUID(),revision:1,name:'New Decorative Panel',shape:'rectangle',widthMm:2400,heightMm:2400,tileVariantId:product.id,tileSize:size,tileOrientation:0,jointWidthMm:2,artworkSourceId:library.artworks[0]?.id??'none',artworkTransform:{...DEFAULT_ARTWORK_TRANSFORM}});setError('');};
  const numeric=(label:string,value:number,change:(n:number)=>void,step=1)=><label>{label}<input aria-label={label} type="number" step={step} value={Number.isFinite(value)?value:''} onChange={e=>change(e.target.value===''?NaN:Number(e.target.value))}/></label>;
  const upload=async(file:File)=>{if(!validImage(file.type,file.size))throw Error('Choose a JPEG, PNG or WebP up to 5 MB.');const bitmap=await createImageBitmap(file);try{if(bitmap.width*bitmap.height>40000000||Math.max(bitmap.width,bitmap.height)>16384)throw Error('Artwork must be below 40 megapixels and 16384 pixels per side.');const a=await panelLibrary.upload({id:crypto.randomUUID(),name:file.name,blob:file,pixelWidth:bitmap.width,pixelHeight:bitmap.height,mimeType:file.type});update({artworkSourceId:a.id});}finally{bitmap.close();}};
  return createPortal(<dialog ref={dialog} className="panel-studio" aria-labelledby="panel-studio-title" onCancel={e=>{e.preventDefault();close();}}><header><div><h2 id="panel-studio-title">Decorative Panel Studio</h2><p>One continuous artwork · real physical tiles and joints · saved on this device</p></div><button className="hud-button" onClick={close}>Close Studio</button></header>
    {error&&<p className="design-error" role="alert">{error}</p>}{library.error&&<p role="alert">{library.error}<button className="hud-button" onClick={()=>void panelLibrary.hydrate()}>Retry Panels</button></p>}
    {draft?<div className="panel-studio-workspace"><aside className="panel-controls">
      <label>Panel name<input aria-label="Panel name" value={draft.name} maxLength={120} onChange={e=>update({name:e.target.value})}/></label>
      <label>Panel shape<select value={draft.shape} onChange={e=>update({shape:e.target.value as DecorativePanel['shape'],...(e.target.value==='circle'?{heightMm:draft.widthMm}:{})})}><option value="rectangle">Rectangle</option><option value="circle">Circle</option><option value="ellipse">Ellipse</option></select></label>
      {numeric(draft.shape==='circle'?'Diameter (mm)':'Panel width (mm)',draft.widthMm,widthMm=>update({widthMm,...(draft.shape==='circle'?{heightMm:widthMm}:{})}))}
      {draft.shape!=='circle'&&numeric('Panel height (mm)',draft.heightMm,heightMm=>update({heightMm}))}
      <label>Physical tile / slab<select value={draft.tileVariantId} onChange={e=>{const p=products.find(p=>p.id===e.target.value)!;const s=layoutAsset(p);update({tileVariantId:p.id,tileSize:{widthMm:s.widthMm,heightMm:s.heightMm}});}}>{!products.some(p=>p.id===draft.tileVariantId)&&<option value={draft.tileVariantId}>Saved body · {draft.tileSize.widthMm} × {draft.tileSize.heightMm} mm · variant unavailable</option>}{products.map(p=>{const s=layoutAsset(p);return <option key={p.id} value={p.id}>{p.name} · {s.widthMm} × {s.heightMm} mm · {p.productKind??'tile'}</option>;})}</select></label>
      <label>Panel tile orientation<select value={draft.tileOrientation} onChange={e=>update({tileOrientation:Number(e.target.value) as 0|90})}><option value="0">0°</option><option value="90">90°</option></select></label>
      {numeric('Panel joint (mm)',draft.jointWidthMm,jointWidthMm=>update({jointWidthMm}),.1)}
      <label>Artwork source<select value={draft.artworkSourceId} onChange={e=>update({artworkSourceId:e.target.value})}><option value="none">Choose artwork</option>{library.artworks.map(a=><option key={a.id} value={a.id}>{a.name} · {a.pixelWidth} × {a.pixelHeight} px</option>)}</select></label>
      <label>Upload artwork<input aria-label="Upload artwork" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void run(()=>upload(file));}}/></label>
      <fieldset><legend>Artwork placement</legend><label>Artwork fit<select value={draft.artworkTransform.fit} onChange={e=>update({artworkTransform:{...draft.artworkTransform,fit:e.target.value as 'fit'|'fill'|'manual'}})}><option value="fit">Fit</option><option value="fill">Fill</option><option value="manual">Manual</option></select></label>
      {numeric('Artwork scale (%)',draft.artworkTransform.scale*100,n=>update({artworkTransform:{...draft.artworkTransform,scale:n/100}}))}
      {numeric('Artwork horizontal (mm)',draft.artworkTransform.offsetXmm,offsetXmm=>update({artworkTransform:{...draft.artworkTransform,offsetXmm}}))}
      {numeric('Artwork vertical (mm)',draft.artworkTransform.offsetYmm,offsetYmm=>update({artworkTransform:{...draft.artworkTransform,offsetYmm}}))}
      {numeric('Artwork rotation (degrees)',draft.artworkTransform.rotationDeg,rotationDeg=>update({artworkTransform:{...draft.artworkTransform,rotationDeg}}))}</fieldset>
      <p>Saving a new revision keeps existing project assignments unchanged. Assign the new revision explicitly in Floor Design → Center.</p>
      <div className="panel-studio-actions"><button className="hud-button hud-button-primary" disabled={busy} onClick={()=>void run(async()=>{compileDecorativePanel(draft);await panelLibrary.save(draft);setDraft(null);})}>Save Panel</button><button className="hud-button" disabled={busy} onClick={()=>{setDraft(null);setError('');}}>Back to Panels</button></div>
    </aside><PanelPreview panel={draft}/></div>:<div className="panel-library"><button className="hud-button hud-button-primary" disabled={busy||library.status!=='ready'} onClick={newPanel}>Create Decorative Panel</button>
      {rename&&<form onSubmit={e=>{e.preventDefault();void run(async()=>{const p=library.panels.find(p=>p.id===rename.id)!;await panelLibrary.save({...p,name:rename.name});setRename(null);});}}><label>New panel name<input value={rename.name} onChange={e=>setRename({...rename,name:e.target.value})}/></label><button className="hud-button" disabled={busy}>Save Name</button><button className="hud-button" type="button" onClick={()=>setRename(null)}>Cancel Rename</button></form>}
      {removing&&<div><p>Delete this library panel? Saved project snapshots and shared artwork remain available.</p><button className="hud-button" onClick={()=>void run(async()=>{await panelLibrary.remove(removing);setRemoving(null);})}>Delete Panel</button><button className="hud-button" onClick={()=>setRemoving(null)}>Cancel Delete</button></div>}
      {!library.panels.length&&<p>Create a panel, then assign its saved revision in Floor Design → Center.</p>}
      <div className="panel-library-grid">{library.panels.map(p=><article key={p.id} data-panel-id={p.id}><h3>{p.name}</h3><p>{p.shape} · {p.widthMm} × {p.heightMm} mm · revision {p.revision}</p><div><button className="hud-button" onClick={()=>{setDraft(structuredClone(p));setError('');}}>Open / Edit</button><button className="hud-button" onClick={()=>setRename({id:p.id,name:p.name})}>Rename</button><button className="hud-button" disabled={busy} onClick={()=>void run(async()=>{await panelLibrary.duplicate(p.id);})}>Duplicate</button><button className="hud-button" onClick={()=>setRemoving(p.id)}>Delete</button></div></article>)}</div>
    </div>}
  </dialog>,document.body);
}
export function PanelStudio(){const [open,setOpen]=useState(false),inXR=useStore(xrStore,s=>!!s.session);if(inXR)return null;return <><button className="hud-button" onClick={()=>setOpen(true)}>Decorative Panels</button>{open&&<PanelStudioDialog close={()=>setOpen(false)}/>}</>;}
