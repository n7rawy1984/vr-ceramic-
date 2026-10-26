import { useMemo, type RefObject } from "react";
import * as THREE from "three";
import { CeramicFloor } from "./CeramicFloor";
import { Door } from "./Door";
import { Wall } from "./Wall";
import { Window } from "./Window";
import { DOOR, ROOM, WALL_THICKNESS, WINDOW } from "./roomConfig";

/**
 * The room shell: floor (reusable ceramic system), four walls with a door
 * and window opening, and a ceiling. Wall geometry is a handful of reused
 * box segments — cheap to draw and easy to swap for a different RoomDesign
 * later.
 */
export function Room({ overheadRef }: { overheadRef?: RefObject<THREE.Group | null> }) {
  const wallMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f0f0ee", roughness: 0.87 }),
    [],
  );
  const ceilingMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f8f8f6", roughness: 0.95 }),
    [],
  );
  // Shared trim material — used for skirting, crown, and the ceiling reveal
  // so the room only carries one extra "architectural detail" material.
  const trimMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#dededb", roughness: 0.55 }),
    [],
  );

  const halfW = ROOM.width / 2;
  const halfL = ROOM.length / 2;
  const ceilingInsetMargin = 0.55;
  const ceilingPanelY = ROOM.height - 0.025;

  return (
    <group>
      <CeramicFloor />

      <group name="overhead" ref={overheadRef}>
        {/* Ceiling */}
        <mesh position={[0, ROOM.height, 0]} rotation={[Math.PI / 2, 0, 0]} material={ceilingMaterial} receiveShadow>
          <planeGeometry args={[ROOM.width, ROOM.length]} />
        </mesh>

        {/* Recessed ceiling panel — a subtle architectural coffer instead of a
            flat slab, cheap to draw (one extra plane + a thin frame outline). */}
        <mesh
          position={[0, ceilingPanelY, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={ceilingMaterial}
        >
          <planeGeometry args={[ROOM.width - ceilingInsetMargin * 2, ROOM.length - ceilingInsetMargin * 2]} />
        </mesh>
        {[
          { w: ROOM.width - ceilingInsetMargin * 2 + 0.04, d: 0.04, x: 0, z: -halfL + ceilingInsetMargin },
          { w: ROOM.width - ceilingInsetMargin * 2 + 0.04, d: 0.04, x: 0, z: halfL - ceilingInsetMargin },
        ].map((s, i) => (
          <mesh key={`cf-z-${i}`} position={[s.x, ceilingPanelY, s.z]} material={trimMaterial}>
            <boxGeometry args={[s.w, 0.02, s.d]} />
          </mesh>
        ))}
        {[
          { d: ROOM.length - ceilingInsetMargin * 2 + 0.04, w: 0.04, x: -halfW + ceilingInsetMargin, z: 0 },
          { d: ROOM.length - ceilingInsetMargin * 2 + 0.04, w: 0.04, x: halfW - ceilingInsetMargin, z: 0 },
        ].map((s, i) => (
          <mesh key={`cf-x-${i}`} position={[s.x, ceilingPanelY, s.z]} material={trimMaterial}>
            <boxGeometry args={[s.w, 0.02, s.d]} />
          </mesh>
        ))}

        {/* Crown trim along the wall/ceiling junction. */}
        <mesh position={[0, ROOM.height - 0.05, -halfL + WALL_THICKNESS / 2 + 0.005]} material={trimMaterial}>
          <boxGeometry args={[ROOM.width - 0.02, 0.07, 0.03]} />
        </mesh>
        <mesh position={[0, ROOM.height - 0.05, halfL - WALL_THICKNESS / 2 - 0.005]} material={trimMaterial}>
          <boxGeometry args={[ROOM.width - 0.02, 0.07, 0.03]} />
        </mesh>
        <mesh
          position={[-halfW + WALL_THICKNESS / 2 + 0.005, ROOM.height - 0.05, 0]}
          rotation={[0, Math.PI / 2, 0]}
          material={trimMaterial}
        >
          <boxGeometry args={[ROOM.length - 0.02, 0.07, 0.03]} />
        </mesh>
        <mesh
          position={[halfW - WALL_THICKNESS / 2 - 0.005, ROOM.height - 0.05, 0]}
          rotation={[0, Math.PI / 2, 0]}
          material={trimMaterial}
        >
          <boxGeometry args={[ROOM.length - 0.02, 0.07, 0.03]} />
        </mesh>

      </group>

      {/* Back wall (-Z) */}
      <Wall
        length={ROOM.width}
        height={ROOM.height}
        thickness={WALL_THICKNESS}
        position={[0, 0, -halfL]}
        rotationY={0}
        material={wallMaterial}
      />

      {/* Front wall (+Z) with door */}
      <Wall
        length={ROOM.width}
        height={ROOM.height}
        thickness={WALL_THICKNESS}
        position={[0, 0, halfL]}
        rotationY={0}
        material={wallMaterial}
        opening={{ centerOffset: -halfW + 0.9, width: DOOR.width, height: DOOR.height, bottom: 0 }}
      />
      <Door position={[-halfW + 0.9, 0, halfL]} rotationY={0} />

      {/* Left wall (-X) */}
      <Wall
        length={ROOM.length}
        height={ROOM.height}
        thickness={WALL_THICKNESS}
        position={[-halfW, 0, 0]}
        rotationY={Math.PI / 2}
        material={wallMaterial}
      />

      {/* Right wall (+X) with window */}
      <Wall
        length={ROOM.length}
        height={ROOM.height}
        thickness={WALL_THICKNESS}
        position={[halfW, 0, 0]}
        rotationY={Math.PI / 2}
        material={wallMaterial}
        opening={{ centerOffset: 0, width: WINDOW.width, height: WINDOW.height, bottom: WINDOW.sillHeight }}
      />
      <Window position={[halfW, WINDOW.sillHeight, 0]} rotationY={Math.PI / 2} />

      {/* Skirting boards for a finished look */}
      <mesh position={[0, 0.05, -halfL + WALL_THICKNESS / 2 + 0.005]} material={trimMaterial}>
        <boxGeometry args={[ROOM.width - 0.02, 0.1, 0.01]} />
      </mesh>
      <mesh position={[0, 0.05, halfL - WALL_THICKNESS / 2 - 0.005]} material={trimMaterial}>
        <boxGeometry args={[ROOM.width - 0.02, 0.1, 0.01]} />
      </mesh>
      <mesh
        position={[-halfW + WALL_THICKNESS / 2 + 0.005, 0.05, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={trimMaterial}
      >
        <boxGeometry args={[ROOM.length - 0.02, 0.1, 0.01]} />
      </mesh>
      <mesh
        position={[halfW - WALL_THICKNESS / 2 - 0.005, 0.05, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={trimMaterial}
      >
        <boxGeometry args={[ROOM.length - 0.02, 0.1, 0.01]} />
      </mesh>
    </group>
  );
}
