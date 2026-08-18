import { useMemo } from "react";
import { getProductById, FLOOR_CERAMICS } from "../catalog/materials";
import { useTiledCeramicMaterial } from "../materials/useTiledCeramicMaterial";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { ROOM } from "./roomConfig";

export function CeramicFloor() {
  const selectedFloorId = useConfiguratorStore((s) => s.selectedFloorId);
  const previousFloorId = useConfiguratorStore((s) => s.previousFloorId);
  const compareActive = useConfiguratorStore((s) => s.compareActive);

  // "Compare" swaps which product is rendered without touching the actual
  // selection, so turning it off always returns to exactly what was chosen.
  const displayFloorId = compareActive && previousFloorId ? previousFloorId : selectedFloorId;

  const product = useMemo(
    () => getProductById(displayFloorId) ?? FLOOR_CERAMICS[0],
    [displayFloorId],
  );

  const material = useTiledCeramicMaterial({
    product,
    surfaceWidth: ROOM.width,
    surfaceLength: ROOM.length,
  });

  if (!material) return null;

  return (
    <mesh
      name="floor"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      material={material}
    >
      <planeGeometry args={[ROOM.width, ROOM.length]} />
    </mesh>
  );
}
