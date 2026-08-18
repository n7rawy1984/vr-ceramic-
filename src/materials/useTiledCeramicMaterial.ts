import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { MaterialProduct } from "../catalog/types";
import { useCeramicTexture } from "../hooks/useCeramicTexture";
import { useOptionalTexture } from "../hooks/useOptionalTexture";
import { cmToM } from "../utils/units";

interface Options {
  product: MaterialProduct;
  /** Surface size in meters that the texture repeats across. */
  surfaceWidth: number;
  surfaceLength: number;
}

const DEFAULT_ROUGHNESS = 0.82;

function applyTiling(texture: THREE.Texture, repeatX: number, repeatY: number, rotationDeg: number) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.center.set(0.5, 0.5);
  texture.rotation = THREE.MathUtils.degToRad(rotationDeg);
  texture.needsUpdate = true;
}

/**
 * Builds a MeshStandardMaterial whose color map repeats at the ceramic's real
 * physical tile size (in meters) and renders subtle grout lines between
 * tiles via a small fragment-shader injection (onBeforeCompile), so the
 * standard PBR lighting model is preserved with no extra draw calls.
 *
 * Optional normal/roughness maps (`product.normalTexture`/`roughnessTexture`)
 * are applied when supplied; when absent the material gracefully falls back
 * to a flat `product.roughnessValue`, so a product only needs a color map to
 * work correctly, and gains real PBR detail the moment the other maps are
 * added to the catalog — no scene code changes required.
 *
 * The material is only returned once its color texture has finished loading
 * (real file or procedural fallback), so USE_MAP is guaranteed to be defined
 * the first time the shader compiles.
 */
export function useTiledCeramicMaterial({
  product,
  surfaceWidth,
  surfaceLength,
}: Options): THREE.MeshStandardMaterial | null {
  const texture = useCeramicTexture(product);
  const normalMap = useOptionalTexture(product.normalTexture);
  const roughnessMap = useOptionalTexture(product.roughnessTexture);

  const repeatX = surfaceWidth / cmToM(product.tileWidth);
  const repeatY = surfaceLength / cmToM(product.tileHeight);
  const groutWidthUvX = cmToM(product.groutWidth ?? 0.3) / cmToM(product.tileWidth);
  const groutWidthUvY = cmToM(product.groutWidth ?? 0.3) / cmToM(product.tileHeight);
  const rotationDeg = product.textureRotationDeg ?? 0;
  const tileVariation = product.tileVariation ?? 0.05;

  const material = useMemo(() => {
    if (!texture) return null;

    applyTiling(texture, repeatX, repeatY, rotationDeg);
    if (normalMap) applyTiling(normalMap, repeatX, repeatY, rotationDeg);
    if (roughnessMap) applyTiling(roughnessMap, repeatX, repeatY, rotationDeg);

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      normalMap: normalMap ?? undefined,
      roughnessMap: roughnessMap ?? undefined,
      // When a roughness map drives the surface, keep the scalar at 1 so it
      // doesn't double-darken the sampled value; otherwise fall back to the
      // catalog's flat roughness for that ceramic's finish.
      roughness: roughnessMap ? 1 : (product.roughnessValue ?? DEFAULT_ROUGHNESS),
      metalness: 0.04,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uGroutWidthUv = {
        value: new THREE.Vector2(groutWidthUvX, groutWidthUvY),
      };
      shader.uniforms.uGroutColor = {
        value: new THREE.Color(product.groutColor ?? "#999999"),
      };
      shader.uniforms.uTileVariation = { value: tileVariation };

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>
        uniform vec2 uGroutWidthUv;
        uniform vec3 uGroutColor;
        uniform float uTileVariation;

        // Cheap deterministic per-tile hash — no texture lookup, no branching.
        float tileHash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
        }`,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        #ifdef USE_MAP
        {
          // Subtle per-tile tone shift so identical tiles don't read as one
          // continuous stretched material — every physical tile gets a tiny,
          // deterministic brightness offset, the way real installed ceramic does.
          vec2 tileIndex = floor(vMapUv);
          float variation = tileHash(tileIndex);
          diffuseColor.rgb *= mix(1.0 - uTileVariation, 1.0 + uTileVariation, variation);

          // Grout: screen-space-derivative anti-aliased so the line stays
          // crisp and flicker-free at any distance or viewing angle, plus a
          // soft inner bevel (a faint AO band just inside the joint) so the
          // grout reads as a physical recessed gap rather than a printed line.
          vec2 tileUv = fract(vMapUv);
          vec2 edgeDist = min(tileUv, 1.0 - tileUv);
          vec2 groutW = max(uGroutWidthUv, vec2(0.0008));
          vec2 aa = fwidth(tileUv) * 1.5 + 0.0006;
          vec2 groutMask2 = smoothstep(groutW - aa, groutW + aa, edgeDist);
          float groutMask = min(groutMask2.x, groutMask2.y);

          vec2 bevelMask2 = smoothstep(groutW, groutW + groutW * 2.2, edgeDist);
          float bevel = min(bevelMask2.x, bevelMask2.y);
          float aoShade = mix(0.8, 1.0, bevel);

          diffuseColor.rgb = mix(uGroutColor, diffuseColor.rgb * aoShade, groutMask);
        }
        #endif`,
      );
    };

    return mat;
    // Deliberately keyed on product.id (not the whole product object) plus
    // room geometry, so we don't rebuild the material on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    texture,
    normalMap,
    roughnessMap,
    product.id,
    product.roughnessValue,
    product.groutColor,
    repeatX,
    repeatY,
    groutWidthUvX,
    groutWidthUvY,
    rotationDeg,
    tileVariation,
  ]);

  // Dispose each material (not the shared/cached texture) once it's replaced,
  // to avoid leaking GPU program resources on repeated selection.
  useEffect(() => {
    return () => {
      material?.dispose();
    };
  }, [material]);

  return material;
}
