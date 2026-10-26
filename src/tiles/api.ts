import type { TileAssetView } from "../../shared/tileAsset";
export class ApiError extends Error {
  status: number;
  cleanupReceipt?: string;
  constructor(message: string, status: number, cleanupReceipt?: string) {
    super(message); this.status = status; this.cleanupReceipt = cleanupReceipt;
  }
}
export async function api<T>(path: string, method = "GET", data?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      method, credentials: "same-origin", headers: data === undefined ? {} : { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(30_000),
    });
  } catch { throw new ApiError("Could not reach the tile service. Check your connection and retry.", 0); }
  let value;
  try { value = await response.json(); }
  catch { throw new ApiError("Tile API is unavailable. For local development, start npm run dev:api as well as Vite.", response.status); }
  if (!response.ok) throw new ApiError(value.error || "The request failed. Please retry.", response.status, value.cleanupReceipt);
  return value;
}
export type SavedTileResponse = { tile: TileAssetView };
