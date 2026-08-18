import { RoundedBox, Text } from "@react-three/drei";
import { useConfiguratorStore } from "../../state/useConfiguratorStore";

const BUTTON_WIDTH = 0.22;
const BUTTON_HEIGHT = 0.09;

function ToolbarButton({
  label,
  position,
  active,
  onSelect,
}: {
  label: string;
  position: [number, number, number];
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <group position={position} onClick={onSelect}>
      <RoundedBox args={[BUTTON_WIDTH, BUTTON_HEIGHT, 0.018]} radius={0.014} smoothness={2}>
        <meshStandardMaterial
          color={active ? "#3b82f6" : "#1c1e24"}
          emissive={active ? "#1d4ed8" : "#000000"}
          emissiveIntensity={active ? 0.3 : 0}
          roughness={0.55}
        />
      </RoundedBox>
      <Text position={[0, 0, 0.011]} fontSize={0.022} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

/**
 * Two always-visible, comfortably large buttons — parented to `XROrigin`
 * (see VRLocomotion) at the player's side rather than dead center, so they
 * don't block the room view but stay in easy reach of a controller ray.
 */
export function VRToolbar() {
  const vrPanelOpen = useConfiguratorStore((s) => s.vrPanelOpen);
  const toggleVrPanel = useConfiguratorStore((s) => s.toggleVrPanel);
  const triggerVrReturnToStart = useConfiguratorStore((s) => s.triggerVrReturnToStart);

  return (
    <group position={[0.45, 1.1, -0.5]} rotation={[0, -0.35, 0]}>
      <ToolbarButton
        label={vrPanelOpen ? "Close Materials" : "Materials"}
        position={[0, 0.06, 0]}
        active={vrPanelOpen}
        onSelect={() => toggleVrPanel()}
      />
      <ToolbarButton
        label="Return to Start"
        position={[0, -0.06, 0]}
        onSelect={() => triggerVrReturnToStart()}
      />
    </group>
  );
}
