import * as THREE from "three";

let cached: THREE.Texture | null = null;

/** A tiny vertical gradient used as a cheap "outdoors" backdrop behind the
 * window — avoids an HDRI/environment map while still reading as daylight
 * sky rather than a flat, obviously fake color. Generated once and reused. */
export function getSkyGradientTexture(): THREE.Texture {
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#8fc3ec");
    gradient.addColorStop(0.55, "#bfe0f7");
    gradient.addColorStop(1, "#eaf4fb");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cached = texture;
  return texture;
}
