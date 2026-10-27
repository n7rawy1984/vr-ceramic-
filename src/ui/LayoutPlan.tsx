import { drawPlacementImage } from '../layout/drawPlacementImage';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFloorDesign } from "../layout/useFloorDesign";
import { useCeramicTexture } from "../hooks/useCeramicTexture";
import { useFloorDesignStore } from "../state/useFloorDesignStore";
import type { MaterialProduct } from "../catalog/types";
import type { ZoneId } from "../layout/model";
const COLORS: Record<ZoneId,string> = {field:"#798da5",border:"#ba863c",centerFrame:"#ba863c",center:"#377b78"};
type ImageState = {image: CanvasImageSource|null; error: string|null};
function PlanImage({product,report}:{product:MaterialProduct;report:(id:string,state:ImageState)=>void}) {
  const {texture,error}=useCeramicTexture(product);
  useEffect(()=>{report(product.id,{image:(texture?.image as CanvasImageSource|undefined)??null,error});return()=>report(product.id,{image:null,error:null});},[product.id,texture,error,report]);
  return null;
}
/** One Canvas, drawn only on data/selection/size changes. No second pattern algorithm. */
export function LayoutPlan() {
  const {products,result}=useFloorDesign();
  const selected=useFloorDesignStore(s=>s.selectedPlacementId);
  const select=useFloorDesignStore(s=>s.selectPlacement);
  const canvas=useRef<HTMLCanvasElement>(null);
  const fit=useRef({scale:1,x:0,y:0});
  const [images,setImages]=useState<Record<string,ImageState>>({});
  const report=useCallback((id:string,state:ImageState)=>setImages(old=>old[id]?.image===state.image&&old[id]?.error===state.error?old:{...old,[id]:state}),[]);
  const used=useMemo(()=>result.ok?products.filter(a=>result.layout.placements.some(p=>p.tileAssetId===a.id)):[],[result,products]);
  useEffect(()=>{
    const element=canvas.current;if(!element||!result.ok)return;
    const {surface,placements}=result.layout;
    const draw=()=>{
      const width=element.clientWidth,height=element.clientHeight;if(!width||!height)return;
      const dpr=Math.min(window.devicePixelRatio||1,1.5);element.width=Math.round(width*dpr);element.height=Math.round(height*dpr);
      const ctx=element.getContext('2d');if(!ctx)return;
      const scale=Math.min((width-56)/surface.widthMm,(height-70)/surface.heightMm);
      if(scale<=0)return;
      const x=(width-surface.widthMm*scale)/2,y=(height-surface.heightMm*scale)/2+8;fit.current={scale,x,y};
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
      ctx.fillStyle='#334155';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(`${surface.widthMm} × ${surface.heightMm} mm`,width/2,18);
      ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#a6a39c';ctx.fillRect(0,0,surface.widthMm,surface.heightMm);
      for(const p of placements){
        ctx.save();ctx.beginPath();ctx.rect(p.xMm,p.yMm,p.widthMm,p.heightMm);ctx.clip();
        ctx.fillStyle=COLORS[p.zoneId];ctx.fillRect(p.xMm,p.yMm,p.widthMm,p.heightMm);
        const image=images[p.tileAssetId]?.image;
        if(image)drawPlacementImage(ctx,image,p,products.find(product=>product.id===p.tileAssetId)?.imageTransform);
        // Outline real source-body edges only, never an L-cut's subdivision seam.
        ctx.strokeStyle=COLORS[p.zoneId];ctx.lineWidth=.45/scale;
        ctx.strokeRect(p.tileBounds.xMm,p.tileBounds.yMm,p.tileBounds.widthMm,p.tileBounds.heightMm);ctx.restore();
      }
      ctx.strokeStyle='#334155';ctx.lineWidth=1.5/scale;ctx.strokeRect(0,0,surface.widthMm,surface.heightMm);
      const p=placements.find(p=>p.id===selected);if(p){ctx.strokeStyle='#f59e0b';ctx.lineWidth=3/scale;ctx.strokeRect(p.xMm,p.yMm,p.widthMm,p.heightMm);}
    };
    draw();const observer=new ResizeObserver(draw);observer.observe(element);return()=>observer.disconnect();
  },[result,images,selected,products]);
  if(!result.ok)return <div className="plan-empty">Correct the dimensions or tile choices to see the plan.</div>;
  const placement=result.layout.placements.find(p=>p.id===selected);
  const errors=used.map(p=>images[p.id]?.error).filter(Boolean);
  return <section className="layout-plan" aria-label="Geometric floor plan">
    {used.map(product=><PlanImage key={product.id} product={product} report={report}/>)}
    <div className="plan-legend">{(['field','centerFrame','center'] as const).map(zone=><span key={zone}><i style={{background:COLORS[zone]}}/>{zone==='centerFrame'?'Center Frame':zone[0].toUpperCase()+zone.slice(1)}</span>)}</div>
    {errors.length>0&&<p role="alert" className="design-error">Some tile images are unavailable. Open My Tiles and Refresh. Geometry remains visible.</p>}
    <div className="plan-canvas-wrap"><canvas ref={canvas} tabIndex={0} role="img" aria-label="Floor plan. Click a tile to inspect it; left and right arrows cycle pieces."
      data-placement-count={result.layout.placements.length}
      onClick={e=>{const bounds=e.currentTarget.getBoundingClientRect();const t=fit.current;const x=(e.clientX-bounds.left-t.x)/t.scale,y=(e.clientY-bounds.top-t.y)/t.scale;select(result.layout.placements.find(p=>x>=p.xMm&&x<=p.xMm+p.widthMm&&y>=p.yMm&&y<=p.yMm+p.heightMm)?.id??null);}}
      onKeyDown={e=>{if(e.key==='Escape')select(null);if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const ps=result.layout.placements;const found=ps.findIndex(p=>p.id===selected),step=e.key==='ArrowRight'?1:-1;const start=found<0?(step===1?-1:0):found;select(ps[(start+step+ps.length)%ps.length]?.id??null);}}}/></div>
    <div className="plan-selection" aria-live="polite">{placement?`${placement.zoneId==='centerFrame'?'Center Frame':placement.zoneId[0].toUpperCase()+placement.zoneId.slice(1)} · ${placement.fullTile?'Full tile':'Cut piece'} · ${Number(placement.widthMm.toFixed(3))} × ${Number(placement.heightMm.toFixed(3))} mm`:'Click a tile for its visible dimensions.'}</div>
  </section>;
}
