import { WALL_IDS } from '../surfaces/model';
import { cachedWallCompile, wallSurface } from '../surfaces/compiler';
import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { useTileProducts } from "../tiles/useTileProducts";
import { architectureErrors, type RoomArchitecture } from "./roomArchitecture";
import { useFloorDesignStore, type DesignConfiguration } from "../state/useFloorDesignStore";
import { compileLayout } from "./compiler";
import { layoutAsset, installationAssetKey } from "./assets";
import type { CompileResult } from "./model";
import type { MaterialProduct } from "../catalog/types";
import { roomSurface, type RoomSizeMm } from "./roomDimensions";
import { FloorDesignContext } from "./useFloorDesign";
import { publishAppliedProject, type PreparedProject } from "../projects/runtime";
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
    const state=useFloorDesignStore.getState();
    for(const id of WALL_IDS)if(state.walls[id].enabled){const wall=cachedWallCompile(wallSurface(id,configuration.roomSize,architecture),state.walls[id],products.map(layoutAsset));if(!wall.ok)return wall.errors;}
    const result=compileLayout(roomSurface(configuration.roomSize),configuration.installation,products.map(layoutAsset));
    if(!result.ok)return result.errors;
    prepared.current={configuration,products,result};
    useFloorDesignStore.getState().applyDesign(configuration);
    return [];
  },[products,architecture]);
  const applyRoom=useCallback((size:RoomSizeMm,architecture:RoomArchitecture):string[]=>{
    const errors=architectureErrors(size,architecture);if(errors.length)return errors;
    const state=useFloorDesignStore.getState();
    for(const id of WALL_IDS)if(state.walls[id].enabled){const result=cachedWallCompile(wallSurface(id,size,architecture),state.walls[id],products.map(layoutAsset));if(!result.ok)return result.errors;}
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
  const restoreProject = useCallback((preparedProject:PreparedProject)=>{
    const {state,products,result}=preparedProject;
    prepared.current={configuration:{roomSize:state.roomSize,installation:state.floorDesign.installation},products,result};
    publishAppliedProject(state);
  },[]);
  const assetKey=installationAssetKey(installation,products);
  const last=useRef<{roomSize:RoomSizeMm;installation:typeof installation;key:string;result:CompileResult}|null>(null);
  const result = useMemo(() => {
    if(last.current?.roomSize===roomSize&&last.current.installation===installation&&last.current.key===assetKey)return last.current.result;
    const cached=prepared.current;
    const result=cached?.configuration.roomSize===roomSize&&cached.configuration.installation===installation&&cached.products.length===products.length&&cached.products.every((p,index)=>p===products[index])
      ? cached.result : compileLayout(roomSurface(roomSize), installation, products.map(layoutAsset));
    last.current={roomSize,installation,key:assetKey,result};return result;
  }, [roomSize, installation, products,assetKey]);
  const value = useMemo(() => ({ products, result, applyDraft, applyRoom, restoreProject }), [products, result, applyDraft, applyRoom, restoreProject]);
  return <FloorDesignContext.Provider value={value}>{children}</FloorDesignContext.Provider>;
}
