# Usability and local architecture refinement

This authorized correction pauses the roadmap. No Running Bond, advanced patterns, wall tiling, quantities, PDF or next milestone is implemented. Backend/API/Supabase files and dependencies remain unchanged and inactive. My Tiles remains unconditionally local, without environment variables.

## Material transition and shared assets

The source-supported defect was mode ownership: returning from Layout to Room changed presentation, while catalog clicks only updated the legacy selection; `FloorSurface` could still render `AdvancedFloor`. In addition, the catalog mapped `FLOOR_CERAMICS` only. A same-id selection also previously left Compare active.

`selectSimpleMaterial` now explicitly disables the compiled renderer, restores Room presentation, closes the composition panel and selects/clears Compare. The Simple-mode action clears Compare too. The existing immutable texture cache and material-owned UV clones remain intact; no forced page reload or material-cache reset masks the issue.

All active pickers/renderers use `useTileProducts`: built-ins plus one repository's derived local products. Canonical local TileAsset records, their blobs, runtime URLs and product adapters are owned by the repository, not separate UI lists. The historical `demoLibrary.ts` filename now wires this repository. The inactive protected UI retains its legacy server adapter for later explicit reactivation.

## Local persistence and lifecycle

IndexedDB database **`tile-configurator-local`**, version **1**, object store **`tile-assets`**, key **`id`**. Records contain prepared image Blob, MIME/size, physical width/height mm, name, material, finish, source filename, baked rotation/crop history and timestamps. Blob URLs are never persisted. No images go into localStorage, and there are no API calls.

App startup hydrates once. Runtime URLs are created from blobs and reused for the document. Saves/deletes are serialized and publish only after the storage transaction completes. Bad records are skipped with a contained message; storage/quota/delete failures do not pretend success. Runtime disposal/deletion revokes owned URLs; page destruction releases the document's remaining URLs. Deletion reconciles Simple, Compare and all installation references to built-in defaults before dropping the runtime asset.

Uploads survive refresh and closing/reopening the browser on the **same origin and profile**. Room/installation/camera settings remain session-only; browser storage clearing/private profiles or device quota can remove/prevent local persistence. The user-facing note is “Saved on this device.” This is local tile persistence, not a saved-project system or cloud synchronization.

## Room and architecture

Canonical applied dimensions stay explicit mm; scene components convert to meters without scaling a root group. Width/length accept **1–100,000 mm**, height **1–50,000 mm**, finite and positive. These deliberately broad numerical/rendering guards replace the 4–12 m business rule. The unchanged compiler's **10,000 grid-cell** safety guard can still reject an overly dense advanced composition; choose larger tiles/reduce the composition rather than stretch tile bodies.

Room Settings collects local drafts for width/length/height, furniture, window and ceiling, then **Apply Room**. Closing discards unapplied edits. The existing installation editor retains **Apply Design**; both paths validate the current shell/opening constraints, and room resizing preserves physical tile dimensions. Incompatible windows/coffers or installed zones are rejected with a focused validation message.

Furniture defaults **hidden** for a clear professional floor view. Show restores sofa, tables, lamp, plant and wall art. No architectural shell/window/door element is part of that furniture switch.

The window stays on the **existing right wall**. Supported: enabled, width, height, sill height and horizontal offset from wall center (positive toward the back). Position, actual segmented hole, frame, glass and exterior backdrop update together. Up to 50 mm perimeter clearance contains the frame; below-floor, above-ceiling and out-of-wall configurations are rejected. Wall switching is outside this focused refinement, avoiding a multi-opening/front-door architecture change.

Ceiling defaults **Simple**, a clean flat ceiling. **Gypsum / Coffer** restores a decorative perimeter treatment/crown. Its inset controls perimeter band width and its drop controls depth below ceiling. No ceiling CAD editor is introduced. The preset door adapts/omits only for shells too small for it; architectural trims, ceiling, walls and opening heights derive from current dimensions.

Interior camera presets and walk eye height respect room height; Top retains full-floor fitting and pose-owned radius. Lighting/shadow coverage/range adapt without additional shadow lights or postprocessing. XR's shared room/teleport plane and short-room spawn margin track dimensions; no XR settings UI or emulator auto-enable was added.

## Performance and verification

Draft input remains local to its form and does not rebuild geometry. Height/furniture/window/ceiling-only Apply reuses the floor-size reference and compiled placements. Changed floor dimensions reuse validation's compiled result at publication. The existing per-asset merged floor batches and single Canvas plan remain. Hydration is not repeated on panel open or render; prepared blobs are decoded through the existing bounded texture cache.

- TypeScript, lint, production build and native tests passed. The native suites contain **46 cases**: 23 layout, 14 preserved server/security, 4 local-repository/transition and 5 architecture/camera cases. Existing bundle-size warnings remain.
- Production browser acceptance uses real IndexedDB with no backend and all `/api/*` blocked: two generated PNG/JPEG uploads plus a focused WebP production run, crop/rotation, shared Simple/Field/Frame/Center choices, actual renderer/texture switching, Compare reset, compiled → Simple transition, 2D image drawing and 3D passed.
- Real scene geometry checks passed at **2.8×3.5**, **5.4×7.2**, **8×10**, **15×20 m** and heights **2.4/3.0/4.5 m**. Window width/height/offset/sill, invalid out-of-wall rejection, resize and enabled/disabled wall subtraction passed. Simple/Gypsum, inset/drop, furniture on/off and camera presets passed. Draft snapshots stayed unchanged before Apply; furniture/window-only Apply kept floor geometry.
- Refresh and an actual isolated browser-process close/reopen preserved both uploads. Durable records contained Blobs and no object URLs. Deletion reconciled active Simple/installation selections and remained deleted after reload. Native cases also cover corrupt records, storage retry, quota failure, failed deletion and URL revocation.
- Both restart-workflow phases and the focused WebP production run recorded **zero `/api/*` requests** and **zero runtime exceptions**. Browser checks used software WebGL and test-only DPR 0.5; no hardware frame-rate or physical-headset claim is made.
- Normal development verified emulator-free. Two explicit emulator enter/exit cycles passed at 2.8×3.5×2.4 m and 15×20×4.5 m: shared teleport plane and short-room spawn matched the shell; original desktop camera and Floor/Reset recovered. Zero API calls, runtime exceptions or SDK notices in the passing run. The test waits for the asynchronously loaded XR origin before inspecting it; no physical headset was tested.

No commit, push, deployment, remote SQL or backend debugging was performed. Stop after this refinement.

## Files changed

- `PROJECT_MASTER_REFERENCE.md`
- `docs/GEOMETRIC_LAYOUT.md`
- `docs/ONLINE_TILE_SETUP.md`
- `docs/USABILITY_REFINEMENT.md`
- `src/App.css`
- `src/App.tsx`
- `src/layout/FloorDesignContext.tsx`
- `src/layout/roomArchitecture.ts`
- `src/layout/roomDimensions.ts`
- `src/layout/useFloorDesign.ts`
- `src/scene/CeramicFloor.tsx`
- `src/scene/DesktopControls.tsx`
- `src/scene/Door.tsx`
- `src/scene/Lighting.tsx`
- `src/scene/Room.tsx`
- `src/scene/VRLocomotion.tsx`
- `src/scene/Wall.tsx`
- `src/scene/Window.tsx`
- `src/scene/cameraPresets.ts`
- `src/scene/roomConfig.ts`
- `src/scene/useRoom.ts`
- `src/state/selectSimpleMaterial.ts`
- `src/state/useConfiguratorStore.ts`
- `src/state/useFloorDesignStore.ts`
- `src/tiles/demoLibrary.ts`
- `src/tiles/localTileRepository.ts`
- `src/tiles/localTileStorage.ts`
- `src/tiles/useTileProducts.ts`
- `src/ui/CeramicCatalog.tsx`
- `src/ui/DemoTileLibrary.tsx`
- `src/ui/FloorDesign.tsx`
- `src/ui/Hud.tsx`
- `src/ui/RoomSettings.tsx`
- `src/ui/TileUploadForm.tsx`
- `tests/browser/client-demo.mjs`
- `tests/browser/room-refinement-xr.mjs`
- `tests/browser/usability-refinement.mjs`
- `tests/demoLibrary.test.ts`
- `tests/layout.test.ts`
- `tests/roomArchitecture.test.ts`
