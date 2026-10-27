# Geometric Floor Design — Milestone 3 refinement

Current scope: Main Field + optional Center Frame + optional Center, Straight only, editable rectangular room. This refines the existing uncommitted M3 work from checkpoint `1c3a0b3`; it is not Milestone 4.

## Domain and units

Room geometry lives as `{widthMm,lengthMm}` in `useFloorDesignStore`; architecture adds explicit `heightMm` and window/ceiling/furniture settings. Default 6000×7000×3000 mm. The urgent usability refinement supersedes the old 4–12 m rule with numerical guards of **1–100,000 mm per floor side**, **1–50,000 mm height**. See [USABILITY_REFINEMENT.md](USABILITY_REFINEMENT.md) for architecture, local tile persistence and verification. `roomDimensions.ts` creates the unchanged compiler surface; `useRoom` converts through `mmToM` at the scene boundary. Draft Apply validates physical openings and composition fit before publication. The compiler retains its 10,000-cell safety guard independently of shell size.

Asset dimensions remain physical **body** dimensions, independent of room/center/frame dimensions. Upload metadata/schema/signing/storage are unchanged. Demo cm converts in `layoutAsset`, uploaded physicalSizeMm stays exact. Full joint `j` is one total gap, pitch=body+j. A pair of 600 mm bodies with j=3 spans 1203 mm. Legacy Simple material shader grout is separate, unchanged representative preview behavior.

Surface local `(0,0)` is back-left, +X width, +Y toward the door. World mapping is `[mmToM(x-widthMm/2), .002, mmToM(y-lengthMm/2)]`. No whole-room scaling. Epsilon=0.000001 mm; numeric area reconciliation tolerance=0.1 mm². No added clipping library/dependency.

## Center Frame contract

Precedence: **Center > Center Frame > Field**. The active UI does not expose a room-perimeter border.

- Center uses exact body-area dimensions `(cw,ch)` centered in the room.
- Frame outer dimensions are **exactly `(cw+2f,ch+2f)`**, also centered. A 1200×1200 center with f=100 has a 1400×1400 outer rectangle.
- The full inner joint lives **inside the frame band**, preserving the requested center body area and exact outer frame dimensions. At f=100,j=3, the side's tile-body cross-width is 97 mm: a 100 mm stock strip is a real cut, never stretched. The 3 mm outer joint is reserved outside the frame, in Field.
- Top/bottom own full-width butt corners; left/right begin/end one joint away. The asset's long edge follows the side (square ties use authored X horizontally). End/cross-width cuts retain original-body UV crops. No miters/fabrication logic.
- Frame width must be finite/positive and greater than j so a tile-body band remains. Center + frame + outer seam must fit the surface. Disabled Center retains its area dimensions; with Frame still enabled, Main Field fills its opening using the same field grid. Disabled Frame leaves the usual center-to-field seam. Disabled zones retain their choices.
- Field keeps one grid phase from room top-left, subtracting the frame/center and seams. Neither hidden field bodies nor field joints remain underneath. Adjacent decomposition fragments merge where they form a whole rectangle; real L-cuts remain multiple rectangles sharing sourceTileId.

The old perimeter implementation remains as an **internal legacy `border` path**, default disabled and unexposed. Its numeric tests are retained separately. It is not the approved operator composition and has no active Border control.

## Compiler and consumers

`compileLayout(surface,installation,physicalAssets)` is pure: no React/Three/DOM/Supabase. Installation references independent field/centerFrame/center asset IDs, full joint, Straight/orientations and zone dimensions. It returns deterministic placements, disjoint joints, zone bounds/regions, areas or useful errors. Placements contain ID/sourceTileId, zone/side, asset, visible rectangle, 0°/90°, full/cut, unclipped tileBounds and original-asset-mm sourceRect. IDs use surface/zone/side/grid/piece, never UUIDs. Maximum cumulative candidate grid cells=10000; bounded visible fragments; missing assets/invalid bodies fail safely.

`FloorDesignProvider` resolves demos + current My Tiles assets and memoizes **one result** from room surface + installation + physical assets. `LayoutPlan` draws those exact rectangles/images on one responsive Canvas; click/arrows select a piece and show dimensions/full-or-cut. It does not calculate another pattern. Plan source-body outlines avoid fake subdivision joints.

`AdvancedFloor` converts the same placements to indexed quad buffers, one geometry/PBR material batch per asset plus one grout plane. All cuts/rotations use source-body UVs. There are no per-tile React components, material instances or per-frame compilations. Cached source images/maps remain read-only; replaced geometry/materials are disposed. Image failures retain geometry and show an error; Refresh renews signed image access.

## Room, camera and controls

Room shell, walls/openings, ceiling/coffer, skirting/crown, Simple material floor, advanced floor, furniture anchors, lights/shadow extent, walking bounds and XR spawn/teleport plane consume the same subscribed room dimensions. Furniture sizes stay unchanged and boundary-relative; no room-group scaling or new furniture-layout system. Scene height remains 3 m; opening sizes stay fixed.

Top fits both room dimensions and viewport aspect; Overview/Floor elevation adapts to room size. Detail remains a fixed physical close inspection inside every supported room, independent of overall tile density. Resize invalidates the saved pre-resize room pose so Back to Room cannot restore a position outside changed walls. Camera transitions retain pose-owned live radius, modal/plan input pauses and XR camera-restoration fix. Far plane=100 m accommodates larger portrait Top views. Reset camera uses the current room; Reset Design resets the composition while retaining room size. Refresh resets both session-local room/design to defaults; the uploaded library remains persistent.

Controls are ordered Room → Main Field → Center Frame → Center → Joint. Each active zone has an explicitly named independent selector containing demo and uploaded assets with physical dimensions. My Tiles remains the existing loading/upload/apply/delete flow. Legacy Compare stays in Simple material mode and uses the resized floor. Plan uses demand rendering in the background; Room/active XR use the normal loop. No new XR design controls; emulator remains opt-in through dev:xr, normal dev disabled, production disabled.

## Draft editing and Apply Design

All controls edit local `DraftControls` state: room meter strings plus a cloned installation. Inputs, selectors and toggles never call the authoritative store. Apply Design and Reset Design stay visible below the independently scrolling fields. The applied plan/3D remain visible while editing; the visible-piece summary explicitly describes the applied design.

Dirty comparison normalizes room meter strings to mm and compares the small configuration, without running the compiler. Apply is disabled for no changes; otherwise “Unsaved changes” appears. Apply validates room bounds, then calls the existing compiler once against current physical assets. Errors remain in the action area and do not publish any values. Success publishes room+installation atomically and reuses the prepared result in `FloorDesignProvider` using exact configuration/product references. Asset refreshes invalidate the prepared match normally. No compiler algorithm or joint policy changed, including existing zero-joint support.

Reset immediately restores the default composition using the selected simple material, retains room size, and synchronizes the draft/dirty status. Close discards unapplied edits. Room/Layout switching within the open panel preserves them. No draft/project persistence or automatic Enter submission was added.

`tests/browser/floor-design-draft.mjs` uses native V8 precise function-call coverage, store-publication subscriptions, actual geometry UUIDs/bounds and plan draw instrumentation. Verified: **0 compiler calls during editing; 1 per valid Apply; 1 atomic publication; 0 plan redraws during plan-open editing**. The fixture Prestige/Dark Stone/Carrara 5.4×7.2 scenario and center1200→1800 workflow passed. Invalid drafts held the applied scene. Close/Reset, all selectors, views, My Tiles and uploaded images passed. Footer hit tests at both scroll ends passed for desktop1280, tablet820 and mobile390; captures were inspected. The separate XR runner passed two cycles after the Apply correction, including8×10, desktop recovery and Reset. Existing SDK offer notices remain; no unrelated exception. These observations concern layout work, not the unchanged continuous Room render loop or a hardware FPS benchmark.

## Exact examples (3 mm full joints)

600×600 Field; 100×600 Frame stock, width100; 1200×1200 Center stock and area:

| Room mm | Field pieces | Frame pieces | Center pieces | Total pieces | Body mm² | Joint mm² |
|---|---:|---:|---:|---:|---:|---:|
| 4200×5600 | 73 | 10 | 1 | 84 | 23,288,940 | 231,060 |
| 5400×7200 | 110 | 10 | 1 | 121 | 38,516,646 | 363,354 |
| 6000×7000 | 122 | 10 | 1 | 133 | 41,600,745 | 399,255 |
| 8000×10000 | 241 | 10 | 1 | 252 | 79,210,526 | 789,474 |

At 6×7: Field 87 full/35 cut, Frame 0 full/10 cut (inner seam cross-width cuts), Center1 full. Four field L-cuts each need two visible rectangles. Frame bounds `(2300,2800,1400,1400)`, center `(2400,2900,1200,1200)`, outer seam bounds `(2297,2797,1406,1406)`. At 5.4×7.2, frame bounds `(2000,2900,1400,1400)`, center `(2100,3000,1200,1200)`. Room resizing preserves those sizes, not their absolute positions.

Three distinct assets mean three body batches + grout: **four floor meshes**. At 5.4×7.2: 484 body vertices/242 triangles; at 8×10: 1008 vertices/504 triangles. Selection adds an optional outline. These are visible/debug counts, not purchasing quantities.

## Automated checks

23 native geometry/domain/render-boundary cases (original 16 retained + 7 refinement cases) cover units, exact/partial fits, full and zero joints, rotated bodies/crops/UVs, deterministic IDs/order, invalid/dense designs, precision, rectangle overlap/coverage, center/frame/butt corners, independent identities, disable/re-enable, frame cuts, oversize rejection and 4200×5600/5400×7200/6000×7000/8000×10000 resize invariants. The existing 11 server/security/adapter cases remain unchanged.

Run `npx tsc -b`, `npm run lint`, `npm run build`, `npm test`. Direct `node tests/layout.test.ts` and `node tests/tileAssets.test.ts` display individual cases; the npm native runner reports the two test files.

Browser runners use the dependency-free CDP helper in `tests/browser/cdp.mjs`. Run `floor-design.mjs` then `floor-design-refinement.mjs` on a frontend proxied to isolated fixture credentials/handlers (`tests/fixtures/serve.ts`), followed by `floor-design-xr.mjs` on an explicitly emulated frontend sharing that fixture. A signing-only storage-origin guard runs before any fixture upload. Tests use generated exact-format images, native UI handlers and actual browser pointer events. Navigation guards wait for a fresh document. Software WebGL uses test-only DPR 0.5; app DPR is unchanged. Live read/render verification is separate and does not write assets.

## Remaining limits

Rectangular room/zones, Straight, 0°/90°, fixed grid origin, butt corners, planar tops, bounded candidate count. No physical headset/FPS guarantee. No saved projects, accounts, metadata editing/schema changes, live write acceptance, remote SQL/security audit or deployment. Running Bond remains unimplemented; multi-size patterns remain future. No purchasing/waste/cartons/prices/BOQ/PDF or Milestone 4. No commit/push.

## Runtime verification — 2026-10-27

- Full isolated fixture UI flow passed: upload/apply/delete/refresh/lock/unlock, missing assets/images, invalid inputs, independent three-zone choices, orientations, all camera views, Simple Compare, refresh persistence and mobile plan. Exact 6×7 composition: 122/10/1; actual 3D vertices/UVs and plan clip rectangles match the compiler; maximum observed error 0.000114441 mm.
- Resize runner passed 6×7,5.4×7.2,8×10,4.2×5.6; actual floor/ceiling dimensions and 3D buffers matched each surface, Top projection contained every floor corner, and body dimensions stayed unchanged. Empty/out-of-range drafts held the room. Mixed uploaded/demo selectors, independent toggles, oversized-center validation, resized Simple Compare and responsive 390×844 controls passed. Screenshots of Top and plan were inspected. Maximum observed resize-buffer error was 0.000236512 mm.
- Two emulator cycles passed: first 6×7 from Room, second 8×10 from Layout. The original desktop camera and installation survived. Teleport plane dimensions and spawn matched each room. On exit subscriber/canvas/input/overlay counts stayed 7/1/0/0. Post-exit WASD, drag, wheel, camera Reset and Reset Design passed at 8×10. Normal dev emulator was disabled. The SDK emitted a known superseded-offer rejection: @pmndrs/xr starts overlapping automatic offers; IWER rejects the previous pending offer (store.js 88–112/172, XRSystem.js 80–91). The XR runner reports this separately as sdkNotices and fails every unrelated exception; no unrelated exception was recorded. No SDK/session behavior was changed. No physical headset test.
- TypeScript/lint/build/npm test pass. Existing large-chunk warnings remain. Software WebGL uses test-only DPR 0.5; no FPS/hardware claim.
- Live read/apply/render passed for an existing uploaded 600×600 asset, Dark Stone frame and Carrara center at 5.4×7.2:110/8/2 visible pieces, three asset batches. Prestige was no longer present; the current library has two 600×600 assets and stayed at two. Room/Top/plan inspected; no replacement asset was uploaded. No live asset writes, SQL/schema/security changes or deployment.

## Exact files changed from checkpoint `1c3a0b3`

Includes preserved original M3 work, composition/room refinement and explicit Apply correction.

Modified existing files:

- `PROJECT_MASTER_REFERENCE.md`
- `src/App.css`
- `src/App.tsx`
- `src/catalog/materials.ts`
- `src/scene/CeramicFloor.tsx`
- `src/scene/DesktopControls.tsx`
- `src/scene/Furniture.tsx`
- `src/scene/Lighting.tsx`
- `src/scene/Room.tsx`
- `src/scene/VRLocomotion.tsx`
- `src/scene/roomConfig.ts`
- `src/ui/CeramicCatalog.tsx`
- `src/ui/Hud.tsx`
- `src/utils/units.ts`

Added files:

- `docs/GEOMETRIC_LAYOUT.md`
- `src/layout/FloorDesignContext.tsx`
- `src/layout/assets.ts`
- `src/layout/compiler.ts`
- `src/layout/floorSurface.ts`
- `src/layout/model.ts`
- `src/layout/renderGeometry.ts`
- `src/layout/roomDimensions.ts`
- `src/layout/useFloorDesign.ts`
- `src/scene/AdvancedFloor.tsx`
- `src/scene/FloorSurface.tsx`
- `src/scene/SceneActivity.tsx`
- `src/scene/useRoom.ts`
- `src/state/useFloorDesignStore.ts`
- `src/ui/FloorDesign.tsx`
- `src/ui/LayoutPlan.tsx`
- `tests/browser/cdp.mjs`
- `tests/browser/floor-design-draft.mjs`
- `tests/browser/floor-design-refinement.mjs`
- `tests/browser/floor-design-xr.mjs`
- `tests/browser/floor-design.mjs`
- `tests/layout.test.ts`

API/server/shared/Supabase files, XR store, VR panels, dependencies/lockfile and dev scripts remain unchanged. VRLocomotion changes are solely the earlier room-size compatibility refinement; the Apply correction does not modify XR.
