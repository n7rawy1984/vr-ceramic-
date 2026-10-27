import type { LayoutPattern } from './model.ts';
/** Effective horizontal pitch is supplied after the physical body is oriented. */
export function fieldRowOffset(pattern: LayoutPattern, row: number, pitchMm: number): number {
  if(pattern==='running-bond-50')return (row%2)*pitchMm/2;
  if(pattern==='running-bond-33')return (row%3)*pitchMm/3;
  return 0;
}
/** Grid identity determines the asset, including pieces clipped around exclusions. */
export function checkerAssetId(row: number, col: number, a: string, b: string): string {
  return (row+col)%2===0?a:b;
}
