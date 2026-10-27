import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { useTileProducts } from "../tiles/useTileProducts";
import { architectureErrors, type RoomArchitecture } from "./roomArchitecture";
import { useFloorDesignStore, type DesignConfiguration } from "../state/useFloorDesignStore";
import { compileLayout } from "./compiler";
import { layoutAsset } from "./assets";
import type { CompileResult } from "./model";
import type { MaterialProduct } from "../catalog/types";
import { roomSurface, type RoomSizeMm } from "./roomDimensions";
import { FloorDesignContext } from "./useFloorDesign";
export function FloorDesignProvider({ children }: { children: ReactNode }) {
  const products=useTileProducts();
  const architecture=useFloorDesignStore(s=>s.architecture);
  const roomSize = useFloorDesignStore(s=>s.roomSize);
  const installation = useFloorDesignStore(s => s.installation);
  // A successful Apply has already compiled/validated this exact snapshot.
  // Reuse it at publication; asset refreshes still invalidate the result normally.
  const prepared = useRef<{configuration:DesignConfiguration; products:MaterialProduct[]; result:CompileResult} | null>(null);
  const applyDraft = useCallback((configuration: DesignConfiguration): string[] => {
    const errors=architectureErrors(configuration.roomSize,architecture);
    if(errors.length)return errors;
    const result=compileLayout(roomSurface(configuration.roomSize),configuration.installation,products.map(layoutAsset));
    if(!result.ok)return result.errors;
    prepared.current={configuration,products,result};
    useFloorDesignStore.getState().applyDesign(configuration);
    return [];
  },[products,architecture]);
  const applyRoom=useCallback((size:RoomSizeMm,architecture:RoomArchitecture):string[]=>{
    const errors=architectureErrors(size,architecture);if(errors.length)return errors;
    const state=useFloorDesignStore.getState();
    const same=size.widthMm===state.roomSize.widthMm&&size.lengthMm===state.roomSize.lengthMm;
    const nextSize=same?state.roomSize:size;
    if(!same&&state.enabled){
      const configuration={roomSize:nextSize,installation:state.installation};
      const result=compileLayout(roomSurface(nextSize),state.installation,products.map(layoutAsset));
      if(!result.ok)return result.errors;
      prepared.current={configuration,products,result};
    }
    state.applyRoom(nextSize,architecture);return [];
  },[products]);
  const result = useMemo(() => {
    const cached=prepared.current;
    return cached?.configuration.roomSize===roomSize&&cached.configuration.installation===installation&&cached.products===products
      ? cached.result : compileLayout(roomSurface(roomSize), installation, products.map(layoutAsset));
  }, [roomSize, installation, products]);
  const value = useMemo(() => ({ products, result, applyDraft, applyRoom }), [products, result, applyDraft, applyRoom]);
  return <FloorDesignContext.Provider value={value}>{children}</FloorDesignContext.Provider>;
}
