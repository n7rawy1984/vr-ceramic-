import { create } from "zustand";
import { FLOOR_CERAMICS } from "../catalog/materials";
import { FLOOR_SURFACE } from "../layout/floorSurface";
import { defaultInstallation, type FloorInstallation } from "../layout/model";
import { DEFAULT_ROOM_SIZE, type RoomSizeMm } from "../layout/roomDimensions";
const initial = (id = FLOOR_CERAMICS[0].id) => defaultInstallation(FLOOR_SURFACE.id, id, FLOOR_CERAMICS[2].id, FLOOR_CERAMICS[0].id);
export type DesignConfiguration = { roomSize: RoomSizeMm; installation: FloorInstallation };
interface FloorDesignState {
  roomSize: RoomSizeMm;
  applyDesign: (configuration: DesignConfiguration) => void;
  enabled: boolean;
  started: boolean;
  panelOpen: boolean;
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
  // Caller validates the complete configuration before this single publication.
  applyDesign: ({roomSize,installation}) => set({roomSize,installation,enabled:true,selectedPlacementId:null}),
  enabled: false, started: false, panelOpen: false, presentation: "room", installation: initial(), selectedPlacementId: null,
  openDesigner: (fieldId) => set(s => ({ panelOpen: true, enabled: true, started: true, installation: s.started ? s.installation : initial(fieldId) })),
  closePanel: () => set({ panelOpen: false }),
  setEnabled: (enabled) => set({ enabled, presentation: "room", selectedPlacementId: null }),
  setPresentation: (presentation) => set(presentation === "layout" ? { presentation, enabled: true } : { presentation }),
  resetDesign: (fieldId) => set({ installation: initial(fieldId), selectedPlacementId: null }),
  selectPlacement: (selectedPlacementId) => set({ selectedPlacementId }),
}));
