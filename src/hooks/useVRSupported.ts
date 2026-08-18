import { useEffect, useState } from "react";

export type VRSupportState = "checking" | "supported" | "unsupported";

/**
 * Tri-state WebXR availability check. "checking" lets the HUD render
 * nothing until the browser has actually answered, so we never flash an
 * incorrect Enter VR button or an unsupported message before we know.
 */
export function useVRSupported(): VRSupportState {
  const [state, setState] = useState<VRSupportState>("checking");

  useEffect(() => {
    let cancelled = false;

    if (!navigator.xr?.isSessionSupported) {
      setState("unsupported");
      return;
    }

    navigator.xr
      .isSessionSupported("immersive-vr")
      .then((ok) => {
        if (!cancelled) setState(ok ? "supported" : "unsupported");
      })
      .catch(() => {
        if (!cancelled) setState("unsupported");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
