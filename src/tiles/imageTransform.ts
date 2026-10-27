import type { ImageTransform } from './variantModel.ts';
/** Shared normalized image-space foundation for future photographed or simulated slab pairs. */
export function transformUv(u:number,v:number,t?:ImageTransform):[number,number]{
  if(!t)return [u,v];
  if(t.mirrorX)u=1-u;if(t.mirrorY)v=1-v;
  switch(t.rotation){case 90:return [v,1-u];case 180:return [1-u,1-v];case 270:return [1-v,u];default:return [u,v];}
}
