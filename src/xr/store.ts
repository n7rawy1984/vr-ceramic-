import { createXRStore } from "@react-three/xr";

/**
 * Single shared XR session store. `teleportPointer` on the controller/hand
 * implementations gives us the comfortable parabolic teleport ray used by
 * VRLocomotion without any custom pointer code.
 *
 * Emulation is opt-in and development-only. Keep one store across Vite HMR:
 * recreating it installs another emulator runtime, DOM UI and global listeners.
 */
const createStore = () => createXRStore({
  controller: { teleportPointer: true },
  hand: { teleportPointer: true },
  emulate: import.meta.env.DEV && import.meta.env.VITE_XR_EMULATOR === "true"
    ? { inject: true, syntheticEnvironment: false }
    : false,
});

export const xrStore: ReturnType<typeof createStore> = import.meta.hot?.data.xrStore ?? createStore();
if (import.meta.hot) {
  // The SDK does not dispose emulator UI; retain one device/store until reload.
  import.meta.hot.data.xrStore = xrStore;
}
