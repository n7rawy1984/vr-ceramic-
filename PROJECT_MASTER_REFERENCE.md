# PROJECT MASTER REFERENCE

Initial audit: **2026-10-25 (Asia/Dubai)**. Last implementation update: **2026-10-28**. Repository: `/home/nagham/vr-ceramic-configurator`.

**Status: official master reference. M8.1 Guided Auto Design is committed at `b89703d`. M9 — Decorative Panel / Mural Designer V1 — began from that clean working tree and is implemented and verified locally; changes remain uncommitted. Project schema is now 6; IndexedDB is v4. See [DECORATIVE_PANELS.md](docs/DECORATIVE_PANELS.md). No commit, push, deployment, AI integration or M9.1 in this task.**

**Current M9 scope (2026-10-28):** independent Decorative Panel Studio/library, original artwork sources, Rectangle/Circle/Ellipse physical compilation, continuous global artwork UVs and a floor/Center snapshot assignment. Normal patterns remain unchanged. Curves are physically clipped with ≤0.25 mm chord deviation; one batched artwork mesh and cut normal backing preserve Field/rectangular Center Frame/Center composition. Studio mapping edits compile no geometry and rewrite no images. Shared sources and immutable project snapshots prevent cross-project mutation after global edit/rename/delete. Schema 6 and DB v4 add panel/artwork storage with safe old-project normalization and Center-only recovery. Wall authoring, arbitrary polygons, manufacturer image sets, quantities/PDF and AI remain future work. Verification passed TypeScript/production build, zero-warning lint and all fourteen native files, including 17 new panel cases. Development browser profiling measured zero panel/layout compilation, buffer construction, bitmap creation, encoding, artwork writes and new URLs during mapping-only edits. Production/offline Studio and room checks passed original 2400 px artwork preservation, all three shapes, exact 3D positions/indices/UVs, one shared artwork Blob/texture, library CRUD, immutable project snapshots, project duplication, room resizing/recentering, reload and Center-only missing-artwork recovery. Database v3→v4/schema 5→6 migration preserved raw project rows and original material bytes without forced writes. Guided regression retained zero geometry work for lighting-only Apply/Undo, and wall/core regression passed independent walls/openings, Simple transitions and all five restored floor patterns. Two guided XR cycles with a circular panel and Slab feature wall preserved complete state, panel geometry/UVs/texture, wall buffers and camera; both recovered at 11 subscribers, zero inputs, one canvas and 226 normal floor cut placements. Completed browser runners recorded zero API requests and no application runtime errors, with one existing XR SDK superseded-offer notice. The existing build chunk advisory remains. These are isolated software-WebGL results, not Quest hardware or deployment validation. Stop after M9 V1.

**Historical M8.1 scope (2026-10-28):** existing three local deterministic styles now accept strength, explicit surface/pattern/ceiling/light/furniture preferences, exact material roles and five Preserve switches. Locks override preferences, roles, preset defaults and safe fallbacks; both planner and transaction enforce them. Pattern compatibility is checked without geometry compilation; incompatible Checker/Modular/Slab requests show explicit Straight fallback. Proposal summaries list preserved systems and actual choices; style cycling retains guidance, and Reset changes only the form. Selective preparation shares unchanged applied references/results, compiles only changed floor/walls and publishes atomically. Complete Undo, stale guards, project persistence and existing render/XR consumers remain in place. This M8.1 is local Guided Auto Design, superseding the historical use of “M8.1” to mean future AI integration. Verification passed TypeScript/production build, zero-warning lint and all thirteen native test files, including 20 new guided cases and the original 18 M8 cases. Development coverage measured zero compilation/publication during Generate; lighting-only Apply and Undo produced zero layout/wall compilation, buffer/segment work and texture generation while retaining all geometry identities. A one-wall change compiled only that wall (one LayoutCompiler invocation), with no floor work. The original M8 regression retained one floor compile for Minimal and one floor plus one wall for Luxury. Each Apply published one complete semantic design. Production/offline checks passed locked Modular physical sizes, all four preserved walls, custom 55% lighting, explicit window-wall clipping, disclosed Checker fallback, two-wall coverage, persistent style-cycle guidance, Reset/form isolation, focused proposal review, full Undo/dirty semantics, Save/Open/Duplicate/reload and 1280/820 px layouts. Two guided XR cycles preserved complete state, Slab buffers, floor result and camera; both recovered at 11 subscribers, zero inputs and one canvas. Completed browser checks recorded zero API requests and no application runtime errors; one existing XR SDK superseded-offer notice and the existing build chunk advisory remain. Tests used isolated software WebGL, not Quest hardware or a deployment. Stop after this sprint; Decorative Panel / Mural Designer and external AI are not started. Do not commit or push automatically.

**Historical M8 scope (2026-10-28):** desktop ✨ Auto Design offers deterministic local Minimal/Luxury/Bold proposals using explicit material roles and supplied effective physical sizes. Versioned semantic decisions feed the existing strict project preparation, floor/wall compilers and batched publication; room dimensions/openings remain architectural inputs. Generate/Cancel do not mutate projects or compile geometry. Apply prepares everything first; one-level Undo restores the full before state and rejects stale recovery. Local project CRUD/schema, shared source images, 2D/3D and XR remain on the existing pipeline. No backend, new dependency, database migration, AI connection or image-as-truth renderer. Verification passed TypeScript/production build, zero-warning lint and all twelve native test files (18 new M8 cases). Development coverage measured zero Generate compilation/publication; Minimal Apply compiled the floor once, and Luxury Apply compiled the floor plus one feature wall once each, with one complete design publication and reuse of prepared results. Production checks passed offline Generate, deterministic style cycling, distinct Simple/Field override selection, Cancel/dirty safety, full Undo, exact Slab positions/UVs, plan/elevation parity and Save/Duplicate/Open/reload identity. Two XR emulator cycles preserved the applied Luxury state, floor result, Slab buffers and camera; both ended at 11 subscribers, zero input sources and one canvas. Completed browser runners recorded zero API requests and no application runtime exceptions; XR recorded one existing SDK superseded-offer notice. The build retains its existing large-chunk advisory. These are isolated software-WebGL results, not deployment or Quest hardware validation. This scope supersedes historical stop-after-M7/M7.1 and “M8 not started” statements below. Stop after M8; do not start M8.1 or commit/push automatically.

**M7.1 checkpoint:** committed at `54e4741` after local verification. Independent project physical sizes, effective Checker/Modular validation, Reset / Save as New Size and schema 5 persistence are preserved. See [TILE_SLAB_VARIANTS.md](docs/TILE_SLAB_VARIANTS.md#m71--project-physical-sizes). Historical uncommitted notes below describe their earlier sessions. M7.1 verification passed TypeScript, zero-warning lint, all eleven native test files, build, Simple size scaling/reset, project isolation/duplication, Save as New Size, effective Checker/Modular, exact wall override/elevation/cuts, schema 4 restoration without forced writes, zero-work draft profiling, five-pattern production regression, lighting/cutaway and two XR cycles preserving sizes. Those were local software-WebGL checks with zero API requests and no application runtime exceptions; one existing SDK offer notice was recorded.

**Historical M5 checkpoint:** Projects are now local IndexedDB documents: New / Save / Open / Rename / Duplicate / confirmed Delete, applied-state snapshots, dirty/switch/close safety and last-active restoration. Global tile images remain shared; no backend, authentication or cloud sync. See §17F and [LOCAL_PROJECT_MANAGEMENT.md](docs/LOCAL_PROJECT_MANAGEMENT.md). M5 was committed as `2f49545`; the current session explicitly authorizes M6.


**Current M6 scope (2026-10-27):** The user authorized Multi-Surface Wall Design V1 after M5 closure. Git inspection found clean `main` at `2f49545`, matching the recorded `origin/main`; M4B is `ebdeeb5`. M6 adds independent Straight-only Front/Back/Left/Right wall designs from the existing shared local Tile Library, pure mm compilation with real window/door subtraction, shared applied elevation/3D placements, batched geometry, draft → Apply Surface, and project schema 2 with neutral-wall M5 migration. See [WALL_DESIGN.md](docs/WALL_DESIGN.md). Verification status is recorded below; M6 was subsequently committed as `841705c`; the current feedback patch remains uncommitted.

**Current M6 feedback patch:** Git inspection found clean `main` at `841705c` (M6 committed), superseding the earlier uncommitted note. The authorized patch adds desktop camera-aware, shadow-preserving wall cutaway and independent immediate room-lighting controls in Room Settings. Project schema 3 migrates existing v1/v2 projects with safe lighting defaults; IndexedDB remains v2. LayoutCompiler, wall compilation and XR lifecycle source are preserved. TypeScript, lint, the isolated test suite and production build pass. New tests cover all four cutaway sides and free-look hysteresis, safe lighting normalization, migration and dirty/save restoration. Development profiling records zero layout compilations, buffer/segment builds and texture generation. Production verifies identical shadow pixels across right-wall cutaway, all lighting controls, camera presets/manual orbit, custom lighting Open/reload, and v1/v2 defaults; two XR cycles verify restoration inside XR. Production floor/wall core assertions also pass through all five restored patterns and built-in/uploaded Simple transitions; the long runner was interrupted after those assertions, and its remaining legacy/missing-wall recovery phase passed separately. Completed checks report zero API requests/runtime exceptions. Feedback changes remain uncommitted; no M7. See [M6_FEEDBACK_PATCH.md](docs/M6_FEEDBACK_PATCH.md) for strategy, defaults, tests and current verification status.

**Preserved M4B pattern scope:** Main Field supports Straight / Grid, Running Bond 50%, Running Bond 33%, Checker and one neutral Multi-Size Modular preset. The latter has large square A, upright B, small C and optional small D with exact joint-aware physical dimensions. Existing local persistence, architecture, Simple-mode transition, shared compilation and batching remain in place. See §17E and [MODULAR_PATTERNS.md](docs/MODULAR_PATTERNS.md). M5 does not expand pattern scope: no herringbone, wall tiling, quantities/waste, PDF, backend, AI or furniture editor work.

**Current refinement override:** the urgent usability scope below supersedes historical memory-only upload and 4–12 m room limits. The active product uses one IndexedDB-backed local tile repository with no API calls, an explicit Simple/compiled render-mode transition, and draft/applied Room Settings for width/length/height, furniture, the right-wall window and Simple/Gypsum ceiling. Backend code remains inactive and preserved. See §17C and [refinement details](docs/USABILITY_REFINEMENT.md).


**Current M7 override (2026-10-27):** M6 and its feedback are accepted and committed at `7344c29` (clean `main` at M7 start, matching the recorded origin). M7 separates stable prepared Material Sources from explicit Tile/Slab physical sizes in one shared local library, adds metadata-only size creation and explicit Checker/Modular matching-size actions, advisory effective pixel density, Straight Slab floor/wall support and bookmatch transform/pair model foundations. IndexedDB is now **v3**, projects **schema 4**; old tile IDs remain the migrated default variant IDs. The ceiling fill has moved to mid-height to remove the near-ceiling point-light hotspot while preserving lit materials, controls and shadows. See [TILE_SLAB_VARIANTS.md](docs/TILE_SLAB_VARIANTS.md) for migration, quality thresholds, resource sharing and limits. Verification passed TypeScript, zero-warning lint, all ten native test files, production build, actual v2/v3 and Schema 3/4 migration, Checker/Modular matching, upload/crop/rotation, exact Slab wall buffers/elevation, all five floor patterns, independent walls/openings, lighting/cutaway with identical shadow pixels, metadata-only resource profiling and two XR emulator cycles. Completed browser checks recorded zero API requests and no application runtime exceptions; XR emitted one existing SDK superseded-offer notice. These M7 facts supersede historical “no M7”, schema 3, IndexedDB v2 and uncommitted-M6 notes above. **M7 remains uncommitted; no push/deployment. Stop after M7. M8 Auto Design / AI Designer is the next roadmap milestone and is not started or implemented here.**

Authority:

1. Actual source code is authoritative for what is implemented.
2. User-confirmed operational facts may supplement what cannot be proven from the repository and must be labeled as such.
3. `PROJECT_MASTER_REFERENCE.md` is authoritative for the current approved product direction and architecture decisions.
4. Historical `PROJECT_HANDOFF.md` is retained for history but is superseded wherever this master reference explicitly disagrees.
5. Future roadmap concepts are not implemented until verified in source/runtime.

Implementation findings began with the read-only audit at `19be60738a919666d5a03c05ee33cbc31fb58ce9` and include Milestones 1/2 plus XR cleanup, subsequently committed by the user as checkpoint 1c3a0b3. Milestone 3 changes were uncommitted during that implementation; M5 begins from clean checkpoint `ebdeeb5` (M4B). The unchanged draft preserves the original findings, including the wall/camera defects corrected in Milestone 1. Browser checks use isolated headless Chrome/software WebGL, not Quest hardware. Milestone 2 adds server-only Supabase integration and a single-operator access gate; fixture verification must not be reported as live online acceptance. Operational deployment information below is explicitly attributed to the user.

# 1. Executive Summary

Today this is a single-room material viewer with an incremental geometric floor installation engine: one editable rectangular room (default 6×7×3 m; broad technical limits documented in §17C), demo/uploaded assets, legacy material Compare, preserved desktop/WebXR controls, and an opt-in Floor Design with Straight Main Field, Center Frame around the center and centered decorative area. Both the 2D plan and 3D installation consume one compiled placement result. It now saves and reopens complete local project designs. Purchasing/quantity output and generic CAD remain future scope. Built-in demo images remain absent and use procedural fallbacks. Existing live 600×600 mm uploaded assets were loaded/rendered read-only; Prestige from the earlier check was absent during refinement; generated fixture assets exercise the exact-format composition and upload/delete workflows.

The primary product is becoming a **Professional Web Tile & Interior Finish Configurator**, desktop/web first. Engineers, designers, showrooms, and homeowners should be able to evaluate actual installation geometry before execution. VR/WebXR is **preserved, frozen future capability**, not the next investment area.

The existing separation of catalog, store, material hook, scene, and navigation is healthy enough for incremental evolution. Preserve it; add a shared installation model and layout compiler rather than rewriting the application or teaching a repeated-texture shader to impersonate a full layout engine.

# 2. Product Vision

Future users should configure rooms, upload actual products with exact dimensions, assign surfaces, combine products and sizes, select patterns, design borders and center motifs, adjust grout/orientation/origin/alignment, and view matching professional 2D and realistic 3D results. Design alternatives and eventual quantities, cut pieces, waste, and technical output provide commercial value.

The target is a real geometric installation, not one flattened image. Example: 60×60 cm outer Main Field, a10 cm dark Center Frame surrounding a120×120 cm decorative center. The room-perimeter implementation is retained internally, disabled/unexposed. Rectangular Field/Center Frame/Center and independent assets are now implemented in Milestone 3; broader combinations, arbitrary zones and patterns beyond Straight remain future work.

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

**Milestone 3 checks:** TypeScript, lint, production build and npm test pass. The native files contain 23 geometry/domain/render-boundary cases plus 11 existing server/security/adapter cases. Browser acceptance uses native CDP and isolated software WebGL; see §17A for fixture/live/XR distinctions. No dependency or lockfile change.

# 4. Repository / Git Status

- Branch: `main`, locally tracking `origin/main`. Milestone 3 started with a clean working tree at `1c3a0b3` (“Complete visual foundation, online tile upload, and XR lifecycle fix”). The older status/history below is historical; M1/M2/XR files are now tracked in that checkpoint. M3 remains uncommitted. No fetch, branch mutation, commit, push or deploy was performed in M3.
- Remote fetch/push: `https://github.com/n7rawy1984/vr-ceramic-.git`.
- Initial tracked working tree: no changes. Initial untracked file: **`PROJECT_HANDOFF.md`**, already present before this audit; preserve it.
- The original audit/finalization created the draft and master documents. Milestone 1 began with all three reference/handoff documents untracked and no tracked modifications. It modifies 10 tracked application files: `src/App.tsx`, `src/App.css`, `src/scene/DesktopControls.tsx`, `Furniture.tsx`, `Lighting.tsx`, `Room.tsx`, `Wall.tsx`, `roomConfig.ts`, `src/state/useConfiguratorStore.ts`, and `src/ui/Hud.tsx`; it also updates this still-untracked master. Historical handoff and draft remain unchanged. No commit, push, reset, or branch mutation was performed.
- Milestone 2 preserves the pre-existing Milestone 1 work and adds API/server/shared models, SQL setup, a local API runner, native tests, upload/library UI, environment example and setup documentation. It modifies catalog/store/material integration and local proxy/typechecking configuration. No real .env.local, credentials, remote SQL execution, commit, push or deployment was created/performed. The user explicitly requested setup instructions because Supabase was not configured at that time.
- At the original audit, history contained two commits: `19be607` (“Polish VR ceramic showroom”), then `2458aa4` (“Initial VR ceramic configurator”). The actual latest diff removes dedication components and wiring (5 files, 160 deletions); its title is not evidence of separate material tuning changes. No dedication remains in current source.
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
| `src/scene/CeramicFloor.tsx` | Preserved simple material preview/Compare; one repeated plane |
| `src/layout/` | Pure mm model/compiler, canonical editable room dimensions, asset/surface adapters, render-boundary buffers and one shared compiled-result provider |
| `src/state/useFloorDesignStore.ts` | Applied room/installation, atomic Apply, active mode, plan presentation and selected placement; draft remains local to the form |
| `src/scene/FloorSurface.tsx`, `AdvancedFloor.tsx` | Simple/compiled seam; merged per-asset body quads, physical grout and selection outline |
| `src/scene/SceneActivity.tsx` | Demand background rendering only under the opaque plan; Room/XR restore normal loop |
| `src/ui/FloorDesign.tsx`, `LayoutPlan.tsx` | Composition controls, validation, single-Canvas shared geometry plan/selection |
| `tests/layout.test.ts`, `tests/browser/floor-design*.mjs` | Numeric geometry/render-boundary cases and fixture/desktop/XR acceptance |
| `docs/GEOMETRIC_LAYOUT.md` | Binding M3 geometry contract, architecture, counts, verification and limits |
| `src/scene/roomConfig.ts`, `useRoom.ts`, `src/layout/roomDimensions.ts` | Default preset/openings; canonical mm room bounds/surface; subscribed scene-meter adapter |
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
| `src/utils/units.ts` | cmToM (legacy), cmToMm/mmToCm and mToMm UI boundaries, mmToM rendering boundary |
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

`Furniture` and `Room` are siblings inside App's `Showroom`, not nested inside each other. There is no frontend router or saved-project backend. Milestone 3 adds a pure floor compiler and a dedicated 2D Canvas preview, described in §17A. Persistence is limited to uploaded tile metadata/images through Supabase integration; its original acceptance checks used a fixture. Read-only live metadata/image rendering was verified in M3; production writes and remote security policy were not audited.

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

Selection still begins at the first demo. Selecting a different id records the previous id and clears Compare; same-id selection is a no-op. getProductById now optionally resolves uploaded products after demos. Uploaded TileAsset metadata remains canonical mm; materialAdapter derives legacy display cm plus `physicalSizeMm`, then rendering explicitly converts mm to meters. The separate FloorInstallation references these same asset identities; compileLayout owns all placement geometry for active Floor Design (§17A).

Compare still displays the previous product across the whole floor, without replacing the selected id. It now works across uploaded/demo sources as well as between demos; it is not split-screen or persisted Design A/B/C. Desktop labels follow the displayed product. Frozen VR rows still expose/select the three demos and highlight selectedFloorId; the shared renderer can consume a desktop-selected uploaded material without a separate VR model.

`setUploadedProducts` reconciles selected/previous ids after reload/delete/lock. A removed uploaded selection resets to the first demo; a removed previous id clears Compare. Full TileAssetView rows live in the library UI, while the scene store receives derived MaterialProducts. Signing URLs are session memory, not database fields. The operator cookie can survive a page reload; chosen floor/design state is still memory and resets on reload. Reopening My Tiles reloads saved asset metadata.

M3 adds a separate authoritative path: `Surface + FloorInstallation + resolved asset bodies → one memoized compileLayout result → LayoutPlan Canvas / AdvancedFloor merged geometry`. Installation references identities only; image/material resolution remains in the asset layer. See §17A for physical joints, zones, cuts and state boundaries.

DesktopView/camera command tokens and VR fields remain as in Milestone 1. New `floorImageError` reports uploaded-image failures visibly; no procedural uploaded-image substitution occurs. Cookie sessions, metadata and images have separate lifetimes; see §17 and the setup guide.

# 7. Current Room / Scene

`ROOM` is the default `living-room-01`, “Modern Living Room”, **6 m X × 7 m Z × 3 m Y**, enlarged from4×5×3 m in M1. The earlier M3 refinement added editable width/length at 4–12 m. §17C supersedes that limit and adds explicit height/window/ceiling/furniture state, stored canonically as mm and subscribed through useRoom by shell/floor/furniture/lights/controls/XR. The following exact6×7 dimensions describe the default preset; all boundary-relative lengths/positions update on Apply. No group scaling. Nominal floor area is **42 m² versus 20 m² (+22 m², +110%)**. This is explicit metric geometry, not scene scaling: floor remains Y=0, now X ±3/Z ±3.5. The size supports a large continuous field for current 60×60, 60×120 and 80×80 products and future larger-format demonstrations while retaining realistic living-room context.

Wall thickness remains 0.12 m; door remains 0.9×2.1 m on +Z, now center X=-2.1 at Z=3.5. Window remains 1.8×1.4 m on +X at X=3, sill 0.9. No opening dimensions changed. Ceiling remains Y=3, inset plane Y=2.975, with coffer/crown/skirting derived from ROOM.

**Wall Y-centering defect corrected:** `Wall.position` is the floor-level center for both branches. A no-opening wall now uses a parent group at that origin and mesh center `[0,height/2,0]`, matching segmented opening walls. Previously the back/left walls extended from -1.5 to 1.5 m; all wall geometry now stays within Y=0…3. Runtime world bounding boxes were checked for all nine segments (two solid walls, three door-wall segments, four window-wall segments). Door/window segment construction remains unchanged. Floor, ceiling, trims and openings were inspected in the shared scene.

`Room` keeps the full architecture. Ceiling, inset, coffer and crown live in named group `overhead`, exposed by `overheadRef`; floor/walls/skirting remain separate. `Showroom` hides overhead in desktop Top or while a desktop camera remains above the ceiling on its return; it restores overhead below Y=2.95. XR explicitly overrides hiding. Furniture is hidden only in desktop Top and restored on leaving it. These are reversible presentation changes, not deletion of room architecture.

Furniture remains primitive geometry; none was added. Rug was removed (former radius 0.75 m, about 1.77 m² of rug footprint). Sofa and wall art now center X=-1.85 near the back-left perimeter; sofa Z=-2.85, base 1.7×0.85 m. Coffee table moved from `[-0.9,0,-0.6]` to `[-1.85,0,-1.85]` (top radius 0.42 m). Side table is now `[-0.55,0,-2.85]`, radius 0.22 m. Lamp follows the back-right corner `[2.5,0,-3]`; plant follows front-right `[2.55,0,3]`. This clusters context around the perimeter and frees the central field. The +22 m² area and removed rug footprint describe geometry, not an exact pixel/union measurement of visible floor.

Room colors are neutralized to wall #f0f0ee, ceiling #f8f8f6, trim #dededb. Window glass/sky backdrop remain unchanged. Lighting in `Lighting.tsx`: white ambient 0.75; hemisphere white/#b6b6b6 at 0.65; white directional key 1.6 (previously warm 2.4), at `[5.2,4.4,1.5]`, scene-graph target `[0,0.4,0.2]`; white ceiling point 0.85, reach max(10,1.5×max(width,length)) m. Lamp point is now white 0.12, reach 2 m, with subdued white emission 0.08. This reduces warm cast, boosts neutral fill and retains dark-material detail without postprocessing. Only the directional key casts shadows: 1024² map, bounds ±7, near1/far40; dynamic shadow extent uses ±max(width,length), expanded for the larger room. Material appearance remains representative, not color-calibrated.

Canvas keeps variance shadows, DPR [1,1.5], antialiasing and near0.05/far100. Physical repeats derive from the new ROOM values; the grout shader behavior is unchanged; the material hook now supports canonical uploaded mm sizes and owned texture transforms. VR_SPAWN automatically becomes `[0,0,2.6]`; existing teleport geometry automatically becomes 6×7 m. No XR locomotion/UI redesign occurred.

# 8. Camera System

`SceneControls` still swaps DesktopControls and VRLocomotion by XR session. Desktop navigation now separates named resting presets, an active tween ref, and deliberate free navigation; it no longer normalizes resting camera/target height every frame.

`presetPose(view,aspect,room)` in `DesktopControls.tsx` defines the following default 6×7 poses (Overview/Floor elevation scales by max(width/6,length/7); Top fits current dimensions; Detail remains a physical close-up):

| View | Position (m) | Target (m) | FOV / behavior |
|---|---|---|---|
| Room Overview | [0.8,2.65,3.1] | [-0.3,0,-0.9] | 58°; default elevated room/floor composition |
| Floor Focus | [0,2.45,2.85] | [0,0,-0.1] | 52°; floor-led perspective with scale/context |
| Top | [0,H,0.001] | [0,0,0] | 45°; near-vertical, full-floor fit for viewport aspect |
| Detail | [0.65,1.15,1.8] | [0.1,0,0.5] | 48°; tile/grout close inspection, radius about 1.82 m |
| Free | User-controlled | Short look target preserving direction | Drag look, WASD/arrows walk, wheel lens zoom |

Top height H is `max(ROOM.length/2, ROOM.width/2/aspect) / tan(45°/2) * 1.22`, about 10.31 m at 1440×900; viewport resize refits Top; room dimension changes reframe the current view and invalidate its pre-resize saved return pose. It is a perspective camera pointed nearly vertically with a tiny Z offset to avoid a pole singularity, not an orthographic technical renderer. Rotate/zoom/walk are locked in Top, with reversible overhead/furniture hiding (§7). Exact top-down floor coverage was visually checked at representative desktop/portrait widths.

All preset commands use 0.8 s cubic-eased position/target/FOV interpolation. During transitions, input is disabled, polar limits are relaxed, and **minDistance=maxDistance tracks the live camera-target distance**. Resting presets retain their actual radius; there is no universal tiny clamp. This preserves the historical macro-collapse fix. Resting non-Top presets permit orbit inspection with polar limits 0.15…π/2−0.05; free look permits 0.15…π−0.15.

Dragging in Overview enters free look with LOOK_RADIUS=0.1 m while preserving direction. WASD/arrows in room/free enter or continue walking, speed 2.2 m/s, bounded 0.35 m inside walls. Eye height is set to 1.6 m **only on actual walking**, translating the target by the same delta to preserve pitch. Floor/Top/Detail disable walking. Wheel lens zoom remains 35°–75° outside Top/transitions. Key handlers ignore editable fields, prevent handled arrow scrolling and clear held keys on blur. No furniture collisions/mobile walking UI were added. Milestone 2 pauses background camera updates/held movement keys while a native library dialog is open and ignores dialog key events, preventing upload inputs/buttons from moving the room.

Entering Floor/Top/Detail from room/free saves position, target, FOV and room/free mode. Switching among inspection presets preserves that original saved pose. Back to Room restores it; Overview selects the canonical room preset. Reset always clears the saved return and requests canonical Overview/FOV 58, including during interrupted transitions. Camera requests use an incrementing token separate from the active view so navigation does not accidentally restart a tween.

**Historical defect corrected:** the old unconditional frame-loop Y assignments overwrote the initial hero/downward view. Presets now rest unchanged; numerical settling/return/reset checks confirm this. The original wall/camera findings remain in the unchanged draft and historical reconciliation below.

**Top View remains 3D camera inspection.** Milestone 3 adds a separate Layout Canvas preview driven by the shared compiler, with fit-to-view, piece selection/dimensions and Field/Center Frame/Center. It is not a CAD/drag editor; advanced authoring remains future work.

# 9. Current Material System

`CeramicFloor` renders **one room-sized PlaneGeometry** (default 6×7; dimensions from useRoom) with default normalized UVs, rotated -π/2 about X. It has one product/material, no per-tile meshes. A neutral loading material keeps the floor shell visible while the selected image loads; failures show an explicit UI error. With that rotation, increasing local plane V maps toward negative world Z. Repeat-derived grid origin is an implicit plane UV boundary, not an installation origin stored in application state.

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

**Legacy simple-preview grout metrology concern (not the M3 compiled convention):** groutWidth/tileDimension is used as the threshold on **each side** of an integer UV seam. Thus the ideal hard boundary spans about twice the nominal groutWidth across adjacent cells, before AA/bevel. All demo products declare 0.4 cm; that value should not be presented as a verified 4 mm physical joint. Resolve full-width vs half-width convention, tile-body vs pitch semantics, and tolerances before engineering layouts/quantities.

The material hook clones loaded albedo/normal/roughness maps before applying UV transforms, then disposes those clones and each replaced material. This resolves the audited shared mutable-transform risk for multiple usages. Cached sources remain reusable and source-cache eviction disposes sources independently. Optional auxiliary-map loading still uses its existing URL cache; an expanded real PBR asset pipeline remains future work. No KTX2/atlas/multiple-face feature was added.

Uploaded finish roughness is **polished 0.28 / satin 0.42 / honed 0.60 / matte 0.82**, via `UPLOAD_ROUGHNESS` in materialAdapter. Demo scalar values remain unchanged. Crop and image rotation are baked into prepared stored pixels, so uploaded textureRotationDeg stays 0 and does not rotate the grout grid. These are representative appearance controls, not calibrated finish measurements.

**Renderer seam implemented in M3:** FloorSurface inside Room keeps CeramicFloor/useTiledCeramicMaterial as the simple uniform preview path and selects AdvancedFloor for active Floor Design. AdvancedFloor consumes shared compiled placements. Reuse asset loading/PBR concepts while isolating mutable transforms per material use. Use instancing/batching for compatible uncut tiles and separate clipped boundary geometry as appropriate after measurement. Renderer selection must not become an alternative placement algorithm: when the compiler exists, it owns placement for 2D, 3D and VR alike.

The legacy single repeat grid cannot express independent zones/cuts. The M3 compiled path now supports rectangular field/Center Frame/center subtraction, independent assets and 0°/90° Straight bodies; modular patterns, arbitrary polygons and multiple faces remain absent. Extra texture masks alone would not supply the missing authoritative geometric data.

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

Milestone 1 Overview/Floor/Top/Detail/Back to Room/Reset and responsive demo catalog remain. The catalog adds **My Tiles · Add Tile**, opening a native modal Tile Library. No brand rename or broader Engineer Mode was added. M3 now adds the focused Floor Design room-size/composition controls and dedicated Layout plan (§17A).

Without an operator session, the modal asks for one access code. Valid sessions reveal Add Tile and saved uploaded cards; Lock library clears cookie/library state. Public demos remain usable without unlocking. No account signup, Supabase Auth, profiles or user permissions exist.

Add Tile accepts JPG/PNG/WebP ≤5,000,000 bytes, name, cm width/height, Ceramic/Porcelain/Marble/Natural Stone/Decorative and Polished/Matte/Satin/Honed. Preview shows filename/physical size; rotation 0/90/180/270 and edge-trim crop sliders use browser canvas. Inputs validate name and positive dimensions. Progress states include preparing preview/upload, uploading, saving and Ready. Save prevents double submission and reuses a completed upload on metadata retry. Other busy actions/refresh disable the form; close/delete/apply are disabled while saving.

Saved cards show image, name, dimensions, material/finish, Apply and confirmed Delete. Apply is offered only after save; image failures are visible and can be retried with Refresh. An uploaded/deleted/locked selection reconciles safely with demo/Compare state. There are no folders, SKU editor, search or pagination. Multiple simultaneous materials now belong to Floor Design (§17A), not legacy material Compare.

The modal stacks its form/library at mobile widths; 390×844 browser fixture capture was reviewed without horizontal overflow. Native dialog focus/inert behavior is used; background camera input is explicitly paused while it is open. The underlying catalog retains its existing ≤640 px bottom-sheet rules and initial open-state behavior.

The splash remains first-frame based, not asset-complete readiness. The floor now shows a neutral surface while a new map loads and a visible floor-image error if uploaded access fails. ErrorBoundary remains render-error recovery only. Upload progress is distinct from scene startup readiness.

# 12. Current VR/WebXR Architecture

`xrStore` retains `controller:{teleportPointer:true}` and `hand:{teleportPointer:true}`. Emulation is now `false` except when DEV and VITE_XR_EMULATOR=true; explicit mode uses `{inject:true,syntheticEnvironment:false}`. `useVRSupported` checks navigator.xr.isSessionSupported('immersive-vr') with checking/supported/unsupported states; Hud catches enterVR rejection. App keeps Room, Furniture, and floor shared while swapping navigation through SceneControls.

`VRLocomotion`: XROrigin starts at VR_SPAWN. `useXRControllerLocomotion(originRef,false,{type:'snap',degrees:30,deadZone:0.5})` disables smooth stick translation. An invisible room-sized plane inside TeleportTarget translates origin on teleport. Return token moves origin to spawn without resetting headset orientation. Target area is rectangular, not furniture-aware; room bounds do not establish physical safety or prevent real-world movement beyond the target.

VRToolbar at local `[0.45,1.1,-0.5]` exposes Materials and Return to Start. VRMaterialPanel at `[0,1.25,-0.6]` renders catalog rows with RoundedBox/Text, onClick selection, and **procedural-only** 96 px swatches. VROnboarding at `[0,1.5,-0.95]` uses a store flag, surviving exit/reentry but not reload. All panels are origin children; they move/turn with rig, not head-look. Controller/hand routing relies on XR pointer infrastructure; hardware operation is unverified.

Production emulation is explicitly disabled. Development emulation is now opt-in via `npm run dev:xr` or `VITE_XR_EMULATOR=true`; normal `npm run dev` passes `emulate: false`. Installed `@pmndrs/xr/dist/store.js` guards setup with `emulate != false` and contains the lazy emulator import. Emulator chunks remain in the Milestone 1 production build; the production guard is unchanged. No production network trace was captured. Milestone 2 did not edit XR, VR locomotion/panel files, room dimensions, lighting or furniture; uploaded materials feed the same floor renderer. No new VR UI/functionality was added. No Quest hardware validation exists in the handoff or Milestone 1; do not claim it now. Current VRLocomotion subscribes through useRoom: spawn=[0,0,length/2−0.9] and teleport plane=width×length (default[0,0,2.6] and6×7). Showroom visibility explicitly restores overhead/furniture for active XR, regardless of desktop Top state. Milestone 2 left XR session setup, locomotion and VR UI source files unchanged; the subsequent authorized exit repair is recorded below.

### XR exit maintenance — 2026-10-26

Historical XR regression repair scope: Milestone 3 was not authorized at that time. The subsequent explicit M3 request is implemented in §17A. `docs/XR_LIFECYCLE.md` contains installed-source evidence and the native CDP browser runner instructions.

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

**Historical M2/XR service verification (subsequent read-only M3 checks are in §17A):** during original Milestone 2 verification the user had not configured Supabase and requested setup instructions. The user now reports live testing; this maintenance task does not independently verify the service or deployment. SQL was not executed remotely; no actual bucket/Data API permissions, live upload, production Vercel API routing or deployed commit mapping were verified. Follow `docs/ONLINE_TILE_SETUP.md`; do not equate test-fixture persistence with live Postgres/Storage proof. Quest hardware remains untested.

**Milestone 1 implemented and checked:** 6×7×3 m room; floor-based wall convention; perimeter seating/rug removal; neutral lighting; explicit room/floor/top/detail/free modes; live-radius/FOV transitions; reversible Top occlusion; saved return and Reset; responsive view controls. `npx tsc -b`, `npm run lint` and `npm run build` passed. Chunk-size warnings remain; no dependency installation or new test framework.

**Milestone 1 runtime verification (isolated headless Chrome, SwiftShader):** visually inspected Overview/Floor/Top/Detail screenshots; all three product repeat pairs and previous-product Compare checked in all views; stable preset coordinates and non-macro radii checked; WASD/arrow walking, mouse drag look and wheel zoom verified (58°→60.4° in the input check); Back to Room restores saved position/target/FOV; interrupted Top→Detail→Reset converges to Overview; Top stays elevated and hides overhead/furniture, normal views restore context; nine world-space wall segment boxes lie within Y=0…3. Responsive control bounds, catalog collapse/open and switching checked at desktop 1440×900, tablet 820×1180, mobile 390×844 and 360×740. Session scripts/results/screenshots are under `/tmp/ceramic-*`; they are temporary artifacts, not a committed regression suite. Browser polling waits for actual rendered poses/maps, since software WebGL settles slowly. Screenshot observations do not establish real-device performance or calibrated material color.

**Milestone 1 preservation history:** the original milestone left material/catalog/XR sources unchanged. Milestone 2 now adapts CeramicFloor/catalog/store/texture/material loading for uploaded assets while preserving the actual grout fragment shader, demo product data, camera poses, room geometry, furniture, lighting and XR/VR files. The built-in demos still use procedural fallback because their real product images are absent; uploaded assets use the saved image. No claim of zero missing-image requests is made.

**Historical desktop validation, attributed only:** PROJECT_HANDOFF (2026-08-18) reports clean build/type/lint, headless Chrome screenshot reviews of switching/scale/grout/camera/Compare, responsive viewports, and dev/preview behavior. No artifacts reviewed here establish that those results still describe every current visual detail. Missing image URLs are consistent with fallback rendering; do not infer zero failed texture requests merely from an overall historical zero-failures claim.

**Implemented but not hardware tested:** immersive session entry, controller rays, hand selection, teleport, snap turn, in-world legibility/comfort, actual headset material appearance/performance. New audit has no physical test results.

**Not implemented:** saved Project/nonrectangular room editor, commercial Product/Variant/SKU catalog, multiple faces/PBR-map uploads, arbitrary polygon zones, patterns beyond Straight, CAD/drag editing, persistent projects/design A/B/C, quantity/waste/pricing/PDF/share workflow, accounts/profiles/Supabase Auth or full admin dashboard. Rectangular zones, geometric cuts/compiler, multi-asset floor and the 2D preview are now implemented in M3 (§17A). The limited upload backend and single-operator gate are implemented as above.

# 14. Known Technical Constraints / Debt

1. Legacy Simple material uses one global selected/previous floor product. Floor Design has independent field/Center Frame/center asset references; no commercial catalog/category expansion.
2. Simple mode remains one repeated plane. M3 adds deterministic visible placement/cut provenance and rectangular zone coverage; no arbitrary polygon/quantity engine.
3. Rectangular room width/length is now canonical mm,4–12 m per side, with derived scene/camera/furniture/light/XR dimensions. No arbitrary room shape, opening editor or furniture-layout system.
4. Upload/save/list/delete and dimension validation now exist, but metadata editing, original-image archive, saved projects and a versioned project schema do not.
5. Native server/security tests plus 23 M3 geometry/domain/render-boundary cases and checked-in CDP browser runners now exist. Lint/type success does not establish geometry or visual correctness.
6. Historical wall no-opening Y centering and unconditional walking normalization were corrected in Milestone 1 (§7–8); the draft preserves the original findings. New scene/camera changes still require visual regression checks.
7. Shader grout width/pitch semantics, rotated rectangular layouts, and fragment-string compatibility need verification; shader depends on Three chunk names/vMapUv.
8. Cached sources now remain immutable and material-owned clones isolate UV transforms; the main source cache is bounded/id+URL keyed. Optional-map cache expansion, large-library texture memory and future many-zone batching still need measurement/design.
9. Uploaded image loading is browser-tested with generated fixtures; actual supplier photography/auxiliary maps and headset material fidelity remain unvalidated. VR swatches remain procedural/demo-only.
10. Keyboard listeners remain global but filter editable fields/dialog events, clear keys on blur, and pause with the library modal. Broader CAD input tools remain future scope; the bounded Canvas plan is implemented, while Top stays 3D camera inspection.
11. Splash is still first-frame rather than all-assets-ready. Upload progress, image errors and signed-access refresh now exist, but no broader scene asset-readiness barrier was added.
12. No furniture collision for desktop or teleport destinations; do not describe rectangular movement bounds as obstacle/safety validation.

Verified strengths to preserve: physical unit conversion/repeat basis; catalog metadata separated from scene; reusable standard PBR hook and optional maps; cached albedo/auxiliary loading with fallback and material disposal; shared scene/store with desktop/XR navigation isolation. Scratch vectors, shared trim materials, limited shadow casters and DPR cap are useful existing performance choices, not a measured performance guarantee.

**Documentation reconciliation:** root README is a Vite template. Handoff clean-tree claim is stale (handoff itself is untracked). Old demo-freeze/VR priority statements are superseded by this request. Category extension is not zero scene/UI work. baseColor is documented as functional but unused. Room still composes no Furniture child; both now live inside Showroom. Handoff floor radius ~2.66 is numerically wrong (~2.375). Its stable hero/reset composition description omitted the frame-loop Y normalization that Milestone 1 corrected; the wall Y-centering finding was also corrected, not erased from history. Darkstone drawer base differs slightly from prose. Latest “Polish” commit actually removes dedication; it does not prove the tuning history attributed to it. Existing docs' photo readiness/fallback assurances do not verify distortion-free cropping, exact grout width, or hardware fidelity. No absent feature should be inferred from comments claiming future extensibility.

# 15. New Strategic Direction

Desktop/web installation confidence is now primary because the user's target work is showing actual finishes, dimensions, combinations and installation choices before construction. Keep VR intact and frozen; do not spend the next milestone improving Quest UX. Preserve conservative scene/performance choices where useful without allowing the former VR-first roadmap to block professional desktop layout tools.

# 16. Target Future Architecture

**The broader table remains future design.** M2 implements TileAsset persistence/render adaptation; M3 now implements a focused rectangular Surface, FloorInstallation, field/Center Frame/center model, Straight LayoutCompiler and shared render consumers (§17A). Generic Project editing, nonrectangular room authoring, arbitrary zones/patterns and multi-face commercial models remain absent. Focused rectangular room dimensions are canonical mm with derived scene geometry; ROOM remains its default preset.

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

Evolve alongside current code: adapt static MaterialProduct entries into renderable assets while preserving a path to Product/Variant identity; separate authored installation data from UI/navigation store; introduce stable surface coordinates; preserve uniform preview while validating compiler parity. Avoid duplicating editable parameters across renderers. Broader commercial schemas, project persistence and general polygon clipping remain future decisions. The implemented rectangular M3 schema and numeric precision policy are specified in §17A; no clipping dependency was added.

### Product / Variant / Asset Compatibility Contract — Future Domain Architecture

```text
Product → Variant / SKU → TileAsset / FaceSet → Installation
```

A commercial catalog separates shared product-family metadata from the actual purchasable format/finish/SKU and its renderable face set. Installation stores customer/project placement choices rather than product-family identity alone. Preserve references back to Variant/SKU for eventual quantities and purchasing; do not collapse commercial identity into an image URL.

An ad-hoc engineer upload can instead create a project-local TileAsset with image, dimensions and finish and use it immediately without a commercial catalog or mandatory Product/Variant records. Both workflows must coexist. Product/Variant implementation is **not required in Milestone 2 — Upload Tile**; this is a compatibility requirement for future domain evolution, not immediate scope.

### Units & Coordinate-System Contract — Binding Before LayoutCompiler

- UI may accept/display cm, mm or m. Uploaded TileAsset persistence and the M3 domain/compiler use millimeters. Preserve explicit conversions and the Surface contract in §17A in future work.
- Conversion occurs at defined input/import/display/export boundaries, not ad hoc inside renderers. Current catalog centimeters and scene meters describe existing code, not the final domain contract.
- Every Surface has a stable local 2D coordinate system with documented origin, axes and orientation.
- LayoutCompiler computes in surface-local coordinates. The 3D renderer transforms those coordinates into world space; dedicated 2D technical rendering consumes the same local coordinates.
- M3 uses 0.000001 mm epsilon and explicit axis-aligned rectangular intersection/subtraction/merge, without a third-party clipping package. Future polygons/quantity models need additional explicit policies; do not silently change the M3 contract.

# 17. Tile Upload Implementation / Future Compatibility

**Implemented locally in Milestone 2; initial checks used a fixture. The user subsequently reports live testing.** This is a single-operator online library backed by Supabase metadata/private Storage through server APIs. No Supabase Auth, account, user table, identity/profile record, ownership columns or commercial Product/Variant implementation. Ad-hoc images can be saved immediately with exact dimensions/finish, preserving a future catalog-linking path.

See **`docs/ONLINE_TILE_SETUP.md`** and **`supabase/migrations/20261025_tile_assets.sql`** for setup/operations. Server variables are SUPABASE_URL, SUPABASE_SECRET_KEY (preferred current secret), optional legacy SUPABASE_SERVICE_ROLE_KEY fallback, ADMIN_ACCESS_CODE and ADMIN_SESSION_SECRET. None use VITE_; no publishable/anon browser key or Supabase SDK is needed. Current secret keys use apikey only; legacy JWTs also use Bearer, server-side. Node 24 `npm run dev:api` loads ignored .env.local on 127.0.0.1:3001; Vite proxies /api. Root api/ handlers are for Vercel; optional `npx vercel dev` is documented but not run. No remote SQL, project creation or deployment occurred.

Endpoints: POST /api/admin/login, GET /api/admin/session, POST /api/admin/logout; POST /api/tile-assets/upload-url; POST/GET /api/tile-assets; DELETE /api/tile-assets/:id. Privileged endpoints verify the operator session. Cookie is 8-hour HttpOnly, SameSite=Strict, Secure in production/Vercel, Path=/api. HMAC sessions/receipts are tied to code/secret; JSON writes require same Origin. No password/localStorage. The local eight-failure/15-minute limiter is per instance; configure production Vercel Firewall limits. Responses are no-store and do not echo upstream secrets/errors.

The required private bucket tile-assets must allow JPEG/PNG/WebP, maximum 5 MB (application exact cap 5,000,000 bytes). Server generates tiles/<uuid>.<extension>. Upload signing returns a Storage URL plus a path/MIME/size-bound 30-minute application receipt; bytes PUT directly from browser to Storage. Confirmation checks stored metadata and up to 32 header bytes before immutable insertion. A DB timeout checks the same id and allows metadata retry without duplicate rows. The supplied migration enables RLS and removes anon/authenticated access on the metadata table; elevated credentials bypass RLS and stay server-only.

Preparation uses existing browser APIs, no package: decode, optional normalized edge crop, clockwise 0/90/180/270 rotation, output ≤4096px long edge, still ≤5 MB; oversized decoded image dimensions are rejected. Prepared pixels are stored; original bytes are not retained. Rotation/crop fields record preparation history and do not alter grout or apply a second transformation. UI cm → persisted mm → rendering meters is explicit; source photography dimensions never determine physical repeat.

Saved list responses contain one-hour signed read URLs, regenerated on reopen/Refresh and periodically while mounted. DB stores only storage_path. Image signing/loading errors are explicit; uploaded failures never generate fake marble. Apply preloads the image with a timeout; the renderer uses mm dimensions, owned texture-map clones and the existing PBR/grout shader. Polished roughness 0.28, Satin 0.42, Honed 0.60, Matte 0.82; representative, not calibrated.

Confirmed Delete removes row then object, compensating by restoring metadata if Storage fails. If restoration also fails, the UI retains an eight-hour signed cleanup receipt for retry; a lost/expired receipt or server interruption can require manual orphan cleanup. Abandoned/uncertain uploads can also leave private unreferenced objects. Supabase signed upload URLs last two hours independently of the app receipt; already issued signed URLs are bearer capabilities and are not revoked by app logout. Never store their URLs in the database.

Future multiple faces, auxiliary-map upload, manufacturer/SKU management, project persistence and advanced image editing remain deferred. A saved tile library is not a saved installation. Milestone 3 now satisfies the body/full-joint/mm/rectangular-surface/compiler gate with the explicit contract in §17A. Purchasing/cut reuse and broader geometry remain future work.

# 17A. Milestone 3 — refined composition and editable room (2026-10-27)

**Preserved and evolved the uncommitted M3 work from checkpoint `1c3a0b3`.** The user corrected the primary composition to **outer Main Field → Center Frame → Center**, with independently obvious tile selectors and editable room dimensions. This supersedes the initial perimeter-border interpretation; it is not Milestone 4. Full contract, exact counts, files and verification: [docs/GEOMETRIC_LAYOUT.md](docs/GEOMETRIC_LAYOUT.md).

**Canonical geometry:** room `{widthMm,lengthMm}` defaults 6000×7000, each side 4000–12000. Room and installation controls edit one local draft; Apply Design validates and commits them together. Empty/out-of-range values leave the applied design unchanged. Asset body sizes are immutable installation inputs, separate from center area/frame width. Full joint j is one gap; pitch=body+j. Local origin back-left, +X width,+Y toward door; world=[(x−width/2)/1000,.002,(y−length/2)/1000]. Epsilon 0.000001 mm; numeric area tolerance 0.1 mm².

**Center > Center Frame > Field:** center body area centered; frame outer=(center width+2f,center height+2f), so 1200×1200+100 frame gives exactly 1400×1400. Inner joint is cut from the frame band, outer joint from field. At frame 100 / joint 3 mm, stock 100 mm strips have 97 mm visible cross-width: real cuts with original-body UVs, not stretched textures. Top/bottom own butt corners; long edge follows side. Frame must leave a positive body width beyond its joint; center+frame+outer seam must fit. Frame with Center disabled keeps its opening filled by Main Field; disabling zones retains choices. No field bodies/joints remain below higher zones. One field grid phase; true L-cuts share sourceTileId. Legacy room-perimeter `border` is internal, disabled/unexposed, with its old numeric tests retained.

**Shared compiler:** `roomSurface(roomSize)+FloorInstallation+resolved demo/uploaded body assets → one memoized compileLayout result → LayoutPlan Canvas / AdvancedFloor`. Pure compiler, deterministic IDs/sourceTileId, visible body rectangles, source crops, rotation 0/90, full/cut, explicit joint rectangles, regions/areas/errors; 10000 candidate-cell budget. No extra placement algorithm, material per tile or React node per tile. 3D uses one indexed body batch per asset + grout; disposed replacement buffers/materials and read-only cached sources.

**Scene and UX:** clear Main Field/Center Frame/Center selectors list demos and My Tiles with body dimensions. Room controls precede them; room dimensions are separate from tile and zone dimensions. Floor/walls/openings/ceiling/trims/furniture anchors/lights/walk bounds/XR spawn+teleport derive from subscribed room dimensions, preserving fixed physical furniture/opening sizes. Range 4–12 m supports existing context without a furniture-layout system. Top fits room/aspect; Overview/Floor elevation adapts; Detail remains a physical close-up. Resizing clears saved pre-resize room pose; live transition radius and XR cleanup remain. Reset camera uses current room; Reset Design retains room dimensions. Refresh resets session-local room/design; uploaded library persistence unchanged. Simple material/Compare preserved on resized floor. Plan uses demand rendering; active XR/Room restore normal loop. No new XR controls.

**Numeric verification:** 23 geometry/domain/render cases plus 11 unchanged server/security/adapter cases pass; TypeScript/lint/build/npm test pass with existing large-chunk warnings. Coverage tests verify no body/joint overlap, exact area, centered ring, independent assets, deterministic cuts/IDs, invalid frame/center/room, unchanged body dimensions across 4200×5600,5400×7200,6000×7000,8000×10000.

**Runtime verification:** full fixture upload/apply/delete/refresh/recovery/lock/unlock/Compare/mobile and 2D/3D buffer/clip parity passed. Resize scenarios 6×7,5.4×7.2,8×10,4.2×5.6 passed actual floor/ceiling/body buffers and Top corner projection; mixed assets, invalid drafts, toggles and views passed. With 600×600 field/100×600 frame / 1200×1200 center, joint 3 mm, counts are 122/10/1 at 6×7,110/10/1 at 5.4×7.2,241/10/1 at 8×10. At 5.4×7.2 bodies 38,516,646 mm²+joints 363,354 mm²=38,880,000 mm²; at 8×10 bodies 79,210,526+joints 789,474=80,000,000 mm². Three asset batches+grout=four floor meshes (121 pieces→484 vertices;252→1008). Counts are visible pieces, not purchasing quantities.

**XR:** two emulator cycles, first 6×7 from Room then 8×10 from Layout; installation/original camera restored, actual spawn/teleport dimensions matched. Exit counters remained 7 frame subscribers, 1 canvas, 0 active inputs/overlays; post-exit WASD/drag/wheel/Reset/Reset Design passed. Normal dev has emulator disabled; dev:xr explicitly enables it; production guard/store/panels/controllers/hands/teleport/snap-turn preserved. VRLocomotion only changed its room dimension subscription. The installed SDK emitted a superseded automatic-offer rejection; it is recorded separately as sdkNotices, while unrelated exceptions fail the runner. No SDK/session behavior was changed. Software WebGL/DPR 0.5 acceptance is not physical-headset/FPS proof.

**Limits:** rectangular room/zones,Straight 0/90,fixed grid,butt corners,planar tops,bounded candidate count. No arbitrary polygons/Running Bond,multi-size patterns,quantities/waste/cartons/prices/PDF,saved projects/accounts or broader backend. API/Supabase/security/schema/dependencies unchanged. No commit/push/deploy.

# 17B. Milestone 3 — explicit Apply Design correction (2026-10-27)

**Implemented and runtime verified without changing compiler geometry, room limits, joint semantics, Center Frame, uploads/Supabase or XR.** Floor Design now edits a local draft of all room/installation controls. The previous field/zone/joint inputs called the authoritative store on each edit; context recompilation then replaced merged geometry and redrew the plan. Room dimensions had a separate Apply action, allowing partial composition changes. That eager path is removed.

**Apply Design** sits beside **Reset Design** in a permanently visible footer, with the fields scrolling separately so actions do not cover inputs. Apply is disabled when the normalized draft equals the applied configuration; otherwise a subtle “Unsaved changes” status appears. Apply validates room bounds and the complete composition against current assets, then publishes room dimensions and installation together in one Zustand action. The provider reuses that validated compiler result for both consumers, avoiding another compilation at publication. Invalid Apply shows visible validation and leaves the applied room, geometry and plan unchanged. Existing zero-joint support remains unchanged. No automatic Enter submission or global Apply listener was added.

Reset retains the existing product behavior: reset composition from the selected simple material, retain current room dimensions, synchronize the draft and clear dirty/errors. Close discards unapplied edits; reopening copies applied state. Switching Room/Layout while the panel stays open preserves the draft. Drafts have no persistence. Initialization, Reset and asset availability/URL refresh can still compile; typing/selecting/toggling draft fields cannot.

**Measured runtime:** native V8 precise function-call coverage observed zero compileLayout calls during multi-digit numeric edits and all three asset/orientation selections, one call on a valid Apply, and one atomic configuration publication. Geometry UUIDs remained unchanged before Apply. With Layout open, center edits 1200→1800 mm produced zero plan redraws and retained the actual 1200 mm 3D bounds; Apply changed both to 1800 mm. Invalid room/center/frame/joint drafts held the applied snapshot; Close/reopen and Reset synchronization passed. The exact 5.4×7.2 / fixture Prestige / Dark Stone frame100 / Carrara center1200 / joint3 workflow passed. Fixture My Tiles loading and uploaded-image rendering passed; no live asset writes or service/security changes.

Footer hit tests passed at 1280×900, 820×1180 and 390×844, at both form scroll ends; screenshots were inspected. Overview/Floor/Top/Detail passed. Two emulator cycles with explicit Apply (6×7 Room, 8×10 Layout) preserved installation, original camera and plan; exits retained 7 frame subscribers, 1 canvas, 0 XR inputs/overlays; post-exit WASD/drag/wheel/Reset/Reset Design passed. Existing SDK superseded-offer console notices remain documented; no unrelated runtime exception. Software WebGL at test-only DPR0.5; no headset/FPS claim. TypeScript/lint/build/npm test and 23 geometry + 11 server/security cases pass, with existing bundle warnings. No commit/push/deploy or later milestone.

# 17C. Urgent Usability / Local Architecture Refinement

Authorized refinement only; no Running Bond, advanced patterns, quantities, PDF or further roadmap milestone. This section supersedes earlier active-room and temporary memory-library descriptions.

- **Material fix:** catalog clicks previously changed legacy selection while `FloorSurface` could still choose the compiled renderer; the catalog mapped built-ins only. Explicit Simple selection now disables compiled mode, returns Room presentation, closes the composition panel and clears Compare (including selecting the same id). Simple and advanced material caches retain their existing ownership rules; no page reload workaround.
- **Shared assets:** `demoLibrary.ts` wires one durable local repository; `useTileProducts` exposes built-ins plus its derived local products to Simple catalog/renderer and the Floor Design provider/selectors/plan. The inactive server UI's legacy adapter property is preserved for reactivation and is not the current local source.
- **Persistence:** IndexedDB v1 `tile-configurator-local`, store `tile-assets`, stores prepared blobs and TileAsset metadata in canonical mm. Startup hydrates once, independently of My Tiles. URLs are recreated at runtime, revoked on deletion/runtime disposal and never stored. Save/delete await transaction completion; failed writes do not publish fake success; malformed records are skipped with a contained message. Deletion reconciles Simple, Compare, Field, Center Frame, Center and the internal disabled border to built-in defaults. Local assets survive same-origin/profile refresh/restart; room, camera and installation choices remain session-only. Browser storage clearing/private-mode/quota limits still apply. No backend or environment flag is required.
- **Dimensions:** explicit room width/length 1–100,000 mm and height 1–50,000 mm are numerical/rendering guards, not a normal-room business range. Physical tile bodies and compiler joint/cut semantics are unchanged. The existing 10,000-grid-cell compiler guard can reject dense advanced designs; use larger tiles or a smaller composition. Window/frame and gypsum fit validation can reject incompatible combinations even when shell dimensions are valid.
- **Architecture:** Room Settings has drafts and one Apply Room action. Default furniture is hidden and default ceiling is flat Simple. Furniture Show restores all original context objects without changing floor geometry. Window remains on the existing right wall, with enabled/width/height/sill and signed horizontal offset from wall center (positive toward back). Real segmented wall openings, frame, glass and sky update together; up to 50 mm margin accommodates the frame. Gypsum restores a decorative perimeter coffer/crown with inset-band width and downward drop controls. This is not a window-wall picker or ceiling CAD editor.
- **Scene/performance:** no whole-room scaling. Width/length update floor/shell, height updates wall/ceiling/trim/opening bounds. The preset door adapts when necessary for small shells. Camera interior heights and walk eye height are bounded by room height; Top keeps full-floor fitting, live radius remains pose-owned, and near/far bounds adapt. Lighting/shadow extent and range adapt without extra lights/postprocessing. XR retains its store, panels, controllers, teleport/snap turn and opt-in emulator; the shared teleport plane follows room size and spawn margin fits short rooms. Draft keystrokes do not publish geometry. Height/furniture/window/ceiling-only Apply preserves the floor size reference and compiled placements; width/length Apply reuses its validated compilation. Storage reads are not performed per render.

**Verified in this refinement:** TypeScript/lint/build, 46 native cases, and production browser workflows passed. Actual Simple/compiled/material changes, independent local assets, 2D/3D, requested room sizes/heights, draft/apply, physical window edits/rejection, furniture and ceiling controls passed. Real IndexedDB refresh plus browser-process restart retained both uploads; deletion reset references and remained deleted after reload. Production phases recorded zero API calls and zero runtime exceptions. Normal development stayed emulator-free; two opt-in emulator cycles at 2.8×3.5×2.4 m and 15×20×4.5 m verified live teleport/spawn bounds and desktop camera/Floor/Reset recovery. Software WebGL/test-only DPR 0.5; no physical-headset, hardware-performance or live deployment claim.

Verification and exact changed-file inventory are recorded in [USABILITY_REFINEMENT.md](docs/USABILITY_REFINEMENT.md). No commit, push, deployment, remote SQL, backend debugging, dependency change or further roadmap work is authorized by this refinement.

# 17D. Milestone 4A — Floor Patterns

Explicitly authorized extension of the existing pure compiler and draft/applied installation. Supported `LayoutPattern` values: `straight`, `running-bond-50`, `running-bond-33`, `checker`. `field.tileAssetId` remains A; optional `field.secondaryTileAssetId` supplies Checker B. Default installation stays Straight with its original serialized shape.

**Geometry:** apply orientation before computing effective horizontal pitch = laid body width + one full joint. Running Bond 50% uses `(row % 2) * pitch / 2`; 33% uses `(row % 3) * pitch / 3`. Offsets move along local horizontal X, rows advance along local Y; the modulo cycle avoids cumulative drift. A shifted row includes a leading negative-column body, then clips to existing field regions and preserves real source crops. Each row partitions pitch cells into bodies/right/bottom gaps. Checker chooses A/B by original row+column parity, including fragments around exclusions. No UV offset fakes the pattern.

**Constraints:** Checker A/B share field orientation and must have equal physical body dimensions after orientation within the existing 0.000001 mm tolerance. Missing/invalid B or mismatched sizes rejects Apply with a clear message and retains the applied floor. Slots may reference the same asset (uniform result). Center > Center Frame > Field, frame/corner/center algorithms, joint semantics, 10,000 candidate-cell / 40,000 piece guards and physical scale remain unchanged. Pattern applies only to Main Field, including a frame opening when Center is disabled.

**State/UI/safety:** Pattern dropdown stays draft-only; only Checker exposes Field Tile A/B. Shared built-in/IndexedDB assets feed both slots. Existing Apply validates once, publishes atomically and reuses the compiled result. Deleting a referenced Checker A/B falls back to a valid Straight field (retaining A if available, otherwise first built-in) and removes a missing B reference; existing Simple/Compare/zone reconciliation remains. Catalog selection still explicitly exits the compiled renderer.

**Architecture/performance:** LayoutPlan and AdvancedFloor are unchanged consumers of one compiler result. Shared clipping/crop/joint generation avoids pattern duplication. One merged material batch per unique asset plus grout; no per-tile React nodes or render loops. No room/window/furniture/ceiling, IndexedDB, backend, XR or dependency redesign. Only required Checker deletion compatibility changes the design store.

**Native verification:** eight full compile results captured before M4A match SHA-256 goldens exactly. Eighteen new cases cover both Running Bond orientations/cycles/crops/joints, drift-free phases, Checker parity/dimensions/assets, central exclusions, Center-off frame opening, deterministic output, complete non-overlapping area coverage, large rooms, zero joints, unchanged safety limits, source immutability and deletion fallback. Existing 46 cases remain passing (64 total). TypeScript, lint, build and tests passed with the existing bundle-size warnings.

**Browser verification:** all four patterns passed Top/Floor/Overview/Layout at 5.4×7.2 m, 600×600 field, 100 mm Dark Stone frame, 1200×1200 uploaded center and 2 mm joints. All 16 captures were inspected. Canvas clips exactly matched compiled placements; maximum 3D Float32 vertex difference was 0.000096639 mm and UV difference 2.9141e-8. Render counts: Straight 119 pieces/4 meshes, Bond50 124/4, Bond33 127/4, Checker 119/5 (unique assets + grout; not purchasing quantities). Mixed uploaded/built-in Checker, mismatched-size Apply rejection, A/B deletion fallback and Running Bond → Simple passed. Precise V8 coverage measured 0 draft compiles, 1 compile and 1 publication per valid Apply for every pattern; invalid Checker Apply published nothing. Production and profiler runs recorded zero API calls and runtime exceptions. Software WebGL/test-only DPR 0.5; no hardware-performance, headset or deployed-Vercel claim. Full file inventory and details: [FLOOR_PATTERNS.md](docs/FLOOR_PATTERNS.md).

The separately authorized M4B implementation follows in §17E. Herringbone, quantities, PDF and backend work remain future scope. No commit, push or deployment.

# 17E. Milestone 4B — Multi-Size Modular

One neutral five-body `modular` / `multi-size` repeat is implemented; this is not an exact Versailles preset. The original field asset/orientation supplies large square A; optional `field.modular` supplies required B/C and optional D with independent asset/orientation references. Body sizes still resolve from the shared physical asset adapter. No duplicate size authoring, stretching or texture-only pattern.

**Exact family:** with square A side L and full joint j, small side s=(L−j)/2. B is laid s×L, C/D s×s. Repeat positions are A(0,0), B(L+j,0), C(0,L+j), C(s+j,L+j), D-or-C(2(s+j),L+j). Pitch is 3(s+j) on both axes, with one owned trailing right/bottom seam. Example L=600, j=2: A600², B299×600, C/D299², body extent901, pitch903 mm. A600/B300/C300 with j2 is rejected, because it does not physically close. Exact nominal sizes are required within only the 0.000001 mm arithmetic epsilon; 599/601 manufacturing deviations are rejected, never scaled. Upload metadata retains 0.001 mm precision. Each slot can rotate0/90; B must remain upright after rotation. Module axes stay fixed.

**Compiler/UI:** pure module definition/validation and reusable repeat enumeration feed the compiler's shared body clipping/crop emitter. Partial modules are clipped against room/center/frame field regions, preserving Center > Center Frame > Field and the field-filled frame opening. Integer indices multiply physical pitches without accumulating drift. Internal/seam joint rectangles partition the same regions. UI shows the preset, expected physical size per shared library selector, per-slot orientation and optional D. Compatible B/C are suggested; final Apply validates exactly. Deleting any used modular asset safely restores Straight and cleans unavailable references. No change to IndexedDB or backend.

**Performance:** the shared 10000-cell budget counts all five candidate bodies per repeat before enumeration, including partial/excluded modules when field remains; entirely occupied fields skip enumeration as the existing grid does. The 40000 clipped-piece cap is unchanged. Canvas plan / merged 3D asset batches remain unchanged consumers of one result. No per-tile React components, extra render loop, dependency or room/XR-store redesign. A browser assertion exposed the existing Canvas reconfiguration default resetting an already-open plan to `always` on Apply: Canvas now receives the plan/XR loop policy explicitly; SceneActivity invalidates only. Plan without a session uses demand, Room or XR uses always.

**Native verification:** 14 modular cases + 64 existing cases pass (78 total); eight pre-M4A full Straight hashes still match. Hand-authored golden: 903×903 repeat, five exact bodies and six disjoint joint rectangles. Additional coverage: source crops/rotation, optional D, exact joint-aware compatibility, invalid/missing slots, deterministic output, no body/joint overlap and complete area, all Center/Frame/perimeter combinations, 3×4/8×10/15×20 m rooms, meter-buffer conversion, unchanged safety limits, mixed built-in/local adapters and deletion of each slot. TypeScript/lint/production build/npm test pass; existing bundle warnings remain.

**Production geometry verification:** mixed built-in/local A/B/C/D with rotated B and center/frame, optional D removal, invalid-size Apply retention, and 5.4×7.2→3×4 m resize pass. Canvas clip rectangles exactly match the compiler; maximum 3D Float32 position error 0.000118256 mm, UV error 2.7816e-8. Large composition:250 pieces/7 meshes with six assets; sharing A with Center and omitting D:250/5 with four assets. Resized:85/5. Plan remains demand after Apply. Layout/Top/Room captures inspected. Zero API calls or runtime exceptions. Source profiler:0 modular draft compiles/publications,1 compile +1 publication per valid Apply (including optional D removal), invalid size Apply compiles once and publishes nothing. Software WebGL/test-only DPR0.5; no hardware/deployment claim.

**Workflow/XR verification:** the production camera matrix Top/Floor/Overview/Detail/Reset, used-slot deletion → valid Straight, catalog → actual Simple mesh, and IndexedDB refresh retention pass with zero API calls/runtime exceptions. Geometry and workflow run separately against one isolated fixture profile to stay within software-renderer harness limits. Two opt-in XR cycles preserve the modular installation, camera and 75 visible pieces; exit restores plan demand mode, Room restores continuous rendering and Floor/Reset work. Each exit has7 frame subscribers,0 XR input sources,1 canvas. Existing emulator offer-superseded console messages occurred; no unexpected runtime exceptions or API calls. XR test-only framebuffer scale0.25 and disabled shadows supplement DPR0.5; no physical-headset/hardware-performance claim.

Final rebuilt-bundle smoke passes:3×4 m modular floor,75 pieces/4 meshes, Canvas parity and demand mode. Final-source profiler reconfirms0 draft compiles and1 valid-Apply compile/publication; both runs record zero API calls/runtime exceptions.

Full format contract, tests and M4B file inventory: [MODULAR_PATTERNS.md](docs/MODULAR_PATTERNS.md). Pre-existing uncommitted M4A changes remain. No commit, push, deployment or later milestone.

# 17F. Milestone 5 — Local Project Management

The explicit local-first M5 request supersedes the historical “M5 Realism / QA” roadmap label. Projects are implemented without backend/authentication/cloud work. Base is clean `ebdeeb5` (“Add multi-size modular floor patterns”); M5 was subsequently committed as `2f49545` (confirmed by Git inspection at the start of M6).

**Architecture/schema:** `src/projects` separates v1 semantic parsing/model, IndexedDB storage, repository, asset resolution and runtime adapter/provider. A project contains id/name/schemaVersion/createdAt/updatedAt, `projectDocument` with the existing roomSize/architecture/full FloorInstallation + enabled/started and Simple material/Compare state, and referenced asset names for useful missing-tile messages. IDs are generated UUIDs; trimmed Unicode names are1–120 characters. No image Blob, URL/Base64, compiled placements or duplicated editable room/layout model.

**IndexedDB:** existing `tile-configurator-local` upgrades nondestructively from v1 to v2. Original `tile-assets` stays intact; new `projects` store uses key id, `preferences` uses key key and remembers last-project. One shared connection/transaction helper replaces only the tile adapter's private connection. Existing tile preparation, repository, metadata, URL/texture ownership and security/backend remain unchanged. Save puts the whole semantic document + last-active ID in one durable transaction. Resolve only on transaction completion; failures preserve the active document and unsaved baseline.

**Save/dirty/UI:** Projects / Save Project controls show active name and Saved/Unsaved. A compact modal supplies New, Open, Rename, Duplicate and confirmed Delete; first-run can design without creating a project. New writes defaults and activates them; first Save asks for a name. Fingerprints compare applied semantic state to the last committed baseline, excluding draft typing, views, FOV, navigation and modal/selection state. No autosave or per-render writes. Save & Open / Discard & Open / Cancel protect unsaved work; unnamed Save & Open asks for a name first. Beforeunload is installed only while dirty. Changes during an outstanding Save remain dirty afterward. Rename is metadata-only; Duplicate copies the saved version with new metadata/ID, keeps the current active design, and shares tile references. Deleting active returns to clean unsaved defaults; deleting any project never deletes tiles.

**Open/validation:** read → explicit version/shape/architecture normalization → shared tile hydration → ID resolution → one compile → persist last-active ID → prime the existing result cache → one synchronous batch updating floor/room/architecture and material/camera stores → active metadata/baseline/warnings. No manual Apply. The result cache compares actual asset objects so a product-array wrapper cannot trigger another compile. Compiled designs normalize the started flag to preserve their authored installation on editor open. Existing camera requests restore Overview; free poses/FOV, Room-vs-Layout and open drafts/panels stay transient. Unknown future/corrupt records are rejected/skipped with feedback and not deleted; bad explicit Open preserves the current state. Missing/unreadable last-active records use defaults. A retry after storage failure does not discard edits made meanwhile.

**Shared/missing assets:** project references resolve against built-ins + global My Tiles; no project image copies. Missing names are reported without opaque IDs; existing built-ins replace missing zone/material identities. Broken Checker/Modular falls back to Straight, retaining available A where possible. Room, architecture, joints and independent zones survive. If replacement dimensions exceed unchanged compiler safety constraints, Simple mode preserves the settings for review. Repairs are dirty and never silently overwrite the saved record.

**Verification:** 20 new native project cases +78 prior cases pass (98 total). They cover CRUD, one-write snapshot semantics, all five pattern restores with byte-identical compile output, Modular four slots/orientations/center/frame, exact room/window/ceiling/furniture, Simple/Compare, last-active reload/defaults, shared references, all four missing Modular slots, named warnings, dirty state/switch guards, pending-Save edits, malformed/schema/geometry rejection, storage failures/retry, and exact state through the actual runtime adapter. TypeScript/lint/build/npm test and script syntax/diff checks pass; existing bundle-size warnings remain.

**Production/browser:** actual v1→v2 migration preserves four old image records; a real local upload, named first Save, Rename/Duplicate without geometry replacement, unsaved Cancel/Save & Open/Discard & Open, New defaults, active Delete, last-active reload, and desktop/640px modal/toolbar/plan controls pass. Every pattern compiles identically before Save and after Open; Canvas clips exactly match compiled placements, and 3D positions/UVs match (maximum Float32 error0.000118256 mm, UV2.9141e-8). Modular includes A/B/C/D, independent rotations,2mm joint and both central zones. Compiled reload, Overview/Floor/Top, saving while Floor Design/Room Settings have unapplied drafts, shared tile retention after project deletion, real tile deletion → named safe fallback, and malformed last-active record → defaults with other projects retained pass. Zero /api/* requests and runtime exceptions in these suites. Captures were visually inspected. Source V8 profiling measures0 compiles for Save/Rename/Duplicate/draft edits,1 compile +1 floor-store publication per Open; IDB instrumentation measures1 project transaction per Save. Software WebGL, test-only DPR0.5 and disabled shadows; no hardware/headset/deployment claim.

Full schema, transaction/snapshot/restore contracts, limitations and exact file inventory: [LOCAL_PROJECT_MANAGEMENT.md](docs/LOCAL_PROJECT_MANAGEMENT.md). No import/export, autosave, cloud, new patterns/geometry, XR lifecycle redesign, dependency, secret, commit, push or deployment changes. Stop after M5.

# 17G. Milestone 6 — Multi-Surface Wall Design V1

Authorized after confirmed committed M5. `src/surfaces` owns wall definitions, pure compilation, bounded per-wall result caching and renderer mapping. Straight geometry delegates to LayoutCompiler; rectangular opening subtraction preserves source crops and real joints. Both the wall Canvas elevation and batched Three.js faces consume those placements. The existing right window and front door remain real openings.

Applied walls live alongside the existing floor/room store. Draft edits remain local; Apply Surface validates and publishes the selected wall once. Room/Floor dimension application validates affected enabled walls before publishing. Independent semantic cache keys isolate wall compilation; stable surface identities isolate geometry buffers. Existing floor patterns and Simple material selection remain separate.

Project schema 2 saves four independent semantic wall designs using shared TileAsset IDs. M5 v1 migrates to neutral walls without changing the floor; missing wall assets warn and neutralize only affected walls. IndexedDB remains v2, with no extra image collection or backend dependency. Full contracts: [WALL_DESIGN.md](docs/WALL_DESIGN.md).

Validation: all 8 isolated test files pass (98 existing cases plus 13 wall cases); TypeScript, lint, build and diff whitespace checks pass. Production acceptance verifies four independent walls, uploaded and built-in tiles, applied-only Save, unchanged unrelated wall buffers during window edits, exact restored wall vertex/UV/index buffers after Open/reload, all five floor-pattern restores with walls, M5 migration, named missing-wall recovery, and desktop/640px screenshots. Zero API requests and runtime exceptions. Existing large build-chunk warnings remain. Focused V8 coverage confirms wall draft edits = 0 compilations; Apply Surface = 1 wall compilation / 1 publication with 0 floor-state changes; combined right-window edits + Apply Room = 1 right-wall compilation and unchanged Front/Back/Left geometry buffers. Save produces 0 compilations. Two XR emulator enter/exit cycles passed with a compiled right wall and Modular floor: identical wall buffers, floor installation, camera identity, subscriber/input/canvas counts, plan demand mode after exit and desktop recovery; zero API calls or runtime exceptions. Software WebGL emitted transient zero-size framebuffer warnings during emulator startup; no physical headset or performance claim. No M6 commit, push or deployment; no physical headset validation.

# 18. Pattern Engine Vision

Implemented in M4A (§17D): Straight; 0°/90° orientation; 50% and 33% Running Bond; equal-size Checker. M4B adds Multi-Size Modular (§17E). Later: Herringbone, Chevron, Basketweave, custom definitions. Patterns specify tile slots or placement rules, not painted textures. Slot-to-TileAsset assignments enable different SKUs and sizes. Compiler handles row offsets, orientation, grout pitch and clipping. Preserve the M4A semantics and tests when defining future pattern slots; do not start future patterns automatically.

# 19. Zone Engine Vision

The current approved composition is Main Field + Center Frame + Center (§17A). Room-perimeter border is internal, disabled/unexposed; the broader combinations below remain future work.

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

### Pre-Layout Correctness Gate — Satisfied for M3 Rectangular Straight

The M3 contract in §17A now defines and tests the following for rectangular Straight. Preserve it in future patterns/outputs:

- Whether entered tile dimensions represent tile body size.
- Full physical grout/joint width and installation pitch.
- The relationship between body size and joint width.
- Seam ownership between adjacent tiles and boundary behavior.
- Numeric tolerance policy, together with the units/coordinates contract in §16.

Then 2D layout, 3D layout, quantity calculations and technical output must use **exactly the same semantics**. The current shader is a visual prototype and its 0.4 cm demo setting is **not verified 4 mm engineering output**. Resolve origin reference, zone conflicts and deterministic ids as part of compiler specification. Validate room fit and edge cuts; texture crop counts are not purchasable tile counts.

### Automated Geometry Correctness — Mandatory Future Requirement

The historical absence of geometry tests is superseded by the native M3 suite. Future patterns/geometry must extend it rather than relying on screenshots. Before LayoutCompiler powers quantities or technical output, add an automated numeric/geometry correctness strategy covering at least:

- Unit conversion.
- Straight placement and Running Bond offsets.
- Deterministic placement IDs.
- Clipping and cut geometry.
- Zone coverage, no unintended overlaps, and no unintended gaps beyond defined grout semantics.
- Orientation and rectangular tile rotation.
- Area reconciliation.
- Deterministic multi-face assignment where relevant.

Screenshot/visual regression may supplement these tests but must not replace numeric/geometry tests. Native Node backend/adapter and M3 compiler geometry suites now exist; broader pattern/clipping/quantity validation remains future work. No external test framework dependency has been installed.

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

Future Engineer Mode exposes room/tile dimensions, assets, zones, patterns, grout, origin/alignment, rotation and quantities. Customer Preview presents a clean room, selected design, Compare, Design A/B/C and fullscreen preview. These are presentations of the same project, not parallel design stores. The application now switches between Simple material and Floor Design, with Room/Layout presentations. Broader Engineer/Customer modes remain future work.

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

### Milestone 3 — Geometric Tile Layout Engine

**Implemented/verified:** focused mm domain, Straight Field/Center Frame/Center, deterministic geometric bodies/cuts/joints, one compiler result, single-Canvas plan, grouped 3D renderer and mandatory numeric tests. See §17A. M3 itself excluded Running Bond; the later explicit M4A authorization is recorded in §17D.

### Milestone 4A — Floor Patterns

Implemented in §17D: Main Field Straight, Running Bond 50%, Running Bond 33% and equal-size Checker. Existing Frame/Center and shared render consumers remain intact.

### Milestone 4B — Multi-Size Modular Patterns

Implemented by explicit authorization in §17E: one controlled joint-aware multi-size repeat with up to four shared asset slots. More modular presets require separate specification and verification.

### Broader Multi-Tile + Zones (future)

Multiple tile assets; pattern slots; Field; Border; Center/Inset; Accent Strip. Explicit overlap/corner/cut behavior.

### Milestone 5 — Local Project Management

Implemented in §17F by the explicit local-first request. Complete applied room/architecture/design/material state, versioned local documents, shared tile references, CRUD, dirty-state safety and last-active restoration.

### Later — Realism / QA (future)

Multiple faces; cut edges; performance; better texture pipeline. Measure rendering costs and verify scale, joints and deterministic appearance.

### Milestone 6 — Engineer Output

Quantity; waste; design alternatives; screenshots; dimensioned PDF/project summary. Validate calculations against compiled geometry and supplier packaging assumptions. Automated geometry correctness coverage in §20 is mandatory before compiler results power quantities or technical output.

Milestones 1–3, usability refinement, M4A, M4B and local-first M5 are explicitly authorized and implemented as documented. Historical live/fixture limits remain attributed to their sessions; local verification does not verify a deployment or backend. Stop after M5; broader patterns/zones, realism/QA expansion and output remain future work requiring explicit authorization.

# 27. Immediate Execution Sequence

Steps 1–5 are preserved from M1/M2. The explicit M3 request implemented the focused model/compiler, Straight, plan/room parity and rectangular field/Center Frame/center (steps 6–9, 11–14 in bounded form). Step 10 Running Bond and step 15 expansion remain unauthorized; no future-work item is implied by this sequence.

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
- Milestone 3 satisfies the body-size/full-joint/pitch/seam/boundary/tolerance gate for rectangular Straight (§17A/20). Preserve those shared semantics in future renderers/patterns/outputs.
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

**Current presentation override (2026-10-27):** supersedes the flag-controlled frontend behavior below. My Tiles always mounts `DemoTileLibrary`, with an explicit local-only upload form. Neither demo environment flag is checked by this presentation path, and no environment variable is needed. The protected UI remains in `src/ui/ProtectedTileLibrary.tsx` for explicit reactivation; all server/Supabase, compiler geometry and XR code remains untouched. Plain `npm run build` and the production browser test passed with zero `/api/*` requests; upload/crop/rotate, physical scale, independent zones, 2D/3D, resizing, camera presets, refresh cleanup and built-ins passed. TypeScript, lint and tests passed.

**Browser-only presentation mode (2026-10-27):** `VITE_PUBLIC_DEMO_MODE=true` at build time selects a separate memory-only My Tiles component and bypasses all admin/session and tile API requests. Existing image preparation and TileAsset → product → layout adapters preserve physical mm dimensions and independent zone selection. Prepared images use owned blob URLs; tiles survive panel remounts, deleted URLs are revoked, and page refresh clears the library. No backend, schema, compiler geometry, security or XR code was changed for this path. With the frontend flag absent/false, the existing server-backed component is used; the separate server flag below still controls its auth policy. See [presentation setup](docs/ONLINE_TILE_SETUP.md#temporary-public-presentation-mode). This is a focused delivery correction, not another milestone.

**Presentation verification:** a production preview with no API service and all `/api/*` requests blocked recorded zero API requests. Generated-image upload/preview/crop/rotation, 600×600 mm bodies in 3D geometry, independent upload selection in all three zones, Apply Design, Canvas image drawing/Layout, 5.4×7.2 m resizing, Overview/Floor/Top/Detail, panel reopen and clean refresh reset passed without runtime exceptions. A separate flag-off production preview checked the session endpoint and displayed the protected access form when its session response was unauthenticated. Screenshots used software WebGL at test-only DPR 0.5; no hardware performance or live deployment claim. TypeScript, lint, both flag-on/flag-off production builds and the existing geometry/server plus new demo-library tests passed. No commit, push or deployment was performed.

**Temporary public demo exception (2026-10-27):** explicitly authorized server-only `PUBLIC_DEMO_MODE=true` bypasses the single-admin session requirement before admin configuration is read. With the flag absent or `false`, the existing protected flow remains in place. Supabase/schema/private Storage architecture is unchanged; demo upload receipts remain signed using the existing server-only Supabase key. All visitors have library write/delete access while enabled. My Tiles contains backend failures and offers retry/close without blocking the showroom, built-ins or Floor Design. Local isolated-fixture browser verification passed no-cookie/no-login upload/library/Apply, simulated session-function 500 containment, built-in Floor Design/room resizing/Layout, and backend recovery. TypeScript, lint, build and tests passed. No live Vercel deployment/runtime fix was verified, and no commit, push or deployment was performed. See [setup instructions](docs/ONLINE_TILE_SETUP.md#temporary-public-presentation-mode). This is a temporary presentation change, not another milestone.

**Current facts:** one editable rectangular room (default 6×7×3 m; current room/local-library behavior is specified in §17C), legacy single-material preview/Compare and an active geometric Straight Floor Design for field/Center Frame/center. M3 body/full-joint/mm/coordinate/tolerance conventions and numeric tests are implemented. Live uploaded 600×600 metadata/signed-image reads and rendering were verified without live asset writes. The refinement library contained two assets; Prestige was absent, so an existing upload was used with Dark Stone frame/Carrara center. Private upload/library/signing schema and security code are unchanged; writes/deletion/renewal/refresh were regression-tested against the isolated fixture. No project persistence, arbitrary zone/pattern editor, commercial SKU model or purchasing/output system.

**Deployment/security limits:** Vercel function routing/deployed commit mapping and actual remote SQL/grants/bucket-policy audit were not performed in M3. No deployment, SQL or security mutation occurred. Existing setup/operations instructions remain relevant to deployment acceptance. Live reads do not prove every production write or permission policy; do not equate fixture writes with live database/Storage proof.

**Operational limits:** session cookie is stateless; logout does not revoke a stolen cookie until expiry (rotate code/secret to invalidate). Signed URLs are bearer capabilities with separate lifetimes. Per-instance rate limiting is not distributed. Private orphan objects can remain after abandoned uploads/server interruption/double-failure deletion; cleanup receipts are memory-only and expire. SQL was not executed against Postgres in this session. Image signature checks are not antivirus/full server decoding. Original image bytes are not archived; prepared pixels are immutable. The small library uses the configured Data API row cap without pagination. Large libraries/large textures need future performance work.

**Visual/hardware limits:** browser checks used headless/software WebGL and generated image fixtures, not supplier color calibration or physical Quest hardware. No furniture collision/full mobile walking controls were added. Splash remains first-frame based; large build chunks remain. No Quest frame-rate/comfort/material-fidelity guarantee.

**Before broader layout/output:** preserve the M3 Surface/mm/body/full-joint/seam/boundary/tolerance contract and extend its tests for new patterns, polygon geometry and outputs. Purchasing/cut reuse/quantity correctness is not established by the current visible-body geometry. No future polygon-clipping package, saved-project schema, commercial catalog or purchasing quantity model was selected.

# 30. Instructions for Future Sessions

1. Read `PROJECT_MASTER_REFERENCE.md` first for approved product direction and architecture decisions. The unchanged draft and PROJECT_HANDOFF are historical context; this master supersedes explicit disagreements. Verify implementation in actual source and label user-confirmed operational facts.
2. Inspect `git status`, preserving pre-existing user changes and untracked documents.
3. Verify relevant source before changing anything; code establishes current behavior.
4. Milestones 1–3, usability refinement, M4A, M4B and local-first M5 are recorded here. The current user explicitly authorized M6 Straight wall tiling after M5. Stop after M6 verification; do not start more presets, herringbone, quantities/waste, PDF, AI, accounts or broader persistence/backend work automatically.
5. Preserve existing VR and its shared compiled floor; do not redesign VR UX without explicit authorization.
6. Never infer that roadmap items are already implemented, or that hardware validation occurred.
7. Update the master reference after major architecture milestones with the user's authorized scope.
8. Keep implemented/source-verified, runtime-tested, hardware-tested and future-plan claims separate. Resolve docs/code disagreements explicitly.
9. After future code changes, run appropriate type/lint/build and meaningful visual/geometry checks. This audit's build omission preserves the one-new-file rule; it is not a recommendation to skip build checks during implementation.
10. Do not commit, push, deploy, install packages or expand scope automatically. Do not restore dedication work or redesign VR UX without explicit direction.

**Milestone 2 boundary:** upload/gate/Supabase integration, SQL/setup/local-runner artifacts, metadata/render adapter, texture ownership and focused library UI were implemented alongside preserved Milestone 1 work. Historical handoff/draft, built-in product entries, room/furniture/lighting and XR files remain unchanged in this milestone; no dependency or lockfile resolution changes. Type/lint/build/server tests and fixture browser checks were performed. No real credentials, remote SQL, live Supabase acceptance, commit, push, deployment, Supabase Auth, accounts or Milestone 3 work. Stop and await the next explicit instruction.

**Milestone 3 boundary:** implemented and tested Straight + Field + Center Frame + Center and shared 2D/3D geometry from clean checkpoint 1c3a0b3. Existing API/Supabase/schema/security/XR UI and dependency files are unchanged. Only read/apply/render used the live library; generated upload/delete acceptance used the isolated fixture. No commit, push, deploy, Running Bond or Milestone 4.
