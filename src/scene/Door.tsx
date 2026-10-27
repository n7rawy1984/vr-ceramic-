import { useMemo } from "react";
import * as THREE from "three";
import { WALL_THICKNESS } from "./roomConfig";

interface DoorProps {
  /** World position of the opening's floor-center point. */
  position: [number, number, number];
  rotationY: number;
  width:number;
  height:number;
}

/** A closed modern flush door with a simple frame and handle, filling the wall opening. */
export function Door({ position, rotationY, width, height }: DoorProps) {
  const panelMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#443426", roughness: 0.5, metalness: 0.04 }),
    [],
  );
  const frameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f4f2ee", roughness: 0.7 }),
    [],
  );
  const handleMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#242424", roughness: 0.32, metalness: 0.7 }),
    [],
  );

  const frameDepth = WALL_THICKNESS + 0.02;
  const frameWidth = Math.min(0.06,width/10,height/10);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* frame sides */}
      <mesh position={[-width / 2 - frameWidth / 2, height / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[frameWidth, height + frameWidth, frameDepth]} />
      </mesh>
      <mesh position={[width / 2 + frameWidth / 2, height / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[frameWidth, height + frameWidth, frameDepth]} />
      </mesh>
      <mesh position={[0, height + frameWidth / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[width + frameWidth * 2, frameWidth, frameDepth]} />
      </mesh>

      {/* door panel */}
      <mesh position={[0, height / 2, 0]} material={panelMaterial} castShadow receiveShadow>
        <boxGeometry args={[Math.max(.001,width - 0.03), Math.max(.001,height - 0.03), 0.045]} />
      </mesh>

      {/* handle — modern horizontal bar lever */}
      <mesh
        position={[width / 2 - 0.14, height / 2, 0.03]}
        rotation={[0, 0, Math.PI / 2]}
        material={handleMaterial}
        castShadow
      >
        <cylinderGeometry args={[0.009, 0.009, 0.12, 8]} />
      </mesh>
      <mesh position={[width / 2 - 0.2, height / 2, 0.018]} material={handleMaterial} castShadow>
        <boxGeometry args={[0.02, 0.02, 0.024]} />
      </mesh>
    </group>
  );
}
