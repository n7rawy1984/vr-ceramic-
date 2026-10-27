import { createSideCutaway } from './sideCutaway';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { WallId } from '../surfaces/model';
import { useRoom } from './useRoom';
import { wallBlocksInterior } from './cutaway';

export function RoomSide({id,children}:{id:WallId;children:ReactNode}){
  const group=useRef<THREE.Group>(null),hidden=useRef(false),direction=useMemo(()=>new THREE.Vector3(),[]),target=useMemo(()=>new THREE.Vector3(),[]);
  const controller=useMemo(createSideCutaway,[]),room=useRoom();
  const inXR=useXR(s=>s.session!=null),gl=useThree(s=>s.gl);
  useLayoutEffect(()=>{if(inXR&&group.current){hidden.current=false;controller.update(group.current,false);}},[inXR,controller]);
  useLayoutEffect(()=>()=>controller.dispose(),[controller]);
  useFrame(({camera,controls})=>{
    if(!group.current)return;
    if(inXR||gl.xr.isPresenting||camera===gl.xr.getCamera()){hidden.current=false;controller.update(group.current,false);return;}
    const orbit=controls as unknown as {target?:THREE.Vector3}|null;
    if(orbit?.target)target.copy(orbit.target);
    else target.copy(camera.position).add(camera.getWorldDirection(direction).multiplyScalar(Math.max(room.width,room.length)*4));
    hidden.current=wallBlocksInterior(id,camera.position,target,room,hidden.current);
    controller.update(group.current,hidden.current);
  });
  return <group name={`room-side-${id}`} ref={group}>{children}</group>;
}
