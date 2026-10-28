import {createStore} from 'zustand/vanilla';
import {localTransaction} from '../tiles/localDatabase.ts';
import {normalizePanel,type DecorativePanel,type ArtworkSource} from './model.ts';
import {validImage} from '../../shared/tileAsset.ts';
import {imageDimensions} from '../tiles/imageDimensions.ts';
export interface PanelStorage {
  read():Promise<{panels:unknown[];artworks:ArtworkSource[]}>;
  panel(p:DecorativePanel):Promise<void>;artwork(a:ArtworkSource):Promise<void>;
  remove(kind:'decorative-panels'|'artwork-sources',id:string):Promise<void>;
}
export function indexedPanelStorage():PanelStorage{return {
  read:()=>localTransaction(['decorative-panels','artwork-sources'],'readonly',tx=>{let panels:unknown[]=[],artworks:ArtworkSource[]=[];tx.objectStore('decorative-panels').getAll().onsuccess=e=>panels=(e.target as IDBRequest).result;tx.objectStore('artwork-sources').getAll().onsuccess=e=>artworks=(e.target as IDBRequest).result;return()=>({panels,artworks});}),
  panel:p=>localTransaction(['decorative-panels'],'readwrite',tx=>{tx.objectStore('decorative-panels').put(p);return()=>undefined;}),
  artwork:a=>localTransaction(['artwork-sources'],'readwrite',tx=>{tx.objectStore('artwork-sources').put(a);return()=>undefined;}),
  remove:(kind,id)=>localTransaction([kind],'readwrite',tx=>{tx.objectStore(kind).delete(id);return()=>undefined;}),
};}
export function createPanelRepository(storage:PanelStorage){
  const store=createStore<{panels:DecorativePanel[];artworks:ArtworkSource[];status:'loading'|'ready'|'error';error:string}>(()=>({panels:[],artworks:[],status:'loading',error:''}));
  let pending:Promise<void>|null=null,busy=false;
  async function hydrate(){
    if(pending)return pending;
    pending=(async()=>{try{const data=await storage.read(),panels:DecorativePanel[]=[],artworks:ArtworkSource[]=[];let skipped=0;
      for(const p of data.panels)try{panels.push(normalizePanel(p));}catch{skipped++;}
      for(const a of data.artworks){const d=a.blob instanceof Blob&&validImage(a.blob.type,a.blob.size)?await imageDimensions(a.blob):null;if(d&&a.id&&a.pixelWidth>0&&a.pixelHeight>0&&a.pixelWidth<=16384&&a.pixelHeight<=16384)artworks.push(a);else skipped++;}
      store.setState({panels,artworks,status:'ready',error:skipped?'Some damaged panels or artwork sources could not be loaded. Saved project snapshots remain independent.':''});
    }catch{pending=null;store.setState({status:'error',error:'Decorative Panels could not be loaded. Close other app versions and retry.'});}})();return pending;
  }
  async function perform<T>(fn:()=>Promise<T>){await hydrate();if(store.getState().status!=='ready')throw Error(store.getState().error);if(busy)throw Error('Wait for the current panel operation.');busy=true;try{return await fn();}finally{busy=false;}}
  async function save(input:DecorativePanel){return perform(async()=>{const old=store.getState().panels.find(p=>p.id===input.id);if(old&&input.revision!==old.revision)throw Error('This panel changed. Reopen its latest revision before saving.');const p=normalizePanel({...input,revision:old?old.revision+1:1});if(!store.getState().artworks.some(a=>a.id===p.artworkSourceId))throw Error('Choose available artwork before saving.');await storage.panel(p);store.setState(s=>({panels:[...s.panels.filter(v=>v.id!==p.id),p]}));return p;});}
  return {store,hydrate,save,
    upload:(artwork:ArtworkSource)=>perform(async()=>{if(!validImage(artwork.blob.type,artwork.blob.size))throw Error('Choose a JPEG, PNG or WebP up to 5 MB.');await storage.artwork(artwork);store.setState(s=>({artworks:[...s.artworks,artwork]}));return artwork;}),
    duplicate:(id:string)=>perform(async()=>{const old=store.getState().panels.find(p=>p.id===id);if(!old)throw Error('Panel is unavailable.');const p=normalizePanel({...old,id:crypto.randomUUID(),revision:1,name:`${old.name.slice(0,110)} Copy`});await storage.panel(p);store.setState(s=>({panels:[...s.panels,p]}));return p;}),
    remove:(id:string)=>perform(async()=>{await storage.remove('decorative-panels',id);store.setState(s=>({panels:s.panels.filter(p=>p.id!==id)}));}),
    // Artworks are deliberately retained: saved project snapshots may still refer to them.
  };
}
export const panelLibrary=createPanelRepository(indexedPanelStorage());
