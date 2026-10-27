import { TiledWall } from './TiledWall';
import { RoomSide } from './RoomSide';
import { useRoom } from './useRoom';
import { useEffect, useMemo, type RefObject } from 'react';
import * as THREE from 'three';
import { FloorSurface } from './FloorSurface';
import { Door } from './Door';
import { Wall } from './Wall';
import { Window } from './Window';
import { WALL_THICKNESS } from './roomConfig';
import { useFloorDesignStore } from '../state/useFloorDesignStore';
import { mmToM } from '../utils/units';

export function Room({overheadRef}:{overheadRef?:RefObject<THREE.Group|null>}) {
  const room=useRoom(),a=useFloorDesignStore(s=>s.architecture);
  const wall=useMemo(()=>new THREE.MeshStandardMaterial({color:'#f0f0ee',roughness:.87}),[]);
  const ceiling=useMemo(()=>new THREE.MeshStandardMaterial({color:'#f8f8f6',roughness:.95}),[]);
  const trim=useMemo(()=>new THREE.MeshStandardMaterial({color:'#dededb',roughness:.55}),[]);
  useEffect(()=>()=>{wall.dispose();ceiling.dispose();trim.dispose();},[wall,ceiling,trim]);
  const {width:w,length:l,height:h}=room,hw=w/2,hl=l/2;
  const win={width:mmToM(a.window.widthMm),height:mmToM(a.window.heightMm),bottom:mmToM(a.window.sillMm),centerOffset:mmToM(a.window.offsetMm)};
  // Architectural details shrink/omit only when the shell is too small for the preset door.
  const door={width:Math.min(.9,w*.45),height:Math.min(2.1,h*.9)};
  const doorOffset=-hw+Math.min(.9,w/2);
  const hasDoor=w>.15&&h>.2;
  const inset=mmToM(a.ceiling.insetMm),drop=mmToM(a.ceiling.dropMm);
  const skirtingHeight=Math.min(.1,h*.05),skirtingDepth=Math.min(.01,w/20,l/20);
  return <group name="room-shell">
    <FloorSurface/>
    <group name="overhead" ref={overheadRef}>
      <mesh name="flat-ceiling" position={[0,h,0]} rotation={[Math.PI/2,0,0]} material={ceiling} receiveShadow><planeGeometry args={[w,l]}/></mesh>
      {a.ceiling.style==='gypsum'&&<group name="gypsum-ceiling" userData={{inset,drop}}>
        <group name="crown-trim">
          {[-1,1].map(sign=><mesh key={`crown-z${sign}`} position={[0,h-Math.min(.07,h*.02)/2,sign*(hl-Math.min(.03,l/20)/2)]} material={trim}><boxGeometry args={[w,Math.min(.07,h*.02),Math.min(.03,l/20)]}/></mesh>)}
          {[-1,1].map(sign=><mesh key={`crown-x${sign}`} position={[sign*(hw-Math.min(.03,w/20)/2),h-Math.min(.07,h*.02)/2,0]} material={trim}><boxGeometry args={[Math.min(.03,w/20),Math.min(.07,h*.02),l]}/></mesh>)}
        </group>
        {[[-hw+inset/2,0,inset,l],[hw-inset/2,0,inset,l],[0,-hl+inset/2,w-2*inset,inset],[0,hl-inset/2,w-2*inset,inset]].map(([x,z,width,length],i)=><mesh key={i} position={[x,h-drop/2,z]} material={ceiling} receiveShadow><boxGeometry args={[width,drop,length]}/></mesh>)}
        {[[-hw+inset,0,.025,l-2*inset],[hw-inset,0,.025,l-2*inset],[0,-hl+inset,w-2*inset,.025],[0,hl-inset,w-2*inset,.025]].map(([x,z,width,length],i)=><mesh key={i} position={[x,h-drop,z]} material={trim}><boxGeometry args={[width,Math.min(.02,drop/2),length]}/></mesh>)}
      </group>}
    </group>
    <RoomSide id="back">
      <Wall name="wall-back" length={w} height={h} thickness={WALL_THICKNESS} position={[0,0,-hl]} rotationY={0} material={wall}/>
      <TiledWall id="back"/>
      <mesh position={[0,skirtingHeight/2,-hl+skirtingDepth]} material={trim}><boxGeometry args={[w,skirtingHeight,skirtingDepth]}/></mesh>
    </RoomSide>
    <RoomSide id="front">
      <Wall name="wall-front" length={w} height={h} thickness={WALL_THICKNESS} position={[0,0,hl]} rotationY={0} material={wall} opening={hasDoor?{centerOffset:doorOffset,...door,bottom:0}:undefined}/>
      <TiledWall id="front"/>
      {hasDoor&&<Door position={[doorOffset,0,hl]} rotationY={0} width={door.width} height={door.height}/>}
      <mesh position={[0,skirtingHeight/2,hl-skirtingDepth]} material={trim}><boxGeometry args={[w,skirtingHeight,skirtingDepth]}/></mesh>
    </RoomSide>
    <RoomSide id="left">
      <Wall name="wall-left" length={l} height={h} thickness={WALL_THICKNESS} position={[-hw,0,0]} rotationY={Math.PI/2} material={wall}/>
      <TiledWall id="left"/>
      <mesh position={[-hw+skirtingDepth,skirtingHeight/2,0]} material={trim}><boxGeometry args={[skirtingDepth,skirtingHeight,l]}/></mesh>
    </RoomSide>
    <RoomSide id="right">
      <Wall name="wall-right" length={l} height={h} thickness={WALL_THICKNESS} position={[hw,0,0]} rotationY={Math.PI/2} material={wall} opening={a.window.enabled?win:undefined}/>
      <TiledWall id="right"/>
      {a.window.enabled&&<Window position={[hw,win.bottom,-win.centerOffset]} rotationY={Math.PI/2} width={win.width} height={win.height}/>}
      <mesh position={[hw-skirtingDepth,skirtingHeight/2,0]} material={trim}><boxGeometry args={[skirtingDepth,skirtingHeight,l]}/></mesh>
    </RoomSide>
  </group>;
}
