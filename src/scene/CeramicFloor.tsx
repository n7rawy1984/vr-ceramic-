import { useTileProducts } from "../tiles/useTileProducts";
import { useRoom } from "./useRoom";
import { useEffect, useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { getProductById, FLOOR_CERAMICS } from "../catalog/materials";
import { useTiledCeramicMaterial } from "../materials/useTiledCeramicMaterial";
import { useConfiguratorStore } from "../state/useConfiguratorStore";


export function CeramicFloor() {
  const ROOM = useRoom();
  const loadingMaterial = useMemo(() => new MeshStandardMaterial({ color: "#c6c6c6", roughness: 0.9 }), []);
  useEffect(() => () => loadingMaterial.dispose(), [loadingMaterial]);
  const products = useTileProducts();
  const setFloorImageError = useConfiguratorStore((s) => s.setFloorImageError);
  const selectedFloorId = useConfiguratorStore((s) => s.selectedFloorId);
  const previousFloorId = useConfiguratorStore((s) => s.previousFloorId);
  const compareActive = useConfiguratorStore((s) => s.compareActive);

  // "Compare" swaps which product is rendered without touching the actual
  // selection, so turning it off always returns to exactly what was chosen.
  const displayFloorId = compareActive && previousFloorId ? previousFloorId : selectedFloorId;

  const product = useMemo(
    () => getProductById(displayFloorId, products) ?? FLOOR_CERAMICS[0],
    [displayFloorId, products],
  );

  const { material, error } = useTiledCeramicMaterial({
    product,
    surfaceWidth: ROOM.width,
    surfaceLength: ROOM.length,
  });

  useEffect(() => { setFloorImageError(error); }, [error, setFloorImageError]);

  return (
    <mesh
      name="floor"
      userData={{ productId: product.id }}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      material={material ?? loadingMaterial}
    >
      <planeGeometry args={[ROOM.width, ROOM.length]} />
    </mesh>
  );
}
