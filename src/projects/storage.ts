import { localTransaction } from '../tiles/localDatabase.ts';
import type { ProjectDocument } from './model.ts';
export interface ProjectStorage {list():Promise<unknown[]>;read(id:string):Promise<unknown>;write(project:ProjectDocument,activate:boolean):Promise<void>;remove(id:string,clearActive:boolean):Promise<void>;readLast():Promise<string|null>;remember(id:string|null):Promise<void>}
export function indexedProjectStorage():ProjectStorage{
  return {
    list:()=>localTransaction(['projects'],'readonly',tx=>{const r=tx.objectStore('projects').getAll();return ()=>r.result;}),
    read:id=>localTransaction(['projects'],'readonly',tx=>{const r=tx.objectStore('projects').get(id);return ()=>r.result;}),
    write:async(project,activate)=>{await localTransaction(['projects','preferences'],'readwrite',tx=>{tx.objectStore('projects').put(project);if(activate)tx.objectStore('preferences').put({key:'last-project',value:project.id});return ()=>undefined;});},
    remove:async(id,clearActive)=>{await localTransaction(['projects','preferences'],'readwrite',tx=>{tx.objectStore('projects').delete(id);if(clearActive)tx.objectStore('preferences').delete('last-project');return ()=>undefined;});},
    readLast:()=>localTransaction(['preferences'],'readonly',tx=>{const r=tx.objectStore('preferences').get('last-project');return ()=>typeof r.result?.value==='string'?r.result.value:null;}),
    remember:async id=>{await localTransaction(['preferences'],'readwrite',tx=>{if(id)tx.objectStore('preferences').put({key:'last-project',value:id});else tx.objectStore('preferences').delete('last-project');return ()=>undefined;});},
  };
}
