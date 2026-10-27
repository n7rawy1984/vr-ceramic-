import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { FLOOR_CERAMICS } from "../catalog/materials";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { useFloorDesignStore, type DesignConfiguration } from "../state/useFloorDesignStore";
import { compileLayout } from "./compiler";
import { layoutAsset } from "./assets";
import type { CompileResult } from "./model";
import type { MaterialProduct } from "../catalog/types";
import { roomSizeError, roomSurface } from "./roomDimensions";
import { FloorDesignContext } from "./useFloorDesign";
export function FloorDesignProvider({ children }: { children: ReactNode }) {
  const uploaded = useConfiguratorStore(s => s.uploadedProducts);
  const roomSize = useFloorDesignStore(s=>s.roomSize);
  const installation = useFloorDesignStore(s => s.installation);
  const products = useMemo(() => [...FLOOR_CERAMICS, ...uploaded], [uploaded]);
  // A successful Apply has already compiled/validated this exact snapshot.
  // Reuse it at publication; asset refreshes still invalidate the result normally.
  const prepared = useRef<{configuration:DesignConfiguration; products:MaterialProduct[]; result:CompileResult} | null>(null);
  const applyDraft = useCallback((configuration: DesignConfiguration): string[] => {
    const error=roomSizeError(configuration.roomSize);
    if(error)return [error];
    const result=compileLayout(roomSurface(configuration.roomSize),configuration.installation,products.map(layoutAsset));
    if(!result.ok)return result.errors;
    prepared.current={configuration,products,result};
    useFloorDesignStore.getState().applyDesign(configuration);
    return [];
  },[products]);
  const result = useMemo(() => {
    const cached=prepared.current;
    return cached?.configuration.roomSize===roomSize&&cached.configuration.installation===installation&&cached.products===products
      ? cached.result : compileLayout(roomSurface(roomSize), installation, products.map(layoutAsset));
  }, [roomSize, installation, products]);
  const value = useMemo(() => ({ products, result, applyDraft }), [products, result, applyDraft]);
  return <FloorDesignContext.Provider value={value}>{children}</FloorDesignContext.Provider>;
}
