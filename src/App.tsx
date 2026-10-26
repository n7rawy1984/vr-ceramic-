import { Canvas, useThree } from "@react-three/fiber";
import { XR, useXR } from "@react-three/xr";
import { Suspense, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useConfiguratorStore } from "./state/useConfiguratorStore";
import { ROOM } from "./scene/roomConfig";
import "./App.css";
import { DesktopControls } from "./scene/DesktopControls";
import { Furniture } from "./scene/Furniture";
import { Lighting } from "./scene/Lighting";
import { ReadySignal } from "./scene/ReadySignal";
import { Room } from "./scene/Room";
import { VRLocomotion } from "./scene/VRLocomotion";
import { CeramicCatalog } from "./ui/CeramicCatalog";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { Hud } from "./ui/Hud";
import { LoadingScreen } from "./ui/LoadingScreen";
import { xrStore } from "./xr/store";

/** Swaps navigation scheme based on whether an XR session is active. */
function SceneControls() {
  const inSession = useXR((s) => s.session != null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  // XR restores the original R3F camera through a separate store subscription.
  // Never initialize OrbitControls against the outgoing XR ArrayCamera.
  // Text in the VR panels loads asynchronously. Keep its suspension local:
  // suspending XR itself can recreate its effect and lose initialCamera.
  if (inSession) return <Suspense fallback={null}><VRLocomotion /></Suspense>;
  if (gl.xr.isPresenting || camera === gl.xr.getCamera()) return null;
  return <DesktopControls />;
}

/** Desktop inspection visibility never hides architecture inside XR. Keep the
 * overhead group hidden until the camera has descended back into the room. */
function Showroom() {
  const inSession = useXR((s) => s.session != null);
  const top = useConfiguratorStore((s) => s.cameraView === "top");
  const overheadRef = useRef<Group>(null);
  useFrame(({ camera }) => {
    if (overheadRef.current) overheadRef.current.visible = inSession || (!top && camera.position.y < ROOM.height - 0.05);
  });
  return <>
    <Room overheadRef={overheadRef} />
    <Furniture visible={inSession || !top} />
  </>;
}

export default function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const floorImageError = useConfiguratorStore((s) => s.floorImageError);

  return (
    <div className="app-root">
      <ErrorBoundary>
        <Canvas
          shadows="variance"
          dpr={[1, 1.5]}
          camera={{ fov: 60, near: 0.05, far: 50, position: [0, 1.6, 1.6] }}
          gl={{ antialias: true }}
        >
          <XR store={xrStore}>
            <color attach="background" args={["#dbe4ec"]} />
            <Lighting />
            <Showroom />
            <SceneControls />
            <ReadySignal onReady={() => setSceneReady(true)} />
          </XR>
        </Canvas>

        {!sceneReady && <LoadingScreen />}
        <Hud />
        <CeramicCatalog />
        {floorImageError && <div className="floor-image-error" role="alert">{floorImageError}</div>}
      </ErrorBoundary>
    </div>
  );
}
