import { RoundedBox, Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { FLOOR_CERAMICS } from "../../catalog/materials";
import type { MaterialProduct } from "../../catalog/types";
import { generateCeramicCanvas } from "../../textures/generateCeramicTexture";
import { useConfiguratorStore } from "../../state/useConfiguratorStore";

const PANEL_WIDTH = 0.62;
const ROW_HEIGHT = 0.13;
const ROW_GAP = 0.015;

function SwatchPreview({ product }: { product: MaterialProduct }) {
  const texture = useMemo(() => {
    const canvas = generateCeramicCanvas(product.proceduralStyle, product.tileWidth, product.tileHeight, 96);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [product]);

  return (
    <mesh position={[-PANEL_WIDTH / 2 + 0.08, 0, 0.012]}>
      <planeGeometry args={[0.09, 0.09]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

interface RowProps {
  product: MaterialProduct;
  active: boolean;
  onSelect: () => void;
}

function MaterialRow({ product, active, onSelect }: RowProps) {
  return (
    <group onClick={onSelect}>
      <RoundedBox
        args={[PANEL_WIDTH - 0.06, ROW_HEIGHT, 0.02]}
        radius={0.012}
        smoothness={2}
      >
        <meshStandardMaterial
          color={active ? "#3b82f6" : "#26282f"}
          emissive={active ? "#1d4ed8" : "#000000"}
          emissiveIntensity={active ? 0.35 : 0}
          roughness={0.6}
        />
      </RoundedBox>
      <SwatchPreview product={product} />
      <Text
        position={[-PANEL_WIDTH / 2 + 0.155, 0.02, 0.013]}
        fontSize={0.028}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
      >
        {product.name}
      </Text>
      <Text
        position={[-PANEL_WIDTH / 2 + 0.155, -0.028, 0.013]}
        fontSize={0.02}
        color={active ? "#dbe8ff" : "#9aa3b2"}
        anchorX="left"
        anchorY="middle"
      >
        {`${product.tileWidth} × ${product.tileHeight} cm`}
      </Text>
    </group>
  );
}

/**
 * In-world VR ceramic selector. Rendered as a child of `XROrigin` (see
 * VRLocomotion) so it tracks the player's teleport position and snap-turns
 * with them, but never chases their head-look the way a camera-attached
 * panel would. Row buttons are plain meshes with `onClick` — @react-three/xr
 * wires controller-ray and hand-pinch input through the same R3F pointer
 * event system as desktop clicks, so no VR-specific input code is needed
 * here.
 */
export function VRMaterialPanel() {
  const selectedFloorId = useConfiguratorStore((s) => s.selectedFloorId);
  const setSelectedFloorId = useConfiguratorStore((s) => s.setSelectedFloorId);

  const panelHeight = 0.09 + FLOOR_CERAMICS.length * (ROW_HEIGHT + ROW_GAP) + 0.02;

  return (
    <group position={[0, 1.25, -0.6]}>
      <RoundedBox args={[PANEL_WIDTH, panelHeight, 0.02]} radius={0.02} smoothness={2}>
        <meshStandardMaterial color="#14151a" roughness={0.8} />
      </RoundedBox>

      <Text
        position={[0, panelHeight / 2 - 0.05, 0.013]}
        fontSize={0.026}
        color="#9aa3b2"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
      >
        FLOOR CERAMIC
      </Text>

      {FLOOR_CERAMICS.map((product, i) => {
        const rowsTop = panelHeight / 2 - 0.12;
        const y = rowsTop - i * (ROW_HEIGHT + ROW_GAP);
        return (
          <group key={product.id} position={[0, y, 0.012]}>
            <MaterialRow
              product={product}
              active={product.id === selectedFloorId}
              onSelect={() => setSelectedFloorId(product.id)}
            />
          </group>
        );
      })}
    </group>
  );
}
