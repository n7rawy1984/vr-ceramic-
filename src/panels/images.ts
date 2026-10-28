import {useEffect,useState} from 'react';
import {useStore} from 'zustand';
import * as THREE from 'three';
import {panelLibrary} from './repository.ts';
const cache=new Map<string,{blob:Blob;url:string;image:HTMLImageElement;texture:THREE.Texture|null;refs:number;promise:Promise<void>}>();
function acquire(id:string,blob:Blob){
  let entry=cache.get(id);
  if(!entry){const url=URL.createObjectURL(blob),image=new Image();entry={blob,url,image,texture:null,refs:0,promise:Promise.resolve()};const e=entry;
    e.promise=new Promise((resolve,reject)=>{image.onload=()=>{const t=new THREE.Texture(image);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.needsUpdate=true;e.texture=t;resolve();};image.onerror=()=>reject(Error('Artwork could not be decoded. Choose another source.'));image.src=url;});cache.set(id,e);
  }
  entry.refs++;return entry;
}
function release(id:string){const e=cache.get(id);if(e)e.refs--;queueMicrotask(()=>{for(const [key,v]of cache){if(cache.size<=8)break;if(v.refs<=0){v.texture?.dispose();URL.revokeObjectURL(v.url);v.image.src='';cache.delete(key);}}});}
export function useArtwork(id:string){
  const source=useStore(panelLibrary.store,s=>s.artworks.find(a=>a.id===id));
  const [loaded,setLoaded]=useState<{id:string;image:HTMLImageElement|null;texture:THREE.Texture|null;error:string}>({id:'',image:null,texture:null,error:''});
  useEffect(()=>{if(!source)return;let active=true;const e=acquire(id,source.blob);e.promise.then(()=>{if(active)setLoaded({id,image:e.image,texture:e.texture,error:''});},error=>{if(active)setLoaded({id,image:null,texture:null,error:error.message});});return()=>{active=false;release(id);};},[id,source]);
  return {source,image:loaded.id===id?loaded.image:null,texture:loaded.id===id?loaded.texture:null,error:source?(loaded.id===id?loaded.error:''):'Artwork is unavailable. The panel uses a neutral preview.'};
}
