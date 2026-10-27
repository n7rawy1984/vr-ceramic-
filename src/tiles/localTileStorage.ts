/// <reference lib="dom" />
import { localTransaction } from './localDatabase.ts';
import type { TileAsset } from '../../shared/tileAsset.ts';
export type StoredTile = TileAsset & { blob: Blob };
export interface TileStorage { list(): Promise<unknown[]>; put(tile: StoredTile): Promise<void>; remove(id: string): Promise<void> }
/** Prepared pixels remain in their original store; version 2 adds projects alongside it. */
export function indexedTileStorage(): TileStorage {
  const transaction=<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>)=>localTransaction(['tile-assets'],mode,tx=>{const request=action(tx.objectStore('tile-assets'));return ()=>request.result;});
  return {list:()=>transaction('readonly',s=>s.getAll()),put:async tile=>{await transaction('readwrite',s=>s.put(tile));},remove:async id=>{await transaction('readwrite',s=>s.delete(id));}};
}
