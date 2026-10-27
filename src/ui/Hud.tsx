import { useEffect, useRef, useState } from "react";
import { BRAND } from "../config/brand";
import { useVRSupported } from "../hooks/useVRSupported";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { useFloorDesignStore } from "../state/useFloorDesignStore";
import { xrStore } from "../xr/store";

const ERROR_DISPLAY_MS = 4500;
const HINT_FADE_MS = 6000;

export function Hud() {
  const resetCamera = useConfiguratorStore((s) => s.resetCamera);
  const cameraView = useConfiguratorStore((s) => s.cameraView);
  const setCameraView = useConfiguratorStore((s) => s.setCameraView);
  const returnToRoom = useConfiguratorStore((s) => s.returnToRoom);
  const vrSupport = useVRSupported();
  const design = useFloorDesignStore();
  const selectedFloorId = useConfiguratorStore(s=>s.selectedFloorId);

  const [vrError, setVrError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hintFaded, setHintFaded] = useState(false);

  // The nav hint is only useful for the first few seconds — fade it once the
  // customer has had time to read it, or the moment they actually start
  // interacting, so it never lingers over the architectural composition.
  useEffect(() => {
    const fade = () => setHintFaded(true);
    const timer = setTimeout(fade, HINT_FADE_MS);
    window.addEventListener("keydown", fade, { once: true });
    window.addEventListener("pointerdown", fade, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", fade);
      window.removeEventListener("pointerdown", fade);
    };
  }, []);

  const handleEnterVR = async () => {
    setVrError(null);
    try {
      await xrStore.enterVR();
    } catch {
      // Covers both a real startup failure and the user declining the
      // headset's permission prompt — either way, fail quietly in-page
      // rather than an uncaught rejection, and let them try again.
      setVrError("Couldn't start VR. Please try again.");
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setVrError(null), ERROR_DISPLAY_MS);
    }
  };

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="brand">
          <span className="brand-title">{BRAND.name}</span>
          <span className="brand-subtitle">{BRAND.subtitle}</span>
        </div>
        <div className="hud-actions">
          <div className="view-controls" role="group" aria-label="Camera views">
            {([['room', 'Overview'], ['floor', 'Floor'], ['top', 'Top'], ['detail', 'Detail']] as const).map(([view, label]) => (
              <button key={view} className={`hud-button${cameraView === view ? " active" : ""}`}
                aria-pressed={cameraView === view} onClick={() => {design.setPresentation("room");setCameraView(view);}}
                title={view === "top" ? "Top inspection view" : view === "floor" ? "View Floor" : `${label} view`}>
                {label}
              </button>
            ))}
          </div>
          {["floor", "top", "detail"].includes(cameraView) && (
            <button className="hud-button" onClick={()=>{design.setPresentation("room");returnToRoom();}}>Back to Room</button>
          )}
          <button className="hud-button" onClick={()=>{design.setPresentation("room");resetCamera();}} title="Reset to Overview">Reset</button>
          <button className="hud-button" onClick={()=>design.openDesigner(selectedFloorId)}>Floor Design</button>
          <button className="hud-button" onClick={()=>{design.openDesigner(selectedFloorId);design.setPresentation("layout");}}>Layout</button>
          {vrSupport === "supported" && (
            <button className="hud-button hud-button-primary" onClick={handleEnterVR}>
              Enter VR
            </button>
          )}
        </div>
      </div>

      {vrSupport === "unsupported" && (
        <div className="vr-availability-note">
          <strong>🥽 VR Experience Available</strong>
          <span>Open this experience on a compatible headset.</span>
        </div>
      )}

      {vrError && <div className="vr-error-toast">{vrError}</div>}

      <div className={`hud-hint${hintFaded ? " faded" : ""}`}>
        {cameraView === "top" ? "Top inspection · Choose a view to return" : "Drag to look around · WASD to walk in Room · Scroll to zoom"}
      </div>
    </div>
  );
}
