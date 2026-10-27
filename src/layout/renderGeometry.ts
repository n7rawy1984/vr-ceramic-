import type { CompiledTilePlacement, Surface } from "./model.ts";
import { imagePoint } from "./compiler.ts";
import { mmToM } from "../utils/units.ts";
/** Back-left local (0,0) → world (-width/2, elevation, -length/2). +local Y → +world Z. */
export function floorWorldPoint(surface: Surface, xMm: number, yMm: number, elevationM = .002): [number,number,number] {
  return [mmToM(xMm-surface.widthMm/2),elevationM,mmToM(yMm-surface.heightMm/2)];
}
/** Geometry conversion only. Every body/cut/rotation comes from a compiled placement. */
export function floorBatchBuffers(surface: Surface, placements: readonly CompiledTilePlacement[]) {
  const positions: number[]=[],normals: number[]=[],uv: number[]=[],indices: number[]=[];
  placements.forEach((p,i)=>{
    for(const [x,y] of [[p.xMm,p.yMm],[p.xMm,p.yMm+p.heightMm],[p.xMm+p.widthMm,p.yMm+p.heightMm],[p.xMm+p.widthMm,p.yMm]]) {
      positions.push(...floorWorldPoint(surface,x,y));normals.push(0,1,0);
      const [u,v]=imagePoint(p,x,y);uv.push(u,1-v);
    }
    const n=i*4;indices.push(n,n+1,n+2,n,n+2,n+3);
  });
  return {positions,normals,uv,indices};
}
