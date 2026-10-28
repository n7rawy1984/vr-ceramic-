import type {CompiledPanel,Polygon} from './compiler.ts';
import type {DecorativePanel,PointMm} from './model.ts';
import {artworkSize,artworkUv} from './mapping.ts';
export function panelBuffers(compiled:CompiledPanel,origin:PointMm={x:0,y:0},surface={widthMm:compiled.widthMm,heightMm:compiled.heightMm}){
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(const tile of compiled.tiles){const start=positions.length/3;for(const v of tile.polygon){positions.push((v.x+origin.x-surface.widthMm/2)/1000,.002,(v.y+origin.y-surface.heightMm/2)/1000);uv.push(v.x/compiled.widthMm,v.y/compiled.heightMm);}for(let k=1;k<tile.polygon.length-1;k++)indices.push(start,start+k+1,start+k);}
  return {positions,uv,indices};
}
export function panelPath(ctx:CanvasRenderingContext2D,polygon:Polygon){ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
/** The canvas and 3D UVs use the same inverse placement transform. */
export function drawPanel(ctx:CanvasRenderingContext2D,compiled:CompiledPanel,p:DecorativePanel,image:HTMLImageElement|null){
  const size=image?artworkSize(p,{pixelWidth:image.naturalWidth,pixelHeight:image.naturalHeight}):null,t=p.artworkTransform;
  panelPath(ctx,compiled.boundary);ctx.fillStyle='#a6a39c';ctx.fill();
  for(const tile of compiled.tiles){ctx.save();panelPath(ctx,tile.polygon);ctx.clip();ctx.fillStyle='#f3f1eb';ctx.fill();
    if(image&&size){ctx.translate(p.widthMm/2+t.offsetXmm,p.heightMm/2+t.offsetYmm);ctx.rotate(t.rotationDeg*Math.PI/180);ctx.drawImage(image,-size.widthMm/2,-size.heightMm/2,size.widthMm,size.heightMm);}ctx.restore();}
}
export function mappedPanelUvs(compiled:CompiledPanel,p:DecorativePanel,pixels:{pixelWidth:number;pixelHeight:number}){return new Float32Array(compiled.tiles.flatMap(t=>t.polygon.flatMap(point=>{const [u,v]=artworkUv(p,pixels,point);return [u,1-v];})));}
