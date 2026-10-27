import { imagePoint } from '../layout/compiler.ts';
import type { CompiledTilePlacement } from '../layout/model.ts';
import type { RoomSizeMm } from '../layout/roomDimensions.ts';
import type { WallSurface } from './compiler.ts';
/** Scene boundary only. Offset sits just inside the 120mm shell, avoiding z fighting. */
export function wallWorldPoint(surface:WallSurface,size:RoomSizeMm,u:number,v:number):[number,number,number]{
  const x=(u-surface.widthMm/2)/1000,y=(surface.heightMm-v)/1000;
  switch(surface.id){
    case 'back':return [x,y,-size.lengthMm/2000+.062];
    case 'front':return [x,y,size.lengthMm/2000-.062];
    case 'left':return [-size.widthMm/2000+.062,y,-x];
    case 'right':return [size.widthMm/2000-.062,y,-x];
  }
}
export function wallBatchBuffers(surface:WallSurface,size:RoomSizeMm,placements:readonly CompiledTilePlacement[]){
  const positions:number[]=[],normals:number[]=[],uv:number[]=[],indices:number[]=[];
  const normal=surface.id==='back'?[0,0,1]:surface.id==='front'?[0,0,-1]:surface.id==='left'?[1,0,0]:[-1,0,0];
  placements.forEach((p,i)=>{
    for(const [u,v] of [[p.xMm,p.yMm],[p.xMm,p.yMm+p.heightMm],[p.xMm+p.widthMm,p.yMm+p.heightMm],[p.xMm+p.widthMm,p.yMm]]){
      positions.push(...wallWorldPoint(surface,size,u,v));normals.push(...normal);const [x,y]=imagePoint(p,u,v);uv.push(x,1-y);
    }
    const n=i*4;
    if(surface.id==='front'||surface.id==='right')indices.push(n,n+2,n+1,n,n+3,n+2);else indices.push(n,n+1,n+2,n,n+2,n+3);
  });
  return {positions,normals,uv,indices};
}
