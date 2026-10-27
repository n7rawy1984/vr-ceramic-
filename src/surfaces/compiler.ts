import { compileLayout, imagePoint, rectArea, subtractRect } from '../layout/compiler.ts';
import { defaultInstallation, type CompileResult, type LayoutAsset, type RectMm } from '../layout/model.ts';
import type { RoomSizeMm } from '../layout/roomDimensions.ts';
import type { RoomArchitecture } from '../layout/roomArchitecture.ts';
import type { WallDesign, WallId } from './model.ts';
export type WallSurface = {id:WallId;widthMm:number;heightMm:number;openings:RectMm[]};
/** u runs along shell-local X, v down from the ceiling. Right +u points toward -world Z. */
export function wallSurface(id:WallId,size:RoomSizeMm,a:RoomArchitecture):WallSurface {
  const widthMm=id==='front'||id==='back'?size.widthMm:size.lengthMm;
  const openings:RectMm[]=[];
  if(id==='right'&&a.window.enabled){const w=a.window;openings.push({xMm:widthMm/2+w.offsetMm-w.widthMm/2,yMm:a.heightMm-w.sillMm-w.heightMm,widthMm:w.widthMm,heightMm:w.heightMm});}
  // Preserve the existing architectural door, including its small-room scaling.
  if(id==='front'&&size.widthMm>150&&a.heightMm>200){const w=Math.min(900,size.widthMm*.45),h=Math.min(2100,a.heightMm*.9);openings.push({xMm:Math.min(900,size.widthMm/2)-w/2,yMm:a.heightMm-h,widthMm:w,heightMm:h});}
  return {id,widthMm,heightMm:a.heightMm,openings};
}
/** Straight uses LayoutCompiler's physical bodies/pitch/UVs, then subtracts real openings. */
export function compileWall(surface:WallSurface,design:WallDesign,assets:readonly LayoutAsset[]):CompileResult {
  if(surface.openings.some(o=>![o.xMm,o.yMm,o.widthMm,o.heightMm].every(Number.isFinite)||o.widthMm<=0||o.heightMm<=0||o.xMm<0||o.yMm<0||o.xMm+o.widthMm>surface.widthMm||o.yMm+o.heightMm>surface.heightMm))return {ok:false,errors:['Wall opening must fit inside the surface.']};
  const installation=defaultInstallation(surface.id,design.tileAssetId,design.tileAssetId,design.tileAssetId);
  installation.field.orientation=design.orientation;installation.jointWidthMm=design.jointWidthMm;
  const result=compileLayout(surface,installation,assets);if(!result.ok)return result;
  const cut=(r:RectMm)=>surface.openings.reduce<RectMm[]>((pieces,o)=>pieces.flatMap(p=>subtractRect(p,o)),[r]);
  const layout=result.layout;
  layout.placements=layout.placements.flatMap(p=>cut(p).map((r,index)=>{
    const corners=[[r.xMm,r.yMm],[r.xMm+r.widthMm,r.yMm+r.heightMm]].map(([x,y])=>imagePoint(p,x,y));
    const asset=assets.find(a=>a.id===p.tileAssetId)!;
    const [u1,v1]=corners[0],[u2,v2]=corners[1];
    return {...p,...r,id:`${p.id}/cut${index}`,fullTile:p.fullTile&&rectArea(r)===rectArea(p),sourceRect:{xMm:Math.min(u1,u2)*asset.widthMm,yMm:Math.min(v1,v2)*asset.heightMm,widthMm:Math.abs(u2-u1)*asset.widthMm,heightMm:Math.abs(v2-v1)*asset.heightMm}};
  }));
  layout.joints=layout.joints.flatMap(cut);
  layout.zones=layout.zones.map(z=>({...z,regions:z.regions.flatMap(cut)}));
  layout.tileAreaMm2=layout.placements.reduce((n,p)=>n+rectArea(p),0);layout.jointAreaMm2=layout.joints.reduce((n,p)=>n+rectArea(p),0);
  return result;
}
/** One bounded entry per wall; exact semantic keys ignore drafts and unrelated assets/settings. */
export function createWallCompilerCache(){
  const cache=new Map<WallId,{key:string;result:CompileResult}>();
  return (surface:WallSurface,design:WallDesign,assets:readonly LayoutAsset[]):CompileResult=>{
    const asset=assets.find(a=>a.id===design.tileAssetId);
    const key=JSON.stringify([surface,design,asset]);const old=cache.get(surface.id);
    if(old?.key===key)return old.result;
    const result=compileWall(surface,design,assets);cache.set(surface.id,{key,result});return result;
  };
}
export const cachedWallCompile=createWallCompilerCache();
