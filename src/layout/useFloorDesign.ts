import { createContext, useContext } from "react";
import type { MaterialProduct } from "../catalog/types";
import type { CompileResult } from "./model";
import type { DesignConfiguration } from "../state/useFloorDesignStore";
import type { RoomSizeMm } from "./roomDimensions";
import type { RoomArchitecture } from "./roomArchitecture";
export const FloorDesignContext = createContext<{ products: MaterialProduct[]; result: CompileResult; applyDraft: (configuration: DesignConfiguration) => string[]; applyRoom: (size:RoomSizeMm,architecture:RoomArchitecture)=>string[] } | null>(null);
export function useFloorDesign() {
  const value = useContext(FloorDesignContext);
  if (!value) throw Error("Floor design provider is missing.");
  return value;
}
