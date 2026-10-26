import { MAX_IMAGE_BYTES, validImage, type CropData } from "../../shared/tileAsset";
export const FULL_CROP: CropData = { x: 0, y: 0, width: 1, height: 1 };
/** Browser-only, no dependency: crop in original coordinates, then clockwise
 * rotate; cap the shipped long edge at 4096px. Stored pixels are ready to use. */
export async function prepareImage(file: File, crop: CropData, rotation: number): Promise<Blob> {
  if (!validImage(file.type, file.size)) throw Error("Choose a JPG, PNG or WebP image no larger than 5 MB.");
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw Error("This file could not be decoded as an image. Choose another JPG, PNG or WebP."); }
  try {
    if (bitmap.width * bitmap.height > 40_000_000 || Math.max(bitmap.width, bitmap.height) > 16384) throw Error("Image dimensions are too large. Resize below 40 megapixels and 16,384 pixels per side.");
    const sx = Math.round(crop.x * bitmap.width), sy = Math.round(crop.y * bitmap.height);
    const sw = Math.max(1, Math.min(bitmap.width - sx, Math.round(crop.width * bitmap.width)));
    const sh = Math.max(1, Math.min(bitmap.height - sy, Math.round(crop.height * bitmap.height)));
    const scale = Math.min(1, 4096 / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement("canvas");
    const sideways = rotation === 90 || rotation === 270;
    canvas.width = sideways ? h : w; canvas.height = sideways ? w : h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("Image preparation is unavailable in this browser.");
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(bitmap, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error("Image preparation failed.")), file.type, 0.92));
    if (blob.size > MAX_IMAGE_BYTES) throw Error("Prepared image exceeds 5 MB. Crop or resize it before saving.");
    return blob;
  } finally { bitmap.close(); }
}
