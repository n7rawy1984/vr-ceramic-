import type { TileAsset } from "../shared/tileAsset.ts";
import { HttpError } from "./http.ts";
const BUCKET = "tile-assets";
export class SupabaseError extends Error { }
function settings() {
  const raw = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw || !key) throw new HttpError(503, "Online tile storage is not configured. See the setup guide.");
  const url = new URL(raw);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new HttpError(503, "Tile storage configuration needs attention.");
  const headers: Record<string, string> = { apikey: key };
  // Current sb_secret keys are not JWTs: use apikey only. Legacy JWTs also
  // carry Authorization so Storage/Data API select the elevated role.
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return { origin: url.origin, headers };
}
async function call(path: string, init: RequestInit = {}) {
  const { origin, headers } = settings();
  const response = await fetch(`${origin}${path}`, { ...init, headers: { ...headers, "Content-Type": "application/json", ...init.headers }, signal: AbortSignal.timeout(15_000), redirect: "error" });
  if (!response.ok) throw new SupabaseError();
  return response;
}
export function storagePath(path: string) { return `/storage/v1/object/${path}/${BUCKET}`; }
export async function rows(query = "") {
  return await (await call(`/rest/v1/tile_assets?select=*${query}`)).json() as TileAsset[];
}
export async function insertRow(row: unknown) {
  return await (await call("/rest/v1/tile_assets", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) })).json() as TileAsset[];
}
export async function deleteRow(id: string) {
  return await (await call(`/rest/v1/tile_assets?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=representation" } })).json() as TileAsset[];
}
export async function signUpload(path: string) {
  const value = await (await call(`${storagePath("upload/sign")}/${path}`, { method: "POST", headers: { "x-upsert": "false" }, body: "{}" })).json() as { url?: string };
  if (!value.url) throw new SupabaseError();
  return storageUrl(value.url);
}
function storageUrl(path: string) {
  const { origin } = settings();
  const url = new URL(path.startsWith("/storage/v1/") ? path : `/storage/v1${path}`, origin);
  if (url.origin !== origin) throw new SupabaseError();
  return url.toString();
}
export async function signRead(path: string) {
  const value = await (await call(`${storagePath("sign")}/${path}`, { method: "POST", body: JSON.stringify({ expiresIn: 3600 }) })).json() as { signedURL?: string };
  if (!value.signedURL) throw new SupabaseError();
  return storageUrl(value.signedURL);
}
export async function objectInfo(path: string) {
  return await (await call(`${storagePath("info")}/${path}`)).json() as { size?: number; content_type?: string; contentType?: string; metadata?: { size?: number; mimetype?: string } };
}
export async function imageHeader(path: string) {
  const response = await call(`/storage/v1/object/${BUCKET}/${path}`, { headers: { Range: "bytes=0-31" } });
  const reader = response.body?.getReader();
  if (!reader) throw new SupabaseError();
  const chunks: Uint8Array[] = [];
  let count = 0;
  try {
    while (count < 32) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = value.subarray(0, 32 - count);
      chunks.push(chunk); count += chunk.length;
    }
    return Buffer.concat(chunks);
  } finally { await reader.cancel(); }
}
export async function removeObject(path: string) {
  await call(`/storage/v1/object/${BUCKET}`, { method: "DELETE", body: JSON.stringify({ prefixes: [path] }) });
}
