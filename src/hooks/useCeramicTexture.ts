import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import type { MaterialProduct } from "../catalog/types";
import { generateCeramicCanvas } from "../textures/generateCeramicTexture";
const loader = new THREE.TextureLoader();
// Immutable source textures. Materials clone them before setting UV transforms.
const cache = new Map<string, Promise<THREE.Texture>>();
const users=new Map<string,number>();
function trim(){
  while(cache.size>24){const key=[...cache.keys()].find(key=>!users.get(key));if(!key)break;const pending=cache.get(key)!;cache.delete(key);pending.then(t=>t.dispose()).catch(()=>{});}
}
function sourceTexture(product: MaterialProduct, key: string) {
  let pending = cache.get(key);
  if (!pending) {
    pending = new Promise<THREE.Texture>((resolve, reject) => {
      const ready = (texture: THREE.Texture) => {
        texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; resolve(texture);
      };
      if (!product.texture && product.source === "upload") { reject(Error("Image access could not be renewed.")); return; }
      loader.load(product.texture, ready, undefined, () => {
        if (product.source === "upload") { reject(Error("Saved tile image could not be loaded. Open My Tiles and Refresh to renew image access.")); return; }
        ready(new THREE.CanvasTexture(generateCeramicCanvas(product.proceduralStyle, product.sourceAspect?.width??product.tileWidth, product.sourceAspect?.height??product.tileHeight)));
      });
    });
    cache.set(key, pending);
    pending.catch(() => { if (cache.get(key) === pending) cache.delete(key); });
    trim();
  }
  return pending;
}
export function useCeramicTexture(product: MaterialProduct) {
  const productRef=useRef(product);productRef.current=product;
  const key = `${product.sourceId??product.id}:${product.texture}`;
  const [state, setState] = useState<{ key: string; texture: THREE.Texture | null; error: string | null }>({ key, texture: null, error: null });
  useEffect(() => {
    let cancelled = false;
    users.set(key,(users.get(key)??0)+1);
    sourceTexture(productRef.current, key).then(texture => {
      if (!cancelled) setState({ key, texture, error: null });
    }, () => {
      if (!cancelled) setState({ key, texture: null, error: "Saved tile image could not be loaded. Open My Tiles and Refresh to renew image access." });
    });
    return () => { cancelled = true;const count=(users.get(key)??1)-1;if(count)users.set(key,count);else users.delete(key);trim(); };
  }, [key]);
  // Never render the previous map with the new product's dimensions/finish.
  return state.key === key ? state : { key, texture: null, error: null };
}
