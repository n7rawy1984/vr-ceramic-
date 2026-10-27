import type { Surface } from "./model.ts";
/** Canonical room geometry; scene meters are derived only at the boundary. */
export type RoomSizeMm = { widthMm: number; lengthMm: number };
export const DEFAULT_ROOM_SIZE: RoomSizeMm = {widthMm:6000,lengthMm:7000};
export const MIN_ROOM_MM = 1;
export const MAX_ROOM_MM = 100_000;
export function roomSizeError(size: RoomSizeMm): string | null {
  return [size.widthMm,size.lengthMm].every(n=>Number.isFinite(n)&&n>=MIN_ROOM_MM&&n<=MAX_ROOM_MM)
    ? null : "Room width and length must be positive (technical range: 0.001–100 m).";
}
export function roomSurface(size: RoomSizeMm, id = "living-room-01/floor"): Surface {
  return {id,widthMm:size.widthMm,heightMm:size.lengthMm};
}
