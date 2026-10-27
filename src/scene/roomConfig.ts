import type { RoomDesign } from "../catalog/types.ts";

/**
 * The default room preset. Runtime dimensions are canonical mm in the design store;
 * scene consumers subscribe through useRoom. Typed against `RoomDesign` (see
 * catalog/types.ts) so a future `ROOM_PRESETS: Record<string, RoomDesign>`
 * — Living Room, Bedroom, Bathroom, Kitchen — can be added by listing more
 * objects of this same shape, without changing any scene component. Only
 * one preset is wired up today by design.
 */
export const ROOM: RoomDesign = {
  id: "living-room-01",
  name: "Modern Living Room",
  width: 6, // meters, X axis
  length: 7, // meters, Z axis
  height: 3, // meters, Y axis
};

export const WALL_THICKNESS = 0.12;
export const DOOR = { width: 0.9, height: 2.1 };
export const WINDOW = { width: 1.8, height: 1.4, sillHeight: 0.9 };

/** Default spawn for the 6×7 preset only; VRLocomotion derives the live spawn
 * from useRoom. Where the VR player rig spawns — just inside the door, facing into the
 * room, clear of every piece of furniture. Shared by VRLocomotion and the
 * in-world VR UI so they never drift out of sync. */
export const VR_SPAWN: [number, number, number] = [0, 0, ROOM.length / 2 - 0.9];
