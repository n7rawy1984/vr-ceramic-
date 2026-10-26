import { useEffect, useState } from "react";
import * as THREE from "three";
import type { MaterialProduct } from "../catalog/types";
import { generateCeramicCanvas } from "../textures/generateCeramicTexture";
const loader = new THREE.TextureLoader();
// Immutable source textures. Materials clone them before setting UV transforms.
const cache = new Map<string, Promise<THREE.Texture>>();
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
        ready(new THREE.CanvasTexture(generateCeramicCanvas(product.proceduralStyle, product.tileWidth, product.tileHeight)));
      });
    });
    cache.set(key, pending);
    pending.catch(() => { if (cache.get(key) === pending) cache.delete(key); });
    while (cache.size > 24) {
      const oldest = cache.keys().next().value!;
      const entry = cache.get(oldest)!; cache.delete(oldest);
      entry.then(texture => texture.dispose()).catch(() => {});
    }
  }
  return pending;
}
export function useCeramicTexture(product: MaterialProduct) {
  const key = `${product.id}:${product.texture}`;
  const [state, setState] = useState<{ key: string; texture: THREE.Texture | null; error: string | null }>({ key, texture: null, error: null });
  useEffect(() => {
    let cancelled = false;
    sourceTexture(product, key).then(texture => {
      if (!cancelled) setState({ key, texture, error: null });
    }, () => {
      if (!cancelled) setState({ key, texture: null, error: "Saved tile image could not be loaded. Open My Tiles and Refresh to renew image access." });
    });
    return () => { cancelled = true; };
  }, [key, product]);
  // Never render the previous map with the new product's dimensions/finish.
  return state.key === key ? state : { key, texture: null, error: null };
}
