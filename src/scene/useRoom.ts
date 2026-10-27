import { useMemo } from "react";
import { useFloorDesignStore } from "../state/useFloorDesignStore";
import { mmToM } from "../utils/units";
import { ROOM } from "./roomConfig";
/** One rendering boundary shared by shell, furniture, lights, controls and XR. */
export function useRoom() {
  const size=useFloorDesignStore(s=>s.roomSize);
  const height=useFloorDesignStore(s=>s.architecture.heightMm);
  return useMemo(()=>({...ROOM,width:mmToM(size.widthMm),length:mmToM(size.lengthMm),height:mmToM(height)}),[size,height]);
}
