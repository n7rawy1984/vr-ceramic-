import { useEffect, useState } from "react";
import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();

/**
 * Loads an auxiliary map (normal, roughness, ...) only when a path is
 * actually supplied. Unlike `useCeramicTexture` there is no procedural
 * fallback here — a missing path, or a failed load, simply means the
 * material renders without that map, which is the intended graceful
 * degradation for optional PBR inputs.
 */
export function useOptionalTexture(path: string | undefined): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(() => (path ? cache.get(path) ?? null : null));

  useEffect(() => {
    if (!path) {
      setTexture(null);
      return;
    }

    let cancelled = false;
    const cached = cache.get(path);
    if (cached) {
      setTexture(cached);
      return;
    }

    textureLoader.load(
      path,
      (loaded) => {
        if (cancelled) return;
        cache.set(path, loaded);
        setTexture(loaded);
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [path]);

  return texture;
}
