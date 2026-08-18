import { Canvas } from "@react-three/fiber";
import { XR, useXR } from "@react-three/xr";
import { useState } from "react";
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
  return inSession ? <VRLocomotion /> : <DesktopControls />;
}

export default function App() {
  const [sceneReady, setSceneReady] = useState(false);

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
            <Room />
            <Furniture />
            <SceneControls />
            <ReadySignal onReady={() => setSceneReady(true)} />
          </XR>
        </Canvas>

        {!sceneReady && <LoadingScreen />}
        <Hud />
        <CeramicCatalog />
      </ErrorBoundary>
    </div>
  );
}
