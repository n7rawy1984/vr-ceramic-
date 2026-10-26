# PROJECT MASTER REFERENCE

Audit date: **2026-10-25 (Asia/Dubai)**. Repository: `/home/nagham/vr-ceramic-configurator`.

**Status: official master reference. Milestone 1 remains implemented. Milestone 2 — Online Tile Upload is implemented locally and checked with automated server tests and a browser against a Supabase-compatible test fixture. At that verification Supabase was not configured. The user now reports Milestone 2 live testing; this XR maintenance task does not independently reverify the live service or deployment. Setup instructions remain in docs/ONLINE_TILE_SETUP.md. XR exit maintenance is recorded in §12. Milestone 3/layout engineering is not authorized.**

Authority:

1. Actual source code is authoritative for what is implemented.
2. User-confirmed operational facts may supplement what cannot be proven from the repository and must be labeled as such.
3. `PROJECT_MASTER_REFERENCE.md` is authoritative for the current approved product direction and architecture decisions.
4. Historical `PROJECT_HANDOFF.md` is retained for history but is superseded wherever this master reference explicitly disagrees.
5. Future roadmap concepts are not implemented until verified in source/runtime.

Implementation findings began with the read-only audit at `19be60738a919666d5a03c05ee33cbc31fb58ce9` and now include the uncommitted Milestone 1 and Milestone 2 working-tree changes described below. The unchanged draft preserves the original findings, including the wall/camera defects corrected in Milestone 1. Browser checks use isolated headless Chrome/software WebGL, not Quest hardware. Milestone 2 adds server-only Supabase integration and a single-operator access gate; fixture verification must not be reported as live online acceptance. Operational deployment information below is explicitly attributed to the user.

# 1. Executive Summary

Today this is a compact, working-code proof of concept for a single-room 3D ceramic showroom: one rectangular room, three demo floor products, physical texture repetition, shader grout, desktop navigation, previous-product comparison, and an implemented WebXR path. It is not yet an installation design or quantity calculation system. Built-in demo images are still absent and use procedural fallbacks. The new uploaded-tile path accepts actual images, persists canonical millimeter metadata in the Supabase integration, and adapts saved assets to the existing floor renderer. Automated browser checks used generated test images, not supplier photography.

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

Scripts: `dev: vite`; `dev:xr: VITE_XR_EMULATOR=true vite`; `dev:api: node --env-file-if-exists=.env.local scripts/dev-api.ts`; `build: tsc -b && vite build`; `lint: oxlint`; `preview: vite preview`; `test: node --test tests/*.test.ts`. Milestone 2 adds native Node tests (11 server/security/adapter cases), not a third-party test framework. No runtime or development dependency was added; package-lock.json and the dependency versions above remain unchanged.

`vite.config.ts` registers the React plugin, deduplicates Three.js for emulator renderer/material compatibility, and proxies local `/api` requests to `http://127.0.0.1:3001` without changing Host. No custom base, alias or HTTPS configuration. Root `api/` Web Request handlers supply Vercel Node functions; there is no new frontend framework or SPA rewrite. `tsconfig.json` references app/node projects; the node project now also includes api/server/shared/scripts/tests so the normal build typechecks the server boundary. App target/lib are ES2023 plus DOM; bundler resolution, React JSX, noEmit, unused-symbol checks, erasableSyntaxOnly, and skipLibCheck are enabled. `strict` is not enabled explicitly. Build-info destinations are under `node_modules/.tmp/`. `.oxlintrc.json` enables react/typescript/oxc plugins and hooks/refresh rules. No ESLint configuration is used.

Historical read-only audit checks: local `tsc -p tsconfig.app.json --noEmit --incremental false`, corresponding `tsconfig.node.json` check, and local `oxlint`, all completed without diagnostics. A fresh production build was deliberately not run because it writes `dist/` and build metadata. Existing `dist/` is not fresh verification. No browser or hardware test was performed in this audit. Historical build/browser results are attributed in §13. **Milestone 1 verification:** `npx tsc -b`, `npm run lint`, and `npm run build` passed before and after application changes. Build retains >500 kB chunk warnings; no dependencies/configuration were changed. Browser checks and captures were added as session-local scripts/artifacts under `/tmp`, not as a project test framework.

**Milestone 2 checks:** TypeScript, lint, native server tests and production build passed (existing large-chunk warnings remain). Browser checks exercise the real API handlers against the isolated test fixture; see §13. A production build verifies the frontend/type gates, not Vercel deployment or a real Supabase schema. Local development uses Node 24 with two processes; no global CLI or new package was installed.

# 4. Repository / Git Status

- Branch: `main`, locally tracking `origin/main`, with no reported divergence at inspection. No fetch or network verification was performed.
- Remote fetch/push: `https://github.com/n7rawy1984/vr-ceramic-.git`.
- Initial tracked working tree: no changes. Initial untracked file: **`PROJECT_HANDOFF.md`**, already present before this audit; preserve it.
- The original audit/finalization created the draft and master documents. Milestone 1 began with all three reference/handoff documents untracked and no tracked modifications. It modifies 10 tracked application files: `src/App.tsx`, `src/App.css`, `src/scene/DesktopControls.tsx`, `Furniture.tsx`, `Lighting.tsx`, `Room.tsx`, `Wall.tsx`, `roomConfig.ts`, `src/state/useConfiguratorStore.ts`, and `src/ui/Hud.tsx`; it also updates this still-untracked master. Historical handoff and draft remain unchanged. No commit, push, reset, or branch mutation was performed.
- Milestone 2 preserves the pre-existing Milestone 1 work and adds API/server/shared models, SQL setup, a local API runner, native tests, upload/library UI, environment example and setup documentation. It modifies catalog/store/material integration and local proxy/typechecking configuration. No real .env.local, credentials, remote SQL execution, commit, push or deployment was created/performed. The user explicitly requested setup instructions because Supabase was not configured at that time.
- Recent history contains two commits: `19be607` (“Polish VR ceramic showroom”), then `2458aa4` (“Initial VR ceramic configurator”). The actual latest diff removes dedication components and wiring (5 files, 160 deletions); its title is not evidence of separate material tuning changes. No dedication remains in current source.
- `node_modules/` and `dist/` exist and are ignored. Other ignore rules include logs, `*.local`, and editor artifacts.
- Public assets: `public/favicon.svg` and `public/textures/ceramics/README.md` only. No actual ceramic JPGs, thumbnails, normal maps, or roughness maps.
- The original audit found no backend/provider metadata or real environment file. Milestone 2 now includes root Vercel API entrypoints, server helpers and .env.example; a real .env.local was absent during that implementation. The user now has a local environment file; its contents were not read or printed in XR maintenance. **Vercel deployment: user-confirmed.** The user confirms that the current project has already been deployed to Vercel. Exact current deployment URL and deployed commit mapping were not independently verified during the repository audit or final review; no matching local deployment metadata was found. This user-confirmed operational fact supersedes the historical handoff's undeployed/Vercel-intended description. Local source/configuration evidence and operational confirmation remain distinct. No deployment action is authorized now.

Documentation inspected: root `README.md`, all of `PROJECT_HANDOFF.md`, `src/catalog/README.md`, and `public/textures/ceramics/README.md`. No separate roadmap/backlog/session-log files were found. No applicable `AGENTS.md` was found in the project or checked ancestor locations.

# 5. Current Architecture Map

| File / folder | Verified responsibility |
|---|---|
| `src/main.tsx` | React root, StrictMode, global CSS |
| `src/App.tsx` | ErrorBoundary; R3F Canvas/XR; Lighting, Showroom, SceneControls, ReadySignal; Showroom owns desktop-only overhead/furniture visibility; DOM HUD/catalog |
| `src/catalog/types.ts` | MaterialProduct, category/finish/style unions, RoomDesign |
| `src/catalog/materials.ts` | Three static FLOOR_CERAMICS, floor CATALOG, getProductById(id, uploaded) compatibility lookup |
| `src/state/useConfiguratorStore.ts` | In-memory demo/upload selection and Compare, uploadedProducts adapter list, floorImageError, unchanged view commands/VR state |
| `src/hooks/useCeramicTexture.ts` | Bounded id+URL immutable source cache; demo fallback; explicit uploaded-image errors; no stale-map/new-size mixing |
| `src/hooks/useOptionalTexture.ts` | URL-keyed auxiliary-map cache, optional normal/roughness loading |
| `src/materials/useTiledCeramicMaterial.ts` | Legacy cm/uploaded mm → meters; material-owned map clones/repeats; unchanged grout shader; clone/material disposal |
| `src/textures/` | generateCeramicCanvas; cached art and sky textures |
| `src/scene/CeramicFloor.tsx` | Resolve displayed product, create material, render one floor plane |
| `src/scene/roomConfig.ts` | ROOM, WALL_THICKNESS, DOOR, WINDOW, VR_SPAWN |
| `src/scene/Room.tsx`, `Wall.tsx`, `Door.tsx`, `Window.tsx` | Floor-based wall convention, segmented openings, named overhead group, trim, door and glazing/backdrop |
| `src/scene/Furniture.tsx` | Perimeter seating/tables, plant, art, subdued lamp; visible prop for Top presentation; rug removed |
| `src/scene/Lighting.tsx` | Ambient/hemisphere, targeted directional shadow light, ceiling fill |
| `src/scene/DesktopControls.tsx` | presetPose, room/floor/top/detail/free modes, pose-owned radius/FOV transitions, walk/look, saved return and Reset |
| `src/scene/VRLocomotion.tsx` | XROrigin, teleport target, snap turn, VR panel mounting |
| `src/scene/vr-ui/` | VRToolbar, VRMaterialPanel/MaterialRow/SwatchPreview, VROnboarding |
| `src/xr/store.ts` | Shared xrStore; production emulation disabled |
| `src/ui/` | Hud, CeramicCatalog, CeramicThumbnail, LoadingScreen, ErrorBoundary |
| `src/scene/ReadySignal.tsx` | First useFrame callback signals splash dismissal |
| `src/config/brand.ts` | BRAND: “VR Interior Studio” / “Interactive Finishing Experience” |
| `src/utils/units.ts` | cmToM (legacy), cmToMm/mmToCm UI boundaries, mmToM rendering boundary |
| `shared/tileAsset.ts` | Persistent TileAsset/TileAssetView, format/size/dimension/crop contracts; no account/ownership fields |
| `server/admin.ts`, `http.ts` | HMAC operator session/receipts, cookie/CSRF/body/error boundary |
| `server/supabase.ts`, `tileAssets.ts` | Server-only REST adapter; upload signing, verification/save/list/delete/recovery |
| `api/admin/`, `api/tile-assets/` | Six small Vercel Node Web Request entrypoints |
| `src/tiles/` | API client, materialAdapter/finish mapping, canvas crop/rotation preparation |
| `src/ui/TileLibrary.tsx`, `TileUploadForm.tsx` | Operator gate, upload/preview/progress, signed-image library, Apply/Delete/lock |
| `scripts/dev-api.ts` | Loopback Node 24 adapter for the same production handlers |
| `supabase/migrations/20261025_tile_assets.sql` | Manual single-table schema/RLS/permission setup; not remotely applied |
| `.env.example`, `docs/ONLINE_TILE_SETUP.md` | Server env placeholders and Supabase/Vercel/local setup/operations |
| `tests/` | Native server/adapter/security tests plus isolated test-only Storage/PostgREST fixture |
| `src/App.css`, `src/index.css` | Overlay/responsive styling and full-window reset |

`Furniture` and `Room` are siblings inside App's `Showroom`, not nested inside each other. There is no frontend router, saved-project model/service, installation compiler or 2D drawing subsystem. Persistence is limited to uploaded tile metadata/images through Supabase integration; its original acceptance checks used a fixture. The user now reports live testing; this task does not inspect real service data.

# 6. Current Data Flow

```text
Built-in FLOOR_CERAMICS ───────────────────────────────────────────┐
                                                                ↓
My Tiles → operator cookie → application API → Supabase metadata / signing
  image preparation → signed upload URL → direct Storage PUT → verified save
  list saved TileAssetView → tileToProduct → uploadedProducts → getProductById
                                                                ↓
setSelectedFloorId → selected/previous ids + Compare → CeramicFloor
  → useTiledCeramicMaterial → source texture → material-owned clones
  → physical repeats + existing PBR/grout shader → one 6×7 m floor mesh
```

Selection still begins at the first demo. Selecting a different id records the previous id and clears Compare; same-id selection is a no-op. getProductById now optionally resolves uploaded products after demos. Uploaded TileAsset metadata remains canonical mm; materialAdapter derives legacy display cm plus `physicalSizeMm`, then rendering explicitly converts mm to meters. There is no second placement algorithm or geometric layout model.

Compare still displays the previous product across the whole floor, without replacing the selected id. It now works across uploaded/demo sources as well as between demos; it is not split-screen or persisted Design A/B/C. Desktop labels follow the displayed product. Frozen VR rows still expose/select the three demos and highlight selectedFloorId; the shared renderer can consume a desktop-selected uploaded material without a separate VR model.

`setUploadedProducts` reconciles selected/previous ids after reload/delete/lock. A removed uploaded selection resets to the first demo; a removed previous id clears Compare. Full TileAssetView rows live in the library UI, while the scene store receives derived MaterialProducts. Signing URLs are session memory, not database fields. The operator cookie can survive a page reload; chosen floor/design state is still memory and resets on reload. Reopening My Tiles reloads saved asset metadata.

DesktopView/camera command tokens and VR fields remain as in Milestone 1. New `floorImageError` reports uploaded-image failures visibly; no procedural uploaded-image substitution occurs. Cookie sessions, metadata and images have separate lifetimes; see §17 and the setup guide.

# 7. Current Room / Scene

`ROOM` remains `living-room-01`, “Modern Living Room”, now **6 m X × 7 m Z × 3 m Y**, enlarged from 4×5×3 m. Nominal floor area is **42 m² versus 20 m² (+22 m², +110%)**. This is explicit metric geometry, not scene scaling: floor remains Y=0, now X ±3/Z ±3.5. The size supports a large continuous field for current 60×60, 60×120 and 80×80 products and future larger-format demonstrations while retaining realistic living-room context.

Wall thickness remains 0.12 m; door remains 0.9×2.1 m on +Z, now center X=-2.1 at Z=3.5. Window remains 1.8×1.4 m on +X at X=3, sill 0.9. No opening dimensions changed. Ceiling remains Y=3, inset plane Y=2.975, with coffer/crown/skirting derived from ROOM.

**Wall Y-centering defect corrected:** `Wall.position` is the floor-level center for both branches. A no-opening wall now uses a parent group at that origin and mesh center `[0,height/2,0]`, matching segmented opening walls. Previously the back/left walls extended from -1.5 to 1.5 m; all wall geometry now stays within Y=0…3. Runtime world bounding boxes were checked for all nine segments (two solid walls, three door-wall segments, four window-wall segments). Door/window segment construction remains unchanged. Floor, ceiling, trims and openings were inspected in the shared scene.

`Room` keeps the full architecture. Ceiling, inset, coffer and crown live in named group `overhead`, exposed by `overheadRef`; floor/walls/skirting remain separate. `Showroom` hides overhead in desktop Top or while a desktop camera remains above the ceiling on its return; it restores overhead below Y=2.95. XR explicitly overrides hiding. Furniture is hidden only in desktop Top and restored on leaving it. These are reversible presentation changes, not deletion of room architecture.

Furniture remains primitive geometry; none was added. Rug was removed (former radius 0.75 m, about 1.77 m² of rug footprint). Sofa and wall art now center X=-1.85 near the back-left perimeter; sofa Z=-2.85, base 1.7×0.85 m. Coffee table moved from `[-0.9,0,-0.6]` to `[-1.85,0,-1.85]` (top radius 0.42 m). Side table is now `[-0.55,0,-2.85]`, radius 0.22 m. Lamp follows the back-right corner `[2.5,0,-3]`; plant follows front-right `[2.55,0,3]`. This clusters context around the perimeter and frees the central field. The +22 m² area and removed rug footprint describe geometry, not an exact pixel/union measurement of visible floor.

Room colors are neutralized to wall #f0f0ee, ceiling #f8f8f6, trim #dededb. Window glass/sky backdrop remain unchanged. Lighting in `Lighting.tsx`: white ambient 0.75; hemisphere white/#b6b6b6 at 0.65; white directional key 1.6 (previously warm 2.4), at `[5.2,4.4,1.5]`, scene-graph target `[0,0.4,0.2]`; white ceiling point 0.85, reach 10 m. Lamp point is now white 0.12, reach 2 m, with subdued white emission 0.08. This reduces warm cast, boosts neutral fill and retains dark-material detail without postprocessing. Only the directional key casts shadows: 1024² map, bounds ±7, near 1/far 20, expanded for the larger room. Material appearance remains representative, not color-calibrated.

Canvas keeps variance shadows, DPR [1,1.5], antialiasing and near 0.05/far 50. Physical repeats derive from the new ROOM values; the grout shader behavior is unchanged; the material hook now supports canonical uploaded mm sizes and owned texture transforms. VR_SPAWN automatically becomes `[0,0,2.6]`; existing teleport geometry automatically becomes 6×7 m. No XR locomotion/UI redesign occurred.

# 8. Camera System

`SceneControls` still swaps DesktopControls and VRLocomotion by XR session. Desktop navigation now separates named resting presets, an active tween ref, and deliberate free navigation; it no longer normalizes resting camera/target height every frame.

`presetPose(view,aspect)` in `DesktopControls.tsx` defines:

| View | Position (m) | Target (m) | FOV / behavior |
|---|---|---|---|
| Room Overview | [0.8,2.65,3.1] | [-0.3,0,-0.9] | 58°; default elevated room/floor composition |
| Floor Focus | [0,2.45,2.85] | [0,0,-0.1] | 52°; floor-led perspective with scale/context |
| Top | [0,H,0.001] | [0,0,0] | 45°; near-vertical, full-floor fit for viewport aspect |
| Detail | [0.65,1.15,1.8] | [0.1,0,0.5] | 48°; tile/grout close inspection, radius about 1.82 m |
| Free | User-controlled | Short look target preserving direction | Drag look, WASD/arrows walk, wheel lens zoom |

Top height H is `max(ROOM.length/2, ROOM.width/2/aspect) / tan(45°/2) * 1.22`, about 10.31 m at 1440×900; resize refits Top only. It is a perspective camera pointed nearly vertically with a tiny Z offset to avoid a pole singularity, not an orthographic technical renderer. Rotate/zoom/walk are locked in Top, with reversible overhead/furniture hiding (§7). Exact top-down floor coverage was visually checked at representative desktop/portrait widths.

All preset commands use 0.8 s cubic-eased position/target/FOV interpolation. During transitions, input is disabled, polar limits are relaxed, and **minDistance=maxDistance tracks the live camera-target distance**. Resting presets retain their actual radius; there is no universal tiny clamp. This preserves the historical macro-collapse fix. Resting non-Top presets permit orbit inspection with polar limits 0.15…π/2−0.05; free look permits 0.15…π−0.15.

Dragging in Overview enters free look with LOOK_RADIUS=0.1 m while preserving direction. WASD/arrows in room/free enter or continue walking, speed 2.2 m/s, bounded 0.35 m inside walls. Eye height is set to 1.6 m **only on actual walking**, translating the target by the same delta to preserve pitch. Floor/Top/Detail disable walking. Wheel lens zoom remains 35°–75° outside Top/transitions. Key handlers ignore editable fields, prevent handled arrow scrolling and clear held keys on blur. No furniture collisions/mobile walking UI were added. Milestone 2 pauses background camera updates/held movement keys while a native library dialog is open and ignores dialog key events, preventing upload inputs/buttons from moving the room.

Entering Floor/Top/Detail from room/free saves position, target, FOV and room/free mode. Switching among inspection presets preserves that original saved pose. Back to Room restores it; Overview selects the canonical room preset. Reset always clears the saved return and requests canonical Overview/FOV 58, including during interrupted transitions. Camera requests use an incrementing token separate from the active view so navigation does not accidentally restart a tween.

**Historical defect corrected:** the old unconditional frame-loop Y assignments overwrote the initial hero/downward view. Presets now rest unchanged; numerical settling/return/reset checks confirm this. The original wall/camera findings remain in the unchanged draft and historical reconciliation below.

**Top View is only Milestone 1 visual inspection.** Milestone 3's dedicated 2D Layout Editor remains future work driven by shared installation/compiler geometry, with exact dimensions, selection, zones, grout, origin/alignment and technical overlays. It is not this camera preset.

# 9. Current Material System

`CeramicFloor` renders **one PlaneGeometry(6,7)** with default normalized UVs, rotated -π/2 about X. It has one product/material, no per-tile meshes. A neutral loading material keeps the floor shell visible while the selected image loads; failures show an explicit UI error. With that rotation, increasing local plane V maps toward negative world Z. Repeat-derived grid origin is an implicit plane UV boundary, not an installation origin stored in application state.

`cmToM(cm)=cm/100`. `useTiledCeramicMaterial` computes:

```text
tileWidthM = physicalSizeMm ? mmToM(widthMm) : cmToM(legacyTileWidth)
tileHeightM = physicalSizeMm ? mmToM(heightMm) : cmToM(legacyTileHeight)
repeatX = surfaceWidth / tileWidthM
repeatY = surfaceLength / tileHeightM
groutUvX = cmToM(groutWidth) / tileWidthM
groutUvY = cmToM(groutWidth) / tileHeightM
```

For the current 6×7 m floor: Carrara repeats 10×5.8333; Travertine 10×11.6667; Dark Stone 7.5×8.75. Browser scene inspection confirmed these values for all three products in every preset. Previously, 4×5 m produced 6.6667×4.1667, 6.6667×8.3333 and 5×6.25 respectively; physical tile dimensions did not change. This establishes nominal pattern pitch at the catalog dimensions. It does **not** add grout to tile pitch. Partial patterns at plane edges are texture crops, not classified geometric cut tiles.

`applyTiling` sets RepeatWrapping, repeat, center (0.5,0.5), rotation and needsUpdate on **material-owned clones** of albedo and optional maps; cached source transforms are not mutated. Product textureRotationDeg defaults to 0; no installation-orientation UI exists. Upload preparation has a separate image-rotation UI that bakes pixels without changing grout orientation. Rotating normalized UVs with unequal repeat axes is not proof of an exact rotated rectangular installation. Future geometry needs tests for 90° and arbitrary orientations.

`useCeramicTexture` loads a real URL with TextureLoader, sRGB and anisotropy 4. Its immutable-source promise cache is keyed by **product id plus texture URL**, bounded to 24 entries; failures are removed so subsequent attempts can retry. A changed signed URL rekeys loading, and the hook never exposes an old product map with new dimensions. Demos still generate 768 px aspect-matched canvases on load failure. Uploaded images instead report an error; they are never silently replaced with demo marble. The source-image cache and per-material clones have separate ownership.

The three demo procedural styles/palettes remain unchanged. **product.baseColor remains unused by this actual pipeline**, despite historical comments/docs claiming tint/fallback control. Real demo JPGs/normal/roughness maps are still absent. Uploaded browser test images demonstrate the photo path technically, not supplier-product fidelity.

`useOptionalTexture(path)` caches by URL, returns null for absent/failed maps, and sets anisotropy 4. Auxiliary maps remain non-color data rather than sRGB albedo. No demo product specifies them. No KTX2 loader, atlas, multiple-face selection or auxiliary-map upload workflow exists; the new browser image-preparation crop/rotation path is described in §17.

`MeshStandardMaterial` uses roughnessMap with scalar 1 if available, otherwise roughnessValue/default 0.82; metalness fixed 0.04. Demo finish is a display label paired with explicit catalog roughness; uploaded finish is mapped to roughness by materialAdapter. The material hook itself reads roughness, not a finish label. PBR supports light response, but no calibrated physical measurement is claimed.

`onBeforeCompile` injects grout/variation into `<common>` and `<map_fragment>`. It hashes floor(vMapUv) for deterministic ±5% default brightness variation. Grout uses fract(vMapUv), distance to each cell edge, fwidth antialiasing, and an AO-like band; it changes diffuse color only. No recessed geometry, cut edge, thickness, or independent grout roughness/normal is generated.

**Grout metrology concern:** groutWidth/tileDimension is used as the threshold on **each side** of an integer UV seam. Thus the ideal hard boundary spans about twice the nominal groutWidth across adjacent cells, before AA/bevel. All demo products declare 0.4 cm; that value should not be presented as a verified 4 mm physical joint. Resolve full-width vs half-width convention, tile-body vs pitch semantics, and tolerances before engineering layouts/quantities.

The material hook clones loaded albedo/normal/roughness maps before applying UV transforms, then disposes those clones and each replaced material. This resolves the audited shared mutable-transform risk for multiple usages. Cached sources remain reusable and source-cache eviction disposes sources independently. Optional auxiliary-map loading still uses its existing URL cache; an expanded real PBR asset pipeline remains future work. No KTX2/atlas/multiple-face feature was added.

Uploaded finish roughness is **polished 0.28 / satin 0.42 / honed 0.60 / matte 0.82**, via `UPLOAD_ROUGHNESS` in materialAdapter. Demo scalar values remain unchanged. Crop and image rotation are baked into prepared stored pixels, so uploaded textureRotationDeg stays 0 and does not rotate the grout grid. These are representative appearance controls, not calibrated finish measurements.

**Renderer seam:** keep CeramicFloor/useTiledCeramicMaterial as the simple uniform preview path. Later introduce a surface-level rendering boundary inside Room that can consume compiled placements through a proposed `AdvancedTileRenderer` (not an existing file). Reuse asset loading/PBR concepts while isolating mutable transforms per material use. Use instancing/batching for compatible uncut tiles and separate clipped boundary geometry as appropriate after measurement. Renderer selection must not become an alternative placement algorithm: when the compiler exists, it owns placement for 2D, 3D and VR alike.

The current single repeat grid cannot express independent multiple SKUs/sizes, border widths, inset subtraction, modular slots, individual rotations/faces, or explicit cut polygons. Extra texture masks alone would not supply the missing authoritative geometric data.

# 10. Current Catalog/Data Model

Exact `MaterialProduct` property inventory (`src/catalog/types.ts`):

```ts
source?: "demo" | "upload"; physicalSizeMm?: { width: number; height: number };
id: string; name: string; code: string; category: MaterialCategory;
tileWidth: number; tileHeight: number; texture: string;
thumbnail?: string; baseColor: string; proceduralStyle: ProceduralStyle;
groutWidth?: number; groutColor?: string;
normalTexture?: string; roughnessTexture?: string; roughnessValue?: number;
textureRotationDeg?: number; finish?: MaterialFinish; tileVariation?: number;
```

Legacy tileWidth/tileHeight and groutWidth are centimeters; uploaded physicalSizeMm and persisted width_mm/height_mm are millimeters. MaterialCategory union: floor, wall, paint, marble, wood, wallpaper, door, ceiling, fixture, furniture, lighting. ProceduralStyle: marble/travertine/darkstone. MaterialFinish: polished/matte/satin/honed. `RoomDesign` has string id/name and numeric width/length/height; current ROOM values are meters.

| id / code | Product | Size cm | Finish / roughness | Grout cm / color |
|---|---|---|---|---|
| ceramic-01 / CR-001 | Carrara White | 60×120 | polished / 0.28 | 0.4 / #bdb7ab |
| ceramic-02 / CR-002 | Travertine Beige | 60×60 | matte / 0.82 | 0.4 / #a98f6b |
| ceramic-03 / CR-003 | Dark Stone | 80×80 | satin / 0.42 | 0.4 / #332f2c |

Each texture URL is `/textures/ceramics/<id>.jpg`; thumbnail is `/textures/thumbnails/<id>.jpg`. Base colors are #f2ede3, #cdb18a, #524f49. The actual darkstone drawer base is #525049.

`CATALOG` still has only floor. getProductById searches demos plus an optional uploadedProducts argument. Desktop demos remain data-driven; uploaded assets use an explicit compatibility adapter. Other material categories/surfaces still require consumer/state/renderer wiring: historical zero-change category extensibility remains overstated. No Product/Variant/SKU commercial refactor was performed.

**Milestone 2 TileAsset (`shared/tileAsset.ts`, `public.tile_assets`):** id UUID; name; unique storage_path; nullable source_filename; mime_type; actual file_size; width_mm/height_mm (positive `numeric(10,3)`); material_type; finish; image_rotation; nullable normalized crop_data; created_at/updated_at. No user_id/owner_id/organization_id/created_by or identity record. `TileAssetView` adds temporary imageUrl/imageUrlExpiresAt and optional imageError in API responses only. Source bytes are cropped/rotated/resampled before storage; preparation metadata is history, not an editable original-image archive. Metadata is immutable; no edit endpoint or project-save schema.

The API validates dimensions (0.001–100,000 mm, max three decimal places), names, material/finish, crop, MIME and size. UI cm converts with cmToMm; cm display with mmToCm; mmToM is the rendering boundary. Legacy demo dimensions remain cm constants. Shape is currently the rectangular image/physical format; multiple faces, manufacturer collections and asset maps remain future work.

# 11. Current Desktop UX

Milestone 1 Overview/Floor/Top/Detail/Back to Room/Reset and responsive demo catalog remain. The catalog adds **My Tiles · Add Tile**, opening a native modal Tile Library. No brand rename, Engineer Mode, room editor or technical 2D tool was added.

Without an operator session, the modal asks for one access code. Valid sessions reveal Add Tile and saved uploaded cards; Lock library clears cookie/library state. Public demos remain usable without unlocking. No account signup, Supabase Auth, profiles or user permissions exist.

Add Tile accepts JPG/PNG/WebP ≤5,000,000 bytes, name, cm width/height, Ceramic/Porcelain/Marble/Natural Stone/Decorative and Polished/Matte/Satin/Honed. Preview shows filename/physical size; rotation 0/90/180/270 and edge-trim crop sliders use browser canvas. Inputs validate name and positive dimensions. Progress states include preparing preview/upload, uploading, saving and Ready. Save prevents double submission and reuses a completed upload on metadata retry. Other busy actions/refresh disable the form; close/delete/apply are disabled while saving.

Saved cards show image, name, dimensions, material/finish, Apply and confirmed Delete. Apply is offered only after save; image failures are visible and can be retried with Refresh. An uploaded/deleted/locked selection reconciles safely with demo/Compare state. There are no folders, SKU editor, search, pagination or multiple simultaneous floor materials.

The modal stacks its form/library at mobile widths; 390×844 browser fixture capture was reviewed without horizontal overflow. Native dialog focus/inert behavior is used; background camera input is explicitly paused while it is open. The underlying catalog retains its existing ≤640 px bottom-sheet rules and initial open-state behavior.

The splash remains first-frame based, not asset-complete readiness. The floor now shows a neutral surface while a new map loads and a visible floor-image error if uploaded access fails. ErrorBoundary remains render-error recovery only. Upload progress is distinct from scene startup readiness.

# 12. Current VR/WebXR Architecture

`xrStore` retains `controller:{teleportPointer:true}` and `hand:{teleportPointer:true}`. Emulation is now `false` except when DEV and VITE_XR_EMULATOR=true; explicit mode uses `{inject:true,syntheticEnvironment:false}`. `useVRSupported` checks navigator.xr.isSessionSupported('immersive-vr') with checking/supported/unsupported states; Hud catches enterVR rejection. App keeps Room, Furniture, and floor shared while swapping navigation through SceneControls.

`VRLocomotion`: XROrigin starts at VR_SPAWN. `useXRControllerLocomotion(originRef,false,{type:'snap',degrees:30,deadZone:0.5})` disables smooth stick translation. An invisible room-sized plane inside TeleportTarget translates origin on teleport. Return token moves origin to spawn without resetting headset orientation. Target area is rectangular, not furniture-aware; room bounds do not establish physical safety or prevent real-world movement beyond the target.

VRToolbar at local `[0.45,1.1,-0.5]` exposes Materials and Return to Start. VRMaterialPanel at `[0,1.25,-0.6]` renders catalog rows with RoundedBox/Text, onClick selection, and **procedural-only** 96 px swatches. VROnboarding at `[0,1.5,-0.95]` uses a store flag, surviving exit/reentry but not reload. All panels are origin children; they move/turn with rig, not head-look. Controller/hand routing relies on XR pointer infrastructure; hardware operation is unverified.

Production emulation is explicitly disabled. Development emulation is now opt-in via `npm run dev:xr` or `VITE_XR_EMULATOR=true`; normal `npm run dev` passes `emulate: false`. Installed `@pmndrs/xr/dist/store.js` guards setup with `emulate != false` and contains the lazy emulator import. Emulator chunks remain in the Milestone 1 production build; the production guard is unchanged. No production network trace was captured. Milestone 2 did not edit XR, VR locomotion/panel files, room dimensions, lighting or furniture; uploaded materials feed the same floor renderer. No new VR UI/functionality was added. No Quest hardware validation exists in the handoff or Milestone 1; do not claim it now. Shared ROOM resizing automatically updates spawn to [0,0,2.6] and teleport target to 6×7 m. Showroom visibility explicitly restores overhead/furniture for active XR, regardless of desktop Top state. Milestone 2 left XR session setup, locomotion and VR UI source files unchanged; the subsequent authorized exit repair is recorded below.

### XR exit maintenance — 2026-10-26

Authorized regression repair only; Milestone 3 remains unauthorized. `docs/XR_LIFECYCLE.md` contains installed-source evidence and the native CDP browser runner instructions.

**Reproduced cause:** asynchronous Drei Text/font loading inside VRLocomotion had no local Suspense boundary. Suspension of the surrounding XR tree re-established the SDK camera-restoration effect while already in-session, losing its closure-local initialCamera. Camera-write tracing showed desktop → XR ArrayCamera on entry, then **no restoration write on exit**; R3F remained on the XR camera. ArrayCamera extends PerspectiveCamera, so the old desktop type guard accepted the wrong camera. A local Suspense boundary around VRLocomotion preserves that effect; the focused A/B trace now restores the original desktop camera UUID. SceneControls also waits for the original camera and non-presenting manager before mounting DesktopControls. Desktop teardown clears keys/tweens; desktop code does not acquire pointer capture, and the second cycle verified browser release of emulator pointer lock on canvas removal; existing listener removals and OrbitControls disposal remain.

**Separate reproduced emulator defect:** DevUI used nested Three.js 0.165 while its transform handles used app Three.js 0.185. Its renderer threw material.onBuild is not a function before IWER reached application XR frame callbacks. Vite resolve.dedupe now uses one app Three.js copy; focused XR entry/exit produced no such exceptions. No package/lockfile changes or node_modules patches were made.

**Activation/lifecycle:** xrStore remains shared and survives Vite HMR to avoid installing duplicate emulator devices/UI/global listeners. Emulation requires DEV and the exact public flag true; `npm run dev:xr` sets it for that process. Production always disables it. Explicit mode retains controller/headset DevUI but disables the synthetic environment module, since the app already supplies the room. Supported real WebXR runtimes are not forcibly replaced. Controller/hand pointers, teleport, snap turn, VR toolbar/material panel/onboarding and the shared renderer remain present. No new render loop, timer, manual setAnimationLoop or demand-frameloop switch was added. SDK session.end cancels its device frame request and clears session callbacks; final runtime inspection also found ended=true, no device frame handle, zero queued frame callbacks and no current frame callback array; IWER restores the canvas parent and removes its runtime container. The opt-in device and detached DevUI polling/input infrastructure persist for re-entry, rather than claiming full emulator disposal at exit.

**Runtime acceptance:** isolated headless Chrome/software WebGL passed two complete Desktop → XR → Desktop cycles, with the full desktop interaction pass before entry and after each exit. Overview/Floor/Top/Detail/Reset, all demos, My Tiles, generated fixture PNG upload/Apply, uploaded↔demo Compare, WASD/arrows, drag look and wheel/FOV worked. Mouse tests hit-test visible buttons and send actual browser input. The second cycle exited with emulator pointer lock active; it cleared, the original camera UUID returned, XR inputs became zero, the origin detached, and the app retained one canvas with zero runtime overlays/captures. R3F frame subscribers returned to seven after each exit, with no accumulating keyboard/wheel/pointer handlers. Both captures were visually inspected; no active-session VR UI remained on desktop.

Normal development was checked separately: no emulator device or emulator resource requests, one pending app RAF, no emulator document input listeners, one canvas, zero runtime overlays, and the same complete desktop/material/upload-fixture interaction pass. Explicit mode retained six DevUI polling RAFs plus the app loop (samples six/seven pending), and three intervals versus two in normal mode; counts did not grow across exits. These include retained DevUI and test/development/library infrastructure, not surviving XR session frames. Tests use DPR 0.5 for the full input checks on the memory-constrained software renderer; focused camera-write tracing also passed at default DPR. No hardware/frame-rate guarantee or physical Quest verification is claimed.

**Checks:** TypeScript, lint, all 11 native server/security/adapter cases and production build passed. A build with VITE_XR_EMULATOR=true also compiled the production store with emulate:false. Existing large-chunk warnings remain; lazy emulator/environment artifacts are emitted but normal development did not request them. Relevant browser checks are reproducible with tests/browser/xr-lifecycle.mjs and the isolated fixture; live Supabase data was not accessed.

Supabase/API/upload/schema/signed upload/physical tile dimensions/storage permissions remain unchanged by this repair. User-provided .env.local values were not inspected. No commit, push or deployment.

# 13. Verified Current Capabilities

**Milestone 2 implemented locally:** Vercel root API entrypoints; server-only Supabase REST adapter; operator-code HMAC cookie gate; private signed uploads/reads; canonical mm TileAsset schema/SQL artifact; preview/crop/rotation/upload/library/Apply/Delete UI; owned texture-map transforms; finish mapping; explicit loading/errors; local API proxy/runner. No dependency installation, Supabase Auth, accounts, commercial catalog refactor, project persistence or layout engine.

**Milestone 2 automated checks:** TypeScript, lint, production build and native Node tests pass; the direct test runner lists **11 passing server/security/adapter cases**, including invalid/expired/tampered sessions, CSRF, secure cookie attributes, per-instance login limits, MIME/size/dimension/receipt/path validation, idempotent metadata retry, signed access failures, compensated delete/cleanup and current/legacy server-key headers. Build still warns on large chunks. Frontend bundle scans found no server environment names or fixture elevated key.

**Milestone 2 browser fixture checks:** invalid access code and unsupported/>5 MB files rejected; JPEG/PNG/WebP prepared/uploaded/saved/applied; 90°/270° image rotation and PNG crop metadata verified; 600×600, 600×1200 and 800×800 mm produce expected 6×7 m repeats; all three saved rows reload after page refresh through signed URLs. All four existing views, all three demos and Compare (including uploaded↔demo) pass; preset radii remain non-macro. Signed-image load failures are visible and recover after Refresh. Delete cancellation preserves data; confirmed deletion removes metadata/object and resets a selected uploaded floor safely. Cookie loss prompts unlock and blocks API access; re-unlock and Lock library work. Native modal/mobile captures were inspected; focused checks confirmed background navigation pauses while the dialog is open and the upload form disables during a pending Refresh. Tests use the same application API handlers against **local test-only** Storage/PostgREST, not a configured Supabase project.

**Service verification history:** during original Milestone 2 verification the user had not configured Supabase and requested setup instructions. The user now reports live testing; this maintenance task does not independently verify the service or deployment. SQL was not executed remotely; no actual bucket/Data API permissions, live upload, production Vercel API routing or deployed commit mapping were verified. Follow `docs/ONLINE_TILE_SETUP.md`; do not equate test-fixture persistence with live Postgres/Storage proof. Quest hardware remains untested.

**Milestone 1 implemented and checked:** 6×7×3 m room; floor-based wall convention; perimeter seating/rug removal; neutral lighting; explicit room/floor/top/detail/free modes; live-radius/FOV transitions; reversible Top occlusion; saved return and Reset; responsive view controls. `npx tsc -b`, `npm run lint` and `npm run build` passed. Chunk-size warnings remain; no dependency installation or new test framework.

**Milestone 1 runtime verification (isolated headless Chrome, SwiftShader):** visually inspected Overview/Floor/Top/Detail screenshots; all three product repeat pairs and previous-product Compare checked in all views; stable preset coordinates and non-macro radii checked; WASD/arrow walking, mouse drag look and wheel zoom verified (58°→60.4° in the input check); Back to Room restores saved position/target/FOV; interrupted Top→Detail→Reset converges to Overview; Top stays elevated and hides overhead/furniture, normal views restore context; nine world-space wall segment boxes lie within Y=0…3. Responsive control bounds, catalog collapse/open and switching checked at desktop 1440×900, tablet 820×1180, mobile 390×844 and 360×740. Session scripts/results/screenshots are under `/tmp/ceramic-*`; they are temporary artifacts, not a committed regression suite. Browser polling waits for actual rendered poses/maps, since software WebGL settles slowly. Screenshot observations do not establish real-device performance or calibrated material color.

**Milestone 1 preservation history:** the original milestone left material/catalog/XR sources unchanged. Milestone 2 now adapts CeramicFloor/catalog/store/texture/material loading for uploaded assets while preserving the actual grout fragment shader, demo product data, camera poses, room geometry, furniture, lighting and XR/VR files. The built-in demos still use procedural fallback because their real product images are absent; uploaded assets use the saved image. No claim of zero missing-image requests is made.

**Historical desktop validation, attributed only:** PROJECT_HANDOFF (2026-08-18) reports clean build/type/lint, headless Chrome screenshot reviews of switching/scale/grout/camera/Compare, responsive viewports, and dev/preview behavior. No artifacts reviewed here establish that those results still describe every current visual detail. Missing image URLs are consistent with fallback rendering; do not infer zero failed texture requests merely from an overall historical zero-failures claim.

**Implemented but not hardware tested:** immersive session entry, controller rays, hand selection, teleport, snap turn, in-world legibility/comfort, actual headset material appearance/performance. New audit has no physical test results.

**Not implemented:** saved Project/room editor, commercial Product/Variant/SKU catalog, multiple faces/PBR-map uploads, zones, installation geometry, patterns/compiler, true cut tiles, 2D editor, simultaneous multi-SKU floor, persistent projects/design A/B/C, quantity/waste/pricing/PDF/share workflow, accounts/profiles/Supabase Auth or full admin dashboard. The limited upload backend and single-operator gate are implemented as above.

# 14. Known Technical Constraints / Debt

1. One global selected floor product; floor-only lookup and UI despite broad category union.
2. One uniform repeated-texture plane; no tile identity/placement/cuts or zone coverage.
3. No project/room geometry abstraction beyond one imported ROOM constant; hardcoded camera/furniture/light values limit simple resizing claims.
4. Upload/save/list/delete and dimension validation now exist, but metadata editing, original-image archive, saved projects and a versioned project schema do not.
5. Native server/security/adapter tests now exist; browser checks remain session-local. No authoritative placement/clipping/zone numeric suite exists because the layout compiler is still future work. Lint/type success does not establish geometry or visual correctness.
6. Historical wall no-opening Y centering and unconditional walking normalization were corrected in Milestone 1 (§7–8); the draft preserves the original findings. New scene/camera changes still require visual regression checks.
7. Shader grout width/pitch semantics, rotated rectangular layouts, and fragment-string compatibility need verification; shader depends on Three chunk names/vMapUv.
8. Cached sources now remain immutable and material-owned clones isolate UV transforms; the main source cache is bounded/id+URL keyed. Optional-map cache expansion, large-library texture memory and future many-zone batching still need measurement/design.
9. Uploaded image loading is browser-tested with generated fixtures; actual supplier photography/auxiliary maps and headset material fidelity remain unvalidated. VR swatches remain procedural/demo-only.
10. Keyboard listeners remain global but filter editable fields/dialog events, clear keys on blur, and pause with the library modal. Dedicated engineering input tools and a technical 2D renderer remain future scope; Top is camera inspection only.
11. Splash is still first-frame rather than all-assets-ready. Upload progress, image errors and signed-access refresh now exist, but no broader scene asset-readiness barrier was added.
12. No furniture collision for desktop or teleport destinations; do not describe rectangular movement bounds as obstacle/safety validation.

Verified strengths to preserve: physical unit conversion/repeat basis; catalog metadata separated from scene; reusable standard PBR hook and optional maps; cached albedo/auxiliary loading with fallback and material disposal; shared scene/store with desktop/XR navigation isolation. Scratch vectors, shared trim materials, limited shadow casters and DPR cap are useful existing performance choices, not a measured performance guarantee.

**Documentation reconciliation:** root README is a Vite template. Handoff clean-tree claim is stale (handoff itself is untracked). Old demo-freeze/VR priority statements are superseded by this request. Category extension is not zero scene/UI work. baseColor is documented as functional but unused. Room still composes no Furniture child; both now live inside Showroom. Handoff floor radius ~2.66 is numerically wrong (~2.375). Its stable hero/reset composition description omitted the frame-loop Y normalization that Milestone 1 corrected; the wall Y-centering finding was also corrected, not erased from history. Darkstone drawer base differs slightly from prose. Latest “Polish” commit actually removes dedication; it does not prove the tuning history attributed to it. Existing docs' photo readiness/fallback assurances do not verify distortion-free cropping, exact grout width, or hardware fidelity. No absent feature should be inferred from comments claiming future extensibility.

# 15. New Strategic Direction

Desktop/web installation confidence is now primary because the user's target work is showing actual finishes, dimensions, combinations and installation choices before construction. Keep VR intact and frozen; do not spend the next milestone improving Quest UX. Preserve conservative scene/performance choices where useful without allowing the former VR-first roadmap to block professional desktop layout tools.

# 16. Target Future Architecture

**Target architecture remains future design, except the minimal Milestone 2 TileAsset persistence/render adapter.** Project/Room-domain/Surface/Zones/Pattern/Installation/LayoutCompiler and multi-face commercial models below are not implemented. Existing scene ROOM is still a simple meter-based scene constant, not a project geometry editor.

| Concept | Proposed responsibility |
|---|---|
| Project | Versioned room/assets/installations/design alternatives and units |
| Room / Geometry | Measurable boundaries/openings and coordinate system |
| Surfaces | Stable floor/wall identities and local 2D-to-world transforms |
| Product | Commercial family identity, manufacturer, collection, material type and shared metadata |
| Variant / SKU | Purchasable format, exact dimensions, finish, optional thickness, SKU/code and supported surfaces where needed |
| TileAsset / FaceSet | Renderable image(s), albedo, optional normal/roughness, multiple faces, crop/orientation metadata and unique slab image where appropriate; project-local assets also retain supplied physical dimensions/finish |
| Zone | Surface region and role, with explicit boundaries/precedence |
| PatternDefinition | Structural tile slots/rules and allowed size/asset assignments |
| Installation | Surface/zone assignments, pattern, grout, origin, orientation/alignment |
| LayoutCompiler | Deterministically generate exact placements, clips and diagnostics |
| 2D renderer | Draw compiler results, dimensions, selection and technical overlays |
| 3D renderer | Visualize identical results using materials/geometry/batching |

Evolve alongside current code: adapt static MaterialProduct entries into renderable assets while preserving a path to Product/Variant identity; separate authored installation data from UI/navigation store; introduce stable surface coordinates; preserve uniform preview while validating compiler parity. Avoid duplicating editable parameters across renderers. Exact schemas, persistence format, numeric precision policy and clipping library are future decisions, not approved dependencies.

### Product / Variant / Asset Compatibility Contract — Future Domain Architecture

```text
Product → Variant / SKU → TileAsset / FaceSet → Installation
```

A commercial catalog separates shared product-family metadata from the actual purchasable format/finish/SKU and its renderable face set. Installation stores customer/project placement choices rather than product-family identity alone. Preserve references back to Variant/SKU for eventual quantities and purchasing; do not collapse commercial identity into an image URL.

An ad-hoc engineer upload can instead create a project-local TileAsset with image, dimensions and finish and use it immediately without a commercial catalog or mandatory Product/Variant records. Both workflows must coexist. Product/Variant implementation is **not required in Milestone 2 — Upload Tile**; this is a compatibility requirement for future domain evolution, not immediate scope.

### Units & Coordinate-System Contract — Binding Before LayoutCompiler

- UI may accept/display cm, mm or m. Uploaded TileAsset persistence now canonically uses millimeters. Future domain/layout calculations must use one canonical internal physical unit with explicit conversions; complete the Surface/layout contract before compiler implementation.
- Conversion occurs at defined input/import/display/export boundaries, not ad hoc inside renderers. Current catalog centimeters and scene meters describe existing code, not the final domain contract.
- Every Surface has a stable local 2D coordinate system with documented origin, axes and orientation.
- LayoutCompiler computes in surface-local coordinates. The 3D renderer transforms those coordinates into world space; dedicated 2D technical rendering consumes the same local coordinates.
- Define numeric tolerance/epsilon policy explicitly before clipping and quantity calculations, including boundary comparisons and reconciliation. No final epsilon value or clipping library is selected by this document.

# 17. Tile Upload Implementation / Future Compatibility

**Implemented locally in Milestone 2; initial checks used a fixture. The user subsequently reports live testing.** This is a single-operator online library backed by Supabase metadata/private Storage through server APIs. No Supabase Auth, account, user table, identity/profile record, ownership columns or commercial Product/Variant implementation. Ad-hoc images can be saved immediately with exact dimensions/finish, preserving a future catalog-linking path.

See **`docs/ONLINE_TILE_SETUP.md`** and **`supabase/migrations/20261025_tile_assets.sql`** for setup/operations. Server variables are SUPABASE_URL, SUPABASE_SECRET_KEY (preferred current secret), optional legacy SUPABASE_SERVICE_ROLE_KEY fallback, ADMIN_ACCESS_CODE and ADMIN_SESSION_SECRET. None use VITE_; no publishable/anon browser key or Supabase SDK is needed. Current secret keys use apikey only; legacy JWTs also use Bearer, server-side. Node 24 `npm run dev:api` loads ignored .env.local on 127.0.0.1:3001; Vite proxies /api. Root api/ handlers are for Vercel; optional `npx vercel dev` is documented but not run. No remote SQL, project creation or deployment occurred.

Endpoints: POST /api/admin/login, GET /api/admin/session, POST /api/admin/logout; POST /api/tile-assets/upload-url; POST/GET /api/tile-assets; DELETE /api/tile-assets/:id. Privileged endpoints verify the operator session. Cookie is 8-hour HttpOnly, SameSite=Strict, Secure in production/Vercel, Path=/api. HMAC sessions/receipts are tied to code/secret; JSON writes require same Origin. No password/localStorage. The local eight-failure/15-minute limiter is per instance; configure production Vercel Firewall limits. Responses are no-store and do not echo upstream secrets/errors.

The required private bucket tile-assets must allow JPEG/PNG/WebP, maximum 5 MB (application exact cap 5,000,000 bytes). Server generates tiles/<uuid>.<extension>. Upload signing returns a Storage URL plus a path/MIME/size-bound 30-minute application receipt; bytes PUT directly from browser to Storage. Confirmation checks stored metadata and up to 32 header bytes before immutable insertion. A DB timeout checks the same id and allows metadata retry without duplicate rows. The supplied migration enables RLS and removes anon/authenticated access on the metadata table; elevated credentials bypass RLS and stay server-only.

Preparation uses existing browser APIs, no package: decode, optional normalized edge crop, clockwise 0/90/180/270 rotation, output ≤4096px long edge, still ≤5 MB; oversized decoded image dimensions are rejected. Prepared pixels are stored; original bytes are not retained. Rotation/crop fields record preparation history and do not alter grout or apply a second transformation. UI cm → persisted mm → rendering meters is explicit; source photography dimensions never determine physical repeat.

Saved list responses contain one-hour signed read URLs, regenerated on reopen/Refresh and periodically while mounted. DB stores only storage_path. Image signing/loading errors are explicit; uploaded failures never generate fake marble. Apply preloads the image with a timeout; the renderer uses mm dimensions, owned texture-map clones and the existing PBR/grout shader. Polished roughness 0.28, Satin 0.42, Honed 0.60, Matte 0.82; representative, not calibrated.

Confirmed Delete removes row then object, compensating by restoring metadata if Storage fails. If restoration also fails, the UI retains an eight-hour signed cleanup receipt for retry; a lost/expired receipt or server interruption can require manual orphan cleanup. Abandoned/uncertain uploads can also leave private unreferenced objects. Supabase signed upload URLs last two hours independently of the app receipt; already issued signed URLs are bearer capabilities and are not revoked by app logout. Never store their URLs in the database.

Future multiple faces, auxiliary-map upload, manufacturer/SKU management, project persistence and advanced image editing remain deferred. A saved tile library is not a saved installation. The layout compiler/grout engineering gate remains for Milestone 3.

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

### Pre-Layout Correctness Gate — Binding Before Milestone 3 Authority

Before Milestone 3 / LayoutCompiler becomes authoritative, explicitly define:

- Whether entered tile dimensions represent tile body size.
- Full physical grout/joint width and installation pitch.
- The relationship between body size and joint width.
- Seam ownership between adjacent tiles and boundary behavior.
- Numeric tolerance policy, together with the units/coordinates contract in §16.

Then 2D layout, 3D layout, quantity calculations and technical output must use **exactly the same semantics**. The current shader is a visual prototype and its 0.4 cm demo setting is **not verified 4 mm engineering output**. Resolve origin reference, zone conflicts and deterministic ids as part of compiler specification. Validate room fit and edge cuts; texture crop counts are not purchasable tile counts.

### Automated Geometry Correctness — Mandatory Future Requirement

The current absence of a test framework is acceptable history for a visual proof of concept, not sufficient assurance for authoritative installation geometry. Before LayoutCompiler powers quantities or technical output, add an automated numeric/geometry correctness strategy covering at least:

- Unit conversion.
- Straight placement and Running Bond offsets.
- Deterministic placement IDs.
- Clipping and cut geometry.
- Zone coverage, no unintended overlaps, and no unintended gaps beyond defined grout semantics.
- Orientation and rectangular tile rotation.
- Area reconciliation.
- Deterministic multi-face assignment where relevant.

Screenshot/visual regression may supplement these tests but must not replace numeric/geometry tests. Native Node backend/adapter tests now exist; the authoritative compiler geometry suite remains future work. No external test framework dependency has been installed.

# 21. 2D / 3D Synchronization Principle

```text
Project / Room / Surface
        ↓
Tile/Product Assets
        ↓
Zones + Pattern + Installation
        ↓
LayoutCompiler
        ↓
Compiled Placement Geometry
   ↙          ↓          ↘
2D       3D / future VR   Quantity/PDF
```

One authored installation, one compiled placement result. The top-down editor updates shared domain state and displays compiled geometry; 3D maps those same coordinates through each surface transform. No second renderer-specific pattern algorithm, independent grout origin or VR layout model. Compare alternatives by complete design/installation snapshots eventually, not merely product ids. Future quantities/PDF consume the same result. Material appearance can differ by render medium; physical placement must agree.

# 22. Engineer Mode vs Customer Preview

Future Engineer Mode exposes room/tile dimensions, assets, zones, patterns, grout, origin/alignment, rotation and quantities. Customer Preview presents a clean room, selected design, Compare, Design A/B/C and fullscreen preview. These are presentations of the same project, not parallel design stores. Current application has only the simple showroom picker/HUD; no mode switch exists.

# 23. Quantity / Waste / PDF Path

Future compiled geometry should support full/cut counts by SKU, installed area, waste, cartons, prices, summaries, dimensioned 2D layouts, 3D images, technical PDFs and shareable designs. A cut fragment is not automatically one additional purchased tile; stock size, reuse, kerf and placement constraints may change purchase quantities. Carton counts/pricing need supplier metadata and explicit rounding assumptions. Phase engineering outputs after geometric correctness; do not derive authoritative BOQ from repeated UV density alone.

### Product Fidelity Contract

**Geometric / installation fidelity:** the product should strive to be authoritative, based on supplied data and validated calculation semantics, for room dimensions, tile dimensions/locations, pattern geometry, grout/joint geometry, border/inset dimensions, cut geometry, coverage and later quantities. This is a target requirement; the current repeated-texture proof of concept is not certified engineering output.

**Visual/material fidelity:** material appearance is representative. It depends on source photography, camera/white balance, texture quality, lighting, tone mapping, monitor/device display and ambient environment. A screen preview must not promise exact real-world color equivalence. Future commercial UX may say: “Material appearance is representative. Confirm final color and finish against an approved physical sample.” Geometric accuracy and representative appearance are separate product promises.

# 24. VR Preservation Strategy

Freeze xr/store, VRLocomotion, vr-ui and support/entry behavior except necessary compatibility work explicitly approved in scope. Preserve shared room/material rendering and the macro-view camera fix. Future VR consumes **Project → LayoutCompiler → shared 3D scene**; no separate layout rules/store. Desktop geometry changes can still affect spawn, teleport bounds, panels and frame cost, so preserve compatibility when touching shared scene dimensions without initiating Quest feature work. Hardware acceptance remains a future explicit task.

# 25. Explicit Deferrals

Milestone 2 explicitly supersedes the old blanket backend deferral only for Supabase tile metadata/private Storage and the single-operator access gate. **No accounts, Supabase Auth, profiles, organizations, roles, multi-tenancy or ownership columns are authorized.**

Deferred: VR improvements; Quest UI refinement; furniture configurator; broader backend; full admin dashboard; account authentication; SaaS; analytics; native mobile apps; native Quest app; AI room reconstruction; full CAD editor; advanced arbitrary tile shapes; bookmatch/continuous vein; checkout/payments. Also defer broad pattern expansion until foundational correctness.

Keep two later “See It In Your Room” concepts separate:

- **2D Photo Visualizer:** upload photo, identify floor/wall region, apply material in perspective.
- **Full 3D Customer Room:** much later floor plans/BIM/SketchUp/Revit/GLB or AI/computer-vision reconstruction.

Neither is implemented or authorized now. No dedication intro should be restored without an explicit user request.

# 26. Immediate Next Milestones

### Milestone 1 — Visual Foundation

**Implemented and browser-verified in this working tree:** 6×7 m room; fixed wall placement; rug removal/perimeter seating; neutral lighting; Overview/Floor/Top/Detail/Reset; explicit free navigation; reversible Top overhead/furniture visibility; physical repeat preservation. Details and validation are in §7–13. Top remains camera inspection, not the future technical 2D Layout Editor.

### Milestone 2 — Upload Tile

**Implemented locally with fixture verification:** single-operator cookie gate, server-only Supabase API integration, SQL setup artifact, private signed uploads/reads, image preview/crop/rotation, canonical mm metadata, saved library, real-scale Apply, Delete/recovery, finish mapping and isolated texture transforms. At original verification the user had no configured Supabase project; live activation/production routing instructions remain in docs/ONLINE_TILE_SETUP.md. No commercial Product/Variant refactor or layout compiler.

### Milestone 3 — 2D Layout Foundation

Dedicated technical 2D Layout Editor; exact geometry; dimensions; selection; zones; grout; origin/alignment; rotation; technical overlays; Straight/Running Bond; synchronized 3D. Establish shared installation coordinates, then compiler rules and parity checks. Satisfy the canonical-unit/surface-coordinate contract and pre-layout grout correctness gate before treating results as authoritative. Plan automated numeric geometry validation; expand zone authoring in Milestone 4.

### Milestone 4 — Multi-Tile + Zones

Multiple tile assets; pattern slots; Field; Border; Center/Inset; Accent Strip. Explicit overlap/corner/cut behavior.

### Milestone 5 — Realism / QA

Multiple faces; cut edges; performance; better texture pipeline. Measure rendering costs and verify scale, joints and deterministic appearance.

### Milestone 6 — Engineer Output

Quantity; waste; design alternatives; screenshots; dimensioned PDF/project summary. Validate calculations against compiled geometry and supplier packaging assumptions. Automated geometry correctness coverage in §20 is mandatory before compiler results power quantities or technical output.

Milestones 1 and 2 were explicitly authorized. Milestone 2 is implemented locally with real Supabase/Vercel activation still pending; milestones 3–6 remain future direction only. Stop after the upload milestone; do not begin layout engineering automatically.

# 27. Immediate Execution Sequence

Steps 1–3 were implemented in Milestone 1. Steps 4–5 now have the Milestone 2 online-upload implementation with fixture verification; actual Supabase/Vercel activation remains pending setup. Steps 6–15 remain future work; no layout-engine authorization follows.

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
- Real physical dimensions are non-negotiable. Before compiler implementation, establish the canonical-unit, conversion-boundary and surface-coordinate contract in §16; define epsilon policy before clipping/quantity calculations.
- Before Milestone 3 authority, satisfy the body-size/full-joint/pitch/seam/boundary/tolerance gate in §20; all renderers and outputs share those semantics.
- Automated numeric/geometry testing is mandatory before compiler results power quantities or technical output; screenshots cannot substitute for it.
- Preserve both project-local ad-hoc TileAssets and future Product → Variant/SKU → TileAsset/FaceSet → Installation compatibility. Product/Variant implementation is not an Upload Tile prerequisite.
- Milestone 1 Top View is camera inspection; Milestone 3's dedicated technical 2D editor consumes shared compiled geometry.
- Apply the Product Fidelity Contract: strive for validated geometric accuracy based on supplied data; visual appearance remains representative, without exact screen-to-sample color promises.
- LayoutCompiler owns exact placements; all 2D/3D/VR/output consumers share them.
- Model TileAssets, patterns and zones structurally; do not flatten multi-product installations into one texture.
- Keep the current simple renderer as a useful bounded preview while introducing the geometric renderer at a surface boundary.
- Preserve PBR/loading abstractions with deliberate texture ownership; do not extrapolate current shared texture transforms to independent zones.
- Preserve the camera live-radius fix; new presets must own their constraints and avoid walking-loop overrides.
- No hardware validation claims without hardware evidence. No roadmap item is implemented merely because a type/comment anticipates it.
- Milestone 2 authorizes Supabase metadata/private Storage and a single-operator access gate only. No Supabase Auth, accounts, profiles, organizations, user ownership columns or multi-tenant architecture. Server secrets must never enter browser code/VITE_ variables. Persist uploaded dimensions in mm, use temporary signed URLs and material-owned texture transforms. No remote SQL/deployment or layout engine is authorized automatically.
- Preserve absent dedication state and avoid broad process-kill commands; the handoff records that the user's regular browser runs on this workstation.

# 29. Risks / Unknowns

**Current facts:** one 6×7 m repeated-texture floor; three built-in procedural demos plus an implemented uploaded TileAsset path. Wall/camera fixes remain. Main material UV ownership is corrected; grout full-joint/body/pitch semantics remain deliberately unresolved. Supabase integration/schema/gate are code-complete locally, but the user has no configured project; fixture checks are not live database/storage/deployment proof. No saved Project, layout compiler, zones/patterns, engineering output or multi-user model.

**Required activation:** apply the reviewed SQL manually, configure private bucket limits/policies, create server environment values in ignored .env.local and Vercel, configure production login rate limiting, and run the real end-to-end acceptance checklist. Production API routing/build behavior has not been platform-tested; no Vercel CLI install/link/deploy occurred. Existing Vercel deployment is user-confirmed, with exact URL/commit mapping unknown; these local changes are not deployed.

**Operational limits:** session cookie is stateless; logout does not revoke a stolen cookie until expiry (rotate code/secret to invalidate). Signed URLs are bearer capabilities with separate lifetimes. Per-instance rate limiting is not distributed. Private orphan objects can remain after abandoned uploads/server interruption/double-failure deletion; cleanup receipts are memory-only and expire. SQL was not executed against Postgres in this session. Image signature checks are not antivirus/full server decoding. Original image bytes are not archived; prepared pixels are immutable. The small library uses the configured Data API row cap without pagination. Large libraries/large textures need future performance work.

**Visual/hardware limits:** browser checks used headless/software WebGL and generated image fixtures, not supplier color calibration or physical Quest hardware. No furniture collision/full mobile walking controls were added. Splash remains first-frame based; large build chunks remain. No Quest frame-rate/comfort/material-fidelity guarantee.

**Before authoritative layout/output:** complete Surface local coordinates, canonical layout units/conversions, body/joint/pitch/seam/boundary/tolerance definitions, clipping/zone rules and mandatory numeric geometry tests (§16/20). Current mm tile storage does not itself establish engineering-accurate grout/cuts/quantities. No final epsilon/clipping library, project schema, commercial catalog or quantity model was selected.

# 30. Instructions for Future Sessions

1. Read `PROJECT_MASTER_REFERENCE.md` first for approved product direction and architecture decisions. The unchanged draft and PROJECT_HANDOFF are historical context; this master supersedes explicit disagreements. Verify implementation in actual source and label user-confirmed operational facts.
2. Inspect `git status`, preserving pre-existing user changes and untracked documents.
3. Verify relevant source before changing anything; code establishes current behavior.
4. Milestones 1/2 implementation and fixture/live limits are recorded here. Finish real setup/acceptance only when authorized; do not start Milestone 3, accounts or layout/domain expansion automatically.
5. Preserve VR unless the user explicitly reactivates it; later feed it the shared compiled layout.
6. Never infer that roadmap items are already implemented, or that hardware validation occurred.
7. Update the master reference after major architecture milestones with the user's authorized scope.
8. Keep implemented/source-verified, runtime-tested, hardware-tested and future-plan claims separate. Resolve docs/code disagreements explicitly.
9. After future code changes, run appropriate type/lint/build and meaningful visual/geometry checks. This audit's build omission preserves the one-new-file rule; it is not a recommendation to skip build checks during implementation.
10. Do not commit, push, deploy, install packages or expand scope automatically. Do not restore dedication work or redesign VR UX without explicit direction.

**Milestone 2 boundary:** upload/gate/Supabase integration, SQL/setup/local-runner artifacts, metadata/render adapter, texture ownership and focused library UI were implemented alongside preserved Milestone 1 work. Historical handoff/draft, built-in product entries, room/furniture/lighting and XR files remain unchanged in this milestone; no dependency or lockfile resolution changes. Type/lint/build/server tests and fixture browser checks were performed. No real credentials, remote SQL, live Supabase acceptance, commit, push, deployment, Supabase Auth, accounts or Milestone 3 work. Stop and await the next explicit instruction.
