import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

/** Fires `onReady` once, on the first rendered frame — used to know when the
 * scene has actually painted so the loading screen can be dismissed instead
 * of hiding on a fixed timer. */
export function ReadySignal({ onReady }: { onReady: () => void }) {
  const firedRef = useRef(false);

  useFrame(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onReady();
  });

  return null;
}
