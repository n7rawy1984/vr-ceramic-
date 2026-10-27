import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFloorDesignStore } from '../state/useFloorDesignStore';
import { WALL_IDS, type WallId } from '../surfaces/model';
import { useWall } from '../surfaces/useWalls';
import { cachedWallCompile } from '../surfaces/compiler';
import { layoutAsset } from '../layout/assets';
import { useCeramicTexture } from '../hooks/useCeramicTexture';
import type { MaterialProduct } from '../catalog/types';
function ElevationImage({product,report}:{product:MaterialProduct;report:(image:CanvasImageSource|null,error:string|null)=>void}){
  const {texture,error}=useCeramicTexture(product);
  useEffect(()=>{report((texture?.image as CanvasImageSource)??null,error);return()=>report(null,null);},[texture,error,report]);return null;
}
function Elevation({wall}:{wall:ReturnType<typeof useWall>}){
  const canvas=useRef<HTMLCanvasElement>(null);
  const [image,setImage]=useState<CanvasImageSource|null>(null),[error,setError]=useState<string|null>(null);
  const report=useCallback((image:CanvasImageSource|null,error:string|null)=>{setImage(image);setError(error);},[]);
  const product=wall.products.find(p=>p.id===wall.design.tileAssetId);
  useEffect(()=>{
    const element=canvas.current;if(!element)return;
    const draw=()=>{
      const width=element.clientWidth,height=element.clientHeight,dpr=Math.min(devicePixelRatio,1.5);element.width=width*dpr;element.height=height*dpr;
      const ctx=element.getContext('2d');if(!ctx)return;
      const {surface,result}=wall,scale=Math.min((width-24)/surface.widthMm,(height-40)/surface.heightMm);if(scale<=0)return;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.fillStyle='#334155';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(`${surface.widthMm} × ${surface.heightMm} mm · wall coordinates`,width/2,16);
      ctx.translate((width-surface.widthMm*scale)/2,30);ctx.scale(scale,scale);ctx.fillStyle='#d3d0c9';ctx.fillRect(0,0,surface.widthMm,surface.heightMm);
      if(result?.ok)for(const p of result.layout.placements){
        ctx.save();ctx.beginPath();ctx.rect(p.xMm,p.yMm,p.widthMm,p.heightMm);ctx.clip();ctx.fillStyle=product?.baseColor??'#aab7bc';ctx.fillRect(p.xMm,p.yMm,p.widthMm,p.heightMm);
        if(image){const t=p.tileBounds;if(p.rotationDeg===90){ctx.translate(t.xMm+t.widthMm,t.yMm);ctx.rotate(Math.PI/2);ctx.drawImage(image,0,0,t.heightMm,t.widthMm);}else ctx.drawImage(image,t.xMm,t.yMm,t.widthMm,t.heightMm);}
        ctx.restore();
      }
      for(const o of surface.openings){ctx.clearRect(o.xMm,o.yMm,o.widthMm,o.heightMm);ctx.strokeStyle='#536779';ctx.lineWidth=1/scale;ctx.strokeRect(o.xMm,o.yMm,o.widthMm,o.heightMm);}
    };
    draw();const observer=new ResizeObserver(draw);observer.observe(element);return()=>observer.disconnect();
  },[wall.surface,wall.result,image,product]);
  return <div className="wall-elevation">{product&&wall.design.enabled&&<ElevationImage key={product.id} product={product} report={report}/>}{error&&<p role="alert">{error}</p>}{wall.result&&!wall.result.ok&&<p role="alert">{wall.result.errors.join(' ')}</p>}<canvas ref={canvas} role="img" aria-label={`${wall.surface.id} wall elevation`} data-placement-count={wall.result?.ok?wall.result.layout.placements.length:0}/><p className="design-hint">Applied wall elevation · transparent openings remain untiled.</p></div>;
}
function SurfaceEditor({id}:{id:WallId}){
  const wall=useWall(id);
  const [draft,setDraft]=useState(()=>({enabled:wall.design.enabled,tileAssetId:wall.design.tileAssetId,orientation:wall.design.orientation,joint:String(wall.design.jointWidthMm)}));
  const [errors,setErrors]=useState<string[]>([]);
  const selected=wall.products.find(p=>p.id===draft.tileAssetId);
  const dirty=draft.enabled!==wall.design.enabled||draft.tileAssetId!==wall.design.tileAssetId||draft.orientation!==wall.design.orientation||draft.joint!==String(wall.design.jointWidthMm);
  function apply(){
    const design={enabled:draft.enabled,tileAssetId:draft.tileAssetId,orientation:draft.orientation,jointWidthMm:draft.joint.trim()?Number(draft.joint):NaN};
    if(!Number.isFinite(design.jointWidthMm)||design.jointWidthMm<0||design.jointWidthMm>100){setErrors(['Joint must be from 0 to 100 mm.']);return;}
    if(!selected){setErrors(['Choose an available tile.']);return;}
    if(design.enabled){const result=cachedWallCompile(wall.surface,design,wall.products.map(layoutAsset));if(!result.ok){setErrors(result.errors);return;}}
    const state=useFloorDesignStore.getState();useFloorDesignStore.setState({walls:{...state.walls,[id]:design}});setDraft({...draft,joint:String(design.jointWidthMm)});setErrors([]);
  }
  return <><div className="wall-editor-content"><div className="design-fields"><fieldset><legend>{id[0].toUpperCase()+id.slice(1)} Wall · Straight</legend>
    <label className="design-toggle"><input type="checkbox" checked={draft.enabled} onChange={e=>setDraft({...draft,enabled:e.target.checked})}/>Tile this wall</label>
    <label>Wall tile<select aria-label="Wall tile" value={draft.tileAssetId} onChange={e=>setDraft({...draft,tileAssetId:e.target.value})}>{wall.products.map(p=><option key={p.id} value={p.id}>{p.name} · {layoutAsset(p).widthMm} × {layoutAsset(p).heightMm} mm</option>)}</select></label>
    <label>Wall orientation<select value={draft.orientation} onChange={e=>setDraft({...draft,orientation:Number(e.target.value) as 0|90})}><option value="0">0°</option><option value="90">90°</option></select></label>
    <label>Wall joint (mm)<input type="number" step=".1" min="0" max="100" value={draft.joint} onChange={e=>setDraft({...draft,joint:e.target.value})}/></label>
    <p className="design-hint">Real tile dimensions. Changes appear after Apply Surface. Closing or switching walls discards unapplied edits.</p>
  </fieldset></div><Elevation wall={wall}/></div><footer className="design-action-footer">{errors.length>0&&<div role="alert" className="design-error">{errors.join(' ')}</div>}<span role="status">{dirty?'Unapplied changes':'Surface applied'}</span><button className="hud-button hud-button-primary" disabled={!dirty} onClick={apply}>Apply Surface</button></footer></>;
}
function WallDialog(){
  const dialog=useRef<HTMLDialogElement>(null),[id,setId]=useState<WallId>('right');
  const close=()=>useFloorDesignStore.getState().setWallPanelOpen(false);
  useEffect(()=>{const element=dialog.current;element?.showModal();return()=>element?.close();},[]);
  return createPortal(<dialog ref={dialog} className="room-settings-dialog wall-design-dialog" aria-labelledby="wall-design-title" onCancel={e=>{e.preventDefault();close();}}><div className="floor-design-panel"><header><h2 id="wall-design-title">Wall Design</h2><button className="hud-button" onClick={close}>Close</button></header><div className="design-draft"><label className="wall-picker">Surface<select aria-label="Wall surface" value={id} onChange={e=>setId(e.target.value as WallId)}>{WALL_IDS.map(id=><option key={id} value={id}>{id[0].toUpperCase()+id.slice(1)} Wall</option>)}</select></label><SurfaceEditor key={id} id={id}/></div></div></dialog>,document.body);
}
export function WallDesign(){return useFloorDesignStore(s=>s.wallPanelOpen)?<WallDialog/>:null;}
