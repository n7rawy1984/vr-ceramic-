import type { Surface } from "./model.ts";
/** Canonical room geometry; scene meters are derived only at the boundary. */
export type RoomSizeMm = { widthMm: number; lengthMm: number };
export const DEFAULT_ROOM_SIZE: RoomSizeMm = {widthMm:6000,lengthMm:7000};
export const MIN_ROOM_MM = 4000;
export const MAX_ROOM_MM = 12000;
export function roomSizeError(size: RoomSizeMm): string | null {
  return [size.widthMm,size.lengthMm].every(n=>Number.isFinite(n)&&n>=MIN_ROOM_MM&&n<=MAX_ROOM_MM)
    ? null : "Room width and length must each be between 4 and 12 m.";
}
export function roomSurface(size: RoomSizeMm, id = "living-room-01/floor"): Surface {
  return {id,widthMm:size.widthMm,heightMm:size.lengthMm};
}
