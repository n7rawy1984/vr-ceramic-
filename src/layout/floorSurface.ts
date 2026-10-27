import { ROOM } from "../scene/roomConfig.ts";
import { mToMm } from "../utils/units.ts";
import type { Surface } from "./model.ts";
export const FLOOR_SURFACE: Surface = { id: `${ROOM.id}/floor`, widthMm: mToMm(ROOM.width), heightMm: mToMm(ROOM.length) };
