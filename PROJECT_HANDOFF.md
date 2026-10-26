# VR Ceramic Configurator — Engineering Handoff

This document is the authoritative handoff for the VR Ceramic Configurator project. A new development session should read this file first, then inspect the current repository before making changes. Everything below was verified directly against the repository source on **2026-08-18** — not reconstructed from memory. Where the running code and this document ever disagree, trust the code and treat this file as stale.

**Project path:** `/home/nagham/vr-ceramic-configurator`

---

## 1. Product overview

A web-based, interactive 3D interior showroom for visualizing ceramic floor tile products at real physical scale before installation. Not a 360° video — a real, navigable Three.js/WebGL scene.

- **Desktop browsers**: full 3D navigation, ceramic switching, and camera tools work with no headset.
- **WebXR immersive VR**: the same page, same URL, adds an "Enter VR" flow for compatible browsers/headsets. Primary target headset family is **modern Meta Quest devices** (Quest Browser).
- The customer's core task: pick a ceramic product, see the floor update instantly at correct real-world tile size, inspect it up close (desktop "View Floor" or by walking/teleporting in VR), and compare two choices.

This is currently a **polished proof-of-concept / client demo**, not a commercial catalog-management platform. There is no backend, no database, no auth — the catalog is a static TypeScript array shipped with the app.

---

## 2. Current scope decision (binding)

**We are NOT currently expanding into backend development.** Do not assume the next task is Supabase, a database, authentication, an admin dashboard, dynamic product management, multi-tenant SaaS, payments, or accounts. Those were discussed only as *possible future directions* (see §31) and are explicitly not started.

> Keep the present client-demo scope frozen until the client reviews the concept and decides how far they want the product developed. A future backend/admin phase should happen only after explicit user approval.

---

## 3. Technology stack

Versions below are the **actually installed** versions (`node_modules/*/package.json`), which may be ahead of the `^`/`~` ranges in `package.json` since a range was never pinned down.

| Package | package.json range | Installed |
|---|---|---|
| react / react-dom | ^19.2.8 | 19.2.8 |
| three | ^0.185.1 | 0.185.1 |
| @react-three/fiber | ^9.7.0 | 9.7.0 |
| @react-three/drei | ^10.7.8 | 10.7.8 |
| @react-three/xr | ^6.6.30 | 6.6.30 |
| zustand | ^5.0.15 | 5.0.15 |
| vite | ^8.2.0 | 8.2.1 |
| typescript | ~6.0.2 | 6.0.3 |
| oxlint | ^1.75.0 | 1.78.0 |
| @vitejs/plugin-react | ^6.0.4 | (dev dep) |
| @types/three, @types/react, @types/react-dom, @types/node | — | (dev deps) |

Runtime used in this environment: Node v24.14.1, npm 11.11.0.

What each does here:
- **Vite** — dev server + production bundler. Config is default (`vite.config.ts` only registers `@vitejs/plugin-react`), no custom `base`, no aliasing.
- **React 19** — UI layer for both the 2D HUD/catalog overlay and declarative Three.js scene graph via R3F.
- **Three.js** — the actual WebGL renderer/scene graph.
- **@react-three/fiber (R3F)** — React reconciler that turns JSX into a Three.js scene.
- **@react-three/drei** — helper components used here: `OrbitControls`, `RoundedBox`, `Text` (troika-three-text, used only inside the in-VR panels).
- **@react-three/xr (pmndrs xr v6)** — WebXR session management, controller/hand input, teleport locomotion, `XROrigin`. Wraps `@pmndrs/xr` internally.
- **zustand** — single small global store for cross-component UI/camera/VR state (no React context, no Redux).
- **oxlint** — the only linter (no ESLint in this project). Config: `.oxlintrc.json`, plugins `react`, `typescript`, `oxc`.
- **TypeScript** — strict-ish config via `tsconfig.app.json`: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax` are all on. `noEmit: true` — Vite/esbuild does the actual transpilation; `tsc -b` is purely a type-check gate.

No test framework is installed (no Jest/Vitest/Playwright as a project dependency). Playwright was used only as an ad hoc, session-local verification tool via `npx`/global install during development — it is not a project dependency and there are no committed test files.

---

## 4. Directory / architecture map

```
src/
  App.tsx              Top-level composition: Canvas + XR + scene + HUD/catalog overlays
  App.css              All UI CSS (HUD, catalog, loading, error states) — single file
  index.css            Global reset (html/body/#root sizing)
  main.tsx             ReactDOM root, wraps <App/> in StrictMode

  catalog/
    types.ts            MaterialProduct, MaterialCategory, MaterialFinish, RoomDesign
    materials.ts         FLOOR_CERAMICS (the 3 demo products), CATALOG map, getProductById()
    README.md            Human walkthrough: how to add a new ceramic product

  materials/
    useTiledCeramicMaterial.ts   The core PBR + grout shader hook (see §7/§9)

  textures/
    generateCeramicTexture.ts   Procedural fallback generators (marble/travertine/darkstone)
    generateAbstractArt.ts      Procedural wall-art canvas texture
    generateSkyGradient.ts      Tiny gradient texture behind the window glass

  hooks/
    useCeramicTexture.ts        Loads real JPG from /public, falls back to procedural
    useOptionalTexture.ts       Loads normal/roughness maps only if a path is given
    useVRSupported.ts           Tri-state ("checking"|"supported"|"unsupported") WebXR probe

  scene/
    roomConfig.ts        ROOM (RoomDesign), WALL_THICKNESS, DOOR, WINDOW, VR_SPAWN
    Room.tsx             Walls, ceiling coffer, crown trim, skirting, door/window openings
    Wall.tsx             Generic wall-with-optional-opening (box-segment based, no CSG)
    Door.tsx             Closed door mesh (frame, panel, lever handle) filling the opening
    Window.tsx           Window frame, glass, mullions, sky-gradient backdrop
    CeramicFloor.tsx     The floor mesh — reads selected/compared product from the store
    Furniture.tsx        Sofa, coffee table, side table, floor lamp, plant, wall art, rug
    Lighting.tsx         Ambient + hemisphere + one shadow-casting directional "sun" + 1 point light
    DesktopControls.tsx  Mouse-look/WASD navigation + camera tween system (see §14 — read before touching)
    VRLocomotion.tsx     XROrigin, teleport target, snap-turn, mounts the in-world VR UI
    ReadySignal.tsx      Fires once on first rendered frame → tells App the scene is ready
    vr-ui/
      VRToolbar.tsx        Always-visible in-world "Materials" / "Return to Start" buttons
      VRMaterialPanel.tsx  In-world ceramic picker (opened via VRToolbar)
      VROnboarding.tsx     One-time in-world "Welcome" panel, dismissed via store flag

  ui/
    Hud.tsx              Top bar: brand, Reset Camera, View Floor, Enter VR, VR-availability note, nav hint
    CeramicCatalog.tsx   Desktop ceramic picker panel (lower-right, collapsible)
    CeramicThumbnail.tsx <img> that falls back to a generated data-URL swatch on load error
    LoadingScreen.tsx    Full-screen branded splash shown until ReadySignal fires
    ErrorBoundary.tsx    Class component catching WebGL/render failures → plain-language message

  state/
    useConfiguratorStore.ts   The one zustand store (see §5)

  xr/
    store.ts             createXRStore() — the single shared XR session store (see §17)

  config/
    brand.ts             { name: "VR Interior Studio", subtitle: "Interactive Finishing Experience" }

  utils/
    units.ts              cmToM() — the only unit-conversion helper

public/
  favicon.svg
  textures/ceramics/README.md       (no actual JPGs committed yet — see §10)
```

**Architecture flow:**

```
catalog/materials.ts (MaterialProduct[])
  → materials/useTiledCeramicMaterial.ts (builds a MeshStandardMaterial + grout shader)
  → scene/CeramicFloor.tsx (renders the floor mesh with that material)
  → scene/Room.tsx (composes floor + walls + ceiling + furniture)
  → App.tsx (mounts Room inside <Canvas><XR>)

state/useConfiguratorStore.ts (zustand)
  ← read/written by: CeramicCatalog.tsx, CeramicFloor.tsx, DesktopControls.tsx,
    Hud.tsx, VRLocomotion.tsx, VRToolbar.tsx, VRMaterialPanel.tsx, VROnboarding.tsx
```

There is no router, no context providers beyond R3F's own `<Canvas>`/`<XR>` context, and no server calls anywhere in the app.

---

## 5. State management (`useConfiguratorStore`)

One zustand store, no persistence, no middleware. Fields, verified from source:

| Field | Type | Purpose |
|---|---|---|
| `selectedFloorId` | `string` | Currently chosen ceramic product id |
| `previousFloorId` | `string \| null` | Auto-tracked previous selection, powers Compare |
| `setSelectedFloorId(id)` | fn | No-ops if `id` equals current; otherwise updates selection, sets `previousFloorId`, clears `compareActive` |
| `compareActive` | `boolean` | While true, the floor renders `previousFloorId` instead of `selectedFloorId` |
| `toggleCompare()` | fn | No-ops if there's no `previousFloorId` yet |
| `cameraResetToken` | `number` | Incremented by "Reset Camera"; `DesktopControls` watches this to trigger a tween |
| `resetCamera()` | fn | Increments the token |
| `floorViewActive` | `boolean` | Desktop "View Floor" toggle |
| `toggleFloorView()` | fn | Flips the boolean |
| `vrReturnToStartToken` | `number` | Incremented by VR "Return to Start"; `VRLocomotion` watches it |
| `triggerVrReturnToStart()` | fn | Increments the token |
| `vrPanelOpen` | `boolean` | In-world VR materials panel open/closed |
| `toggleVrPanel()` | fn | Flips the boolean |
| `vrOnboardingSeen` | `boolean` | Whether the VR welcome panel has been dismissed this session |
| `markVrOnboardingSeen()` | fn | Sets it true |

No `dedicationSeen` field exists — see §23/§24.

---

## 6. Material catalog model (`MaterialProduct`)

Exact current interface (`src/catalog/types.ts`):

```ts
interface MaterialProduct {
  id: string;
  name: string;
  code: string;                       // SKU shown in UI, e.g. "CR-001"
  category: MaterialCategory;         // "floor" | "wall" | "paint" | "marble" | "wood" |
                                       // "wallpaper" | "door" | "ceiling" | "fixture" |
                                       // "furniture" | "lighting"
  tileWidth: number;                  // cm
  tileHeight: number;                 // cm
  texture: string;                    // /public path to the real color/albedo JPG
  thumbnail?: string;                 // /public path to a catalog-card thumbnail
  baseColor: string;                  // hex, used by the procedural fallback + as a tint reference
  proceduralStyle: "marble" | "travertine" | "darkstone";
  groutWidth?: number;                // cm, defaults to 0.3 in the shader if unset
  groutColor?: string;                // defaults to "#999999" if unset
  normalTexture?: string;             // optional /public path, no procedural equivalent
  roughnessTexture?: string;          // optional /public path, no procedural equivalent
  roughnessValue?: number;            // 0 (mirror) – 1 (matte); ignored if roughnessTexture is set
  textureRotationDeg?: number;        // rotates both the texture and its grout grid
  finish?: "polished" | "matte" | "satin";  // customer-facing label only
  tileVariation?: number;             // 0–1 per-tile tone jitter, defaults to 0.05 in the shader
}
```

**Current demo catalog** (`src/catalog/materials.ts`, `FLOOR_CERAMICS`, in this exact order):

| id | name | code | tile size | finish | roughnessValue | groutWidth/Color |
|---|---|---|---|---|---|---|
| `ceramic-01` | Carrara White | CR-001 | 60×120 cm | polished | 0.28 | 0.4cm / `#bdb7ab` |
| `ceramic-02` | Travertine Beige | CR-002 | 60×60 cm | matte | 0.82 | 0.4cm / `#a98f6b` |
| `ceramic-03` | Dark Stone | CR-003 | 80×80 cm | satin | 0.42 | 0.4cm / `#332f2c` |

`CATALOG: Record<string, MaterialProduct[]>` currently only has a `floor` key pointing at `FLOOR_CERAMICS`. `getProductById(id)` searches `FLOOR_CERAMICS` only.

**Adding a new ceramic requires zero scene/UI code changes** — append an object to `FLOOR_CERAMICS`. Full walkthrough with a worked example already exists in `src/catalog/README.md`. Adding a whole new category (e.g. wall ceramics) is adding a new array + a new `CATALOG` key — every consumer already reads from whatever array it's given.

---

## 7. Real-world tile scale

This is load-bearing product behavior — do not regress it.

- `cmToM()` (`src/utils/units.ts`) converts catalog cm values to meters.
- In `useTiledCeramicMaterial.ts`: `repeatX = surfaceWidth / cmToM(tileWidth)`, `repeatY = surfaceLength / cmToM(tileHeight)`, where `surfaceWidth`/`surfaceLength` are the floor's real meter dimensions (`ROOM.width` = 4, `ROOM.length` = 5, from `roomConfig.ts`).
- The texture's `.repeat` is set to that ratio and `RepeatWrapping` is enabled on both axes — so a 60×120cm tile always occupies exactly 0.6×1.2m of floor regardless of the source image's own pixel aspect ratio (the procedural canvas is generated at a matching aspect; a real photo just needs to be a tileable square/near-square crop of one tile — see `public/textures/ceramics/README.md`).
- Edge tiles are **not** specially handled — the floor is one `PlaneGeometry(ROOM.width, ROOM.length)`, so tiles crop naturally at the room boundary exactly as real installed tile would.
- **One image is never stretched across the whole floor** — this was an explicit acceptance criterion in an earlier phase and was visually verified (screenshots showed clearly distinct grid density for 60×60 vs 60×120 vs 80×80).

---

## 8. Ceramic material / shader system

`useTiledCeramicMaterial()` (`src/materials/useTiledCeramicMaterial.ts`) builds one `THREE.MeshStandardMaterial` per selected product (standard PBR, not a custom `ShaderMaterial`), then injects fragment-shader code via `onBeforeCompile`. This preserves normal Three.js lighting or PBR compatibility (no custom lighting model to reason about) while adding:

1. **Physical tiling** — `applyTiling()` sets `wrapS/T = RepeatWrapping`, `repeat`, `center = (0.5,0.5)`, and `rotation` (from `textureRotationDeg`) on the color map and, if present, the normal/roughness maps.
2. **Per-tile tonal variation** — a cheap deterministic hash (`fract(sin(dot(tileIndex, vec2(12.9898,78.233)))*43758.5453123)`) keyed on `floor(vMapUv)` multiplies `diffuseColor.rgb` by `mix(1-tileVariation, 1+tileVariation, hash)`. Breaks up the "one continuous stretched texture" look with zero extra texture samples.
3. **Grout rendering** — computed from `fract(vMapUv)` against `edgeDist = min(uv, 1-uv)`:
   - Anti-aliased via `fwidth(tileUv)` (screen-space derivatives — requires WebGL2/GLSL ES 3.00, which is standard on Quest Browser and all modern desktop browsers) so the line stays crisp and non-flickering at any distance/angle, instead of a fixed-width `smoothstep`.
   - A secondary, wider `smoothstep` band just inside the grout line darkens `diffuseColor` slightly (`mix(0.8, 1.0, bevel)`) to fake a recessed-joint AO look before the final grout-color mix.
4. **Roughness** — `roughnessMap` if supplied (scalar roughness pinned to 1 so it doesn't double-darken); otherwise `product.roughnessValue ?? 0.82` (the module's `DEFAULT_ROUGHNESS`). `metalness` is hardcoded to `0.04` for every ceramic (a small non-zero value reads better under PBR than pure 0).
5. **Graceful degradation** — `normalTexture`/`roughnessTexture` are completely optional (`useOptionalTexture` returns `null` if unset or on load failure, no procedural equivalent is generated for these). None of the 3 demo products currently set them.

Material rebuild is memoized on `[texture, normalMap, roughnessMap, product.id, product.roughnessValue, product.groutColor, repeatX, repeatY, groutWidthUvX, groutWidthUvY, rotationDeg, tileVariation]`; the previous material is explicitly `.dispose()`d in a cleanup effect on every rebuild (texture instances are cached separately and are *not* disposed, since they're reused across reselection — see §21).

**Intended character per demo ceramic** (verified against actual `roughnessValue`s and the procedural generator, and confirmed via screenshot in a prior session): Carrara White = polished marble, moderate specular, restrained veining; Travertine Beige = matte/honed, warm beige, soft sedimentary banding; Dark Stone = satin charcoal (deliberately lightened from an earlier near-black draft that read as flat/featureless — see git history/commit "Polish VR ceramic showroom" and the tuning notes still in code comments).

---

## 9. Procedural fallback textures

`src/textures/generateCeramicTexture.ts` exports `generateCeramicCanvas(style, tileWidthCm, tileHeightCm, resolution = 768)`, drawing one physical tile onto an HTML canvas at an aspect ratio matching the tile's own cm ratio (so repeat-tiling never distorts). Three drawers:

- **`drawMarble`** — warm off-white base (`#f2ede3`), 5 soft radial "cloud" gradients for large-scale tonal drift, 2–4 restrained flowing veins per tile (drawn via a shared `drawVein()` helper using a slowly-drifting heading angle rather than a pure random walk, so veins read as elegant continuous marks, not scribbles), occasional faint secondary branch veins, very fine mottling, `addGrain()` at 0.015 for a photographed-not-vector look.
- **`drawTravertine`** — warm beige base (`#c9ad82`), 14–22 wavy horizontal sedimentary bands, sparse small pores (ellipses, both lighter and darker), `addGrain()` at 0.022.
- **`drawDarkStone`** — lightened charcoal base (`#524f49`), 9–12 overlapping soft clouds (deliberately dense so no region stays flat), 4 faint mineral veins, fine speckle, `addGrain()` at 0.03 (highest of the three — needed to keep detail visible under ambient-only light).

`addGrain()` does a real per-pixel `getImageData`/`putImageData` brightness jitter — this is a one-time CPU cost at texture-generation time (cached per product afterward via `useCeramicTexture`'s `Map` cache), not a per-frame cost.

**When used**: `useCeramicTexture` (`src/hooks/useCeramicTexture.ts`) always tries `product.texture` (a real JPG under `/public/textures/ceramics/`) first via `THREE.TextureLoader`; only on load failure does it call `buildProceduralTexture()` → `generateCeramicCanvas()`. **As of this handoff, no real JPGs exist in `public/textures/ceramics/` (only a README) — all three demo ceramics currently render 100% via the procedural path.** Dropping in `ceramic-01.jpg`/`ceramic-02.jpg`/`ceramic-03.jpg` (see `public/textures/ceramics/README.md`) will switch each one over automatically with no code change.

Anti-repetition strategy is deliberately the "simplest performant option," not a texture atlas: per-tile tonal variation (shader-side, §8) + a reasonably large 768px source canvas + non-repetitive vein/band placement. A texture-atlas approach was considered and explicitly rejected as unnecessary complexity for this phase.

Two other tiny procedural generators exist and are unrelated to the ceramic system: `generateAbstractArt.ts` (the wall-art canvas, cached module-level) and `generateSkyGradient.ts` (the gradient behind the window glass, cached module-level).

---

## 10. Current room

Single active room, defined in `src/scene/roomConfig.ts` as a `RoomDesign`-typed constant `ROOM = { id: "living-room-01", name: "Modern Living Room", width: 4, length: 5, height: 3 }` (meters). `WALL_THICKNESS = 0.12`, `DOOR = { width: 0.9, height: 2.1 }`, `WINDOW = { width: 1.8, height: 1.4, sillHeight: 0.9 }`, `VR_SPAWN = [0, 0, ROOM.length/2 - 0.9]`.

- **Floor**: `CeramicFloor.tsx`, the material system described in §8.
- **Walls**: `Wall.tsx` — a generic reusable component; openings (door/window) are cut by splitting the wall into up to 4 box segments rather than CSG, keeping geometry/draw-call count cheap and predictable.
- **Ceiling**: a flat plane plus a smaller inset plane + 4 thin trim boxes forming a shallow coffered-panel look (`Room.tsx`), plus crown trim boxes at every wall/ceiling junction and skirting boxes at every wall/floor junction — all sharing one `trimMaterial` to minimize material count.
- **Door**: `Door.tsx` — a *closed* door (frame + panel + horizontal lever handle) filling the front-wall opening; it is not walkable through (there is no exterior scene behind it).
- **Window**: `Window.tsx` — slim matte-black frame, mullions, a semi-transparent `MeshPhysicalMaterial` glass pane, and a small gradient-canvas "sky" backdrop plane positioned just outside the glass so the opening never reads as a black void.
- **Furniture** (`Furniture.tsx`, all primitive geometry — `RoundedBox`/cylinders/spheres/cones, no imported GLTF assets): a 2-seat sofa, a round coffee table, a small round side table with a decorative sphere "vase," a slim floor lamp with its own small non-shadow-casting point light, a potted plant, a framed abstract-art canvas, and a small area rug (deliberately undersized so most of the floor stays visible).

**Design principle (explicit, load-bearing)**: *the floor is the hero; the room supports the floor.* This drove several concrete decisions: furniture is intentionally lightweight/primitive rather than photorealistic asset-pack quality, the rug was shrunk multiple times, and the catalog panel was moved off the floor's center (§13).

---

## 11. Lighting

`src/scene/Lighting.tsx`, current values:

- `ambientLight` intensity `0.5`
- `hemisphereLight` args `["#cfe3f7", "#736a5c", 0.46]` (sky/ground colors + intensity)
- One `directionalLight` ("sun"), the **only shadow-casting light** in the scene: intensity `2.4`, color `#fff2dd`, positioned outside the window wall (`[halfW+2.2, ROOM.height+1.4, WINDOW.sillHeight+0.6]`) and aimed via a real `<object3D>` target (`position={[0, 0.4, 0.2]}`) parented into the scene graph — **do not** switch this back to the `target-position` JSX shorthand; a `DirectionalLight.target` only gets a correctly-updating `matrixWorld` if it's an actual scene-graph object, not a detached one (this was fixed deliberately, see the comment in the file). `shadow-mapSize=[1024,1024]`, `shadow-radius=2.5`, `shadow-bias=-0.0008`.
- One non-shadow-casting `pointLight` near the ceiling center, intensity `0.85`, distance `6.5`, for warm interior fill.
- `Canvas` uses `shadows="variance"` (VSM shadow map) — deliberately not the default/boolean `shadows` prop, which resolves to the now-deprecated `PCFSoftShadowMap` and prints a console warning in current Three.js.

The ambient/hemisphere/point values were raised from an earlier, flatter pass specifically because Dark Stone was reading as crushed/near-black in shadowed areas — if you ever darken these again, re-check Dark Stone in a shadowed part of the room, not just under direct light.

No post-processing pipeline exists anywhere (no `@react-three/postprocessing`, no bloom/SSAO/DOF) — this is an intentional, standing decision for Quest performance headroom, not an oversight.

---

## 12. Desktop user experience

Flow: open the showroom → hero view loads → pick a ceramic (floor updates instantly, no reload) → optionally **View Floor** to inspect tiles up close → **Compare** against the previous pick → **Back to Room** / **Reset Camera** → optionally **Enter VR** if supported.

Concretely, in `Hud.tsx` + `CeramicCatalog.tsx` + `DesktopControls.tsx`:
- **Look**: click-drag orbit (via drei `OrbitControls`, constrained — see §13).
- **Move**: WASD / arrow keys, `MOVE_SPEED = 2.2` m/s, clamped to stay `MARGIN = 0.35` m inside the walls. Disabled while `floorViewActive`.
- **Zoom**: mouse wheel adjusts camera `fov` directly (35°–75° clamp) rather than dollying the camera — a deliberate choice, since a real dolly would fight the orbit-radius trick described in §13.
- **Reset Camera**: tweens back to the hero pose, also force-clears `floorViewActive` if it was on.
- **View Floor / Back to Room**: one button whose label and behavior flip based on `floorViewActive` (see §13 for the camera mechanics).
- **Compare**: only rendered once a `previousFloorId` exists; label reads "Compare with {other product}" / "Comparing with {current product}".
- **Nav hint** ("Drag to look around · WASD to walk · Scroll to zoom"): fades out after 6s or on first `keydown`/`pointerdown`, whichever comes first (`Hud.tsx`, `HINT_FADE_MS = 6000`).
- **Catalog collapse**: defaults open at `window.innerWidth >= 640`, otherwise starts as a small edge tab; user can toggle either way regardless of width (`CeramicCatalog.tsx`).

---

## 13. Camera system — read this before touching `DesktopControls.tsx`

Four states, all in `src/scene/DesktopControls.tsx`:

- **Default hero pose**: `INITIAL_POSITION = (0.2, 1.5, 1.65)`, aimed at `INITIAL_LOOK_POINT = (0.1, -0.15, -1.4)` — computed into an actual `INITIAL_TARGET` at `LOOK_RADIUS` (0.1m) from the position (see below for why).
- **View Floor**: `FLOOR_VIEW_POSITION = (0, 1.55, 2.2)`, `FLOOR_VIEW_TARGET = (0, 0, 0.4)` — deliberately centered over the open entry area, not toward the furniture cluster or the window wall (both were tried and rejected — see the comment block above the constants for exactly why: a wide FOV still catches the sofa at the frame edge even from a "safe" distance, and standing close to the window wall makes the glass material render oddly at a grazing angle).
- **Back to Room**: returns to whatever pose was saved immediately before View Floor was toggled on (not necessarily the hero pose, if the user had walked elsewhere first).
- **Reset Camera**: always tweens to the exact hero pose and clears `floorViewActive`, regardless of current state.

All transitions are a manual `lerpVectors` tween (`TWEEN_DURATION = 0.8`s, `easeInOutCubic`) driven inside the component's own `useFrame`, not `OrbitControls`' built-in damping.

### The bug that was found and fixed — do not reintroduce it

`OrbitControls` recomputes `camera.position` from `controls.target` at a **clamped radius** on every single `update()` call (`minDistance`/`maxDistance`). The very first implementation of View Floor hardcoded `minDistance={LOOK_RADIUS} maxDistance={LOOK_RADIUS}` (0.1m) as fixed JSX props, because that tiny fixed radius is what makes `OrbitControls` fake a first-person mouse-look while walking (orbiting a target 10cm in front of the camera looks like turning your head). But that same fixed 0.1m clamp also applied to View Floor's real several-meter camera-to-target distance — so the instant `controls.update()` ran after the tween, the camera snapped back to within 10cm of the target, in the same direction, producing exactly the "extreme macro shot right above the tile" bug that was reported and fixed.

**The fix**, present in the current code: `minDistance`/`maxDistance` are no longer static props at all — they are set **imperatively, every frame**:
- During any tween, they're set to the *live interpolated* `camera.position.distanceTo(controls.target)` every frame, so the clamp tracks the animation instead of fighting it.
- At rest, they're set to `LOOK_RADIUS` (0.1) in walk mode or `FLOOR_VIEW_RADIUS` (`FLOOR_VIEW_POSITION.distanceTo(FLOOR_VIEW_TARGET)`, ~2.66m) in floor-view mode.
- The `<OrbitControls>` JSX no longer passes `minDistance`/`maxDistance` at all.

> **Do not restore a fixed 0.1m `OrbitControls` radius globally, and do not add `minDistance`/`maxDistance` back as static JSX props.** Any camera mode with a real target distance (View Floor, or a future mode) needs this same "track the live radius, then pin it at rest" treatment or it will silently collapse back into a macro shot the moment `controls.update()` runs.

This was visually verified (screenshots) after the fix: View Floor genuinely shows a multi-tile, human-scale, angled architectural view, not a close-up.

---

## 14. Catalog UI

`src/ui/CeramicCatalog.tsx` + the `.catalog-*` rules in `App.css`. Docked lower-right (`position: absolute; right: 20px; bottom: 20px; top: 106px`), sized to content (`height: fit-content`, `max-height: calc(100vh - 126px)`, `overflow-y: auto` as a safety net), **not** spanning the bottom of the screen — that was an earlier layout (bottom-center, full-width) that was deliberately replaced because it covered too much of the floor.

Contents when open: title, a "selected product" info line (name · code · dims · finish), a full-width "Compare" button (only when a previous selection exists), then a vertical stack of product rows (60×60px live thumbnail + name/code/dims+finish), with the currently-displayed product's row highlighted. A `✕` button collapses it to a small edge tab (`.catalog-tab`, "◧ Materials") docked to the same right edge.

Responsive: at `max-width: 640px` the panel becomes a bottom sheet (`left/right: 12px; bottom: 12px; top: auto`) and the card list switches to a horizontal scrolling row instead of a vertical stack; the `vr-availability-note` is hidden entirely below 640px to reduce clutter. Verified viewport sizes (via headless-browser screenshots in a prior session): 1920×1080, ~1400×900, ~820×1180 (tablet), 390×844 (mobile) — catalog stayed collapsed-by-default only below 640px, no overlap/clipping observed at any size.

---

## 15. WebXR / Meta Quest architecture

`src/xr/store.ts` — a single module-level `xrStore = createXRStore({ controller: { teleportPointer: true }, hand: { teleportPointer: true }, emulate: import.meta.env.PROD ? false : undefined })`. `emulate` is explicitly disabled in production builds; see §16 for why.

- **Support detection**: `useVRSupported()` (`src/hooks/useVRSupported.ts`) is a tri-state hook (`"checking" | "supported" | "unsupported"`) built on `navigator.xr.isSessionSupported("immersive-vr")`. `"checking"` renders nothing (avoids a flash of the wrong state).
- **Desktop, unsupported**: `Hud.tsx` shows a small secondary note ("🥽 VR Experience Available — Open this experience on a compatible headset.") instead of a dead "Enter VR" button. No WebXR jargon in any customer-facing string.
- **Compatible device**: an "Enter VR" button appears and calls `xrStore.enterVR()`.
- **Failure handling**: `handleEnterVR` wraps `enterVR()` in try/catch; on rejection (real failure *or* the user declining the permission prompt — the API doesn't distinguish) it shows a transient toast ("Couldn't start VR. Please try again.", auto-dismisses after 4.5s) rather than an uncaught rejection.
- **Session-aware controls swap**: `App.tsx`'s `SceneControls` reads `useXR(s => s.session != null)` and renders `<VRLocomotion/>` or `<DesktopControls/>` accordingly.

---

## 16. VR customer experience

All in `src/scene/VRLocomotion.tsx` + `src/scene/vr-ui/*`.

- **Locomotion**: `useXRControllerLocomotion(originRef, false, { type: "snap", degrees: 30, deadZone: 0.5 })` — the `false` explicitly disables smooth joystick translation; only snap-turn rotation comes from the thumbstick. Translation is teleport-only, via `<TeleportTarget>` wrapping an invisible plane sized exactly to `ROOM.width × ROOM.length`, so **the player physically cannot teleport outside the room** (the ray simply has nothing to hit past the room bounds). This is a deliberate motion-sickness-avoidance decision — do not add smooth locomotion without discussing it first.
- **Return to Start**: `triggerVrReturnToStart()` increments a store token; `VRLocomotion` watches it and does `originRef.current.position.set(...VR_SPAWN)` — **translation only**, it never touches head orientation (which stays under the headset's own tracking at all times, by design).
- **VR onboarding**: `VROnboarding.tsx`, an in-world panel (mesh + drei `Text`, *not* HTML — WebXR immersive-vr sessions on Quest Browser don't render DOM overlays) shown once, gated by the store's `vrOnboardingSeen` boolean (not sessionStorage — it only needs to survive a same-session exit/re-entry of VR, not a page reload). Dismissed via a "Start Experience" in-world button.
- **In-world materials panel**: `VRMaterialPanel.tsx`, toggled by `VRToolbar.tsx`'s always-visible "Materials"/"Close Materials" button. Both are children of `<XROrigin>`, so they track the player's teleport position and snap-turn rotation but do **not** chase head-look the way a camera-attached panel would (explicit anti-"stuck in your face" design choice).
- **Controller/hand input**: no VR-specific input code exists anywhere in these components — they're plain R3F meshes with `onClick`. `@react-three/xr`'s pointer-events system (wired up by `<XR>`) routes controller-ray clicks, hand-pinch, and desktop mouse clicks through the exact same React event, so selecting a ceramic works identically whichever input method is active. This was a deliberate architectural simplification, not an oversight.
- **Room-scale safety**: `VR_SPAWN = [0, 0, ROOM.length/2 - 0.9]` was placed to be clear of every piece of furniture at spawn.

---

## 17. Real Quest hardware verification status

**Not yet verified on a real Meta Quest headset. Do not claim otherwise in any future report.**

Everything in §16 is implemented against the documented `@react-three/xr` v6 / WebXR APIs and has been verified only via:
- TypeScript compiling cleanly against the actual installed type definitions.
- A headless desktop Chrome instance (`--use-gl=swiftshader`) confirming `navigator.xr` exists, `isSessionSupported` resolves correctly, and the HUD's tri-state VR messaging renders correctly for the "unsupported" desktop case.

**Still requires physical-device testing:**
- Immersive session actually starting on-device.
- Controller ray selection of ceramic rows/buttons.
- Hand-pinch selection (structurally should work per the pointer-events architecture, never physically tested).
- Teleport arc rendering and destination accuracy.
- Snap-turn comfort/feel.
- In-world VR UI legibility and physical placement/reach comfort (panel sizes were chosen by estimation, not measured against a headset).
- Frame rate and thermal behavior over a real session.
- How the ceramic materials actually look through headset optics/lenses.

---

## 18. IWER / development emulation

`@react-three/xr` (via `@pmndrs/xr`) bundles the IWER (Immersive Web Emulation Runtime) desktop emulator as part of `createXRStore()`'s default behavior — it lazy-imports `emulate.js` and, if `emulate !== false` and the page is on `localhost`, tries to inject a virtual XR device (default `metaQuest3`) so `isSessionSupported`/`enterVR` work without a headset during local dev.

- In **this specific dev sandbox**, IWER detected that a native (but hardware-less) `navigator.xr` already exists on the test Chrome build and deferred to it — so the emulator never actually engaged, and "Enter VR" was never exercised even in dev. This is environment-specific; a normal developer machine may behave differently.
- **Production explicitly disables it**: `xr/store.ts` sets `emulate: import.meta.env.PROD ? false : undefined`. The IWER JS chunks (`office_small`, `meeting_room`, `office_large`, `living_room`, `music_room`, `emulate-*` — visible in `vite build` output, several hundred KB to ~2MB each) still exist as separate files in `dist/` because Rollup can't statically eliminate a third-party library's own `import()` call site — but because `emulate` is `false` at runtime, the code path that would `await import('./emulate.js')` never executes, so **a real visitor's browser never fetches them**. This was traced through the `@pmndrs/xr` source in an earlier session (`store.js`: `if (typeof window !== 'undefined' && emulate != false) { ... await import('./emulate.js') ... }`).
- **Do not treat any desktop/headless/IWER-based test as equivalent to real Quest hardware validation** (see §17).

---

## 19. Performance work already done

- **Per-frame allocations**: `DesktopControls.tsx`'s hot `useFrame` loop uses module-level scratch `THREE.Vector3`s (`scratchForward`, `scratchRight`, `scratchMove`) reused via `.set()`/mutation instead of `new THREE.Vector3()` every frame. This was a deliberate fix for a previously-flagged anti-pattern.
- **Shadow lights**: exactly one shadow-casting light in the whole scene (the directional "sun"). The floor lamp's point light and the ceiling fill point light are both non-shadow-casting.
- **Materials/geometry reuse**: `Room.tsx` shares one `trimMaterial` across skirting, crown, and ceiling-reveal trim; `Furniture.tsx` shares materials across repeated legs/elements via a small `mat()` helper.
- **Texture sizes**: procedural ceramic canvases are 768px on the long edge (`generateCeramicCanvas`'s default `resolution`); catalog thumbnails render at 128px, VR panel swatches at 96px — deliberately small, separate resolutions per use case rather than one large shared texture. Real photography guidance (documented in `public/textures/ceramics/README.md`) targets ~1024px/~80% JPEG/under ~500KB.
- **Pixel ratio**: `Canvas` is configured with `dpr={[1, 1.5]}`, capping device-pixel-ratio scaling (relevant mainly for high-DPI desktop displays; irrelevant inside an active XR session, where the headset compositor controls resolution).
- **XR emulator**: disabled in production (§18) specifically so its chunk weight can never reach a real visitor.
- **Post-processing**: none exists, by deliberate standing decision (§11) — do not add bloom/SSAO/DOF to "improve" visuals without discussing Quest performance impact first.
- **Anisotropy**: fixed at `4` on all loaded/generated ceramic textures (`useCeramicTexture`, `useOptionalTexture`) — a conservative, cheap value, not renderer-capability-queried.

**Guiding philosophy for the next session**: visual quality improvements should come from better composition, materials, and lighting placement — not from adding expensive effects. This was stated explicitly by the user in an earlier phase and should still hold.

---

## 20. Loading / error experience

- **`ReadySignal.tsx`**: a no-render R3F component whose `useFrame` fires `onReady()` exactly once, on the first actually-rendered frame — this is how `App.tsx` knows to hide the loading screen (based on real render completion, not a fixed timer).
- **`LoadingScreen.tsx`**: full-screen branded splash ("VR Interior Studio" / "Preparing your showroom…" / an indeterminate CSS bar animation), shown via `{!sceneReady && <LoadingScreen/>}` in `App.tsx` until `ReadySignal` fires.
- **`ErrorBoundary.tsx`**: a class component (required — React only supports error boundaries as classes) wrapping the entire `<Canvas>` + HUD + catalog tree in `App.tsx`. Catches render-time failures (most commonly a WebGL context that couldn't be created) and shows a plain-language fallback message instead of a blank page.
- **Missing texture fallback**: covered in §9 — any real JPG 404/load failure silently falls back to the procedural generator, no user-visible error.
- **`useOptionalTexture`** (normal/roughness maps): a load failure just resolves to `null`, no fallback generation, no error shown — the material simply renders without that map.

---

## 21. Branding

Centralized in `src/config/brand.ts`: `BRAND = { name: "VR Interior Studio", subtitle: "Interactive Finishing Experience" }`. Consumed by `Hud.tsx` (top-left brand block) and `LoadingScreen.tsx`. `index.html`'s `<title>` is a separate, manually-synced string ("VR Interior Studio — Interactive Finishing Experience") since it can't import a TS constant — keep these in sync by hand if the brand ever changes.

**No dedication of any kind currently exists.** See §22.

---

## 22. Removed / reverted work — do not restore without being asked

### Arabic dedication intro

A cinematic, RTL Arabic full-screen dedication ("إلى هدير…" + two lines of gratitude text) was built as a one-time, session-gated intro overlay (`sessionStorage` key `dedicationSeen`, ~4.4s fade-in/hold/fade-out, Amiri Google Font, warm dark radial-gradient background), shown before the showroom on first load. It was fully implemented, visually verified (correct RTL shaping, no white flash, responsive on mobile), and then **explicitly and completely reverted by user request in the same session.**

Files that existed and were deleted: `src/ui/Dedication.tsx`, `src/utils/dedicationSession.ts`. Also reverted: the Amiri `<link>` tags in `index.html`, the `.dedication-*` CSS block in `App.css`, and the import/state/render wiring in `App.tsx`.

The revert was verified to be **byte-for-byte identical** to the pre-dedication build (matching output JS/CSS hashes and module count between the pre-dedication build and the post-revert build).

**Current desired state: no dedication intro.** Do not reintroduce any part of this (component, session-storage gating, font links, CSS) unless the user explicitly asks again. If asked again, note that a working, previously-verified implementation approach exists in the conversation history that produced it — but since it was fully deleted from the repo, it would need to be rebuilt from scratch by design and specification, not restored from any remaining file.

---

## 23. Workstation safety rule (must be followed)

**Never run broad process-kill commands** such as `pkill -9 -f "google-chrome-stable"` (or any bare-name variant) — this machine has the user's real, regular Chrome browser running as an ordinary long-lived process, and a broad name-match kill will terminate it too. This exact mistake was made and caught mid-session previously; a permanent feedback-memory entry exists about it outside this repo.

Allowed cleanup, scoped only to what can be positively identified as test/dev infrastructure:
- Dev server: `lsof -ti:5173 -sTCP:LISTEN | xargs -r kill`
- Preview server: `lsof -ti:4173 -sTCP:LISTEN | xargs -r kill`
- Headless/Playwright browser processes, **only** if identifiable by a distinguishing launch flag unique to the automated instance (e.g. `ps aux | grep -- "--use-gl=swiftshader"`, the flag actually used when launching headless test browsers in this project's verification sessions) — never by bare executable name.
- If a browser process cannot be safely and specifically identified as test infrastructure, **leave it running.**

---

## 24. Development commands

Verified working against the current `package.json` in this session:

```bash
cd /home/nagham/vr-ceramic-configurator

npm run dev        # Vite dev server, http://localhost:5173
npm run build      # tsc -b && vite build → dist/
npm run preview    # serves the production build, http://localhost:4173

npx tsc -b         # type-check only (noEmit), same check `build` runs first
npm run lint       # oxlint
```

No `npm test` script exists — there is no test suite.

---

## 25. Current quality / verification status

As of this handoff (freshly re-run, not carried over from memory):

- `npx tsc -b` — **clean, 0 errors.**
- `npm run lint` (oxlint) — **clean, 0 errors, 0 warnings.**
- `npm run build` — **clean.** Output includes a chunk-size warning (several IWER-related chunks over 500kB — see §18, expected and inert in production) but no errors.
- `git status` — **clean working tree**, nothing to commit.

**Desktop/browser verified** (in prior sessions, via headless Chrome + manual screenshot review): ceramic switching, real tile scale across all three products, grout rendering, View Floor (post-fix), Reset Camera, Compare, catalog collapse/expand, responsive layout at 4 viewport sizes, zero console errors and zero failed asset requests across all of the above and across both the dev server and the production `preview` build.

**Real Quest hardware: not verified** — see §17. Do not conflate the two.

---

## 26. Deployment status

- **Not currently deployed.** The app is production-build-ready (§25) but no deployment has occurred from within any session on record.
- **Intended target**: Vercel, served over HTTPS, with the same public URL expected to work for both desktop browsers and the Meta Quest Browser.
- No environment variables, secrets, or server-side code exist anywhere in the project — it is a fully static SPA (confirmed: no `.env*` files, no `process.env`/`import.meta.env` usage beyond the standard Vite `DEV`/`PROD` built-ins in `xr/store.ts`).

**Git state** (verified directly):
- Git repository **is initialized** (this may be new since an earlier session that reported "not a git repository" — trust this file/current state).
- Remote `origin` → `https://github.com/n7rawy1984/vr-ceramic-.git` (both fetch and push).
- Current branch: `main`, up to date with `origin/main`.
- Working tree: clean, nothing uncommitted.
- Commit history (2 commits, newest first):
  - `19be607` — "Polish VR ceramic showroom" (this commit is the dedication-intro revert — it deletes `src/ui/Dedication.tsx` and `src/utils/dedicationSession.ts` and trims `App.tsx`/`App.css`/`index.html`)
  - `2458aa4` — "Initial VR ceramic configurator" (the full pre-revert project state, which still included the dedication files at that point in history)
  - Author on both: `Mohamed Elnahrawy <n7rawy1984@gmail.com>`
- Whether `origin/main` on GitHub has been pushed to/is in sync was not independently verified beyond what `git status` reports locally (it reports "up to date with 'origin/main'", implying a fetch has occurred and there's no divergence, but no live network check to GitHub was performed in this handoff).

---

## 27. Important product decisions (binding)

1. Continue the existing project; do not rewrite from scratch.
2. Web application + WebXR, not a 360° video.
3. Meta Quest is the primary VR target.
4. Desktop must remain fully usable without a headset.
5. Real-world tile sizing is non-negotiable (§7).
6. The floor is the main product/focal point; the room supports it (§10).
7. The catalog must not obscure the floor (§14).
8. Quest performance takes priority over expensive visual effects (§19).
9. No backend/admin work until client scope is confirmed (§2).
10. No real Quest verification has happened yet (§17) — never claim otherwise.
11. No dedication intro in the current desired build (§22).

---

## 28. Known limitations / open items

Honest, code-verified list — not speculative:

- No physical Quest validation yet (§17).
- All three demo ceramic textures are currently 100% procedural — no real product photography has been added to `public/textures/ceramics/` yet (§9, verified: the folder contains only a README).
- Furniture is intentionally simple primitive geometry, not photorealistic asset-pack quality (§10) — this is a deliberate performance/scope choice, not an oversight.
- No backend/catalog administration exists (§2) — intentional.
- No real client ceramic catalog has been imported — the 3 demo products are placeholders.
- Not yet deployed anywhere (§26).
- The root `README.md` is still the unedited default Vite template text — cosmetic only, not user-facing.
- No automated test suite exists (§3/§24).
- Large IWER-related JS chunks appear in the production build output (§18) — confirmed inert/never-fetched in production, but worth knowing about if someone is auditing bundle size.

---

## 29. Possible future directions — NOT approved, do not start automatically

Recorded only as possibilities discussed in passing, not tasks:

- Real client ceramic catalog import
- Wall ceramic, porcelain, marble, wood flooring, paint categories
- Additional rooms (bedroom, bathroom, kitchen — `RoomDesign`/`roomConfig.ts` was structured to make this easy later, but only one room is wired up today)
- Admin dashboard for catalog management
- Supabase or any other database
- Authentication / accounts
- Private/gated showroom access
- Dynamic catalog uploads
- Saved customer designs
- Client-specific floor plans

> None of these should be started automatically. Wait for explicit user/client direction.

---

## 30. Instructions for the next Claude session

1. Read this entire `PROJECT_HANDOFF.md` first.
2. Inspect the current repository and run `git status` — treat the actual code as source of truth over this document if they ever disagree.
3. Do not assume future scope (§2, §29) — no backend, no new features, no deployment unless explicitly requested in the new conversation.
4. Get the next concrete task from the user before making changes.
5. Preserve current working desktop/VR/material behavior — read §13 in full before touching camera code, and read §8 before touching the ceramic material/shader.
6. Before major changes, run the baseline checks (`npx tsc -b`, `npm run lint`, `npm run build`) so you know the starting state is clean.
7. After changes, verify both code quality (same three commands) and actual rendered behavior where relevant (a headless-browser screenshot check is the established pattern in this project's history for visual changes — plain build success does not verify visual/behavioral correctness).
8. Never claim physical Meta Quest hardware testing unless physical hardware was actually used in that session (§17).
9. Follow the workstation safety rule on browser process termination without exception (§23).
10. If asked to touch git (commit/push/etc.), confirm scope with the user first — this handoff only documents the current git state, it does not authorize any git operations.
