import { WALL_IDS } from '../surfaces/model.ts';
import { cachedWallCompile, wallSurface } from '../surfaces/compiler.ts';
import type { MaterialProduct } from '../catalog/types.ts';
import { FLOOR_CERAMICS } from '../catalog/materials.ts';
import { compileLayout } from '../layout/compiler.ts';
import { layoutAsset } from '../layout/assets.ts';
import { roomSurface } from '../layout/roomDimensions.ts';
import { assetReferences, normalizeAppliedState, type AppliedProjectState } from './model.ts';
/** Resolve shared identities before touching runtime stores. The layout compiler is unchanged. */
export function prepareProjectState(input:AppliedProjectState,products:MaterialProduct[],names:Record<string,string>){
  const state=normalizeAppliedState(input),ids=new Set(products.map(p=>p.id)),missing=assetReferences(state).filter(id=>!ids.has(id));
  const warnings=missing.map(id=>`Saved tile “${names[id]||'Unnamed tile'}” is no longer available on this device. A default material was used instead.`);
  const fallback=FLOOR_CERAMICS[0].id,frameFallback=FLOOR_CERAMICS[2].id;
  const i=state.floorDesign.installation,field=i.field,m=field.modular;
  const brokenPattern=!ids.has(field.tileAssetId)||(field.pattern==='checker'&&!ids.has(field.secondaryTileAssetId!))||(field.pattern==='modular'&&(!m||[m.b,m.c,m.d].some(s=>s&&!ids.has(s.tileAssetId))));
  if(!ids.has(field.tileAssetId))field.tileAssetId=fallback;
  if(field.secondaryTileAssetId&&!ids.has(field.secondaryTileAssetId))delete field.secondaryTileAssetId;
  if(m&&[m.b,m.c,m.d].some(s=>s&&!ids.has(s.tileAssetId)))delete field.modular;
  if(brokenPattern&&field.pattern!=='straight'){field.pattern='straight';warnings.push('Main Field was restored as Straight because its saved pattern tiles are no longer available.');}
  for(const [zone,id] of [[i.border,frameFallback],[i.centerFrame,frameFallback],[i.center,fallback]] as const)if(!ids.has(zone.tileAssetId))zone.tileAssetId=id;
  for(const id of WALL_IDS){
    const wall=state.walls[id];
    const missingWall=!ids.has(wall.tileAssetId);
    if(missingWall){wall.enabled=false;wall.tileAssetId=fallback;}
    if(wall.enabled){const compiled=cachedWallCompile(wallSurface(id,state.roomSize,state.architecture),wall,products.map(layoutAsset));if(!compiled.ok)throw Error(`The ${id} wall could not be opened: ${compiled.errors.join(' ')}`);}
  }
  const material=state.materialState;
  if(!ids.has(material.selectedFloorId))material.selectedFloorId=fallback;
  if(material.previousFloorId&&!ids.has(material.previousFloorId)){material.previousFloorId=null;material.compareActive=false;}
  if(state.floorDesign.enabled)material.compareActive=false;
  const result=compileLayout(roomSurface(state.roomSize),i,products.map(layoutAsset));
  if(!result.ok){
    if(!missing.length&&state.floorDesign.enabled)throw Error(`This saved design could not be opened: ${result.errors.join(' ')}`);
    if(state.floorDesign.enabled){state.floorDesign.enabled=false;warnings.push('The room and design settings were kept. Simple material is active; review Floor Design before applying it again.');}
  }
  return {state,result,products,warnings};
}
