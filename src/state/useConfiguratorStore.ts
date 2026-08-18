import { create } from "zustand";
import { FLOOR_CERAMICS } from "../catalog/materials";

interface ConfiguratorState {
  selectedFloorId: string;
  /** The ceramic that was selected right before the current one — powers Compare. */
  previousFloorId: string | null;
  setSelectedFloorId: (id: string) => void;

  /** True while "Compare" is showing the previous ceramic instead of the current one. */
  compareActive: boolean;
  toggleCompare: () => void;

  /** Incremented to signal desktop controls to reset the camera. */
  cameraResetToken: number;
  resetCamera: () => void;

  /** True while the desktop camera is tweened into the floor-inspection pose. */
  floorViewActive: boolean;
  toggleFloorView: () => void;

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
  selectedFloorId: FLOOR_CERAMICS[0].id,
  previousFloorId: null,
  setSelectedFloorId: (id) => {
    const current = get().selectedFloorId;
    if (id === current) return;
    set({ selectedFloorId: id, previousFloorId: current, compareActive: false });
  },

  compareActive: false,
  toggleCompare: () =>
    set((s) => (s.previousFloorId ? { compareActive: !s.compareActive } : s)),

  cameraResetToken: 0,
  resetCamera: () => set((s) => ({ cameraResetToken: s.cameraResetToken + 1 })),

  floorViewActive: false,
  toggleFloorView: () => set((s) => ({ floorViewActive: !s.floorViewActive })),

  vrReturnToStartToken: 0,
  triggerVrReturnToStart: () => set((s) => ({ vrReturnToStartToken: s.vrReturnToStartToken + 1 })),

  vrPanelOpen: false,
  toggleVrPanel: () => set((s) => ({ vrPanelOpen: !s.vrPanelOpen })),

  vrOnboardingSeen: false,
  markVrOnboardingSeen: () => set({ vrOnboardingSeen: true }),
}));
