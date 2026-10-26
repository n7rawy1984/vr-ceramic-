# PROJECT MASTER REFERENCE — DRAFT

Audit date: **2026-10-25 (Asia/Dubai)**. Repository: `/home/nagham/vr-ceramic-configurator`.

**Status: draft awaiting user review. No implementation milestone is authorized by this document.** This audit created only this file. Current implementation statements below derive from source inspected at `19be60738a919666d5a03c05ee33cbc31fb58ce9`; future direction derives from the user's takeover request. Source wins over historical documentation for present behavior. The user's new direction wins over historical roadmaps. This draft does not silently promote itself to `PROJECT_MASTER_REFERENCE.md`.

# 1. Executive Summary

Today this is a compact, working-code proof of concept for a static 3D ceramic showroom: one rectangular room, three demo floor products, physical texture repetition, shader grout, desktop navigation, previous-product comparison, and an implemented WebXR path. It is not yet an installation design or quantity calculation system. All shipped ceramic appearances currently depend on procedural fallbacks because product images are absent.

The primary product is becoming a **Professional Web Tile & Interior Finish Configurator**, desktop/web first. Engineers, designers, showrooms, and homeowners should be able to evaluate actual installation geometry before execution. VR/WebXR is **preserved, frozen future capability**, not the next investment area.

The existing separation of catalog, store, material hook, scene, and navigation is healthy enough for incremental evolution. Preserve it; add a shared installation model and layout compiler rather than rewriting the application or teaching a repeated-texture shader to impersonate a full layout engine.

# 2. Product Vision

Future users should configure rooms, upload actual products with exact dimensions, assign surfaces, combine products and sizes, select patterns, design borders and center motifs, adjust grout/orientation/origin/alignment, and view matching professional 2D and realistic 3D results. Design alternatives and eventual quantities, cut pieces, waste, and technical output provide commercial value.

The target is a real geometric installation, not one flattened image. Example: 60×60 cm field, 10 cm dark perimeter band, a separate inner frame, and a 120×120 cm decorative center. These are independent logical/geometric areas and placements. None of those zone or multi-product installation features exists today.

# 3. Current Verified Stack

`package.json` version `0.0.0`, private ESM package `vr-ceramic-configurator`. Lockfile is npm `package-lock.json`, lockfileVersion 3. The installed direct package versions were read and agree with the lockfile:

| Package | Declared range | Locked / installed |
|---|---|---|
| react | ^19.2.8 | 19.2.8 |
| react-dom | ^19.2.8 | 19.2.8 |
| three | ^0.185.1 | 0.185.1 |
| @react-three/fiber | ^9.7.0 | 9.7.0 |
| @react-three/drei | ^10.7.8 | 10.7.8 |
| @react-three/xr | ^6.6.30 | 6.6.30 |
| zustand | ^5.0.15 | 5.0.15 |
| @types/three | ^0.185.4 | 0.185.4 |
| @types/node | ^24.13.3 | 24.13.3 |
| @types/react | ^19.2.17 | 19.2.18 |
| @types/react-dom | ^19.2.3 | 19.2.4 |
| @vitejs/plugin-react | ^6.0.4 | 6.0.5 |
| oxlint | ^1.75.0 | 1.78.0 |
| typescript | ~6.0.2 | 6.0.3 |
| vite | ^8.2.0 | 8.2.1 |

The first eight entries are in `dependencies`, including `@types/three`; the rest are `devDependencies`. Observed tools: Node `v24.14.1`, npm `11.11.0`.

Scripts: `dev: vite`; `build: tsc -b && vite build`; `lint: oxlint`; `preview: vite preview`. No test script/framework or committed automated tests were found.

`vite.config.ts` registers only the React plugin; no custom base, aliases, HTTPS, or deployment behavior. `tsconfig.json` references app/node projects. App target/lib are ES2023 plus DOM; bundler resolution, React JSX, noEmit, unused-symbol checks, erasableSyntaxOnly, and skipLibCheck are enabled. `strict` is not enabled explicitly. Build-info destinations are under `node_modules/.tmp/`. `.oxlintrc.json` enables react/typescript/oxc plugins and hooks/refresh rules. No ESLint configuration is used.

Read-only checks performed in this audit: local `tsc -p tsconfig.app.json --noEmit --incremental false`, corresponding `tsconfig.node.json` check, and local `oxlint`, all completed without diagnostics. A fresh production build was deliberately not run because it writes `dist/` and build metadata. Existing `dist/` is not fresh verification. No browser or hardware test was performed in this audit. Historical build/browser results are attributed in §13.

# 4. Repository / Git Status

- Branch: `main`, locally tracking `origin/main`, with no reported divergence at inspection. No fetch or network verification was performed.
- Remote fetch/push: `https://github.com/n7rawy1984/vr-ceramic-.git`.
- Initial tracked working tree: no changes. Initial untracked file: **`PROJECT_HANDOFF.md`**, already present before this audit; preserve it.
- This audit adds only `PROJECT_MASTER_REFERENCE_DRAFT.md`, also untracked. No commit, push, reset, or branch mutation was performed.
- Recent history contains two commits: `19be607` (“Polish VR ceramic showroom”), then `2458aa4` (“Initial VR ceramic configurator”). The actual latest diff removes dedication components and wiring (5 files, 160 deletions); its title is not evidence of separate material tuning changes. No dedication remains in current source.
- `node_modules/` and `dist/` exist and are ignored. Other ignore rules include logs, `*.local`, and editor artifacts.
- Public assets: `public/favicon.svg` and `public/textures/ceramics/README.md` only. No actual ceramic JPGs, thumbnails, normal maps, or roughness maps.
- No deployment provider configuration, CI workflow, backend, or environment file was found in the inspected project tree. Historical handoff says undeployed and Vercel intended; external deployment status is **not independently established** by local absence of config. HTTPS hosting will matter when VR is reactivated, but no deployment is authorized now.

Documentation inspected: root `README.md`, all of `PROJECT_HANDOFF.md`, `src/catalog/README.md`, and `public/textures/ceramics/README.md`. No separate roadmap/backlog/session-log files were found. No applicable `AGENTS.md` was found in the project or checked ancestor locations.

# 5. Current Architecture Map

| File / folder | Verified responsibility |
|---|---|
| `src/main.tsx` | React root, StrictMode, global CSS |
| `src/App.tsx` | ErrorBoundary; R3F Canvas; XR wrapper; Lighting, Room, Furniture, SceneControls, ReadySignal; DOM HUD/catalog |
| `src/catalog/types.ts` | MaterialProduct, category/finish/style unions, RoomDesign |
| `src/catalog/materials.ts` | Three static FLOOR_CERAMICS, CATALOG, floor-only getProductById |
| `src/state/useConfiguratorStore.ts` | In-memory Zustand selection/compare, camera tokens/flag, VR UI/return/onboarding state |
| `src/hooks/useCeramicTexture.ts` | Albedo loader, id-keyed texture cache, procedural fallback |
| `src/hooks/useOptionalTexture.ts` | URL-keyed auxiliary-map cache, optional normal/roughness loading |
| `src/materials/useTiledCeramicMaterial.ts` | applyTiling; MeshStandardMaterial; grout/variation shader injection; material disposal |
| `src/textures/` | generateCeramicCanvas; cached art and sky textures |
| `src/scene/CeramicFloor.tsx` | Resolve displayed product, create material, render one floor plane |
| `src/scene/roomConfig.ts` | ROOM, WALL_THICKNESS, DOOR, WINDOW, VR_SPAWN |
| `src/scene/Room.tsx`, `Wall.tsx`, `Door.tsx`, `Window.tsx` | Room shell, segmented openings, trim, door, glazing/backdrop |
| `src/scene/Furniture.tsx` | Primitive furniture, rug, decorative art and lamp light |
| `src/scene/Lighting.tsx` | Ambient/hemisphere, targeted directional shadow light, ceiling fill |
| `src/scene/DesktopControls.tsx` | Look/walk, wheel FOV, floor/return/reset tweens |
| `src/scene/VRLocomotion.tsx` | XROrigin, teleport target, snap turn, VR panel mounting |
| `src/scene/vr-ui/` | VRToolbar, VRMaterialPanel/MaterialRow/SwatchPreview, VROnboarding |
| `src/xr/store.ts` | Shared xrStore; production emulation disabled |
| `src/ui/` | Hud, CeramicCatalog, CeramicThumbnail, LoadingScreen, ErrorBoundary |
| `src/scene/ReadySignal.tsx` | First useFrame callback signals splash dismissal |
| `src/config/brand.ts` | BRAND: “VR Interior Studio” / “Interactive Finishing Experience” |
| `src/utils/units.ts` | cmToM |
| `src/App.css`, `src/index.css` | Overlay/responsive styling and full-window reset |

`Furniture` is an App sibling of `Room`, not a child of `Room`. There is no router, project service, persistence layer, installation compiler, or 2D drawing subsystem.

# 6. Current Data Flow

```text
FLOOR_CERAMICS → CeramicCatalog / VRMaterialPanel
    → setSelectedFloorId(id) → useConfiguratorStore
    → CeramicFloor resolves displayFloorId
    → getProductById(id), fallback FLOOR_CERAMICS[0]
    → useTiledCeramicMaterial({product, surfaceWidth, surfaceLength})
        → useCeramicTexture + useOptionalTexture
        → physical repeats + MeshStandardMaterial + shader grout
    → one floor mesh → Room → App Canvas/XR

Store → desktop selected/displayed labels, card highlighting, Compare
Store → camera commands and VR UI/navigation
```

Selection begins at the first catalog id. Selecting the same id is a no-op; selecting a different one saves the old id as `previousFloorId`, sets the new id, and clears `compareActive`. There is no id validation in the setter; renderer/UI fall back to the first product for unresolved ids.

Compare toggles the **previous product** on the whole floor without replacing current selection. It is available only after a previous id exists. It is neither split-screen nor saved design A/B/C. Desktop info/highlights follow the displayed product. VR rows highlight selectedFloorId instead, and expose no Compare control; compare state is nevertheless shared and influences the same floor.

State also includes `cameraResetToken`, `floorViewActive`, `vrReturnToStartToken`, `vrPanelOpen`, and `vrOnboardingSeen`, with their corresponding increment/toggle/mark actions. No middleware/persist adapter is present; everything resets on reload.

# 7. Current Room / Scene

`ROOM` is `living-room-01`, “Modern Living Room”, **4 m X × 5 m Z × 3 m Y**, nominal floor area 20 m². Floor is at Y=0, bounds X ±2 and Z ±2.5. Wall thickness 0.12 m. Door 0.9×2.1 m on +Z at X=-1.1. Window opening 1.8×1.4 m on +X, sill 0.9 m. VR spawn `[0,0,1.6]`.

`Room.tsx` builds four walls, a ceiling plane at Y=3, an inset plane at 2.975, coffer trim, crown trim, and skirting. Wall/ceiling/trim colors are `#f0eee8`, `#f8f7f3`, `#dedad0`. The door is closed; there is no door interaction. Window uses transmissive/transparent MeshPhysicalMaterial and a generated sky plane, not an HDR environment.

**Source defect to review before enlargement:** `Wall`'s no-opening branch renders a height-sized box centered at the passed `position`, whose Y is 0 in `Room`. Thus the back and left 3 m walls span Y=-1.5…1.5, while opening-bearing front/right wall segments correctly use height/2 local offsets. The shell is not uniformly floor-to-ceiling as the handoff's prose implies. This is static geometry evidence, not a screenshot-confirmed visual diagnosis.

Floor occluders in `Furniture.tsx`:

- Sofa centered `[-0.9,0,-1.95]`, base footprint 1.7×0.85 m.
- Coffee table centered `[-0.9,0,-0.6]`, top radius 0.42 m.
- Rug centered `[-0.9,0.005,-0.45]`, radius 0.75 m (about 1.77 m² of floor hidden, with furniture overlap).
- Side table centered `[0.4,0,-1.95]`, radius 0.22 m, plus small vase.
- Floor lamp near `[1.5,0,-2]`, base radius up to 0.13 m.
- Plant near `[1.55,0,2]`, foliage extends beyond pot footprint.
- WallArt above sofa does not itself occupy floor but contributes visual competition.

Lighting: ambient 0.5; hemisphere `#cfe3f7` / `#736a5c`, 0.46; warm directional `#fff2dd`, 2.4 at `[4.2,4.4,1.5]`, real scene-graph target `[0,0.4,0.2]`; ceiling point `#fff1dd`, 0.85; lamp point `#ffdca8`, 0.5. Only the directional light casts shadows (1024² map, bounds ±3, near 1/far 12). Warm lights and colored sky/ground affect apparent product color. No postprocessing or environment lighting pipeline.

`App` uses variance shadows, DPR [1,1.5], antialiasing, perspective FOV 60°, near 0.05/far 50. Larger rooms require reviewing shadow bounds, light reach, furniture offsets, camera framing and near/far distances together. Future safe visual changes are localized in roomConfig, Room, Furniture, Lighting and DesktopControls, but must be approved and visually checked. A Top view must deliberately handle roof/trim occlusion and camera constraints.

# 8. Camera System

`SceneControls` chooses `DesktopControls` outside XR and `VRLocomotion` inside XR. Canvas starts at `[0,1.6,1.6]`, then desktop mount sets `INITIAL_POSITION=[0.2,1.5,1.65]`. `INITIAL_LOOK_POINT=[0.1,-0.15,-1.4]` is converted to a target only 0.1 m away (`LOOK_RADIUS`) for first-person-like OrbitControls behavior.

Desktop drag rotates; pan and OrbitControls zoom are disabled. WASD/arrows move at 2.2 m/s, clamp X/Z to 0.35 m inside nominal walls, with no furniture collision. Wheel changes perspective FOV within 35°–75°. Polar angles are π/2±1.2, so an exact vertical top view is outside current limits.

`floorViewActive` saves the current position/target and tweens to `[0,1.55,2.2]`, target `[0,0,0.4]`; radius is **about 2.375 m**. Walking is disabled in this mode but orbiting remains. Back to Room returns the saved pose. Reset increments a token, clears floor view, returns toward INITIAL constants and resets FOV to 60°. Tween duration 0.8 s, cubic easing, `useFrame` interpolation.

**Verified historical fix in current source:** during tweens, minDistance/maxDistance follow the live camera-target distance; at completion, radius is chosen for the resting mode. They are not fixed JSX props. A universal 0.1 m clamp would collapse Floor View into a macro shot. Preserve this constraint-aware approach for future presets. The historical symptom and screenshot validation are recorded in PROJECT_HANDOFF, not reproduced here.

**Current code/prose mismatch:** the non-floor, non-tween frame loop unconditionally sets camera Y and target Y to `EYE_HEIGHT=1.6`, even without movement. This overwrites the elevated/downward INITIAL pose and can alter the saved return direction/radius after transition. Do not promise a stable hero composition from constants alone. New presets must avoid walking normalization overwriting them. Snapshot/restore FOV policy also needs a deliberate choice; Floor View currently retains whatever wheel FOV existed.

No Room Overview / Top Layout / Detail preset set exists yet. Floor Focus and Reset are the closest existing functions, not the full requested future camera system.

# 9. Current Material System

`CeramicFloor` renders **one PlaneGeometry(4,5)** with default normalized UVs, rotated -π/2 about X. It has one product/material, no per-tile meshes. With that rotation, increasing local plane V maps toward negative world Z. Repeat-derived grid origin is an implicit plane UV boundary, not an installation origin stored in application state.

`cmToM(cm)=cm/100`. `useTiledCeramicMaterial` computes:

```text
repeatX = surfaceWidth / (tileWidth / 100)
repeatY = surfaceLength / (tileHeight / 100)
groutUvX = groutWidth / tileWidth
groutUvY = groutWidth / tileHeight
```

For 4×5 m: Carrara repeats 6.6667×4.1667; Travertine 6.6667×8.3333; Dark Stone 5×6.25. This establishes nominal pattern pitch at the catalog dimensions. It does **not** add grout to tile pitch. Partial patterns at plane edges are texture crops, not classified geometric cut tiles.

`applyTiling` mutates RepeatWrapping, repeat, center (0.5,0.5), rotation in radians, and needsUpdate on albedo and optional maps. Product textureRotationDeg defaults to 0; no orientation UI exists. Rotating normalized UVs with unequal repeat axes is not proof of an exact rotated rectangular installation. Future geometry needs tests for 90° and arbitrary orientations.

`useCeramicTexture` tries TextureLoader on product.texture, sets sRGB and anisotropy 4, caches by product.id. On error, `buildProceduralTexture` uses `generateCeramicCanvas(style,width,height)` (768 px long edge; aspect matches physical format). Three seeded styles provide marble veins/clouds, travertine bands/pores, and darkstone clouds/mineral detail. These are demo appearances, not supplier photography. Generator palettes are hardcoded by style: **product.baseColor is not consumed by this rendering pipeline** despite comments/docs claiming tint/fallback control.

`useOptionalTexture(path)` caches by URL, returns null for absent/failed maps, and sets anisotropy 4. Auxiliary maps remain non-color data rather than sRGB albedo. No demo product specifies them. No KTX2 loader, compression pipeline, atlas, multiple-face selection, or crop workflow exists.

`MeshStandardMaterial` uses roughnessMap with scalar 1 if available, otherwise roughnessValue/default 0.82; metalness fixed 0.04. Finish is a display label, not an independent rendering switch. PBR supports light response, but no calibrated physical measurement is claimed.

`onBeforeCompile` injects grout/variation into `<common>` and `<map_fragment>`. It hashes floor(vMapUv) for deterministic ±5% default brightness variation. Grout uses fract(vMapUv), distance to each cell edge, fwidth antialiasing, and an AO-like band; it changes diffuse color only. No recessed geometry, cut edge, thickness, or independent grout roughness/normal is generated.

**Grout metrology concern:** groutWidth/tileDimension is used as the threshold on **each side** of an integer UV seam. Thus the ideal hard boundary spans about twice the nominal groutWidth across adjacent cells, before AA/bevel. All demo products declare 0.4 cm; that value should not be presented as a verified 4 mm physical joint. Resolve full-width vs half-width convention, tile-body vs pitch semantics, and tolerances before engineering layouts/quantities.

Memoized material cleanup disposes replaced materials, not cached textures. Preserved caching is useful for three static products, but future upload/multi-zone use needs explicit ownership: cached textures are mutable and shared; different surface repeats on one texture can conflict. No cache eviction/invalidation is provided. Hooks retain old texture state while a new uncached product/path loads; a transient previous-map/new-metadata combination is possible from source. Cancelled loads are ignored without explicit disposal of the delivered texture. These are follow-up risks, not defects fixed here.

**Renderer seam:** keep CeramicFloor/useTiledCeramicMaterial as the simple uniform preview path. Later introduce a surface-level rendering boundary inside Room that can consume compiled placements through a proposed `AdvancedTileRenderer` (not an existing file). Reuse asset loading/PBR concepts while isolating mutable transforms per material use. Use instancing/batching for compatible uncut tiles and separate clipped boundary geometry as appropriate after measurement. Renderer selection must not become an alternative placement algorithm: when the compiler exists, it owns placement for 2D, 3D and VR alike.

The current single repeat grid cannot express independent multiple SKUs/sizes, border widths, inset subtraction, modular slots, individual rotations/faces, or explicit cut polygons. Extra texture masks alone would not supply the missing authoritative geometric data.

# 10. Current Catalog/Data Model

Exact `MaterialProduct` property inventory (`src/catalog/types.ts`):

```ts
id: string; name: string; code: string; category: MaterialCategory;
tileWidth: number; tileHeight: number; texture: string;
thumbnail?: string; baseColor: string; proceduralStyle: ProceduralStyle;
groutWidth?: number; groutColor?: string;
normalTexture?: string; roughnessTexture?: string; roughnessValue?: number;
textureRotationDeg?: number; finish?: MaterialFinish; tileVariation?: number;
```

Widths/heights/grout are centimeters. MaterialCategory union: floor, wall, paint, marble, wood, wallpaper, door, ceiling, fixture, furniture, lighting. ProceduralStyle: marble/travertine/darkstone. MaterialFinish: polished/matte/satin. `RoomDesign` has string id/name and numeric width/length/height; current ROOM values are meters.

| id / code | Product | Size cm | Finish / roughness | Grout cm / color |
|---|---|---|---|---|
| ceramic-01 / CR-001 | Carrara White | 60×120 | polished / 0.28 | 0.4 / #bdb7ab |
| ceramic-02 / CR-002 | Travertine Beige | 60×60 | matte / 0.82 | 0.4 / #a98f6b |
| ceramic-03 / CR-003 | Dark Stone | 80×80 | satin / 0.42 | 0.4 / #332f2c |

Each texture URL is `/textures/ceramics/<id>.jpg`; thumbnail is `/textures/thumbnails/<id>.jpg`. Base colors are #f2ede3, #cdb18a, #524f49. The actual darkstone drawer base is #525049.

`CATALOG` has only floor. `getProductById` searches FLOOR_CERAMICS, as do desktop and VR pickers directly. Adding another floor entry is data-driven; adding a new material category/surface **requires consumer/state/renderer wiring**, contrary to the catalog README and handoff's zero-change category claim. One product is one fixed format/image. There is no explicit manufacturer, shape, product family with formats, upload record, face set, zone, surface identity, project, or installation definition. No runtime dimension validation prevents zero/negative inputs because inputs are currently developer-authored constants.

# 11. Current Desktop UX

Full-window Canvas with DOM HUD and collapsible ceramic picker. Hud provides Reset Camera, View Floor/Back to Room, conditional Enter VR, unsupported-device note, startup-error toast (4.5 s), and navigation hint fading after 6 s or first key/pointer interaction. Branding remains historical VR branding; no rename is authorized in this audit. `index.html` title duplicates brand text manually.

CeramicCatalog shows displayed product name/code/dimensions/finish, previous-product Compare, thumbnail cards and collapse control. It starts open at innerWidth ≥640; that decision is initial local state, not a reactive resize rule. CSS ≤640 makes a horizontal-card bottom sheet and hides the VR availability note. Large-screen panel is lower-right, top 106/right 20/bottom 20, content height and scroll cap. No touch walking controls are implemented.

CeramicThumbnail first uses thumbnail URL, then a 128 px procedural data URL on error. LoadingScreen disappears on ReadySignal's first useFrame callback, not completion of all texture requests; it is not an asset readiness barrier. ErrorBoundary catches render errors but is not a general async error recovery system.

No room editor, upload, dimension editor, pattern editor, zone editor, origin/grout controls, saved alternatives, fullscreen action, export, or 2D layout exists.

# 12. Current VR/WebXR Architecture

`xrStore=createXRStore({controller:{teleportPointer:true},hand:{teleportPointer:true},emulate: import.meta.env.PROD ? false : undefined})`. `useVRSupported` checks navigator.xr.isSessionSupported('immersive-vr') with checking/supported/unsupported states; Hud catches enterVR rejection. App keeps Room, Furniture, and floor shared while swapping navigation through SceneControls.

`VRLocomotion`: XROrigin starts at VR_SPAWN. `useXRControllerLocomotion(originRef,false,{type:'snap',degrees:30,deadZone:0.5})` disables smooth stick translation. An invisible room-sized plane inside TeleportTarget translates origin on teleport. Return token moves origin to spawn without resetting headset orientation. Target area is rectangular, not furniture-aware; room bounds do not establish physical safety or prevent real-world movement beyond the target.

VRToolbar at local `[0.45,1.1,-0.5]` exposes Materials and Return to Start. VRMaterialPanel at `[0,1.25,-0.6]` renders catalog rows with RoundedBox/Text, onClick selection, and **procedural-only** 96 px swatches. VROnboarding at `[0,1.5,-0.95]` uses a store flag, surviving exit/reentry but not reload. All panels are origin children; they move/turn with rig, not head-look. Controller/hand routing relies on XR pointer infrastructure; hardware operation is unverified.

Production emulation is explicitly disabled. Installed `@pmndrs/xr/dist/store.js` guards setup with `emulate != false` and contains the lazy emulator import. Historical build contains emulator chunks, but this audit did not capture network traffic or rebuild. No Quest hardware validation exists in the handoff; do not claim it now.

# 13. Verified Current Capabilities

**Verified in source / read-only checks this audit:** React/R3F showroom composition; three catalog products; repeat formula at physical dimensions; shader grout/variation; optional image/PBR loader paths with fallback; selection/previous-product Compare; floor/reset camera machinery with live-radius fix; responsive picker CSS; XR controls and panels; clean no-output TypeScript and lint checks. These are code verification, not fresh visual acceptance.

**Historical desktop validation, attributed only:** PROJECT_HANDOFF (2026-08-18) reports clean build/type/lint, headless Chrome screenshot reviews of switching/scale/grout/camera/Compare, responsive viewports, and dev/preview behavior. No artifacts reviewed here establish that those results still describe every current visual detail. Missing image URLs are consistent with fallback rendering; do not infer zero failed texture requests merely from an overall historical zero-failures claim.

**Implemented but not hardware tested:** immersive session entry, controller rays, hand selection, teleport, snap turn, in-world legibility/comfort, actual headset material appearance/performance. New audit has no physical test results.

**Not implemented:** Project/TileAsset upload model, room editing, zones, installation geometry, pattern definitions/compiler, true cut tiles, 2D layout editor, multi-SKU floor, persistent projects, named designs A/B/C, quantity/waste/cartons/pricing/PDF/share workflow, backend/admin/auth.

# 14. Known Technical Constraints / Debt

1. One global selected floor product; floor-only lookup and UI despite broad category union.
2. One uniform repeated-texture plane; no tile identity/placement/cuts or zone coverage.
3. No project/room geometry abstraction beyond one imported ROOM constant; hardcoded camera/furniture/light values limit simple resizing claims.
4. No upload lifecycle, editable tile library, dimension validation, saved projects or versioned schema.
5. No automated regression suite. Current lint/type success cannot detect appearance or metrology regressions.
6. Wall no-opening Y centering and desktop walking normalization require explicit visual review before expanding/reframing.
7. Shader grout width/pitch semantics, rotated rectangular layouts, and fragment-string compatibility need verification; shader depends on Three chunk names/vMapUv.
8. Shared mutable cached textures and no eviction suit static demos, not independently transformed many-zone uploads. Optional-map transitions and cancellation/resource handling need review.
9. No actual product photography or auxiliary maps to validate the real-image path visually; VR swatches always procedural.
10. Keyboard events are global and do not filter future text inputs or clear keys on window blur. Current camera model is not ready for engineer input forms/top view without coordination.
11. Splash is first-frame based, not all-assets-ready. No upload/loading/error status per asset.
12. No furniture collision for desktop or teleport destinations; do not describe rectangular movement bounds as obstacle/safety validation.

Verified strengths to preserve: physical unit conversion/repeat basis; catalog metadata separated from scene; reusable standard PBR hook and optional maps; cached albedo/auxiliary loading with fallback and material disposal; shared scene/store with desktop/XR navigation isolation. Scratch vectors, shared trim materials, limited shadow casters and DPR cap are useful existing performance choices, not a measured performance guarantee.

**Documentation reconciliation:** root README is a Vite template. Handoff clean-tree claim is stale (handoff itself is untracked). Old demo-freeze/VR priority statements are superseded by this request. Category extension is not zero scene/UI work. baseColor is documented as functional but unused. Room composes no Furniture child. Handoff floor radius ~2.66 is numerically wrong (~2.375). Its stable hero/reset composition description omits frame-loop Y normalization. Darkstone drawer base differs slightly from prose. Latest “Polish” commit actually removes dedication; it does not prove the tuning history attributed to it. Existing docs' photo readiness/fallback assurances do not verify distortion-free cropping, exact grout width, or hardware fidelity. No absent feature should be inferred from comments claiming future extensibility.

# 15. New Strategic Direction

Desktop/web installation confidence is now primary because the user's target work is showing actual finishes, dimensions, combinations and installation choices before construction. Keep VR intact and frozen; do not spend the next milestone improving Quest UX. Preserve conservative scene/performance choices where useful without allowing the former VR-first roadmap to block professional desktop layout tools.

# 16. Target Future Architecture

**Future design only — none of these new domain models is implemented.**

| Concept | Proposed responsibility |
|---|---|
| Project | Versioned room/assets/installations/design alternatives and units |
| Room / Geometry | Measurable boundaries/openings and coordinate system |
| Surfaces | Stable floor/wall identities and local 2D-to-world transforms |
| TileAsset | User/catalog product identity, physical dimensions, faces/maps and metadata |
| Zone | Surface region and role, with explicit boundaries/precedence |
| PatternDefinition | Structural tile slots/rules and allowed size/asset assignments |
| Installation | Surface/zone assignments, pattern, grout, origin, orientation/alignment |
| LayoutCompiler | Deterministically generate exact placements, clips and diagnostics |
| 2D renderer | Draw compiler results, dimensions, selection and technical overlays |
| 3D renderer | Visualize identical results using materials/geometry/batching |

Evolve alongside current code: adapt static MaterialProduct entries into TileAssets; separate authored installation data from UI/navigation store; introduce stable surface coordinates; preserve uniform preview while validating compiler parity. Avoid duplicating editable parameters across renderers. Exact schemas, persistence format, numeric precision policy and clipping library are future decisions, not approved dependencies.

# 17. Tile Upload Vision

Future upload flow: image → crop/orientation preview → physical width/height and units → finish → local project tile library → real-scale rendering. Initial shapes square/rectangle. Record id/name/image, width/height, shape, finish/material type, optional SKU/manufacturer, faces, normal/roughness maps, crop/orientation metadata and repeat behavior. Separate physical format from pixel resolution; a square source crop of a rectangular tile can distort its content if carelessly normalized. Validate positive dimensions and asset readiness.

Local library persistence and image ownership need an explicit later choice; “local” does not imply a backend. Cached id-only textures must invalidate when image/crop changes. Multiple faces should be reproducible per placement so 2D/3D/VR and exports remain consistent.

# 18. Pattern Engine Vision

Initial: Straight; horizontal/vertical orientation; 50% and 33% Running Bond; Checker. Later: multi-size modular, Herringbone, Chevron, Basketweave, custom definitions. Patterns specify tile slots or placement rules, not painted textures. Slot-to-TileAsset assignments enable different SKUs and sizes. Compiler handles row offsets, orientation, grout pitch and clipping. Start with Straight then Running Bond; do not build all patterns simultaneously.

# 19. Zone Engine Vision

Field: main coverage. Border: perimeter band/frame. Center/Inset: internal decorative area or motif. Accent Strip: narrow separator. Custom Area: later rectangular/polygonal user region. Support nested/adjacent bands such as outer dark border, inner frame, beige field and decorative center. Define overlap precedence and subtract occupied regions rather than stacking coincident full-floor textures. Choose corner treatment, strip joins and alignment explicitly in a later specification.

# 20. Layout Compiler Vision

```text
Room + Surfaces + Zones + Tile Assets/Sizes + Pattern + Grout + Origin/Alignment
                                  ↓
                           LayoutCompiler
                                  ↓
                       Exact Tile Placement Results
                         ↙                   ↘
                     2D Layout             3D Preview
                                  ↓
                        Future quantities / PDF / BOQ
```

Future outputs: placement identity; asset/SKU; surface/zone membership; position; rotation; physical dimensions; full/cut classification; original tile bounds and clipped boundary/cut geometry; coverage and useful diagnostics. Preserve provenance so a visible fragment can be traced to an asset and source tile. The compiler is source of truth for placement; 3D must not invent it independently.

Resolve tile-body dimension versus installation pitch, full joint width, origin reference, boundary convention, numeric tolerance, zone conflicts and deterministic ids. Validate coverage/no overlap, actual room fit and edge cuts. Do not claim texture crop counts equal purchasable tile counts.

# 21. 2D / 3D Synchronization Principle

One authored installation, one compiled placement result. The top-down editor updates shared domain state and displays compiled geometry; 3D maps those same coordinates through each surface transform. No second renderer-specific pattern algorithm, independent grout origin or VR layout model. Compare alternatives by complete design/installation snapshots eventually, not merely product ids. Future quantities/PDF consume the same result. Material appearance can differ by render medium; physical placement must agree.

# 22. Engineer Mode vs Customer Preview

Future Engineer Mode exposes room/tile dimensions, assets, zones, patterns, grout, origin/alignment, rotation and quantities. Customer Preview presents a clean room, selected design, Compare, Design A/B/C and fullscreen preview. These are presentations of the same project, not parallel design stores. Current application has only the simple showroom picker/HUD; no mode switch exists.

# 23. Quantity / Waste / PDF Path

Future compiled geometry should support full/cut counts by SKU, installed area, waste, cartons, prices, summaries, dimensioned 2D layouts, 3D images, technical PDFs and shareable designs. A cut fragment is not automatically one additional purchased tile; stock size, reuse, kerf and placement constraints may change purchase quantities. Carton counts/pricing need supplier metadata and explicit rounding assumptions. Phase engineering outputs after geometric correctness; do not derive authoritative BOQ from repeated UV density alone.

# 24. VR Preservation Strategy

Freeze xr/store, VRLocomotion, vr-ui and support/entry behavior except necessary compatibility work explicitly approved in scope. Preserve shared room/material rendering and the macro-view camera fix. Future VR consumes **Project → LayoutCompiler → shared 3D scene**; no separate layout rules/store. Desktop geometry changes can still affect spawn, teleport bounds, panels and frame cost, so preserve compatibility when touching shared scene dimensions without initiating Quest feature work. Hardware acceptance remains a future explicit task.

# 25. Explicit Deferrals

Deferred: VR improvements; Quest UI refinement; furniture configurator; backend; admin dashboard; authentication; SaaS; analytics; native mobile apps; native Quest app; AI room reconstruction; full CAD editor; advanced arbitrary tile shapes; bookmatch/continuous vein; checkout/payments. Also defer broad pattern expansion until foundational correctness.

Keep two later “See It In Your Room” concepts separate:

- **2D Photo Visualizer:** upload photo, identify floor/wall region, apply material in perspective.
- **Full 3D Customer Room:** much later floor plans/BIM/SketchUp/Revit/GLB or AI/computer-vision reconstruction.

Neither is implemented or authorized now. No dedication intro should be restored without an explicit user request.

# 26. Immediate Next Milestones

### Milestone 1 — Visual Foundation

Enlarge/reframe room; expose more floor; neutral lighting; Room/Floor/Top/Detail views. First validate shell placement and camera normalization/radius constraints; plan roof handling for Top. Preserve physical scale and shared scene compatibility.

### Milestone 2 — Upload Tile

Upload image; crop/preview; exact dimensions; finish; local project tile library; real-scale rendering. Define asset update/cache ownership and validate actual photography.

### Milestone 3 — 2D Layout Foundation

Top-down layout; dimensions; grout; origin; rotation; Straight/Running Bond; synchronized 3D. Establish shared installation coordinates, then compiler rules and parity checks.

### Milestone 4 — Multi-Tile + Zones

Multiple tile assets; pattern slots; Field; Border; Center/Inset; Accent Strip. Explicit overlap/corner/cut behavior.

### Milestone 5 — Realism / QA

Multiple faces; cut edges; performance; better texture pipeline. Measure rendering costs and verify scale, joints and deterministic appearance.

### Milestone 6 — Engineer Output

Quantity; waste; design alternatives; screenshots; dimensioned PDF/project summary. Validate calculations against compiled geometry and supplier packaging assumptions.

All are proposed future work. This audit does not begin Milestone 1.

# 27. Immediate Execution Sequence

1. Preserve current code and VR.
2. Reframe/enlarge room and improve visibility.
3. Add professional camera presets including top view.
4. Add TileAsset upload flow.
5. Render one uploaded tile at exact physical scale.
6. Add a shared installation/layout model.
7. Build 2D top-down representation.
8. Introduce PatternDefinition + LayoutCompiler.
9. Implement Straight.
10. Implement Running Bond.
11. Add second tile/SKU.
12. Add Border + Field.
13. Add Center/Inset decorative zone.
14. QA scale, grout, cuts, and synchronization.
15. Only then expand patterns/features.

# 28. Binding Engineering Decisions

- Continue the existing project incrementally; preserve historical WebXR code.
- Desktop/web professional tile/interior finish design is primary. VR is frozen unless explicitly reactivated.
- Real physical dimensions are non-negotiable; define and validate units and joint semantics.
- LayoutCompiler owns exact placements; all 2D/3D/VR/output consumers share them.
- Model TileAssets, patterns and zones structurally; do not flatten multi-product installations into one texture.
- Keep the current simple renderer as a useful bounded preview while introducing the geometric renderer at a surface boundary.
- Preserve PBR/loading abstractions with deliberate texture ownership; do not extrapolate current shared texture transforms to independent zones.
- Preserve the camera live-radius fix; new presets must own their constraints and avoid walking-loop overrides.
- No hardware validation claims without hardware evidence. No roadmap item is implemented merely because a type/comment anticipates it.
- No backend, deployment, package installation, refactor or application change in this audit. User review of the master reference must precede Milestone 1 implementation.
- Preserve absent dedication state and avoid broad process-kill commands; the handoff records that the user's regular browser runs on this workstation.

# 29. Risks / Unknowns

**Facts:** one 4×5 m floor plane; three procedural demo products; absent image assets; no installation compiler/project persistence/tests; untracked pre-existing handoff; source-supported wall and camera mismatches; nominal grout threshold on both seam sides; no new runtime/hardware acceptance in this audit.

**Before Milestone 1 implementation:** review and approve this draft; capture visual baseline after implementation authorization; inspect shell centering and camera frame normalization; define desired room dimensions/framing and floor visibility; plan Top view occlusion/constraints; review shadow bounds/furniture placement and preserve VR spawn/target consistency. These issues do not require a rewrite. New room dimensions and visual targets are unspecified; do not invent them as approved decisions.

**Before geometric layout/quantity work:** settle pitch/body/joint width semantics and numeric tolerances; verify rectangular tile orientation; decide zone precedence/clipping; validate real image crop and cache lifecycle; define output correctness checks. Exact clipping approach, schema, persistence strategy, device budget and supplier metadata are open choices.

**Unknown / unverified:** current rendered visual quality in a browser; external deployment state; current live GitHub synchronization; actual real-image/optional-map appearance; hardware input comfort, teleport behavior and sustained Quest performance. Historical testing is useful context, not fresh proof. Shader width concerns and transient texture-state risks follow source analysis and need runtime/metrology checks before asserting observed impact.

# 30. Instructions for Future Sessions

1. Read `PROJECT_MASTER_REFERENCE.md` if it exists. Until an approved master exists, read this draft and retain its draft status; use PROJECT_HANDOFF for historical context with the corrections above.
2. Inspect `git status`, preserving pre-existing user changes and untracked documents.
3. Verify relevant source before changing anything; code establishes current behavior.
4. Work only on the explicitly approved milestone. Await the user's master-reference approval before Milestone 1.
5. Preserve VR unless the user explicitly reactivates it; later feed it the shared compiled layout.
6. Never infer that roadmap items are already implemented, or that hardware validation occurred.
7. Update the master reference after major architecture milestones with the user's authorized scope.
8. Keep implemented/source-verified, runtime-tested, hardware-tested and future-plan claims separate. Resolve docs/code disagreements explicitly.
9. After future code changes, run appropriate type/lint/build and meaningful visual/geometry checks. This audit's build omission preserves the one-new-file rule; it is not a recommendation to skip build checks during implementation.
10. Do not commit, push, deploy, install packages or expand scope automatically. Do not restore dedication work or redesign VR UX without explicit direction.

**Audit boundary:** sole new deliverable is this draft. Existing application, configuration, lockfile, public assets, handoff and generated build outputs were left untouched. Stop after reporting the audit; do not implement the roadmap.
