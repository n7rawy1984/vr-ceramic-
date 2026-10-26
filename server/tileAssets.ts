import { randomUUID } from "node:crypto";
import { FINISHES, MATERIAL_TYPES, validCrop, validDimensionMm, validImage, type ImageMime, type TileAsset, type TileAssetView } from "../shared/tileAsset.ts";
import { requireAdmin, sign, verify } from "./admin.ts";
import { HttpError, body, endpoint, json } from "./http.ts";
import * as db from "./supabase.ts";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const extensions: Record<ImageMime, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
function validPath(path: unknown): path is string {
  return typeof path === "string" && /^tiles\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path);
}
async function view(tile: TileAsset): Promise<TileAssetView> {
  try { return { ...tile, imageUrl: await db.signRead(tile.storage_path), imageUrlExpiresAt: Date.now() + 3600_000 }; }
  catch { return { ...tile, imageUrl: null, imageUrlExpiresAt: null, imageError: "Image access could not be renewed. Refresh the library to retry." }; }
}
export const uploadUrl = (request: Request) => endpoint(async () => {
  requireAdmin(request);
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { Allow: "POST" });
  const data = await body(request);
  if (!validImage(data.mimeType, data.fileSize)) throw new HttpError(400, "Choose a JPG, PNG or WebP image no larger than 5 MB.");
  const filename = typeof data.filename === "string" ? data.filename.split(/[\\/]/).pop()!.slice(0, 255) : null;
  const id = randomUUID();
  const path = `tiles/${id}.${extensions[data.mimeType]}`;
  let url: string;
  try { url = await db.signUpload(path); }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(502, "Could not prepare the upload. Please retry."); }
  const receipt = sign({ kind: "upload", id, path, mime: data.mimeType, size: data.fileSize, filename }, 30 * 60);
  return json({ uploadUrl: url, uploadReceipt: receipt, expiresAt: Date.now() + 30 * 60_000 });
});
function matchesHeader(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  return Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" && Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP";
}
async function save(request: Request) {
  const data = await body(request);
  const receipt = verify(data.uploadReceipt, "upload");
  if (!receipt || !UUID.test(String(receipt.id)) || !validPath(receipt.path)) throw new HttpError(400, "The upload reservation expired. Select the image and upload again.");
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name || name.length > 120 || !validDimensionMm(data.widthMm) || !validDimensionMm(data.heightMm)) throw new HttpError(400, "Enter a name and positive dimensions up to 10,000 cm (maximum 0.001 mm precision).");
  if (!MATERIAL_TYPES.includes(data.materialType as typeof MATERIAL_TYPES[number]) || !FINISHES.includes(data.finish as typeof FINISHES[number]) || ![0, 90, 180, 270].includes(Number(data.imageRotation)) || !validCrop(data.cropData ?? null)) throw new HttpError(400, "Check the material, finish and image preparation settings.");
  const id = receipt.id as string;
  const existing = await db.rows(`&id=eq.${id}`);
  // Retrying an uncertain insert returns the original saved asset, never overwrites it.
  if (existing[0]) return json({ tile: await view(existing[0]) });
  let info;
  try { info = await db.objectInfo(receipt.path); }
  catch { throw new HttpError(502, "The image upload could not be verified. Retry saving after the upload completes."); }
  const size = Number(info.size ?? info.metadata?.size);
  const mime = info.content_type ?? info.contentType ?? info.metadata?.mimetype;
  if (!validImage(mime, size) || size !== receipt.size || mime !== receipt.mime || !matchesHeader(await db.imageHeader(receipt.path), mime)) {
    await db.removeObject(receipt.path).catch(() => {});
    throw new HttpError(400, "Stored file does not match the permitted image and size. Upload a valid image again.");
  }
  const tile = {
    id, name, storage_path: receipt.path, source_filename: receipt.filename,
    mime_type: mime, file_size: size, width_mm: data.widthMm, height_mm: data.heightMm,
    material_type: data.materialType, finish: data.finish, image_rotation: Number(data.imageRotation), crop_data: data.cropData ?? null,
  };
  try {
    const saved = await db.insertRow(tile);
    return json({ tile: await view(saved[0]) }, 201);
  } catch {
    // A network timeout may occur after Postgres committed. Check before reporting
    // failure; leave the private object for an idempotent metadata retry.
    const saved = await db.rows(`&id=eq.${id}`).catch(() => []);
    if (saved[0]) return json({ tile: await view(saved[0]) });
    throw new HttpError(502, "Image uploaded, but tile details could not be saved. Retry Save tile; the uploaded image will be reused.");
  }
}
export const tileAssets = (request: Request) => endpoint(async () => {
  requireAdmin(request);
  if (request.method === "POST") return save(request);
  if (request.method !== "GET") return json({ error: "Method not allowed." }, 405, { Allow: "GET, POST" });
  const tiles: TileAsset[] = await db.rows("&order=created_at.desc");
  // Bounded signing batches keep a growing library from creating a request burst.
  const result: TileAssetView[] = [];
  for (let i = 0; i < tiles.length; i += 8) result.push(...await Promise.all(tiles.slice(i, i + 8).map(view)));
  return json({ tiles: result });
});
export const deleteTile = (request: Request) => endpoint(async () => {
  requireAdmin(request);
  if (request.method !== "DELETE") return json({ error: "Method not allowed." }, 405, { Allow: "DELETE" });
  const id = new URL(request.url).pathname.split("/").pop() ?? "";
  if (!UUID.test(id)) throw new HttpError(400, "Invalid uploaded tile id.");
  const data = await body(request);
  const existing: TileAsset[] = await db.rows(`&id=eq.${id}`);
  const tile = existing[0];
  const recovery = verify(data.cleanupReceipt, "cleanup");
  const path = tile?.storage_path ?? (recovery?.id === id ? recovery.path : null);
  if (!path) return json({ deleted: true }); // Idempotent once both resources are gone.
  if (!validPath(path)) throw new HttpError(400, "Invalid uploaded tile path.");
  if (tile) await db.deleteRow(id);
  try { await db.removeObject(path); }
  catch {
    // Database and object storage cannot share a transaction. Restore metadata
    // on storage failure; retain a signed cleanup capability if restoration fails.
    let restored = false;
    if (tile) {
      try { await db.insertRow(tile); restored = true; }
      catch { restored = (await db.rows(`&id=eq.${id}`).catch(() => [] )).length > 0; }
    }
    throw new HttpError(502, restored ? "Image deletion failed; the tile was restored. Retry Delete." : "Image cleanup is still pending. Retry Delete before closing this library.", {
      cleanupReceipt: sign({ kind: "cleanup", id, path }, 8 * 3600), cleanupPending: !restored,
    });
  }
  return json({ deleted: true });
});
