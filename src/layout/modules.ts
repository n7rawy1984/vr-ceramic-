import type { FloorInstallation, LayoutAsset, Orientation, RectMm } from './model.ts';

export type ModuleTile = RectMm & { slot: string; tileAssetId: string; rotationDeg: Orientation };
/** One repeat includes its trailing right/bottom seam; repeats never double joints. */
export type ModuleDefinition = { widthMm: number; heightMm: number; tiles: ModuleTile[]; joints: RectMm[] };
const rect = (xMm: number,yMm: number,widthMm: number,heightMm: number): RectMm => ({xMm,yMm,widthMm,heightMm});
export function modularSizes(largeMm: number, jointMm: number) {
  const smallMm=(largeMm-jointMm)/2;
  return {largeMm,smallMm,pitchMm:3*(smallMm+jointMm)};
}
/** Strict nominal compatibility, allowing only 1e-6 mm arithmetic noise. No scaling. */
export function multiSizeModule(field: FloorInstallation['field'], joint: number, assets: ReadonlyMap<string,LayoutAsset>): {module: ModuleDefinition; errors: []} | {errors: string[]; module?: never} {
  const errors:string[]=[];
  const config=field.modular;
  if(!config||config.preset!=='multi-size')return {errors:['Choose the Multi-Size Modular preset and Tile B / Tile C.']};
  const a=assets.get(field.tileAssetId);
  if(!a)return {errors:['Modular Tile A is unavailable. Choose another tile.']};
  const {largeMm:l,smallMm:s,pitchMm:p}=modularSizes(a.widthMm,joint);
  if(!Number.isFinite(joint)||joint<0||joint>100||!Number.isFinite(s)||s<.001||l>100000)return {errors:['Modular Tile A must leave a positive small tile after subtracting one full joint.']};
  const expected=[['A',{tileAssetId:field.tileAssetId,orientation:field.orientation},l,l],['B',config.b,s,l],['C',config.c,s,s],...(config.d?[['D',config.d,s,s] as const]:[])] as const;
  const oriented=new Map<string,{id:string;w:number;h:number;rotation:Orientation}>();
  for(const [slot,selection,w,h] of expected){
    const asset=selection&&assets.get(selection.tileAssetId);
    if(!asset){errors.push(`Modular Tile ${slot} is unavailable. Choose a tile from the library.`);continue;}
    if(![0,90].includes(selection.orientation)){errors.push(`Modular Tile ${slot} orientation must be 0° or 90°.`);continue;}
    const width=selection.orientation===90?asset.heightMm:asset.widthMm,height=selection.orientation===90?asset.widthMm:asset.heightMm;
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<.001||height<.001||width>100000||height>100000||Math.abs(width-w)>1e-6||Math.abs(height-h)>1e-6){
      errors.push(`Modular Tile ${slot} must be ${w} × ${h} mm after orientation (selected ${width} × ${height} mm). Exact nominal sizes include the full ${joint} mm joint; tiles are never stretched.`);
    }
    oriented.set(slot,{id:asset.id,w:width,h:height,rotation:selection.orientation});
  }
  if(errors.length)return {errors};
  const tile=(slot:string,x:number,y:number):ModuleTile=>{const a=oriented.get(slot)!;return {...rect(x,y,a.w,a.h),slot,tileAssetId:a.id,rotationDeg:a.rotation};};
  // Two-tier five-body composition: [large A | upright B], then [C | C | D/C].
  const extent=p-joint;
  return {errors:[],module:{widthMm:p,heightMm:p,tiles:[tile('A',0,0),tile('B',l+joint,0),tile('C',0,l+joint),tile('C',s+joint,l+joint),tile(config.d?'D':'C',2*(s+joint),l+joint)],joints:[
    rect(extent,0,joint,p),rect(0,extent,extent,joint),rect(0,l,extent,joint),rect(l,0,joint,l),rect(s,l+joint,joint,s),rect(2*s+joint,l+joint,joint,s),
  ].filter(r=>r.widthMm>0&&r.heightMm>0)}};
}

/** Integer-index multiplication prevents drift. Budget counts candidate bodies, not modules. */
export function repeatModule(module:ModuleDefinition,bounds:RectMm,budget:number,emit:(tile:ModuleTile,row:number,col:number,index:number)=>void,gap:(rect:RectMm)=>void):number {
  const rows=Math.ceil((bounds.heightMm-1e-6)/module.heightMm),cols=Math.ceil((bounds.widthMm-1e-6)/module.widthMm);
  const candidates=rows*cols*module.tiles.length;
  if(!Number.isSafeInteger(candidates)||candidates>budget)throw new Error('Design exceeds 10000 grid cells. Choose larger tiles or reduce the composition.');
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const x=bounds.xMm+col*module.widthMm,y=bounds.yMm+row*module.heightMm;
    module.tiles.forEach((t,index)=>emit({...t,xMm:x+t.xMm,yMm:y+t.yMm},row,col,index));
    module.joints.forEach(t=>gap({...t,xMm:x+t.xMm,yMm:y+t.yMm}));
  }
  return candidates;
}
