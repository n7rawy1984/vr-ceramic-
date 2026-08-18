import type { ProceduralStyle } from "../catalog/types";

/**
 * Demo-quality procedural textures used until real photographed tile JPGs are
 * dropped into /public/textures/ceramics/. Each generator draws exactly one
 * physical tile into the canvas; the canvas aspect ratio is matched to the
 * tile's real width:height ratio so repeat-tiling in Three.js stays
 * undistorted. Actual gloss/matte behavior comes from the material's PBR
 * roughness (see catalog/materials.ts) — these textures intentionally stay
 * physically plausible (color + restrained micro-variation) rather than
 * baking in fake highlights or dramatic marks, which is what makes
 * procedural fills read as synthetic under moving light.
 */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Cheap per-pixel brightness jitter so flat vector fills stop reading as
 * flat CSS gradients and start reading as a photographed surface. */
function addGrain(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, amount: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const jitter = (rand() - 0.5) * amount * 255;
    data[i] = Math.max(0, Math.min(255, data[i] + jitter));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + jitter));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + jitter));
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * A single flowing, organic mark — used for marble/stone veining. Unlike a
 * pure random walk (which reads as a "scribble"), this drifts a heading
 * angle gently each step, so the result is one continuous elegant curve
 * rather than a jittery zig-zag.
 */
function drawVein(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  startX: number,
  startY: number,
  length: number,
  strokeStyle: string,
  lineWidth: number,
  curviness = 0.35,
) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  let x = startX;
  let y = startY;
  let heading = rand() * Math.PI * 2;
  const segments = 9 + Math.floor(rand() * 5);
  const stepLen = length / segments;

  for (let s = 0; s < segments; s++) {
    heading += (rand() - 0.5) * curviness;
    const nx = x + Math.cos(heading) * stepLen;
    const ny = y + Math.sin(heading) * stepLen;
    const cx = (x + nx) / 2 + (rand() - 0.5) * stepLen * 0.4;
    const cy = (y + ny) / 2 + (rand() - 0.5) * stepLen * 0.4;
    ctx.quadraticCurveTo(cx, cy, nx, ny);
    x = nx;
    y = ny;
  }
  ctx.stroke();
}

function drawMarble(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seededRandom(11);
  const diag = Math.hypot(w, h);

  ctx.fillStyle = "#f2ede3";
  ctx.fillRect(0, 0, w, h);

  // Soft large-scale cloudiness — real marble reads mostly as gentle tonal
  // drift, with veins as sparse accents rather than the main event.
  for (let i = 0; i < 5; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = w * (0.25 + rand() * 0.35);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(228,222,211,${0.16 + rand() * 0.12})`);
    grad.addColorStop(1, "rgba(228,222,211,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // A handful of restrained, elegant veins — real Carrara slabs typically
  // show only a few characterful veins per section, not dozens of scribbles.
  const veinCount = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < veinCount; i++) {
    const warm = rand() > 0.8;
    const gray = 150 + rand() * 35;
    const color = warm
      ? `rgba(${gray + 12},${gray + 2},${gray - 22},${0.12 + rand() * 0.12})`
      : `rgba(${gray},${gray},${gray + 3},${0.12 + rand() * 0.14})`;
    const length = diag * (0.35 + rand() * 0.4);
    drawVein(ctx, rand, rand() * w, rand() * h, length, color, 0.7 + rand() * 1.3, 0.3);

    // One faint, thin branch off some veins — restrained, not a fractal mess.
    if (rand() > 0.55) {
      drawVein(
        ctx,
        rand,
        rand() * w,
        rand() * h,
        length * 0.4,
        `rgba(${gray},${gray},${gray},${0.06 + rand() * 0.08})`,
        0.3 + rand() * 0.4,
        0.45,
      );
    }
  }

  // Very fine overall mottling, barely perceptible.
  const speckCount = Math.round((w * h) / 1100);
  for (let i = 0; i < speckCount; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = rand() * 1.1;
    ctx.fillStyle = `rgba(205,200,192,${rand() * 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  addGrain(ctx, w, h, rand, 0.015);
}

function drawTravertine(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seededRandom(23);
  ctx.fillStyle = "#c9ad82";
  ctx.fillRect(0, 0, w, h);

  // Horizontal sedimentary striations, layered and slightly wavy rather than
  // perfectly straight bands — the main character of honed travertine.
  const bands = 14 + Math.floor(rand() * 8);
  for (let i = 0; i < bands; i++) {
    const y = (h / bands) * i + rand() * (h / bands) * 0.5;
    const bandH = h / bands / 2 + rand() * (h / bands) / 2;
    ctx.fillStyle = `rgba(${165 + rand() * 45},${125 + rand() * 35},${75 + rand() * 30},${0.09 + rand() * 0.1})`;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += w / 8) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * bandH * 0.15);
    }
    ctx.lineTo(w, y + bandH);
    for (let x = w; x >= 0; x -= w / 8) {
      ctx.lineTo(x, y + bandH + Math.sin(x * 0.02 + i) * bandH * 0.15);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Small, restrained pores — natural imperfections, not "dirt". Sparse and
  // subtle rather than dense speckling.
  const speckCount = Math.round((w * h) / 950);
  for (let i = 0; i < speckCount; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 0.4 + rand() * 1.1;
    const dark = rand() > 0.45;
    ctx.fillStyle = dark
      ? `rgba(115,90,58,${0.08 + rand() * 0.12})`
      : `rgba(238,220,188,${0.08 + rand() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  addGrain(ctx, w, h, rand, 0.022);
}

function drawDarkStone(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seededRandom(37);
  const diag = Math.hypot(w, h);

  // Charcoal, not near-black — the base tone alone must read as a stone
  // color with room to show detail, never a flat void. Kept a touch lighter
  // and higher-contrast than a "true" charcoal so detail survives being
  // dimmed by ambient-only light in shadowed parts of the room.
  ctx.fillStyle = "#525049";
  ctx.fillRect(0, 0, w, h);

  // Dense, overlapping soft clouds, pushed to a wider tonal range so no
  // region of the tile stays flat — every pixel gets real tonal drift.
  const cloudCount = 9 + Math.floor(rand() * 4);
  for (let i = 0; i < cloudCount; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = w * (0.22 + rand() * 0.3);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const lighter = rand() > 0.45;
    grad.addColorStop(0, lighter ? "rgba(118,113,104,0.4)" : "rgba(26,24,22,0.34)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Quiet mineral vein structure — visible grain, not a marble-style feature.
  for (let i = 0; i < 4; i++) {
    const length = diag * (0.3 + rand() * 0.35);
    drawVein(
      ctx,
      rand,
      rand() * w,
      rand() * h,
      length,
      `rgba(${70 + rand() * 25},${68 + rand() * 25},${64 + rand() * 22},${0.14 + rand() * 0.1})`,
      0.6 + rand() * 1.1,
      0.3,
    );
  }

  // Fine mineral speckle, kept light enough not to read as noise.
  const speckCount = Math.round((w * h) / 380);
  for (let i = 0; i < speckCount; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const v = 60 + rand() * 45;
    ctx.fillStyle = `rgba(${v},${v - 2},${v - 4},${0.18 + rand() * 0.24})`;
    ctx.fillRect(x, y, 1, 1);
  }

  addGrain(ctx, w, h, rand, 0.04);
}

const STYLE_DRAWERS: Record<
  ProceduralStyle,
  (ctx: CanvasRenderingContext2D, w: number, h: number) => void
> = {
  marble: drawMarble,
  travertine: drawTravertine,
  darkstone: drawDarkStone,
};

/**
 * Generates a single-tile canvas texture image. `tileWidthCm`/`tileHeightCm`
 * only set the canvas aspect ratio (not physical repeat, which is handled by
 * the material's UV repeat based on real-world meters).
 */
export function generateCeramicCanvas(
  style: ProceduralStyle,
  tileWidthCm: number,
  tileHeightCm: number,
  resolution = 768,
): HTMLCanvasElement {
  const aspect = tileWidthCm / tileHeightCm;
  const w = aspect >= 1 ? resolution : Math.round(resolution * aspect);
  const h = aspect >= 1 ? Math.round(resolution / aspect) : resolution;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  STYLE_DRAWERS[style](ctx, w, h);
  return canvas;
}
