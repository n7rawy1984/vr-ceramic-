import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useFloorDesignStore } from "../state/useFloorDesignStore";
/** The opaque plan needs no continuously rendered background room. XR keeps its normal loop. */
export function SceneActivity() {
  const plan=useFloorDesignStore(s=>s.presentation==='layout');
  const session=useXR(s=>s.session);
  const setFrameloop=useThree(s=>s.setFrameloop);
  const invalidate=useThree(s=>s.invalidate);
  useEffect(()=>{setFrameloop(plan&&!session?'demand':'always');invalidate();return()=>setFrameloop('always');},[plan,session,setFrameloop,invalidate]);
  return null;
}
