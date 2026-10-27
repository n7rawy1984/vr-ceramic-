import type * as THREE from 'three';
import { wallSegments, type WallOpening } from '../layout/roomArchitecture';
export type { WallOpening } from '../layout/roomArchitecture';
interface WallProps { name?:string; length:number; height:number; thickness:number; position:[number,number,number]; rotationY:number; material:THREE.Material; opening?:WallOpening }
/** Disjoint boxes leave a genuine opening. Dimensions are scene meters. */
export function Wall({name,length,height,thickness,position,rotationY,material,opening}:WallProps) {
  return <group name={name} position={position} rotation={[0,rotationY,0]} userData={{length,height,opening}}>
    {wallSegments(length,height,opening).map((s,i)=><mesh key={i} position={[s.x,s.y,0]} material={material} castShadow receiveShadow><boxGeometry args={[s.w,s.h,thickness]}/></mesh>)}
  </group>;
}
