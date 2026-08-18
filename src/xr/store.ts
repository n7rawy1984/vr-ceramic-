import { createXRStore } from "@react-three/xr";

/**
 * Single shared XR session store. `teleportPointer` on the controller/hand
 * implementations gives us the comfortable parabolic teleport ray used by
 * VRLocomotion without any custom pointer code.
 *
 * `emulate` is explicitly disabled in production so the IWER desktop
 * emulator (and its room-model chunks) can never be fetched by a real
 * visitor; in dev it keeps its default so `localhost` testing without a
 * headset still works.
 */
export const xrStore = createXRStore({
  controller: { teleportPointer: true },
  hand: { teleportPointer: true },
  emulate: import.meta.env.PROD ? false : undefined,
});
