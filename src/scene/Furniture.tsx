import { useRoom } from "./useRoom";
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { getAbstractArtTexture } from "../textures/generateAbstractArt";


const mat = (color: string, roughness = 0.7, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

/** A simple low-poly modern sofa against the back wall. */
function Sofa() {
  const ROOM = useRoom();
  const fabric = useMemo(() => mat("#a39684", 0.82), []);
  const wood = useMemo(() => mat("#3f2f22", 0.6), []);

  return (
    <group position={[-ROOM.width / 2 + 1.15, 0, -ROOM.length / 2 + 0.65]}>
      {/* seat base */}
      <RoundedBox args={[1.7, 0.36, 0.85]} radius={0.07} smoothness={3} position={[0, 0.2, 0]} material={fabric} castShadow receiveShadow />
      {/* backrest */}
      <RoundedBox args={[1.7, 0.6, 0.22]} radius={0.07} smoothness={3} position={[0, 0.55, -0.32]} material={fabric} castShadow />
      {/* armrests */}
      <RoundedBox args={[0.22, 0.42, 0.85]} radius={0.06} smoothness={3} position={[-0.74, 0.28, 0]} material={fabric} castShadow />
      <RoundedBox args={[0.22, 0.42, 0.85]} radius={0.06} smoothness={3} position={[0.74, 0.28, 0]} material={fabric} castShadow />
      {/* seat cushions — plusher, slightly domed via extra radius */}
      <RoundedBox args={[0.78, 0.17, 0.75]} radius={0.06} smoothness={3} position={[-0.42, 0.43, 0.02]} material={fabric} castShadow />
      <RoundedBox args={[0.78, 0.17, 0.75]} radius={0.06} smoothness={3} position={[0.42, 0.43, 0.02]} material={fabric} castShadow />
      {/* legs */}
      {[
        [-0.7, -0.3],
        [0.7, -0.3],
        [-0.7, 0.35],
        [0.7, 0.35],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.04, z]} material={wood} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.08, 8]} />
        </mesh>
      ))}
    </group>
  );
}

/** A small round coffee table. */
function CoffeeTable() {
  const ROOM = useRoom();
  const top = useMemo(() => mat("#c3a06a", 0.32), []);
  const leg = useMemo(() => mat("#2b2b2b", 0.5, 0.4), []);

  return (
    <group position={[-ROOM.width / 2 + 1.15, 0, -ROOM.length / 2 + 1.65]}>
      <mesh position={[0, 0.36, 0]} material={top} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.04, 24]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} material={leg} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.34, 12]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={leg} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 24]} />
      </mesh>
    </group>
  );
}

/** A minimal round side table beside the sofa. */
function SideTable() {
  const ROOM = useRoom();
  const top = useMemo(() => mat("#e9e5dd", 0.5), []);
  const leg = useMemo(() => mat("#2b2b2b", 0.5, 0.4), []);
  const decor = useMemo(() => mat("#c98a5b", 0.35), []);

  return (
    <group position={[-ROOM.width / 2 + 2.45, 0, -ROOM.length / 2 + 0.65]}>
      <mesh position={[0, 0.42, 0]} material={top} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 24]} />
      </mesh>
      <mesh position={[0, 0.21, 0]} material={leg} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 12]} />
      </mesh>
      <mesh position={[0, 0.01, 0]} material={leg} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.02, 24]} />
      </mesh>
      {/* small decorative vase */}
      <mesh position={[0, 0.48, 0]} material={decor} castShadow>
        <sphereGeometry args={[0.06, 12, 10]} />
      </mesh>
    </group>
  );
}

/** A floor lamp for warm ambient decor. */
function FloorLamp() {
  const ROOM = useRoom();
  const pole = useMemo(() => mat("#3a3a3a", 0.4, 0.6), []);
  const shade = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f2ead9", roughness: 0.6, emissive: "#ffffff", emissiveIntensity: 0.08 }),
    [],
  );

  return (
    <group position={[ROOM.width / 2 - 0.5, 0, -ROOM.length / 2 + 0.5]}>
      <mesh position={[0, 0.015, 0]} material={pole}>
        <cylinderGeometry args={[0.11, 0.13, 0.02, 20]} />
      </mesh>
      <mesh position={[0, 0.78, 0]} material={pole} castShadow>
        <cylinderGeometry args={[0.012, 0.016, 1.55, 8]} />
      </mesh>
      <mesh position={[0, 1.58, 0]} material={shade} castShadow>
        <coneGeometry args={[0.16, 0.26, 20, 1, true]} />
      </mesh>
      <pointLight position={[0, 1.52, 0]} intensity={0.12} distance={2} decay={2} color="#ffffff" />
    </group>
  );
}

/** A potted plant for greenery. */
function PottedPlant() {
  const ROOM = useRoom();
  const pot = useMemo(() => mat("#8a5c3b", 0.8), []);
  const foliage = useMemo(() => mat("#3c6b40", 0.9), []);

  return (
    <group position={[ROOM.width / 2 - 0.45, 0, ROOM.length / 2 - 0.5]}>
      <mesh position={[0, 0.18, 0]} material={pot} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.35, 16]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={foliage} castShadow>
        <sphereGeometry args={[0.26, 12, 10]} />
      </mesh>
      <mesh position={[0.12, 0.65, 0.08]} material={foliage} castShadow>
        <sphereGeometry args={[0.16, 10, 8]} />
      </mesh>
    </group>
  );
}

/** A framed abstract wall art piece above the sofa. */
function WallArt() {
  const ROOM = useRoom();
  const frame = useMemo(() => mat("#2b2b2b", 0.5), []);
  const canvas = useMemo(
    () => new THREE.MeshStandardMaterial({ map: getAbstractArtTexture(), roughness: 0.85 }),
    [],
  );

  return (
    <group position={[-ROOM.width / 2 + 1.15, 1.7, -ROOM.length / 2 + 0.08]}>
      <mesh material={frame} castShadow>
        <boxGeometry args={[0.9, 0.6, 0.03]} />
      </mesh>
      <mesh position={[0, 0, 0.02]} material={canvas}>
        <planeGeometry args={[0.8, 0.5]} />
      </mesh>
    </group>
  );
}

export function Furniture({ visible = true }: { visible?: boolean }) {
  return (
    <group name="furniture" visible={visible}>
      <Sofa />
      <CoffeeTable />
      <SideTable />
      <FloorLamp />
      <PottedPlant />
      <WallArt />
    </group>
  );
}
