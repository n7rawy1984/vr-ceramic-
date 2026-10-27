import type { WallId } from '../surfaces/model.ts';
type Point = { x:number; y:number; z:number };
type Room = { width:number; length:number; height:number };
/** Scene-meter visibility test only. The ray toward the view target must cross the actual wall span. */
export function wallBlocksInterior(id:WallId, camera:Point, target:Point, room:Room, hidden=false):boolean {
  const xSide=id==='left'||id==='right';
  const sign=id==='right'||id==='front'?1:-1;
  const half=(xSide?room.width:room.length)/2;
  const position=xSide?camera.x:camera.z;
  const end=xSide?target.x:target.z;
  const tolerance=Math.min(.06,room.width*.02,room.length*.02,room.height*.02);
  // Enter outside +tolerance, restore inside -tolerance. Keep a hidden shell cut while crossing it.
  if(sign*position-half <= (hidden?-tolerance:tolerance))return false;
  const delta=end-position;
  if(sign*delta>=-1e-9)return false;
  const t=(sign*half-position)/delta;
  const slack=hidden?tolerance:0;
  // Free look uses a target only 0.1 m away. Continue its ray beyond that target.
  // The distance gate already bounds negative hits while crossing the shell;
  // do not scale hysteresis by the (possibly 0.1 m) target distance.
  const across=xSide?camera.z+(target.z-camera.z)*t:camera.x+(target.x-camera.x)*t;
  const y=camera.y+(target.y-camera.y)*t;
  return Math.abs(across)<=(xSide?room.length:room.width)/2+slack && y>=-slack && y<=room.height+slack;
}
