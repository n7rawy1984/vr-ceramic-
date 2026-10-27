/// <reference lib="dom" />
import type { TileAsset } from '../../shared/tileAsset.ts';
export type StoredTile = TileAsset & { blob: Blob };
export interface TileStorage { list(): Promise<unknown[]>; put(tile: StoredTile): Promise<void>; remove(id: string): Promise<void> }
/** Version 1 stores prepared pixels, never an object URL. One connection per document. */
export function indexedTileStorage(): TileStorage {
  let connection: Promise<IDBDatabase> | null = null;
  function open():Promise<IDBDatabase> {
    if(connection)return connection;
    const pending=new Promise<IDBDatabase>((resolve,reject)=>{
      if(!globalThis.indexedDB){reject(Error('Device storage is unavailable.'));return;}
      let blocked=false;
      const request=indexedDB.open('tile-configurator-local',1);
      request.onupgradeneeded=()=>{request.result.createObjectStore('tile-assets',{keyPath:'id'});};
      request.onerror=()=>reject(request.error);
      request.onblocked=()=>{blocked=true;reject(Error('Close other open versions of this app, then retry.'));};
      request.onsuccess=()=>{
        const db=request.result;
        if(blocked){db.close();return;}
        db.onversionchange=()=>{db.close();connection=null;};resolve(db);
      };
    });
    connection=pending;
    pending.catch(()=>{if(connection===pending)connection=null;});
    return pending;
  }
  async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('tile-assets',mode),request=action(tx.objectStore('tile-assets'));
      tx.oncomplete=()=>resolve(request.result);
      tx.onerror=tx.onabort=()=>reject(tx.error??Error('Could not save on this device.'));
    });
  }
  return {list:()=>transaction('readonly',s=>s.getAll()),put:async tile=>{await transaction('readwrite',s=>s.put(tile));},remove:async id=>{await transaction('readwrite',s=>s.delete(id));}};
}
