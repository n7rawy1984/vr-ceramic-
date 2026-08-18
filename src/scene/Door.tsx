import { useMemo } from "react";
import * as THREE from "three";
import { DOOR, WALL_THICKNESS } from "./roomConfig";

interface DoorProps {
  /** World position of the opening's floor-center point. */
  position: [number, number, number];
  rotationY: number;
}

/** A closed modern flush door with a simple frame and handle, filling the wall opening. */
export function Door({ position, rotationY }: DoorProps) {
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
  const frameWidth = 0.06;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* frame sides */}
      <mesh position={[-DOOR.width / 2 - frameWidth / 2, DOOR.height / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[frameWidth, DOOR.height + frameWidth, frameDepth]} />
      </mesh>
      <mesh position={[DOOR.width / 2 + frameWidth / 2, DOOR.height / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[frameWidth, DOOR.height + frameWidth, frameDepth]} />
      </mesh>
      <mesh position={[0, DOOR.height + frameWidth / 2, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[DOOR.width + frameWidth * 2, frameWidth, frameDepth]} />
      </mesh>

      {/* door panel */}
      <mesh position={[0, DOOR.height / 2, 0]} material={panelMaterial} castShadow receiveShadow>
        <boxGeometry args={[DOOR.width - 0.03, DOOR.height - 0.03, 0.045]} />
      </mesh>

      {/* handle — modern horizontal bar lever */}
      <mesh
        position={[DOOR.width / 2 - 0.14, DOOR.height / 2, 0.03]}
        rotation={[0, 0, Math.PI / 2]}
        material={handleMaterial}
        castShadow
      >
        <cylinderGeometry args={[0.009, 0.009, 0.12, 8]} />
      </mesh>
      <mesh position={[DOOR.width / 2 - 0.2, DOOR.height / 2, 0.018]} material={handleMaterial} castShadow>
        <boxGeometry args={[0.02, 0.02, 0.024]} />
      </mesh>
    </group>
  );
}
