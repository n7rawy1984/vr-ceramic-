/// <reference lib="dom" />
import { localTransaction } from './localDatabase.ts';
import type { TileAsset } from '../../shared/tileAsset.ts';
import { sourceDeletionError, type MaterialSource, type PhysicalVariant } from './variantModel.ts';
/** Legacy v1/v2 tile record, retained only for upgrade/fixture compatibility. */
export type StoredTile=TileAsset&{blob:Blob};
export interface TileStorage {
  list():Promise<{sources:unknown[];variants:unknown[];unmigrated?:number}>;
  put(source:MaterialSource,variant:PhysicalVariant):Promise<void>;
  putSource(source:MaterialSource):Promise<void>;
  putVariant(variant:PhysicalVariant):Promise<void>;
  remove(id:string):Promise<void>;
  removeSource(id:string):Promise<void>;
}
export function indexedTileStorage():TileStorage {
  return {
    list:()=>localTransaction(['material-sources','physical-variants','tile-assets'],'readonly',tx=>{const sources=tx.objectStore('material-sources').getAll(),variants=tx.objectStore('physical-variants').getAll(),legacy=tx.objectStore('tile-assets').count();return ()=>({sources:sources.result,variants:variants.result,unmigrated:legacy.result});}),
    put:async(source,variant)=>{await localTransaction(['material-sources','physical-variants'],'readwrite',tx=>{tx.objectStore('material-sources').add(source);tx.objectStore('physical-variants').add(variant);return ()=>undefined;});},
    putSource:async source=>{await localTransaction(['material-sources'],'readwrite',tx=>{tx.objectStore('material-sources').put(source);return ()=>undefined;});},
    putVariant:async variant=>{
      let missing=false;
      try{await localTransaction(['material-sources','physical-variants'],'readwrite',tx=>{
        // Serialize against material deletion in other tabs as well as this repository.
        const save=()=>tx.objectStore('physical-variants').put(variant);
        if(/^builtin:ceramic-0[123]$/.test(variant.sourceId))save();
        else{const source=tx.objectStore('material-sources').get(variant.sourceId);source.onsuccess=()=>{if(source.result)save();else{missing=true;tx.abort();}};}
        return ()=>undefined;
      });}catch(e){if(missing)throw Error('This material was deleted. Reopen My Tiles before creating a size.');throw e;}
    },
    remove:async id=>{await localTransaction(['physical-variants'],'readwrite',tx=>{const store=tx.objectStore('physical-variants'),q=store.get(id);q.onsuccess=()=>{if(q.result)store.put({...q.result,deleted:true});};return ()=>undefined;});},
    removeSource:async id=>{
      let failure='';
      try{await localTransaction(['material-sources','physical-variants','projects'],'readwrite',tx=>{
        const variants=tx.objectStore('physical-variants').getAll(),projects=tx.objectStore('projects').getAll();let complete=0;
        const check=()=>{if(++complete!==2)return;failure=sourceDeletionError(id,variants.result,projects.result)??'';if(failure){tx.abort();return;}tx.objectStore('material-sources').delete(id);for(const v of variants.result)if(v.sourceId===id)tx.objectStore('physical-variants').delete(v.id);};
        variants.onsuccess=projects.onsuccess=check;return ()=>undefined;
      });}catch(e){if(failure)throw Error(failure);throw e;}
    },
  };
}
