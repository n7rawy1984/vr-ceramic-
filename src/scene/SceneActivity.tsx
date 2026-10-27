import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useFloorDesignStore } from "../state/useFloorDesignStore";
/** Canvas owns the loop policy declaratively; redraw once when plan/XR changes. */
export function SceneActivity() {
  const plan=useFloorDesignStore(s=>s.presentation==='layout');
  const session=useXR(s=>s.session);
  const invalidate=useThree(s=>s.invalidate);
  useEffect(()=>{invalidate();},[plan,session,invalidate]);
  return null;
}
