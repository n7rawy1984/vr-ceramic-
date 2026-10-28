import type {DecorativePanel,PointMm} from './model.ts';
import {imageQuality} from '../tiles/variantModel.ts';
export function artworkSize(p:DecorativePanel,pixels:{pixelWidth:number;pixelHeight:number}){
  const t=p.artworkTransform,ratio=pixels.pixelWidth/pixels.pixelHeight;
  const factor=t.fit==='fit'?Math.min(p.widthMm/pixels.pixelWidth,p.heightMm/pixels.pixelHeight):t.fit==='fill'?Math.max(p.widthMm/pixels.pixelWidth,p.heightMm/pixels.pixelHeight):p.widthMm/pixels.pixelWidth;
  return {widthMm:pixels.pixelWidth*factor*t.scale,heightMm:pixels.pixelWidth/ratio*factor*t.scale};
}
/** Inverse artwork placement: the same panel point maps identically on every tile/cut. */
export function artworkUv(p:DecorativePanel,pixels:{pixelWidth:number;pixelHeight:number},point:PointMm):[number,number]{
  const t=p.artworkTransform,s=artworkSize(p,pixels),a=t.rotationDeg*Math.PI/180,x=point.x-p.widthMm/2-t.offsetXmm,y=point.y-p.heightMm/2-t.offsetYmm;
  return [(.5+(Math.cos(a)*x+Math.sin(a)*y)/s.widthMm),(.5+(-Math.sin(a)*x+Math.cos(a)*y)/s.heightMm)];
}
export const artworkQuality=(p:DecorativePanel,pixels:{pixelWidth:number;pixelHeight:number})=>imageQuality(pixels,artworkSize(p,pixels));
