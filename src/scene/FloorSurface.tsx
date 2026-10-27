import { useFloorDesignStore } from "../state/useFloorDesignStore";
import { AdvancedFloor } from "./AdvancedFloor";
import { CeramicFloor } from "./CeramicFloor";
/** Legacy material preview and authoritative geometric installation coexist. */
export function FloorSurface() {
  return useFloorDesignStore(s=>s.enabled) ? <AdvancedFloor/> : <CeramicFloor/>;
}
