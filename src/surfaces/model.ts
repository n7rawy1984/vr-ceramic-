import { FLOOR_CERAMICS } from '../catalog/materials.ts';
import type { Orientation } from '../layout/model.ts';
export const WALL_IDS = ['front','back','left','right'] as const;
export type WallId = typeof WALL_IDS[number];
export type WallDesign = { enabled:boolean; tileAssetId:string; orientation:Orientation; jointWidthMm:number };
export type WallDesigns = Record<WallId,WallDesign>;
export function defaultWalls():WallDesigns {
  return Object.fromEntries(WALL_IDS.map(id=>[id,{enabled:false,tileAssetId:FLOOR_CERAMICS[0].id,orientation:0,jointWidthMm:3}])) as WallDesigns;
}
