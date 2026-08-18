import { useEffect, useState } from "react";
import * as THREE from "three";
import type { MaterialProduct } from "../catalog/types";
import { generateCeramicCanvas } from "../textures/generateCeramicTexture";

const textureLoader = new THREE.TextureLoader();

// Small cache so switching back to a previously-selected ceramic is instant
// and we don't leak GPU textures by re-generating on every selection.
const cache = new Map<string, THREE.Texture>();

function buildProceduralTexture(product: MaterialProduct): THREE.Texture {
  const canvas = generateCeramicCanvas(
    product.proceduralStyle,
    product.tileWidth,
    product.tileHeight,
  );
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Loads a ceramic's real photographed texture from /public/textures/ceramics/
 * when present; otherwise falls back to a generated demo texture so the app
 * looks correct before real product photography is dropped in.
 */
export function useCeramicTexture(product: MaterialProduct): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(
    () => cache.get(product.id) ?? null,
  );

  useEffect(() => {
    let cancelled = false;

    const cached = cache.get(product.id);
    if (cached) {
      setTexture(cached);
      return;
    }

    textureLoader.load(
      product.texture,
      (loaded) => {
        if (cancelled) return;
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = 4;
        cache.set(product.id, loaded);
        setTexture(loaded);
      },
      undefined,
      () => {
        if (cancelled) return;
        const fallback = buildProceduralTexture(product);
        cache.set(product.id, fallback);
        setTexture(fallback);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [product]);

  return texture;
}
