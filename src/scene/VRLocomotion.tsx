import { useRoom } from "./useRoom";
import { TeleportTarget, XROrigin, useXRControllerLocomotion } from "@react-three/xr";
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { useConfiguratorStore } from "../state/useConfiguratorStore";

import { VRMaterialPanel } from "./vr-ui/VRMaterialPanel";
import { VROnboarding } from "./vr-ui/VROnboarding";
import { VRToolbar } from "./vr-ui/VRToolbar";

/**
 * Comfortable VR locomotion: parabolic-ray teleport (thumbstick / trigger,
 * provided by the controller's teleportPointer) across the floor, plus
 * snap-turning for rotation. Deliberately avoids smooth joystick movement,
 * which is a common source of VR motion sickness.
 */
export function VRLocomotion() {
  const ROOM = useRoom();
  const VR_SPAWN = useMemo<[number,number,number]>(()=>[0,0,ROOM.length/2-.9],[ROOM.length]);
  const originRef = useRef<Group>(null);
  const returnToStartToken = useConfiguratorStore((s) => s.vrReturnToStartToken);

  useXRControllerLocomotion(
    originRef,
    false, // no smooth joystick translation
    { type: "snap", degrees: 30, deadZone: 0.5 },
  );

  // "Return to Start" only ever translates the rig back to the spawn point —
  // it never touches head orientation, which stays under the headset's
  // own tracking at all times.
  useEffect(() => {
    if (returnToStartToken === 0) return;
    originRef.current?.position.set(...VR_SPAWN);
  }, [returnToStartToken, VR_SPAWN]);

  const vrPanelOpen = useConfiguratorStore((s) => s.vrPanelOpen);

  return (
    <>
      <XROrigin ref={originRef} position={VR_SPAWN}>
        <VRToolbar />
        <VROnboarding />
        {vrPanelOpen && <VRMaterialPanel />}
      </XROrigin>
      <TeleportTarget
        onTeleport={(point) => {
          originRef.current?.position.set(point.x, 0, point.z);
        }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <planeGeometry args={[ROOM.width, ROOM.length]} />
        </mesh>
      </TeleportTarget>
    </>
  );
}
