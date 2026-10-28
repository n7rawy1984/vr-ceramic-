import type { MaterialProduct } from '../catalog/types.ts';
import { layoutAsset } from '../layout/assets.ts';
import { compileFloor as compileLayout } from '../panels/floor.ts';
import type { CompileResult } from '../layout/model.ts';
import { roomSurface } from '../layout/roomDimensions.ts';
import { assetReferences, normalizeAppliedState, type AppliedProjectState } from '../projects/model.ts';
import { WALL_IDS } from '../surfaces/model.ts';
import { cachedWallCompile, wallSurface } from '../surfaces/compiler.ts';

/** Retain unchanged semantic objects so lighting-only changes cannot rebuild geometry. */
function share<T>(next:T, before:T):T {
  if (next === before) return before;
  if (!next || !before || typeof next !== 'object' || typeof before !== 'object') return next;
  const keys=Object.keys(next), oldKeys=Object.keys(before);
  const result={...next};let same=keys.length===oldKeys.length;
  for(const key of keys){
    const k=key as keyof T;result[k]=share(next[k],before[k]);
    if(!Object.hasOwn(before,key)||result[k]!==before[k])same=false;
  }
  return same?before:result;
}
export type AppliedDesignSnapshot={state:AppliedProjectState;result:CompileResult};
/** Strict preparation; unchanged surfaces reuse the already validated applied results. */
export function prepareAutoDesign(input:AppliedProjectState,products:MaterialProduct[],previous?:AppliedDesignSnapshot){
  const parsed=normalizeAppliedState(input);
  if(assetReferences(parsed).some(id=>!products.some(p=>p.id===id)))throw Error('A design material was deleted or is unavailable. Choose materials again.');
  const state=previous?share(parsed,previous.state):parsed;
  const assets=products.map(layoutAsset);
  for(const id of WALL_IDS)if(state.walls[id].enabled){
    const surface=wallSurface(id,state.roomSize,state.architecture);
    const unchanged=previous&&state.walls[id]===previous.state.walls[id]&&JSON.stringify(surface)===JSON.stringify(wallSurface(id,previous.state.roomSize,previous.state.architecture));
    if(!unchanged){const wall=cachedWallCompile(surface,state.walls[id],assets);if(!wall.ok)throw Error(`The ${id} wall could not be applied: ${wall.errors.join(' ')}`);}
  }
  const sameFloor=previous&&state.roomSize===previous.state.roomSize&&state.floorDesign.installation===previous.state.floorDesign.installation;
  const result=sameFloor?previous.result:compileLayout(roomSurface(state.roomSize),state.floorDesign.installation,assets);
  if(!result.ok&&state.floorDesign.enabled)throw Error(`This design could not be opened: ${result.errors.join(' ')}`);
  return {state,result,products,warnings:[] as string[]};
}
