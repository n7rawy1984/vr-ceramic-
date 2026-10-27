import { create } from "zustand";
import type { MaterialProduct } from "../catalog/types.ts";
import { FLOOR_CERAMICS } from "../catalog/materials.ts";

export type DesktopView = "room" | "floor" | "top" | "detail" | "free";

interface ConfiguratorState {
  /** Reserved for the preserved, inactive server library. Local consumers use the asset repository. */
  uploadedProducts: MaterialProduct[];
  reconcileAssetIds: (ids: Set<string>) => void;
  setUploadedProducts: (products: MaterialProduct[]) => void;
  floorImageError: string | null;
  setFloorImageError: (error: string | null) => void;
  selectedFloorId: string;
  /** The ceramic that was selected right before the current one — powers Compare. */
  previousFloorId: string | null;
  setSelectedFloorId: (id: string) => void;

  /** True while "Compare" is showing the previous ceramic instead of the current one. */
  compareActive: boolean;
  toggleCompare: () => void;

  /** Requests are separate from mode so manual movement cannot restart a tween. */
  cameraView: DesktopView;
  cameraRequestToken: number;
  cameraRequestKind: "preset" | "return";
  lastRoomView: "room" | "free";
  setCameraView: (view: Exclude<DesktopView, "free">) => void;
  returnToRoom: () => void;
  resetCamera: () => void;

  /** Incremented to signal VRLocomotion to move the player rig back to the spawn point. */
  vrReturnToStartToken: number;
  triggerVrReturnToStart: () => void;

  /** Whether the in-world VR materials panel is open. */
  vrPanelOpen: boolean;
  toggleVrPanel: () => void;

  /** True once the VR welcome panel has been dismissed this browser session. */
  vrOnboardingSeen: boolean;
  markVrOnboardingSeen: () => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  uploadedProducts: [],
  reconcileAssetIds: ids => set(s => ({selectedFloorId:ids.has(s.selectedFloorId)?s.selectedFloorId:FLOOR_CERAMICS[0].id,previousFloorId:s.previousFloorId&&ids.has(s.previousFloorId)?s.previousFloorId:null,compareActive:s.previousFloorId&&ids.has(s.previousFloorId)?s.compareActive:false})),
  setUploadedProducts: (products) => set((s) => {
    const exists = (id: string | null) => id && [...FLOOR_CERAMICS, ...products].some(p => p.id === id);
    return {
      uploadedProducts: products,
      selectedFloorId: exists(s.selectedFloorId) ? s.selectedFloorId : FLOOR_CERAMICS[0].id,
      previousFloorId: exists(s.previousFloorId) ? s.previousFloorId : null,
      compareActive: exists(s.previousFloorId) ? s.compareActive : false,
    };
  }),
  floorImageError: null,
  setFloorImageError: (error) => set({ floorImageError: error }),
  selectedFloorId: FLOOR_CERAMICS[0].id,
  previousFloorId: null,
  setSelectedFloorId: (id) => {
    const current = get().selectedFloorId;
    if (id === current) { set({compareActive:false}); return; }
    set({ selectedFloorId: id, previousFloorId: current, compareActive: false });
  },

  compareActive: false,
  toggleCompare: () =>
    set((s) => (s.previousFloorId ? { compareActive: !s.compareActive } : s)),

  cameraView: "room",
  cameraRequestToken: 0,
  cameraRequestKind: "preset",
  lastRoomView: "room",
  setCameraView: (view) => set((s) => ({
    cameraView: view,
    cameraRequestKind: "preset",
    cameraRequestToken: s.cameraRequestToken + 1,
  })),
  returnToRoom: () => set((s) => ({
    cameraView: s.lastRoomView,
    cameraRequestKind: "return",
    cameraRequestToken: s.cameraRequestToken + 1,
  })),
  resetCamera: () => set((s) => ({
    cameraView: "room",
    lastRoomView: "room",
    cameraRequestKind: "preset",
    cameraRequestToken: s.cameraRequestToken + 1,
  })),

  vrReturnToStartToken: 0,
  triggerVrReturnToStart: () => set((s) => ({ vrReturnToStartToken: s.vrReturnToStartToken + 1 })),

  vrPanelOpen: false,
  toggleVrPanel: () => set((s) => ({ vrPanelOpen: !s.vrPanelOpen })),

  vrOnboardingSeen: false,
  markVrOnboardingSeen: () => set({ vrOnboardingSeen: true }),
}));
