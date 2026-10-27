import { presetPose, type Pose } from "./cameraPresets";
import { useRoom } from "./useRoom";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { useFloorDesignStore } from "../state/useFloorDesignStore";


const MOVE_SPEED = 2.2;
const MARGIN = 0.35;
const LOOK_RADIUS = 0.1; // Free look only. Presets always retain their real radius.
const TWEEN_DURATION = 0.8;
const scratchForward = new THREE.Vector3();
const scratchRight = new THREE.Vector3();
const scratchMove = new THREE.Vector3();

type Tween = { from: Pose; to: Pose; start: number };

/** Small command-driven camera: presets rest untouched, transitions own their
 * live radius, and only deliberate room navigation enters free look/walk. */
export function DesktopControls() {
  const ROOM = useRoom();
  const { camera, gl, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const keys = useRef<Record<string, boolean>>({});
  const tween = useRef<Tween | null>(null);
  const savedRoom = useRef<{ pose: Pose; view: "room" | "free" } | null>(null);
  const activeView = useRef(useConfiguratorStore.getState().cameraView);
  const initialized = useRef(false);
  const lastRequest = useRef(-1);
  const lastRoomSize = useRef("");
  const requestToken = useConfiguratorStore((s) => s.cameraRequestToken);
  const cameraView = useConfiguratorStore((s) => s.cameraView);

  const readPose = (): Pose => ({
    position: camera.position.clone(),
    target: controlsRef.current!.target.clone(),
    fov: (camera as THREE.PerspectiveCamera).fov,
  });

  useLayoutEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !(camera instanceof THREE.PerspectiveCamera)) return;
    const state = useConfiguratorStore.getState();
    const roomKey = `${ROOM.width}/${ROOM.length}/${ROOM.height}`;
    const resized=lastRoomSize.current!==roomKey;
    if (initialized.current && !resized && lastRequest.current === requestToken && state.cameraView !== "top") return;
    lastRoomSize.current=roomKey;
    if(resized) savedRoom.current=null;
    lastRequest.current = requestToken;
    camera.near=Math.max(.00001,Math.min(.05,ROOM.width/100,ROOM.length/100,ROOM.height/100));
    camera.far=Math.max(100,ROOM.width*5,ROOM.length*5,ROOM.height*4);
    camera.updateProjectionMatrix();
    let destination = presetPose(state.cameraView, size.width / size.height, ROOM);
    if (!resized && state.cameraRequestKind === "return" && savedRoom.current) {
      destination = savedRoom.current.pose;
      activeView.current = savedRoom.current.view;
    } else {
      if (["floor", "top", "detail"].includes(state.cameraView) &&
          ["room", "free"].includes(activeView.current) && initialized.current && !resized) {
        const view = activeView.current as "room" | "free";
        savedRoom.current = { pose: readPose(), view };
        useConfiguratorStore.setState({ lastRoomView: view });
      }
      activeView.current = state.cameraView;
      if (state.cameraView === "room") savedRoom.current = null;
    }
    // A transition can pass through any elevation. Polar limits are relaxed
    // while interpolating so OrbitControls cannot clamp the intended pose.
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    if (!initialized.current) {
      camera.position.copy(destination.position);
      controls.target.copy(destination.target);
      camera.fov = destination.fov;
      camera.updateProjectionMatrix();
      const radius = camera.position.distanceTo(controls.target);
      controls.minDistance = controls.maxDistance = radius;
      controls.update();
      initialized.current = true;
    } else {
      tween.current = { from: readPose(), to: destination, start: performance.now() };
    }
    // Commands, not mode changes from free navigation, start camera motion.
    // Resize reframes Top to keep the full floor visible at either aspect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestToken, camera, size.width, size.height, ROOM.width, ROOM.length, ROOM.height]);

  const enterFree = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    camera.getWorldDirection(scratchForward);
    controls.target.copy(camera.position).addScaledVector(scratchForward, LOOK_RADIUS);
    controls.minDistance = controls.maxDistance = LOOK_RADIUS;
    activeView.current = "free";
    useConfiguratorStore.setState({ cameraView: "free", lastRoomView: "free" });
  };

  useEffect(() => {
    const movementKeys = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
    const down = (e: KeyboardEvent) => {
      if (useFloorDesignStore.getState().presentation === "layout") return;
      const target = e.target as HTMLElement;
      if (target?.closest("dialog[open]") || target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName)) return;
      if (!movementKeys.has(e.code)) return;
      e.preventDefault();
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    const clear = () => { keys.current = {}; };
    const wheel = (e: WheelEvent) => {
      if (useFloorDesignStore.getState().presentation === "layout" || tween.current || activeView.current === "top" || !(camera instanceof THREE.PerspectiveCamera)) return;
      camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.02, 35, 75);
      camera.updateProjectionMatrix();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    gl.domElement.addEventListener("wheel", wheel, { passive: true });
    return () => {
      keys.current = {};
      tween.current = null;
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      gl.domElement.removeEventListener("wheel", wheel);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || !(camera instanceof THREE.PerspectiveCamera)) return;
    if (document.querySelector("dialog[open]") || useFloorDesignStore.getState().presentation === "layout") {
      keys.current = {};
      controls.enabled = false;
      return;
    }
    const transition = tween.current;
    controls.enabled = !transition;
    controls.enableRotate = activeView.current !== "top";
    if (transition) {
      const progress = Math.min(1, (performance.now() - transition.start) / (TWEEN_DURATION * 1000));
      const t = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      camera.position.lerpVectors(transition.from.position, transition.to.position, t);
      controls.target.lerpVectors(transition.from.target, transition.to.target, t);
      camera.fov = THREE.MathUtils.lerp(transition.from.fov, transition.to.fov, t);
      camera.updateProjectionMatrix();
      // Historical macro-view fix: never apply the free-look radius here.
      controls.minDistance = controls.maxDistance = camera.position.distanceTo(controls.target);
      controls.update();
      if (progress === 1) tween.current = null;
      return;
    }
    controls.minPolarAngle = activeView.current === "top" ? 0 : 0.15;
    controls.maxPolarAngle = activeView.current === "free" ? Math.PI - 0.15 : Math.PI / 2 - 0.05;

    if (["room", "free"].includes(activeView.current)) {
      scratchMove.set(0, 0, 0);
      camera.getWorldDirection(scratchForward);
      scratchForward.y = 0;
      scratchForward.normalize();
      scratchRight.crossVectors(scratchForward, camera.up).normalize();
      if (keys.current.KeyW || keys.current.ArrowUp) scratchMove.add(scratchForward);
      if (keys.current.KeyS || keys.current.ArrowDown) scratchMove.sub(scratchForward);
      if (keys.current.KeyD || keys.current.ArrowRight) scratchMove.add(scratchRight);
      if (keys.current.KeyA || keys.current.ArrowLeft) scratchMove.sub(scratchRight);
      if (scratchMove.lengthSq() > 0) {
        if (activeView.current !== "free") enterFree();
        scratchMove.normalize().multiplyScalar(MOVE_SPEED * Math.min(delta, 0.05));
        const margin=Math.min(MARGIN,ROOM.width*.1,ROOM.length*.1);
        const eyeHeight=Math.min(1.6,ROOM.height*.6);
        const x = THREE.MathUtils.clamp(camera.position.x + scratchMove.x, -ROOM.width / 2 + margin, ROOM.width / 2 - margin);
        const z = THREE.MathUtils.clamp(camera.position.z + scratchMove.z, -ROOM.length / 2 + margin, ROOM.length / 2 - margin);
        // Change eye height only when the user actually walks. Preserve pitch.
        controls.target.add(scratchMove.set(x - camera.position.x, eyeHeight - camera.position.y, z - camera.position.z));
        camera.position.set(x, eyeHeight, z);
      }
    }
    controls.update();
  });

  return <OrbitControls ref={controlsRef} makeDefault enablePan={false} enableZoom={false}
    enableDamping={false} rotateSpeed={0.6}
    onStart={() => {
      if (!tween.current && activeView.current === "room") enterFree();
    }}
    // Keep this declarative state limited to rotation; distance is pose-owned.
    enableRotate={cameraView !== "top"}
  />;
}
