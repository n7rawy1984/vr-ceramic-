import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { getSkyGradientTexture } from "../textures/generateSkyGradient";
import { WALL_THICKNESS } from "./roomConfig";

interface WindowProps {
  /** World position of the opening's sill-center point. */
  position: [number, number, number];
  rotationY: number;
  width:number;
  height:number;
}

/** A window with a slim modern frame, mullions, glass, and a soft gradient
 * sky backdrop so the opening doesn't read as a black void with no exterior
 * scene. */
export function Window({ position, rotationY, width, height }: WindowProps) {
  const frameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2b2b2c", roughness: 0.5, metalness: 0.3 }),
    [],
  );
  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#bcd8ea",
        roughness: 0.04,
        metalness: 0,
        transmission: 0.9,
        transparent: true,
        opacity: 0.3,
        ior: 1.4,
      }),
    [],
  );
  const skyMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ map: getSkyGradientTexture() }),
    [],
  );

  useEffect(()=>()=>{frameMaterial.dispose();glassMaterial.dispose();skyMaterial.dispose();},[frameMaterial,glassMaterial,skyMaterial]);
  const frameWidth = Math.min(0.045,width/20,height/20);
  const frameDepth = WALL_THICKNESS + 0.02;

  return (
    <group name="room-window" userData={{width,height}} position={position} rotation={[0, rotationY, 0]}>
      {/* frame */}
      <mesh position={[-width / 2 - frameWidth / 2, height / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[frameWidth, height + frameWidth * 2, frameDepth]} />
      </mesh>
      <mesh position={[width / 2 + frameWidth / 2, height / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[frameWidth, height + frameWidth * 2, frameDepth]} />
      </mesh>
      <mesh position={[0, height + frameWidth / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[width + frameWidth * 2, frameWidth, frameDepth]} />
      </mesh>
      <mesh position={[0, -frameWidth / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[width + frameWidth * 2, frameWidth, frameDepth]} />
      </mesh>
      {/* center mullion */}
      <mesh position={[0, height / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[0.02, height, frameDepth * 0.8]} />
      </mesh>
      <mesh position={[0, height / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[width, 0.02, frameDepth * 0.8]} />
      </mesh>

      {/* glass */}
      <mesh name="window-glass" position={[0, height / 2, 0]} material={glassMaterial}>
        <planeGeometry args={[width, height]} />
      </mesh>

      {/* exterior sky backdrop, offset outward */}
      <mesh position={[0, height / 2, 0.6]} material={skyMaterial}>
        <planeGeometry args={[width * 3, height * 3]} />
      </mesh>
    </group>
  );
}
