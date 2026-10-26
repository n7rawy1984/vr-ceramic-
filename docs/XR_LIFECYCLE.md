# XR / desktop lifecycle

Normal development: `npm run dev`. The emulator is disabled unless `VITE_XR_EMULATOR` is exactly `true`.

Explicit emulator development: `npm run dev:xr` (or `VITE_XR_EMULATOR=true npm run dev`). Restart the server and reload the page when switching modes. Production always passes `emulate: false`, even if that flag is set at build time. Real headset WebXR entry, controller/hand pointers, teleport, snap turn and VR panels remain enabled in both modes. The SDK does not replace a supported native XR runtime.

Explicit emulation uses the controller/headset DevUI without the synthetic environment module; the application supplies its own room. The XR store/device survives Vite HMR. Reload after editing store configuration to apply new options; creating another emulator on every module replacement would retain extra global listeners and UI.

## Failure and fix

`VRLocomotion` contains Drei `Text`, whose asynchronous font loading suspends. Previously there was no local Suspense boundary. Suspending the surrounding XR tree re-established the SDK camera-restoration effect during an active session, losing its closure-local `initialCamera`. Camera-write tracing reproduced entry's desktop → XR ArrayCamera write, followed by **no camera-restoration write at exit**. R3F then retained the XR ArrayCamera. It extends PerspectiveCamera, so the former desktop type guard accepted it and OrbitControls could control the wrong camera.

A local Suspense boundary now contains VR asset loading. The trace with that change includes the exit write restoring the original camera UUID. DesktopControls also waits until the XR manager stops presenting and R3F has its desktop camera. Desktop input teardown clears held keys/tweens. Desktop code does not acquire pointer capture; the browser releases emulator pointer lock when its canvas detaches, checked in the second exit cycle. Existing keyboard/wheel removals and Drei OrbitControls disposal remain in place. No additional animation loop or manual renderer session management is added.

A separate reproduced failure was `TypeError: material.onBuild is not a function`: emulator DevUI's Three.js 0.165 renderer received transform-handle materials from app Three.js 0.185. IWER calls DevUI rendering **before** application XR frame callbacks, so this exception prevented those callbacks. Vite `resolve.dedupe: ['three']` makes renderer and materials use the app's installed copy, without changing dependencies/lockfile or patching node_modules.

Source evidence in the installed packages:

- `@react-three/xr/dist/xr.js`: effect-local `initialCamera`, session subscription and R3F camera restoration.
- `@react-three/drei/core/Text.js`: asynchronous font loading/Suspense.
- `three/src/cameras/ArrayCamera.js`: extends PerspectiveCamera.
- `@iwer/devui/lib/scene.js`: separate renderer, global input listeners and disposal behavior.
- `iwer/lib/session/XRSession.js`: DevUI rendering precedes application callbacks; end cancels the device RAF and clears session callbacks.
- `iwer/lib/device/XRDevice.js`: reparents/restores the app canvas and removes the runtime container on exit.
- `@react-three/fiber/dist/events-*.esm.js`: sessionend restores normal frame scheduling.

## Browser regression runner

`tests/browser/xr-lifecycle.mjs` uses Node's built-in WebSocket and an isolated Chrome debugging target. It needs no installed automation package. Launch a dedicated test Chrome, never a normal browsing profile:

```sh
google-chrome-stable --headless=new --no-sandbox --disable-dev-shm-usage \
  --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader \
  --remote-debugging-port=9335 --user-data-dir=/tmp/ceramic-xr-test about:blank
```

With normal and emulator Vite servers on separate ports:

```sh
CDP_PORT=9335 node tests/browser/xr-lifecycle.mjs http://localhost:5173
CDP_PORT=9335 node tests/browser/xr-lifecycle.mjs http://localhost:5174 --emulator
```

The emulator test masks native navigator.xr in that test page before initialization, representing a browser without a native WebXR API. This does not change application support detection. Installed IWER declines to overwrite an existing native navigator.xr; the test masks it to exercise the emulation path, while real WebXR detection/entry stays unchanged. It runs two enter/exit cycles, opens the VR material panel (exercising asynchronous text), verifies original-camera identity and desktop controls, uses real mouse hit testing/clicks, checks all presets/Reset/demos/Compare/My Tiles/WASD/arrows/drag/wheel, and compares listeners, subscribers, captures and DOM overlays. The second cycle acquires emulator pointer lock before exit. Keyboard tests wait for observed movement before key release so slow rendering cannot swallow a short test press. PNG screenshots go to `/tmp`.

For uploaded-tile coverage add `--fixture` **only against an isolated frontend/API routed to `tests/fixtures/serve.ts`**, using the existing fixture credentials from tests. It creates a generated 60×60 cm PNG through the upload UI and checks Apply/Compare after every exit. Do not point fixture mode at a live library. Keep the user's existing API process running; use a separate API_PORT and temporary Vite proxy config if its port is occupied.

On a memory-constrained software renderer, add `--software` to reduce only the test canvas DPR to 0.5. Application defaults remain unchanged. Camera identity/restoration was also traced at default DPR.

The runner reports pending browser RAF callbacks and intervals. The opt-in SDK retains one emulator device, detached DevUI and its polling/input infrastructure for re-entry; session exit is not full emulator disposal. Normal development initializes none of that infrastructure. Stable callback/listener counts across cycles establish absence of accumulation, not zero emulator overhead or headset performance guarantees.

## Verified results (2026-10-26)

Two emulator enter/exit cycles passed the complete desktop/material/upload-fixture input checks, including the second exit under pointer lock. Normal development separately passed those checks with zero emulator resource requests/device. Screenshots for both modes were visually inspected. After exits: original desktop camera, seven R3F subscribers, one canvas, no active XR inputs/runtime overlay/capture/lock, and no growing input listener counts. Opt-in DevUI polling remains (six vector RAF pollers plus the app loop; three total intervals versus two without emulation in this fixture/dev setup), with no accumulation across cycles. Full interaction tests used software WebGL at test-only DPR 0.5; focused camera restoration also passed at default DPR.

TypeScript, lint, the 11 native backend/adapter tests, normal build and a production build with the emulator flag set passed. The latter still compiled emulation off. Existing large-chunk warnings remain. Supabase integration/schema/upload/security and physical dimensions were unchanged; test uploads used the local fixture. Real headset hardware remains untested.

Final ended-session inspection confirmed ended=true, no device frame handle, zero queued frame callbacks and null currentFrameCallbacks. Pointer-lock-dependent DevUI key bindings disappear after its React effects settle; no retained duplicate keyboard/capture handlers were found.
