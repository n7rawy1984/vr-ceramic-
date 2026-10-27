import { roomSizeError, type RoomSizeMm } from './roomDimensions.ts';
export type RoomArchitecture = {
  heightMm: number;
  furnitureVisible: boolean;
  window: { enabled: boolean; widthMm: number; heightMm: number; sillMm: number; offsetMm: number };
  ceiling: { style: 'simple' | 'gypsum'; insetMm: number; dropMm: number };
};
export const DEFAULT_ARCHITECTURE: RoomArchitecture = {
  heightMm: 3000, furnitureVisible: false,
  window: { enabled: true, widthMm: 1800, heightMm: 1400, sillMm: 900, offsetMm: 0 },
  ceiling: { style: 'simple', insetMm: 550, dropMm: 100 },
};
/** Broad numerical/rendering guards, not a normal-room business range. */
export const MAX_ROOM_HEIGHT_MM = 50_000;
export function architectureErrors(size: RoomSizeMm, a: RoomArchitecture): string[] {
  const errors: string[] = [];
  const dimensionError = roomSizeError(size);
  if (dimensionError) errors.push(dimensionError);
  if (!Number.isFinite(a.heightMm) || a.heightMm < 1 || a.heightMm > MAX_ROOM_HEIGHT_MM) errors.push('Room height must be positive (technical range: 0.001–50 m).');
  const w = a.window;
  // Right wall only; offset is measured from its center along local horizontal X.
  if (w.enabled) {
    const margin = Math.min(50, size.lengthMm / 20, a.heightMm / 20);
    if (![w.widthMm,w.heightMm,w.sillMm,w.offsetMm].every(Number.isFinite) || w.widthMm < 1 || w.heightMm < 1 || w.sillMm < margin || w.sillMm+w.heightMm > a.heightMm-margin || Math.abs(w.offsetMm)+w.widthMm/2 > size.lengthMm/2-margin) errors.push('Window must fit inside the right wall with space around its frame. Check width, height, offset and sill.');
  }
  const c = a.ceiling;
  if (!['simple','gypsum'].includes(c.style)) errors.push('Choose a ceiling style.');
  if (c.style === 'gypsum' && (!Number.isFinite(c.insetMm) || c.insetMm < 1 || c.insetMm*2 >= Math.min(size.widthMm,size.lengthMm) || !Number.isFinite(c.dropMm) || c.dropMm < 1 || c.dropMm >= a.heightMm)) errors.push('Gypsum inset must leave an opening, and drop must be smaller than room height.');
  return errors;
}
export interface WallOpening { centerOffset: number; width: number; height: number; bottom: number }
/** Scene-meter boundary: disjoint boxes leave a real rectangular opening. */
export function wallSegments(length: number, height: number, opening?: WallOpening) {
  if (!opening) return [{w:length,h:height,x:0,y:height/2}];
  const left = opening.centerOffset-opening.width/2, right = opening.centerOffset+opening.width/2, top = opening.bottom+opening.height;
  return [
    {w:left+length/2,h:height,x:(left-length/2)/2,y:height/2},
    {w:length/2-right,h:height,x:(right+length/2)/2,y:height/2},
    {w:opening.width,h:height-top,x:opening.centerOffset,y:(height+top)/2},
    {w:opening.width,h:opening.bottom,x:opening.centerOffset,y:opening.bottom/2},
  ].filter(s=>s.w>1e-9&&s.h>1e-9);
}
