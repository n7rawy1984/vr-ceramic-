import { create } from "zustand";
import { FLOOR_CERAMICS } from "../catalog/materials.ts";
import { FLOOR_SURFACE } from "../layout/floorSurface.ts";
import { defaultInstallation, type FloorInstallation } from "../layout/model.ts";
import { DEFAULT_ROOM_SIZE, type RoomSizeMm } from "../layout/roomDimensions.ts";
import { DEFAULT_ARCHITECTURE, type RoomArchitecture } from "../layout/roomArchitecture.ts";
const initial = (id = FLOOR_CERAMICS[0].id) => defaultInstallation(FLOOR_SURFACE.id, id, FLOOR_CERAMICS[2].id, FLOOR_CERAMICS[0].id);
export type DesignConfiguration = { roomSize: RoomSizeMm; installation: FloorInstallation };
interface FloorDesignState {
  roomSize: RoomSizeMm;
  architecture: RoomArchitecture;
  applyRoom: (roomSize: RoomSizeMm, architecture: RoomArchitecture) => void;
  reconcileAssets: (ids: Set<string>) => void;
  applyDesign: (configuration: DesignConfiguration) => void;
  enabled: boolean;
  started: boolean;
  panelOpen: boolean;
  roomSettingsOpen: boolean;
  setRoomSettingsOpen: (open:boolean)=>void;
  presentation: "room" | "layout";
  installation: FloorInstallation;
  selectedPlacementId: string | null;
  openDesigner: (fieldId: string) => void;
  closePanel: () => void;
  setEnabled: (enabled: boolean) => void;
  setPresentation: (view: "room" | "layout") => void;
  resetDesign: (fieldId: string) => void;
  selectPlacement: (id: string | null) => void;
}
/** Session-local design, separate from legacy material Compare and camera commands. */
export const useFloorDesignStore = create<FloorDesignState>((set) => ({
  roomSize: {...DEFAULT_ROOM_SIZE},
  architecture: structuredClone(DEFAULT_ARCHITECTURE),
  applyRoom: (roomSize,architecture) => set({roomSize,architecture,selectedPlacementId:null}),
  reconcileAssets: (ids) => set(s => {
    const i=s.installation;
    const field=ids.has(i.field.tileAssetId)?i.field:{...i.field,tileAssetId:FLOOR_CERAMICS[0].id};
    const center=ids.has(i.center.tileAssetId)?i.center:{...i.center,tileAssetId:FLOOR_CERAMICS[0].id};
    const centerFrame=ids.has(i.centerFrame.tileAssetId)?i.centerFrame:{...i.centerFrame,tileAssetId:FLOOR_CERAMICS[2].id};
    const border=ids.has(i.border.tileAssetId)?i.border:{...i.border,tileAssetId:FLOOR_CERAMICS[2].id};
    return field===i.field&&center===i.center&&centerFrame===i.centerFrame&&border===i.border?{}:{installation:{...i,field,center,centerFrame,border},selectedPlacementId:null};
  }),
  // Caller validates the complete configuration before this single publication.
  applyDesign: ({roomSize,installation}) => set({roomSize,installation,enabled:true,selectedPlacementId:null}),
  roomSettingsOpen:false, setRoomSettingsOpen:roomSettingsOpen=>set({roomSettingsOpen}),
  enabled: false, started: false, panelOpen: false, presentation: "room", installation: initial(), selectedPlacementId: null,
  openDesigner: (fieldId) => set(s => ({ panelOpen: true, enabled: true, started: true, installation: s.started ? s.installation : initial(fieldId) })),
  closePanel: () => set({ panelOpen: false }),
  setEnabled: (enabled) => set({ enabled, presentation: "room", selectedPlacementId: null }),
  setPresentation: (presentation) => set(presentation === "layout" ? { presentation, enabled: true } : { presentation }),
  resetDesign: (fieldId) => set({ installation: initial(fieldId), selectedPlacementId: null }),
  selectPlacement: (selectedPlacementId) => set({ selectedPlacementId }),
}));
