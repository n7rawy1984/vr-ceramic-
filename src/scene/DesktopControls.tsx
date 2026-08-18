import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { ROOM } from "./roomConfig";

const EYE_HEIGHT = 1.6;
const MOVE_SPEED = 2.2; // meters / second
const MARGIN = 0.35; // keep the camera this far from the walls
const LOOK_RADIUS = 0.1; // fixed camera-to-target distance while walking, used to turn OrbitControls into a look-around
const TWEEN_DURATION = 0.8; // seconds, used by both Reset Camera and View Floor

// Hero composition for the very first frame: a centered, elevated vantage
// near the door with a confident downward tilt, so a large expanse of
// ceramic floor fills the lower half of frame while the sofa, window
// daylight, and ceiling stay visible but don't dominate the shot.
const INITIAL_POSITION = new THREE.Vector3(0.2, 1.5, 1.65);
const INITIAL_LOOK_POINT = new THREE.Vector3(0.1, -0.15, -1.4);
const INITIAL_DIRECTION = INITIAL_LOOK_POINT.clone().sub(INITIAL_POSITION).normalize();
const INITIAL_TARGET = INITIAL_POSITION.clone().addScaledVector(INITIAL_DIRECTION, LOOK_RADIUS);

// An architect's-eye inspection pose — standing height, angled down at the
// floor. Framed on the open entry area rather than toward the furniture
// cluster or the window wall: at a wide FOV, even a camera positioned far
// from the sofa still catches it at the frame's edge once aimed toward it,
// and standing close to the window wall makes its glass render oddly at a
// grazing angle. Centered and pulled back avoids both.
const FLOOR_VIEW_POSITION = new THREE.Vector3(0, 1.55, 2.2);
const FLOOR_VIEW_TARGET = new THREE.Vector3(0, 0, 0.4);
const FLOOR_VIEW_RADIUS = FLOOR_VIEW_POSITION.distanceTo(FLOOR_VIEW_TARGET);

// Reused every frame instead of allocated — DesktopControls only ever runs
// one instance at a time, so module-level scratch vectors are safe and
// avoid per-frame garbage on what's otherwise a very hot path.
const scratchForward = new THREE.Vector3();
const scratchRight = new THREE.Vector3();
const scratchMove = new THREE.Vector3();

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface CameraTween {
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toPosition: THREE.Vector3;
  toTarget: THREE.Vector3;
  startTime: number;
}

/**
 * Desktop navigation: click-drag to look around (OrbitControls constrained
 * to a fixed tiny radius so it behaves like first-person mouse-look), WASD /
 * arrow keys to walk, mouse wheel to zoom the lens, a "Reset Camera" trigger,
 * and a "View Floor" toggle that smoothly flies to a floor-inspection pose
 * and back to wherever the camera was before.
 *
 * OrbitControls enforces `minDistance`/`maxDistance` on *every* `update()`
 * call by recomputing the camera position from the target at a clamped
 * radius — so those two properties must track whatever distance the current
 * pose actually needs (a tiny 0.1m for the walk-around illusion, a real few
 * meters for the floor-inspection pose) or the far pose gets silently
 * snapped back to just outside the target the instant `update()` runs next.
 */
export function DesktopControls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const keys = useRef<Record<string, boolean>>({});
  const resetToken = useConfiguratorStore((s) => s.cameraResetToken);
  const floorViewActive = useConfiguratorStore((s) => s.floorViewActive);

  const tweenRef = useRef<CameraTween | null>(null);
  const preFloorViewPoseRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  const startTween = (toPosition: THREE.Vector3, toTarget: THREE.Vector3) => {
    const controls = controlsRef.current;
    if (!controls) return;
    tweenRef.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition: toPosition.clone(),
      toTarget: toTarget.clone(),
      startTime: performance.now(),
    };
  };

  // Reset Camera always wins: snap the floor-view flag off (imperative,
  // non-reactive read/write so this effect only runs on an actual reset
  // click) and fly back to the room's starting pose.
  useEffect(() => {
    if (resetToken === 0) return;
    if (useConfiguratorStore.getState().floorViewActive) {
      useConfiguratorStore.setState({ floorViewActive: false });
    }
    preFloorViewPoseRef.current = null;
    startTween(INITIAL_POSITION, INITIAL_TARGET);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 60;
      camera.updateProjectionMatrix();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  // Set the initial pose once on mount, no tween.
  useEffect(() => {
    camera.position.copy(INITIAL_POSITION);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(INITIAL_TARGET);
      controls.minDistance = LOOK_RADIUS;
      controls.maxDistance = LOOK_RADIUS;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "View Floor" toggle: fly to the inspection pose, or back to wherever the
  // camera was beforehand.
  useEffect(() => {
    if (floorViewActive) {
      preFloorViewPoseRef.current = {
        position: camera.position.clone(),
        target: controlsRef.current?.target.clone() ?? INITIAL_TARGET.clone(),
      };
      startTween(FLOOR_VIEW_POSITION, FLOOR_VIEW_TARGET);
    } else if (preFloorViewPoseRef.current) {
      startTween(preFloorViewPoseRef.current.position, preFloorViewPoseRef.current.target);
      preFloorViewPoseRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorViewActive]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!(camera instanceof THREE.PerspectiveCamera)) return;
      camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.02, 35, 75);
      camera.updateProjectionMatrix();
    };
    const el = gl.domElement;
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, [camera, gl]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const tween = tweenRef.current;
    if (tween) {
      const elapsed = (performance.now() - tween.startTime) / 1000;
      const t = easeInOutCubic(Math.min(1, elapsed / TWEEN_DURATION));
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, t);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, t);

      // Keep OrbitControls' radius clamp glued to the actual, currently
      // interpolated distance so it never fights the animation.
      const liveDistance = camera.position.distanceTo(controls.target);
      controls.minDistance = liveDistance;
      controls.maxDistance = liveDistance;

      if (t >= 1) {
        tweenRef.current = null;
        const restRadius = floorViewActive ? FLOOR_VIEW_RADIUS : LOOK_RADIUS;
        controls.minDistance = restRadius;
        controls.maxDistance = restRadius;
      }
      controls.update();
      return;
    }

    // Walking is disabled while in the floor-inspection pose — it's a fixed
    // (though still orbit-able) vantage point, not a place to wander from.
    if (!floorViewActive) {
      camera.getWorldDirection(scratchForward);
      scratchForward.y = 0;
      scratchForward.normalize();
      scratchRight.crossVectors(scratchForward, camera.up).normalize();

      scratchMove.set(0, 0, 0);
      if (keys.current["KeyW"] || keys.current["ArrowUp"]) scratchMove.add(scratchForward);
      if (keys.current["KeyS"] || keys.current["ArrowDown"]) scratchMove.sub(scratchForward);
      if (keys.current["KeyD"] || keys.current["ArrowRight"]) scratchMove.add(scratchRight);
      if (keys.current["KeyA"] || keys.current["ArrowLeft"]) scratchMove.sub(scratchRight);

      if (scratchMove.lengthSq() > 0) {
        scratchMove.normalize().multiplyScalar(MOVE_SPEED * delta);
        camera.position.add(scratchMove);
        controls.target.add(scratchMove);
      }

      const halfW = ROOM.width / 2 - MARGIN;
      const halfL = ROOM.length / 2 - MARGIN;
      const clampedX = THREE.MathUtils.clamp(camera.position.x, -halfW, halfW);
      const clampedZ = THREE.MathUtils.clamp(camera.position.z, -halfL, halfL);
      const dx = clampedX - camera.position.x;
      const dz = clampedZ - camera.position.z;
      if (dx !== 0 || dz !== 0) {
        camera.position.x = clampedX;
        camera.position.z = clampedZ;
        controls.target.x += dx;
        controls.target.z += dz;
      }
      camera.position.y = EYE_HEIGHT;
      controls.target.y = EYE_HEIGHT;
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={false}
      minPolarAngle={Math.PI / 2 - 1.2}
      maxPolarAngle={Math.PI / 2 + 1.2}
      rotateSpeed={0.6}
    />
  );
}
