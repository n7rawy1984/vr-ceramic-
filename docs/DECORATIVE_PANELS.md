# M9 — Decorative Panel / Mural Designer V1

Decorative Panels are independent compositions: one artwork spans a real physical tile/slab grid. They are **not** another `LayoutPattern`, another room, an AI image generator, a vector waterjet/CAD editor, or a quantity/PDF feature. V1 provides a dedicated 2D Studio and floor/Center placement. Wall authoring and M9.1 are not implemented.

## Models and units

`src/panels/model.ts` defines a version-1 `DecorativePanel` with ID, revision, name, Rectangle/Circle/Ellipse, physical width/height in mm, artwork source ID, physical tile variant ID, captured physical body width/height, orientation 0/90, full joint width and artwork transform. A Circle has equal width/height, edited as Diameter. Shapes can be extended in a future version without adding a floor pattern.

A dedicated `ArtworkSource` owns one original JPEG/PNG/WebP Blob and its pixel dimensions. Upload validates format/size (5 MB), decodes once to validate up to 40 megapixels / 16384 pixels per side, then closes that bitmap. **The original uploaded bytes are stored without resizing, re-encoding, cropping or upscaling.** This source is independent of the material image printed on ordinary tiles. Physical media comes from a real shared Tile/Slab variant; the panel snapshots its body dimensions so library changes cannot alter its scale. Artwork is continuous, rather than the tile variant's texture repeated per body.

## Studio and library

Desktop **Decorative Panels** opens Decorative Panel Studio: a bounded dialog with scrollable controls beside a 2D compiled preview. It does not change the active room. Create → name/dimensions/shape → physical tile/slab and joint → upload/select artwork → Fit/Fill/Manual, scale, horizontal/vertical position and rotation → Save Panel. The preview displays the real boundary, cut pieces, grout and source-quality advisory. It renders compiler polygons directly, with no second layout algorithm.

The library supports Create, Open/Edit, Rename, Duplicate and confirmed Delete. Save/Edit and Rename increment a panel's revision. Duplicate makes a new ID/revision 1 and shares the artwork source. Delete removes only the library definition. Artworks are deliberately retained because another definition or a saved project's snapshot can still use them. This conservative retention avoids broken projects; automatic orphan-collection/artwork deletion is not implemented. An uploaded source remains available even if an unsaved draft is discarded. Closing/Back discards unapplied Studio edits.

## Pure geometry and tolerance

`compileDecorativePanel` is a pure mm compiler. Its output contains the convex panel boundary, physical tile bounds, row/column IDs, actual clipped tile polygons, normalized panel-local UV coordinates, cut flags and disjoint joint polygons. Rectangles use exact rectangular clipping. Circle/Ellipse use a deterministic convex polygon; each intersecting tile is physically clipped with half-plane polygon clipping. No full square outside the curved boundary is retained or hidden by an alpha mask.

For maximum semi-axis R, subdivision uses at least 64 vertices and enough segments that `R × (1 − cos(π/n)) ≤ 0.25 mm`. This conservatively bounds circle/ellipse chord deviation by **0.25 mm** across the accepted dimension range. Clip predicates use a small numerical epsilon; only negligible polygon areas at/below 1e−12 mm² are dropped. There are at most 10000 candidate bodies and 500000 cut/joint vertices per panel; the Center backing adapter also guards 40000 pieces / 500000 vertices before publication. Technical dimension limits match the existing physical-size model: 0.001–100000 mm, at most 3 decimal places; joints are 0–100 mm.

Tile orientation swaps body axes. Grid origin is panel top-left. Pitch is **body + full joint**, with no invented stretching or external half-joint. Right and bottom gaps partition each pitch cell, clipped to the same boundary. A 2400×2400 panel, 600×600 body and 2 mm joint has 4×4 candidate bodies: the last row/column are **594 mm cuts**, because four full 600 mm bodies plus three 2 mm joints would require 2406 mm. It never pretends those cuts are full tiles.

`intersectPolygon` also supports clipping panel output against a convex receiving surface for future attachments; UVs remain in original panel coordinates. Current room Center rules require the complete panel/Frame and outer joint to fit. Too-small room changes are rejected before publication rather than stretching or partially placing the panel.

## Continuous artwork mapping

Geometry and mapping are separate. The geometry key excludes artwork ID, fit, scale, position and rotation. Studio memoization compiles only physical changes; artwork controls redraw mapping using the existing compiled polygons. Each vertex's artwork UV comes from its **location across the whole panel**, never its location inside an individual tile. The artwork logically continues across a physical grout gap; grout remains visible because no tile geometry occupies it.

`artworkUv` inversely maps panel points through the same artwork placement used by Canvas:

- **Fit:** preserve aspect and contain the complete artwork in the panel; uncovered areas are neutral white.
- **Fill:** preserve aspect and cover the panel, cropping excess outside its boundary.
- **Manual:** at 100%, display artwork width equal to panel width while preserving source aspect; then use scale/position/rotation. It does not infer print DPI from image pixels.
- Scale multiplies displayed dimensions (1–10000%). Horizontal is +right, vertical is +down, in panel-local mm. Rotation is clockwise about the artwork center, with offsets applied in panel coordinates.

2D clips the same artwork draw to the union of compiled tile polygons. 3D has per-vertex UVs on one indexed tile batch using one shared artwork texture. Outside-image UVs and transparent image regions use neutral white; this matches Canvas compositing. No cropped per-tile files, image Blobs, canvases or textures are generated. Tile/room-intersection cuts retain global panel UVs.

## Floor and Center integration

Floor Design → Center → **Center fill type** offers Normal Tile/Slab or Decorative Panel. Choose a saved panel revision and Apply Design. The panel's physical dimensions set the Center host dimensions; they are not stretched to the room. V1 placement is room center with no offset/drag UI. A room resize recenters the same physical panel. Normal Center background material remains selectable for the space around a Circle/Ellipse.

`compileFloor` is a small adapter over the unchanged normal LayoutCompiler. It retains Main Field and the existing rectangular Center Frame. For the Center, it subtracts the compiled panel shape from normal backing tiles, producing real convex cut polygons, then adds the decorative panel's own physical grid. Rectangle panels replace the entire normal Center interior; curves keep physically cut normal backing around them. This is **Center > Frame > Field** within the existing rectangular host, not a circular Frame or a new room-perimeter border. Panel internal joints use its own joint setting; the surrounding layout/Frame uses the existing floor joint. No new curved perimeter grout/border authoring is introduced.

Normal tile batches now also accept compiler-produced convex polygons, retaining original body UVs/crop bounds. The technical plan draws each original body once through the union of its cut polygons, avoiding visible seams along subdivision edges. Selection/hit testing respects actual backing polygons. Shared floor results feed the plan and room, and a single `PanelMesh` renders all decorative pieces. No placement loop lives in React.

The compiler works in panel-local coordinates; floor placement/render conversion is separate. A future wall adapter can use the same local geometry and artwork UVs with wall openings/world transforms, but V1 wall placement is intentionally deferred.

## Persistence, revision stability and recovery

IndexedDB is **v4**, adding `artwork-sources` and `decorative-panels` to the existing shared database. The v3 material-source/variant/project/preferences stores and migration behavior are preserved. Project documents become **schema 6**; versions 1–5 still normalize safely and are not forcibly rewritten just by Open.

The project stores `center.panel`, a complete validated version-1 definition snapshot including panel ID/revision, original artwork source reference, media body dimensions and transform. It does not store artwork bytes or compiled geometry. A library edit/rename creates a new revision; an existing room continues using its saved snapshot. Floor Design displays that saved revision alongside current library revisions, and adopting a new one requires explicit selection and Apply. Global panel operations do not dirty projects; assigning a different snapshot does. Project Duplicate copies semantic state only and shares the original artwork source.

Deleting a library definition does not delete its project snapshot or artwork. On Open, the app warns that the removed panel's saved revision is being preserved. This is intentional: the panel is not missing because its immutable definition is in the project. If the snapshot itself is malformed, normalization removes only that assignment, restores normal Center tiles, and reports a recovery warning. If artwork is missing/invalid on hydration, project preparation similarly restores only normal Center tiles with a clear warning, preserving architecture, Field, Frame, walls and lighting. Decode failures have a visible warning and neutral physical preview. Original malformed/old project rows are not rewritten until Save.

Auto Design and Guided Auto Design do not create/select panels. Unlocked Floor design continues normal preset behavior; Keep Current Floor retains the complete panel snapshot and compiled floor output. Future Auto/AI planning can choose a validated panel snapshot through a later explicit semantic command without bypassing geometry or reference checks.

## Quality, resource ownership and performance

Artwork density uses the existing M7 image-quality thresholds against actual mapped physical artwork size, including fit and scale: ≥2 px/mm Excellent, ≥0.75 Good, otherwise Low for close-up. It is advisory and reads cached pixel metadata only. Changing panel dimensions or artwork controls never writes, resamples or encodes artwork. The original source resolution is retained; visual fidelity remains representative and is subject to display/GPU limits.

`useArtwork` shares one decoded image / texture / Blob URL per source. Active consumers retain it; a bounded cache keeps at most eight entries when unused consumers can be evicted, disposing textures and revoking URLs on eviction. The Studio and placed panel reuse the same source. There are no per-piece image resources. Each panel is one indexed mesh regardless of piece count; normal materials retain their existing per-asset batching. Grout is physical empty space over the existing grout surface; Studio fills the compiled boundary before drawing tile polygons. Geometry and materials have explicit disposal effects. Compiled geometry has candidate/vertex limits, and cache ownership has no unlimited per-tile growth.

Studio mapping changes measured **zero** panel/layout compilation, panel/floor buffer construction, image preparation, bitmap creation, encoding, artwork-source writes and new object URLs. Studio/global definition edits do not republish room geometry. Adopting a new saved revision into a project is an explicit floor Apply and uses normal complete validation/publication. Current V1 does not live-edit an applied project's artwork mapping.

## Verification and limits

`tests/decorativePanels.test.ts` adds 17 native cases for all shapes, physical bodies/joints, area conservation, UV continuity across gaps, mapping-only changes, fit/rotation, convex receiving-surface cuts, Center/Frame non-overlap, resizing, quality, budgets, revision/source sharing, schema migration/recovery and Guided preservation. Existing native suites remain in place.

`tests/browser/decorative-panels.mjs` exercises real Studio upload/controls/CRUD, source ownership, exact 3D positions/UVs/indices, plan rendering, project snapshot stability after edit/rename/delete, shared textures, Save/Open/Duplicate/reload, room resizing and missing-artwork recovery. `--profile` measures actual V8 function coverage and image/source-write counters. `panels-migration.mjs` verifies v3→v4 and schema 5→6 restoration without forced project writes or changed legacy material bytes. Relevant Guided, wall/five-pattern and XR runners verify preserved consumers. All checks passed: TypeScript/production build, zero-warning lint, all fourteen native test files (17 new panel cases), development profiling, production/offline Studio-to-room workflows, v3 migration, Guided preservation/performance and wall/core regressions through all five patterns. Two guided XR cycles with a circular panel and Slab wall preserved complete project state, artwork texture, positions/UVs, wall buffers and camera, recovering at 11 subscribers / zero inputs / one canvas / 226 normal cut placements in both cycles. Completed browser runs recorded zero API requests and no application runtime errors; XR emitted one existing SDK superseded-offer notice. The production technical plan was visually checked after eliminating backing-subdivision seams.

Checks use isolated local Chrome/software WebGL and generated artwork, not live deployment, supplier calibration or physical Quest hardware. Existing build chunk advisory remains. No new dependency, API/Supabase path, AI connection, vector artwork editor, custom/freehand polygon, wall-placement UI, purchasing quantities or PDF output is included.

## Future boundaries

A custom-shape revision can add a boundary-provider model and appropriate non-convex clipping/triangulation, without changing artwork ownership or making a new floor pattern. Manufacturer-supplied individual tile images need a **different image-set mode**, mapping image identities to bodies/slots rather than distributing one master artwork; that mode is not implemented. Medallions, mosaics, logos and later waterjet compositions can share the generic panel/attachment terminology, but vector waterjet CAD is not part of V1. M9.1 and AI Designer are not started.

## Files changed in M9

- New panel implementation: `src/panels/model.ts`, `compiler.ts`, `mapping.ts`, `render.ts`, `floor.ts`, `repository.ts`, `images.ts`, `PanelMesh.tsx`.
- Studio and entry: new `src/ui/PanelStudio.tsx`, plus `src/ui/Hud.tsx`, `src/App.tsx`, `src/App.css`.
- Center/plan/mesh integration: `src/ui/FloorDesign.tsx`, `src/ui/LayoutPlan.tsx`, `src/scene/AdvancedFloor.tsx`, `src/layout/model.ts`, `src/layout/renderGeometry.ts`, `src/layout/FloorDesignContext.tsx`.
- Project/preservation/migration: `src/projects/model.ts`, `repository.ts`, `resolve.ts`, `runtime.ts`, `src/autoDesign/prepare.ts`, `src/tiles/localDatabase.ts`.
- New acceptance: `tests/decorativePanels.test.ts`, `tests/browser/decorative-panels.mjs`, `tests/browser/panels-migration.mjs`.
- Existing tests updated for current schema/database or placed-panel XR: `tests/projects.test.ts`, `walls.test.ts`, `physicalOverrides.test.ts`, `presentation.test.ts`, `variants.test.ts`; `tests/browser/auto-design-xr.mjs`, `physical-overrides.mjs`, `variants.mjs`, `walls.mjs`. Old raw-version fixtures remain old; only current-runtime expectations change.
- Documentation: this file, `PROJECT_MASTER_REFERENCE.md`, and a focused compatibility note in `docs/AUTO_DESIGN.md`.
