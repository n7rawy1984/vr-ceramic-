import * as THREE from "three";

let cached: THREE.Texture | null = null;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** A small soft-abstract canvas texture for the wall art placeholder —
 * a few warm overlapping gradient blobs on a linen backdrop. Cached so it's
 * generated once regardless of how many art pieces reuse it. */
export function getAbstractArtTexture(): THREE.Texture {
  if (cached) return cached;

  const size = 384;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round(size * 0.62);
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#efe7da";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rand = seededRandom(7);
    const palette = ["#c98a5b", "#8a6b52", "#b7462f", "#d9c7a8"];
    for (let i = 0; i < 5; i++) {
      const x = rand() * canvas.width;
      const y = rand() * canvas.height;
      const r = canvas.width * (0.18 + rand() * 0.22);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const color = palette[i % palette.length];
      grad.addColorStop(0, color + "cc");
      grad.addColorStop(1, color + "00");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // A couple of confident brush strokes for structure.
    ctx.strokeStyle = "rgba(60,45,35,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.15, canvas.height * 0.75);
    ctx.quadraticCurveTo(canvas.width * 0.5, canvas.height * 0.25, canvas.width * 0.85, canvas.height * 0.6);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cached = texture;
  return texture;
}
