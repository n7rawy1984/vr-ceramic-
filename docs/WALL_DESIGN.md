# M6 — Multi-Surface Wall Design V1

Original M6 is checkpoint `841705c`. The subsequent [M6 feedback patch](M6_FEEDBACK_PATCH.md) adds camera-only cutaway and independent lighting, extending project documents from schema 2 to schema 3 without changing compiled wall geometry. The schema-2 contract below describes the original milestone.

M6 starts from committed M5 checkpoint `2f49545` on `main`. Floor behavior remains in the existing Floor Design / Simple material workflow. Wall Design adds independent Front, Back, Left and Right finishes. Walls start neutral; enable Tile this wall, choose any built-in or shared local upload, choose 0°/90° and full joint width, then Apply Surface. Disabling tiling restores the neutral architectural shell. Switching walls or closing discards unapplied wall edits. The elevation always shows the applied state.

## Geometry contract

`src/surfaces/compiler.ts` delegates Straight physical body/pitch generation to the existing pure LayoutCompiler. It subtracts architectural opening rectangles from placements, joint rectangles and zone regions. Cuts retain source tile identity, original bounds and correctly cropped source rectangles. No texture masking, stretching or separate renderer pattern calculations.

Wall coordinates are canonical millimeters: u increases along the shell's local horizontal axis and v downward from the ceiling. Front/Back u follows world +X; Left/Right u follows world -Z. The elevation uses these explicit coordinates (it is not a perspective camera). Right-window u is wall width / 2 + horizontal offset, matching the existing shell/window transform. The existing front door is also clipped, including its small-room dimensions and omission threshold.

`renderGeometry.ts` maps placements into world meters only at the scene boundary, with inward normals and corresponding triangle winding. Tile faces sit 2 mm inside the existing 120 mm shell, whose exposed material supplies grout gaps. The shell retains actual openings; window frame and glass remain visible. One merged quad batch per active wall uses the shared tile texture, optional normal/roughness maps and material finish. Buffer/material cleanup follows the floor renderer. There are no React nodes per tile.

The Canvas wall elevation draws these same applied placement rectangles and unclipped source-body images. Openings stay transparent. A failed uploaded-image load is reported in the elevation; fallback color keeps the placement geometry inspectable.

## Draft, Apply and invalidation

Wall edits are local React drafts and perform no compilation or store publication. Apply validates the selected wall, primes a bounded cache and publishes one update containing its applied semantic state. Rendering reuses that result. Neutral walls need no tile compilation.

The cache keeps at most one result per wall, keyed by its surface dimensions, actual openings, design and selected tile's physical dimensions. Unrelated assets, furniture, ceiling and other wall edits do not recompile that wall. Stable semantic surface identities also prevent buffer rebuilds for unchanged walls when window settings change. Moving/resizing the right window invalidates only Right; room height affects all enabled walls, width/length affect corresponding surfaces and world transforms. Room Apply validates affected enabled walls before publication. Floor Apply also validates affected walls when editing room dimensions. An invalid floor or wall keeps the previous applied room intact.

## Project schema 2

New saves contain `schemaVersion: 2` and `projectDocument.walls`, a complete four-wall map. Each entry contains only `enabled`, `tileAssetId`, `orientation`, and `jointWidthMm`. Dirty state observes applied walls; panel visibility and drafts remain transient. No autosave.

Version-1 M5 documents migrate in memory to neutral walls, preserving existing normalized floor, room and material state. Existing records are not rewritten on Open. Version 2 requires complete valid wall data; future versions are rejected. IndexedDB stays version 2: project schema version and database version are independent.

Opening resolves shared tile IDs and prepares enabled walls before a synchronous runtime publication. No Apply is needed afterward. A missing wall asset produces the existing named missing-tile warning and restores only that wall to neutral. Other surfaces and architecture remain intact. Project duplicate/delete continue to share/preserve the global image Blobs; wall documents never own images or object URLs.

## Verification

`tests/walls.test.ts` covers all four walls and both orientations, physical bodies, edge/opening clipping, conserved tile + joint area, source crops, exact renderer vertex/UV mapping, inward winding, all four window parameters, bounded independent cache invalidation, window removal, door clipping, invalid inputs/grid limits, schema migration, independent restoration, missing assets and real runtime capture/publication. Existing project tests now expect schema 2 and still reject unknown versions.

`tests/browser/walls.mjs` runs against an isolated local Chrome profile with generated shared uploaded assets. `--profile --profile-only` runs focused profiling against Vite development source and uses V8 coverage to measure actual compiler calls; production mode verifies the same UI/persistence/geometry workflow without development imports. `/api/*` is blocked and requests/exceptions are counted. Screenshots are written under `/tmp/m6-*.png`. Production acceptance passed: all four applied walls, uploaded/built-in materials, orientation, applied-only saving, independent buffers during window changes, byte-identical saved/restored vertex/UV/index buffers after Open and reload, all five floor patterns with walls preserved, M5 migration, missing-wall recovery and the 640px dialog. API requests and runtime exceptions were both zero. Screenshots were inspected. Focused V8 coverage passed: draft edits 0 compilations, Apply Surface 1 wall compilation + 1 wall publication + 0 floor-state changes, Save 0 compilations, and combined right-window edits + Apply Room 1 wall compilation with all unrelated wall buffers unchanged. `tests/browser/walls-xr.mjs` extends the existing two-cycle Modular-floor emulator regression with a compiled right wall and exact wall-buffer preservation; both cycles passed, including desktop recovery, unchanged wall geometry and matching subscriber/input/canvas counts, with zero API calls/runtime exceptions. Software WebGL produced transient zero-size framebuffer warnings during emulator startup; physical Quest behavior/performance remains unverified.

No new wall patterns, quantities, waste, PDF, cloud/backend, image collections, dependencies or XR UX changes. VR source remains preserved; software browser verification does not establish physical Quest performance.
