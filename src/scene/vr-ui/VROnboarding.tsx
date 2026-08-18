import { RoundedBox, Text } from "@react-three/drei";
import { useConfiguratorStore } from "../../state/useConfiguratorStore";

const LINES = [
  "Look around naturally",
  "Point to select materials",
  "Use teleport to move",
  "Open Materials to change ceramic",
];

const PANEL_WIDTH = 0.72;
const PANEL_HEIGHT = 0.5;

/**
 * A short one-time welcome panel shown the first time a VR session starts.
 * "Seen" state lives in the shared store rather than local component state
 * so it survives if the player briefly exits and re-enters VR without a
 * full page reload — it should only ever appear once per visit.
 */
export function VROnboarding() {
  const seen = useConfiguratorStore((s) => s.vrOnboardingSeen);
  const markSeen = useConfiguratorStore((s) => s.markVrOnboardingSeen);

  if (seen) return null;

  return (
    <group position={[0, 1.5, -0.95]}>
      <RoundedBox args={[PANEL_WIDTH, PANEL_HEIGHT, 0.02]} radius={0.025} smoothness={2}>
        <meshStandardMaterial color="#14151a" roughness={0.8} />
      </RoundedBox>

      <Text position={[0, PANEL_HEIGHT / 2 - 0.07, 0.013]} fontSize={0.045} color="#ffffff" anchorX="center" anchorY="middle">
        Welcome
      </Text>

      {LINES.map((line, i) => (
        <Text
          key={line}
          position={[0, PANEL_HEIGHT / 2 - 0.17 - i * 0.06, 0.013]}
          fontSize={0.026}
          color="#c7cdda"
          anchorX="center"
          anchorY="middle"
        >
          {`•  ${line}`}
        </Text>
      ))}

      <group position={[0, -PANEL_HEIGHT / 2 + 0.08, 0]} onClick={() => markSeen()}>
        <RoundedBox args={[0.34, 0.09, 0.018]} radius={0.014} smoothness={2}>
          <meshStandardMaterial color="#3b82f6" roughness={0.5} />
        </RoundedBox>
        <Text position={[0, 0, 0.011]} fontSize={0.024} color="#ffffff" anchorX="center" anchorY="middle">
          Start Experience
        </Text>
      </group>
    </group>
  );
}
