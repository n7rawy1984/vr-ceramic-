/// <reference lib="dom" />
/** One versioned connection shared by tile assets, project documents and device preferences. */
let connection:Promise<IDBDatabase>|null=null;
export function openLocalDatabase():Promise<IDBDatabase>{
  if(connection)return connection;
  const pending=new Promise<IDBDatabase>((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(Error('Device storage is unavailable.'));return;}
    let blocked=false;
    const request=indexedDB.open('tile-configurator-local',2);
    request.onupgradeneeded=()=>{
      const db=request.result;
      for(const [name,keyPath] of [['tile-assets','id'],['projects','id'],['preferences','key']])if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath});
    };
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>{blocked=true;reject(Error('Close other open versions of this app, then retry.'));};
    request.onsuccess=()=>{const db=request.result;if(blocked){db.close();return;}db.onversionchange=()=>{db.close();connection=null;};resolve(db);};
  });
  connection=pending;pending.catch(()=>{if(connection===pending)connection=null;});return pending;
}
/** Resolve on transaction completion, never on request success before durable commit. */
export async function localTransaction<T>(stores:string[],mode:IDBTransactionMode,action:(tx:IDBTransaction)=>()=>T):Promise<T>{
  const db=await openLocalDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(stores,mode);
    try{const result=action(tx);tx.oncomplete=()=>resolve(result());tx.onerror=tx.onabort=()=>reject(tx.error??Error('Could not save on this device.'));}
    catch(reason){tx.abort();reject(reason);}
  });
}
