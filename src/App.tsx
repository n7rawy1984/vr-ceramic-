import { panelLibrary } from './panels/repository';
import { WallDesign } from './ui/WallDesign';
import { ProjectProvider } from "./projects/ProjectProvider";
import { Projects } from "./ui/Projects";
import { Canvas, useThree } from "@react-three/fiber";
import { XR, useXR } from "@react-three/xr";
import { useStore } from "zustand";
import { Suspense, useState, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useConfiguratorStore } from "./state/useConfiguratorStore";
import { useRoom } from "./scene/useRoom";
import { useFloorDesignStore } from "./state/useFloorDesignStore";
import { localTileLibrary } from "./tiles/demoLibrary";
import { RoomSettings } from "./ui/RoomSettings";
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
import { FloorDesignProvider } from "./layout/FloorDesignContext";
import { FloorDesign } from "./ui/FloorDesign";
import { SceneActivity } from "./scene/SceneActivity";
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
  const ROOM=useRoom();
  const furniture=useFloorDesignStore(s=>s.architecture.furnitureVisible);
  const inSession = useXR((s) => s.session != null);
  const top = useConfiguratorStore((s) => s.cameraView === "top");
  const overheadRef = useRef<Group>(null);
  useFrame(({ camera }) => {
    if (overheadRef.current) overheadRef.current.visible = inSession || (!top && camera.position.y < ROOM.height - 0.05);
  });
  return <>
    <Room overheadRef={overheadRef} />
    {furniture&&<Furniture visible={inSession || !top} />}
  </>;
}

export default function App() {
  useEffect(()=>{void localTileLibrary.hydrate();void panelLibrary.hydrate();},[]);
  const [sceneReady, setSceneReady] = useState(false);
  const floorImageError = useConfiguratorStore((s) => s.floorImageError);
  const plan = useFloorDesignStore((s) => s.presentation === "layout");
  const inSession = useStore(xrStore, (s) => s.session != null);

  return (
    <div className="app-root">
      <ErrorBoundary>
        <FloorDesignProvider>
        <ProjectProvider>
        <Canvas
          frameloop={plan && !inSession ? "demand" : "always"}
          shadows="variance"
          dpr={[1, 1.5]}
          camera={{ fov: 60, near: 0.05, far: 100, position: [0, 1.6, 1.6] }}
          gl={{ antialias: true }}
        >
          <XR store={xrStore}>
            <color attach="background" args={["#dbe4ec"]} />
            <Lighting />
            <Showroom />
            <SceneControls />
            <SceneActivity />
            <ReadySignal onReady={() => setSceneReady(true)} />
          </XR>
        </Canvas>

        {!sceneReady && <LoadingScreen />}
        <Hud />
        <CeramicCatalog />
        <FloorDesign />
        <RoomSettings />
        <WallDesign />
        <Projects />
        {floorImageError && <div className="floor-image-error" role="alert">{floorImageError}</div>}
        </ProjectProvider>
      </FloorDesignProvider>
      </ErrorBoundary>
    </div>
  );
}
