/// <reference lib="dom" />
import type { CompiledTilePlacement } from './model.ts';
import { imagePoint } from './compiler.ts';
import { transformUv } from '../tiles/imageTransform.ts';
import type { ImageTransform } from '../tiles/variantModel.ts';
/** Inverse of the same UV transform used by 3D. Caller clips the visible piece. */
export function drawPlacementImage(ctx:CanvasRenderingContext2D,image:CanvasImageSource,p:CompiledTilePlacement,t?:ImageTransform){
  const b=p.tileBounds,point=(x:number,y:number)=>transformUv(...imagePoint(p,x,y),t);
  const [u,v]=point(b.xMm,b.yMm),[ux,vx]=point(b.xMm+b.widthMm,b.yMm),[uy,vy]=point(b.xMm,b.yMm+b.heightMm);
  const a=ux-u,c=uy-u,d=vx-v,e=vy-v,det=a*e-c*d;
  ctx.save();ctx.transform(b.widthMm*e/det,-b.heightMm*d/det,-b.widthMm*c/det,b.heightMm*a/det,b.xMm+b.widthMm*(-e*u+c*v)/det,b.yMm+b.heightMm*(d*u-a*v)/det);ctx.drawImage(image,0,0,1,1);ctx.restore();
}
