# Milestone 4A — Floor Patterns

M4A scope and verification are retained below. The later authorized M4B extension is documented in [MODULAR_PATTERNS.md](MODULAR_PATTERNS.md).

Main Field supports `straight`, `running-bond-50`, `running-bond-33` and `checker`. Pattern and optional Checker `secondaryTileAssetId` are part of the existing draft/applied installation. Default remains Straight; the optional secondary identity is omitted from default installations to preserve earlier snapshots.

## Geometry contract

The compiler remains the sole placement source. Assets describe physical bodies in mm; full joint `j` gives effective pitch `(oriented body width + j, oriented body height + j)`. Orientation is applied before selecting either pitch. Rows advance on the surface's local Y axis; offsets move along its local horizontal X axis using the oriented width. At 90°, the asset's source height is the effective horizontal body width. Source UV crops retain the existing inverse-rotation mapping.

- **Straight:** row offset zero. Eight full pre-M4A compile results, captured at checkpoint `8b38d83`, are preserved as SHA-256 golden fixtures. They cover plain/rotated fields, center/frame combinations, internal legacy perimeter, zero joints and a boundary ending in a joint. Full output includes placement order, IDs, crops, joints, zones and areas.
- **Running Bond 50%:** `(row % 2) * horizontalPitch / 2`; cycle 0, 1/2, 0.
- **Running Bond 33%:** `(row % 3) * horizontalPitch / 3`; cycle 0, 1/3, 2/3, 0. Phase is computed from the row index, never accumulated, avoiding drift.
- **Checker:** A for even `row + column`, B for odd. A is the existing field identity; B is `secondaryTileAssetId`. Both slots use the shared field orientation. Body dimensions must match after that orientation within the existing 0.000001 mm geometry tolerance. Missing/invalid B or mismatched dimensions produces a validation error and does not publish the draft. Slots may reference the same asset, yielding a uniform appearance; no extra distinct-SKU constraint is imposed.

Running Bond enumerates a leading `c=-1` cell on shifted rows, then clips its actual body against field regions. This creates real boundary pieces and source crops; no texture transform simulates staggering. Each row partitions its own pitch cells into body, right joint and bottom joint. Clipping these disjoint pieces to existing field regions preserves complete physical joint coverage even when the next row has a different horizontal phase.

Center > Center Frame > Field precedence is unchanged. Pattern applies only to Field, including the field-filled opening when Center is disabled. Frame sides, butt corners, center placement and internal legacy perimeter retain the existing grid logic. Row/column identity persists through exclusion cuts, so Checker parity does not restart on the other side of a center/frame.

## UI, validation and deletion

The existing Main Field controls add a Pattern dropdown. Checker shows Field Tile A and Field Tile B; other patterns retain Main Field tile. The shared built-in/local library supplies all selectors. Checker prefers a compatible second asset when first enabled, while final validation remains in the compiler. It never stretches or silently changes a tile's physical dimensions.

All edits remain local drafts. Apply Design validates/compiles and publishes atomically through the existing prepared-result cache. Invalid Apply retains the applied design. Changing patterns does not replace applied room, geometry or plan while editing.

Deleting a local asset referenced by an active Checker pair resets the field to Straight. A remains selected when available; missing A falls back to the first built-in. Missing B references are removed. This avoids retaining a mismatched pair that could invalidate the applied floor. Existing Simple/Compare/Center/Frame reconciliation stays in place, and normal catalog selection still explicitly enters Simple mode.

## Performance and boundaries

The existing 10,000 candidate-cell and 40,000 visible-piece guards are unchanged. Shifted rows budget their extra leading cell; no silent increase is made. Large-room tests cover 3×4, 8×10 and 15×20 m without changing physical tile scale.

LayoutPlan, AdvancedFloor, render-buffer conversion, material cache, room architecture, IndexedDB, backend/security, XR and dependencies are unchanged. The same compiled placements drive Canvas clipping and per-asset merged geometry. A Checker field needs at most two field batches; zones add their own unique materials, plus one grout mesh. No per-tile React nodes or new render loops are introduced.

## Verification

- 18 new native pattern cases plus the 46 existing cases pass. Golden fixtures match exactly. Coverage tests independently check every body/joint pair for overlap, all visible bounds and exact total area. Cases include both Running Bond orientations, drift-free cycles, leading crops, full joints, Checker parity, missing/mismatched B, built-in/local inputs, central exclusions (including Center disabled), deterministic output, zero joints, immutability, safety limits and deletion reconciliation.
- TypeScript, lint, production build and npm test pass; existing large-chunk warnings remain.
- The production browser matrix passed all four patterns in Top, Floor, Overview and Layout at 5.4×7.2 m, 600×600 field, 100 mm Dark Stone Center Frame, 1200×1200 uploaded center and 2 mm joints. All 16 captures were visually inspected. Canvas clip rectangles matched compiled placements exactly. Maximum 3D vertex error was **0.000096639 mm**, maximum UV error **2.9141e-8**, consistent with Float32 buffer conversion.
- Visible pieces / floor meshes were Straight **119 / 4**, Running Bond 50 **124 / 4**, Running Bond 33 **127 / 4**, Checker **119 / 5**. These are render counts, not purchasing quantities. Checker used uploaded A + built-in 600×600 Travertine B; its four unique asset batches plus grout included the unchanged frame/center materials.
- Invalid Checker size Apply retained the last valid geometry; deleting referenced local A or B restored a valid Straight field; Running Bond → normal catalog selection restored the actual Simple mesh. The production run recorded zero API requests and zero runtime exceptions.
- Development-source precise V8 coverage measured **0 compile calls for draft edits**, **1 compile call + 1 publication per valid Apply** for all four patterns. Invalid Checker Apply compiled once for validation and published nothing. The separate profiler run recorded zero API requests and runtime exceptions. Software WebGL uses test-only DPR 0.5; no hardware performance or physical-headset claim is implied.

The separately authorized M4B now implements one Multi-Size Modular preset; see the linked contract. Herringbone, quantities, PDF and backend work remain outside scope. No commit, push or deployment is performed.

## Files changed

- `PROJECT_MASTER_REFERENCE.md`
- `docs/FLOOR_PATTERNS.md`
- `docs/GEOMETRIC_LAYOUT.md`
- `src/layout/compiler.ts`
- `src/layout/model.ts`
- `src/layout/patterns.ts`
- `src/state/useFloorDesignStore.ts`
- `src/ui/FloorDesign.tsx`
- `tests/browser/floor-patterns.mjs`
- `tests/browser/pattern-drafts.mjs`
- `tests/fixtures/straight-golden.json`
- `tests/patterns.test.ts`
