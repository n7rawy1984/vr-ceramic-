# M6 feedback patch — desktop cutaway and room lighting

This patch starts from clean commit `841705c` (M6). The user's description of M6 as uncommitted was superseded by actual Git inspection. No reset, checkout, restore, new commit, push, deployment, backend or M7 work.

## A. Camera cutaway strategy

Each wall's shell, compiled tile batch, window/door and skirting share a render-only `RoomSide`. A scene-meter ray from the desktop camera toward its current viewing target must cross the finite wall span before that side is cut away. The ray continues beyond short targets because free look uses a 0.1 m target radius. Cameras above a wall or facing away do not unnecessarily hide it; a corner sightline may cut both blocking sides.

Hysteresis enters beyond the wall plane +60 mm and restores below -60 mm in the default room; smaller rooms scale this tolerance down. Intersection extents get the same restoration slack. There is no persisted visibility flag and no React/store update per camera frame.

Simply setting `visible=false` would remove wall shadows in Three.js. Instead, temporary material copies suppress camera color and depth writes while retaining visibility, opacity, textures and shadow settings. Three.js derives separate shadow materials, so these copies keep the exact shadow casters active. Original material instances restore when unobstructed. Copies are reused while hidden and disposed on restoration, replacement or unmount. Geometry, placements, source UVs and project content stay intact. No transparent-wall effect, extra wall meshes or texture regeneration.

XR session, active XR renderer and transitional XR camera checks all bypass desktop cutaway and restore normal materials. Existing ceiling/Top-view behavior is preserved.

## B. Light fixture handling

Source inspection found no debug light helper. The actual visible fixture is the existing decorative FloorLamp in Furniture. It is now mounted once under Lighting with independent Show/Hide, hidden by default. Furniture Show/Hide no longer owns it. Its redundant 0.12 decorative point light was removed; actual illumination remains the existing controlled lighting rig, independent of fixture visibility. Fixture materials are cleaned up on unmount.

## C. Lighting state/model

`src/lighting/model.ts` defines four applied fields: `lightingEnabled`, `lightFixtureVisible`, `lightingColor` and `lightingBrightness`. They live in a separate `lighting` object in the existing applied store, outside room architecture and layout state. Room Settings controls update lighting immediately. Closing the dialog retains lighting changes while discarding unapplied architecture drafts. The UI explains this distinction. Save Project captures current lighting; there is no autosave.

Defaults: On, fixture Hidden, Neutral (`#ffffff`), 100%. The existing four lights are retained: ambient 0.75, hemisphere 0.65 with original gray ground fill, directional key 1.6 and interior point fill 0.85. The directional light remains the only shadow-casting light. No added light collection or post-processing.

## D. Color controls

Warm `#fff0d6`, Neutral `#ffffff`, Cool `#dceaff`, or Custom through a native color input. These are representative RGB colors, not Kelvin/CCT simulation. Applied RGB changes affect room illumination, not UI/background. Project parsing normalizes six-digit hex colors and safely defaults invalid colors.

## E. Brightness control

A continuous input slider controls 0–200% of the validated rig. At 100%, all four original intensities and neutral colors match the prior default. Other values scale proportionally. Off/0% sets key, hemisphere and point contributions to zero, with neutral ambient safety fill 0.08. Fixture visibility does not change the light intensities.

## F. Project persistence/migration

New project documents use schema **3**; IndexedDB stays version **2**. New/Save/Duplicate/Rename operate on the normalized current schema. M5 v1 and original M6 v2 records without lighting normalize to On/Neutral/100%/Hidden while retaining their existing floor, architecture and applicable wall data. Unknown future versions are rejected. Missing/invalid visual fields receive independent safe defaults; brightness clamps to 0–200. Open prepares the design and restores lighting automatically; merely opening old projects does not rewrite them. Applied lighting changes participate in dirty state; Save clears it. Cutaway stays transient and never enters documents.

## G. Performance

Lighting subscribes independently from geometry consumers. Brightness/color only update light properties. The fixture remains mounted so Show/Hide reuses its geometry. Cutaway changes only camera material bindings and uses bounded per-side temporary material copies.

V8 precise coverage against development source passed with **0** calls to `compileLayout`, `compileWall`, `floorBatchBuffers`, `wallBatchBuffers`, `wallSegments` and `generateCeramicCanvas` during lighting edits, Save, all-side camera cutaway and hysteresis checks. Browser checks also compare every mesh/geometry identity and original light identity before/after lighting changes. No per-tile React nodes or source compiler changes.

## H. Verification

- Full isolated test suite passes, including 11 new presentation cases. They cover all sides, short free-look targets, bounded hysteresis, above-wall/corner/tiny-room visibility, exact materials/geometry/texture/shadow preservation, material replacement/disposal, all brightness levels, Off safety, safe RGB normalization, M5/M6 migration, and real store/repository dirty/save/restore behavior.
- TypeScript, lint, production build and whitespace checks pass. Existing large-chunk build warnings remain.
- Focused development browser profiling passed with zero API requests or runtime exceptions, live On/Off, fixture Show/Hide, all color presets/custom, 25/50/100/150/200% brightness, applied-only Save, all-side cutaway/restoration and hysteresis.
- Production acceptance passed On/Off, independent fixture visibility, Warm/Neutral/Cool/Custom RGB, 25/50/100/150/200%, saved custom `#f8d69b` at 150%, exact Open/reload restoration and v1/v2 fallback defaults. Overview, Floor, Detail, Top and manual orbit were exercised; Top retained all wall faces while its existing overhead policy remained intact. Rendered 128×128 VSM shadow data was byte-identical before, during and after the right-wall cutaway. Geometry identities stayed unchanged. API requests/runtime exceptions were zero.
- Two XR emulator enter/exit cycles passed. Each entered with the right desktop wall cut away, restored all wall materials inside XR and recovered desktop/plan behavior afterward. Modular floor installation, wall buffers and camera identity stayed unchanged; both cycles retained 11 subscribers, zero input sources and one Canvas. API requests/runtime exceptions were zero. No XR lifecycle source changes.
- The existing production floor/wall core assertions passed: independent walls, window edits, exact saved/restored wall buffers after Open/reload, all five floor patterns with walls preserved, and actual built-in → uploaded → built-in Simple selection. The process runner interrupted the long script after these assertions; `--core-only` / `--recovery-only` now allow bounded phases. The separate `--recovery-only` phase passed with zero API requests/runtime exceptions: v1 neutral walls, v2 preserved walls and lighting defaults, named missing-wall fallback affecting only Right, unchanged floor, and full wall restoration on reopening.

Browser tests use isolated Chrome profiles, generated shared local image fixtures and software WebGL. Screenshots go to `/tmp/m6-feedback-*.png`. Core checks use DPR 0.5 and disable shadows to bound software cost; the explicit shadow comparison enables 128×128 VSM maps for byte comparison. This is not physical Quest, calibrated color or hardware-performance validation.

## I. Files changed

- Lighting domain/UI: `src/lighting/model.ts`, `src/ui/LightingControls.tsx`, `src/ui/RoomSettings.tsx`, `src/scene/Lighting.tsx`, `src/scene/Furniture.tsx`.
- Camera presentation: `src/scene/cutaway.ts`, `src/scene/sideCutaway.ts`, `src/scene/RoomSide.tsx`, `src/scene/Room.tsx`.
- Applied/persisted state: `src/state/useFloorDesignStore.ts`, `src/projects/model.ts`, `src/projects/repository.ts`, `src/projects/runtime.ts`.
- Verification: `tests/presentation.test.ts`, `tests/projects.test.ts`, `tests/walls.test.ts`, `tests/browser/presentation.mjs`, `tests/browser/walls.mjs`, `tests/browser/walls-xr.mjs`.
- Documentation: this report, `PROJECT_MASTER_REFERENCE.md`, `docs/LOCAL_PROJECT_MANAGEMENT.md`, `docs/WALL_DESIGN.md`.

## J. Git status

Feedback changes are uncommitted on `main`, based on `841705c`. Nothing committed, pushed or deployed. Stop after this feedback patch; no M7.
