import { panelLibrary } from '../panels/repository.ts';
import { unstable_batchedUpdates } from 'react-dom';
import { useFloorDesignStore } from '../state/useFloorDesignStore.ts';
import { useConfiguratorStore } from '../state/useConfiguratorStore.ts';
import { localTileLibrary } from '../tiles/demoLibrary.ts';
import { FLOOR_CERAMICS } from '../catalog/materials.ts';
import { assetReferences, normalizeAppliedState, type AppliedProjectState } from './model.ts';
import { prepareProjectState } from './resolve.ts';
import type { ProjectRuntime } from './repository.ts';
export type PreparedProject=ReturnType<typeof prepareProjectState>;
export function captureAppliedProjectReferences():AppliedProjectState{
  const d=useFloorDesignStore.getState(),m=useConfiguratorStore.getState();
  return {autoDesign:d.autoDesign,lighting:d.lighting,walls:d.walls,roomSize:d.roomSize,architecture:d.architecture,floorDesign:{enabled:d.enabled,started:d.started,installation:d.installation},materialState:{physicalOverride:m.physicalOverride,previousPhysicalOverride:m.previousPhysicalOverride,selectedFloorId:m.selectedFloorId,previousFloorId:m.previousFloorId,compareActive:d.enabled?false:m.compareActive}};
}
export function captureAppliedProject():AppliedProjectState{return normalizeAppliedState(captureAppliedProjectReferences());}
/** One synchronous batched publication, after parsing, resolving and compilation have succeeded. */
export function publishAppliedProject(state:AppliedProjectState){
  unstable_batchedUpdates(()=>{
    useFloorDesignStore.setState({autoDesign:state.autoDesign,lighting:state.lighting,walls:state.walls,wallPanelOpen:false,roomSize:state.roomSize,architecture:state.architecture,installation:state.floorDesign.installation,enabled:state.floorDesign.enabled,started:state.floorDesign.started,presentation:'room',panelOpen:false,roomSettingsOpen:false,selectedPlacementId:null});
    const c=useConfiguratorStore.getState();
    useConfiguratorStore.setState({physicalOverride:undefined,previousPhysicalOverride:undefined,...state.materialState,floorImageError:null,cameraView:'room',lastRoomView:'room',cameraRequestKind:'preset',cameraRequestToken:c.cameraRequestToken+1});
  });
}
export function createProjectRuntime(publish:(prepared:PreparedProject)=>void):ProjectRuntime{
  const products=()=>[...FLOOR_CERAMICS,...localTileLibrary.useLibrary.getState().products];
  return {
    capture:captureAppliedProject,
    names:state=>Object.fromEntries(assetReferences(state).flatMap(id=>{const p=products().find(p=>p.id===id);return p?[[id,p.name]]:[];})),
    prepare:async(state,names)=>{await localTileLibrary.hydrate();await panelLibrary.hydrate();if(localTileLibrary.useLibrary.getState().status!=='ready')throw Error('Open My Tiles and retry loading your saved materials before opening this project.');const safe=normalizeAppliedState(state),panel=safe.floorDesign.installation.center.panel,extra:string[]=[];
      if(panel){const library=panelLibrary.store.getState();if(!library.artworks.some(a=>a.id===panel.artworkSourceId)){delete safe.floorDesign.installation.center.panel;extra.push('Decorative artwork is unavailable. Normal Center tiles were restored; other room settings were kept.');}else if(!library.panels.some(p=>p.id===panel.id))extra.push('This panel was removed from the library. Its saved project revision is preserved.');}
      const prepared=prepareProjectState(safe,products(),names);prepared.warnings.push(...extra);return {state:prepared.state,warnings:prepared.warnings,commit:()=>publish(prepared)};},
    subscribe:changed=>{
      const a=useFloorDesignStore.subscribe((s,p)=>{if(s.autoDesign!==p.autoDesign||s.lighting!==p.lighting||s.walls!==p.walls||s.roomSize!==p.roomSize||s.architecture!==p.architecture||s.installation!==p.installation||s.enabled!==p.enabled||s.started!==p.started)changed();});
      const b=useConfiguratorStore.subscribe((s,p)=>{if(s.selectedFloorId!==p.selectedFloorId||s.previousFloorId!==p.previousFloorId||s.compareActive!==p.compareActive||s.physicalOverride!==p.physicalOverride||s.previousPhysicalOverride!==p.previousPhysicalOverride)changed();});
      return ()=>{a();b();};
    },
  };
}
