import { transformUv } from '../tiles/imageTransform.ts';
import type { ImageTransform } from '../tiles/variantModel.ts';
import type { CompiledTilePlacement, Surface } from "./model.ts";
import { imagePoint } from "./compiler.ts";
import { mmToM } from "../utils/units.ts";
/** Back-left local (0,0) → world (-width/2, elevation, -length/2). +local Y → +world Z. */
export function floorWorldPoint(surface: Surface, xMm: number, yMm: number, elevationM = .002): [number,number,number] {
  return [mmToM(xMm-surface.widthMm/2),elevationM,mmToM(yMm-surface.heightMm/2)];
}
/** Geometry conversion only. Every body/cut/rotation comes from a compiled placement. */
export function floorBatchBuffers(surface: Surface, placements: readonly CompiledTilePlacement[],transform?:ImageTransform) {
  const positions: number[]=[],normals: number[]=[],uv: number[]=[],indices: number[]=[];
  placements.forEach(p=>{
    const points=p.polygon?p.polygon.map(v=>[v.x,v.y]):[[p.xMm,p.yMm],[p.xMm,p.yMm+p.heightMm],[p.xMm+p.widthMm,p.yMm+p.heightMm],[p.xMm+p.widthMm,p.yMm]];
    const n=positions.length/3;
    for(const [x,y] of points){positions.push(...floorWorldPoint(surface,x,y));normals.push(0,1,0);const [u,v]=transformUv(...imagePoint(p,x,y),transform);uv.push(u,1-v);}
    // Convex panel subtraction pieces use clockwise surface coordinates; Three's floor normal faces +Y.
    if(p.polygon)for(let k=1;k<points.length-1;k++)indices.push(n,n+k+1,n+k);
    else indices.push(n,n+1,n+2,n,n+2,n+3);
  });
  return {positions,normals,uv,indices};
}
