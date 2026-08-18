import * as THREE from "three";

export interface WallOpening {
  /** Offset from the wall's horizontal center, in meters. */
  centerOffset: number;
  width: number;
  height: number;
  /** Height from the floor where the opening starts. 0 = reaches the floor (door). */
  bottom: number;
}

interface WallProps {
  /** Horizontal span of the wall, in meters. */
  length: number;
  height: number;
  thickness: number;
  position: [number, number, number];
  rotationY: number;
  material: THREE.Material;
  opening?: WallOpening;
}

/**
 * A straight wall, optionally with a single rectangular opening (door or
 * window) built from a handful of box segments rather than CSG, keeping the
 * geometry cheap and draw-call count predictable for VR.
 */
export function Wall({ length, height, thickness, position, rotationY, material, opening }: WallProps) {
  if (!opening) {
    return (
      <mesh position={position} rotation={[0, rotationY, 0]} material={material} castShadow receiveShadow>
        <boxGeometry args={[length, height, thickness]} />
      </mesh>
    );
  }

  const openLeft = opening.centerOffset - opening.width / 2;
  const openRight = opening.centerOffset + opening.width / 2;
  const openTop = opening.bottom + opening.height;

  const segments: { w: number; h: number; x: number; y: number }[] = [];

  const leftW = openLeft - -length / 2;
  if (leftW > 0.01) segments.push({ w: leftW, h: height, x: -length / 2 + leftW / 2, y: height / 2 });

  const rightW = length / 2 - openRight;
  if (rightW > 0.01) segments.push({ w: rightW, h: height, x: length / 2 - rightW / 2, y: height / 2 });

  const topH = height - openTop;
  if (topH > 0.01) segments.push({ w: opening.width, h: topH, x: opening.centerOffset, y: openTop + topH / 2 });

  if (opening.bottom > 0.01) {
    segments.push({ w: opening.width, h: opening.bottom, x: opening.centerOffset, y: opening.bottom / 2 });
  }

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {segments.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0]} material={material} castShadow receiveShadow>
          <boxGeometry args={[s.w, s.h, thickness]} />
        </mesh>
      ))}
    </group>
  );
}
