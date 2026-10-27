# Milestone 4B — Multi-Size Modular

One controlled neutral preset, `modular` / `multi-size`, extends the existing installation/compiler. This is a five-body repeating composition, not an exact Versailles pattern. Straight, Running Bond 50%/33% and Checker retain their existing behavior. Default installation serialization remains unchanged.

## Physical family and repeat

A is a large **square** with body side `L`. For full joint `j`, the small body side is `s = (L − j) / 2`. B is laid upright `s × L`; C is `s × s`. Optional D is `s × s` and replaces the last C. A lives in existing `field.tileAssetId` / `field.orientation`; `field.modular` stores the preset and B/C/optional-D asset/orientation selections. Physical sizes resolve from the same shared TileAsset adapter as every other zone. No redundant authored width/height or asset scaling is introduced.

The module has a top tier of A and B, and a bottom tier of three small tiles:

| Position | Slot | X | Y | Laid body |
|---|---|---|---|---|
| top left | A | 0 | 0 | L × L |
| top right | B | L+j | 0 | s × L |
| bottom left | C | 0 | L+j | s × s |
| bottom middle | C | s+j | L+j | s × s |
| bottom right | D, otherwise C | 2(s+j) | L+j | s × s |

Module repeat pitch is `P = 3(s+j)` on both axes. Body extent is `P−j`. The definition includes disjoint internal joint rectangles and trailing right/bottom seams. Each next repeat owns its bodies and trailing seams; there is exactly one full joint across module boundaries. Indices multiply the pitch directly; coordinates are never accumulated.

For **L=600 mm and j=2 mm**, A=600×600, B=299×600, C/D=299×299. The body extent is 901 mm and repeat pitch is 903 mm. A 600/300 family is incompatible with a positive 2 mm joint: two 300 mm bodies and the joint span 602 mm. At j=0, the exact 600/300 family works. This preset needs compatible physical formats; it does not claim arbitrary off-the-shelf formats fit.

## Compatibility and orientation

Exact configured nominal sizes are required. Only the existing **0.000001 mm** arithmetic epsilon is allowed; there is no 1 mm manufacturing allowance. Selected physical bodies are always retained. A nominal 599/601 mm mismatch is rejected. Local upload dimensions retain the existing 0.001 mm metadata precision; choose a family whose derived dimensions can be represented at that precision. Validation reports slot, expected oriented size, selected oriented size and full joint. Apply keeps the last valid floor on errors.

Each slot supports 0°/90° orientation. B must remain upright after orientation: a 600×299 source at 90° is accepted as a 299×600 laid body, with inverse-rotated source crops. A, C and D remain square; their rotation changes image orientation. The module axes are fixed. There is no arbitrary angle, module rotation or user pattern editor.

The Main Field UI provides one preset, expected sizes beside the shared asset selectors, orientation per slot, and optional D. Compatible B/C are suggested when first selecting Modular; the compiler still validates all selections. Joint or A changes update expected draft sizes without changing the selected assets or applied design.

## Compilation, zones and performance

`modules.ts` separates the controlled definition/validation from reusable `repeatModule` enumeration. The compiler shares one tile emitter for the old grids and modular repeats: clip actual bodies against existing disjoint field regions, merge subdivision-only seams, preserve source identity, produce full/cut status and actual source crops. Module joint rectangles are clipped to the same regions. Center > Center Frame > Field and the field-filled opening with Center disabled retain their existing geometry. Partial modules at room edges are clipped, not dropped.

Every candidate body, including bodies in partial/excluded modules, counts against the shared **10,000** cell budget. Enumeration checks the full module count before entering its loops and respects the already-used Center/Frame/perimeter budget. A completely occupied field skips enumeration and consumes no invisible field budget, matching the existing grid path. The existing 40,000 clipped-piece guard remains. No increased safety limits, per-tile React nodes, extra render loops or dependencies.

LayoutPlan and AdvancedFloor still consume the same compiled result. One material batch per unique asset plus grout; slots sharing an asset share a batch. Their Canvas images and UV mapping are unchanged.

The browser check exposed an existing loop-policy reset when applying while the plan was already open: R3F Canvas defaults its configuration to `always`, overriding the imperative SceneActivity setting on reconfiguration while that effect's dependencies remain unchanged. Canvas now receives its loop mode explicitly from plan and shared XR-session state: plan without XR uses `demand`; Room or XR uses `always`. SceneActivity only invalidates when the presentation/session changes. There is one declarative policy and no added loop.

Drafts still live in FloorDesign local state. The existing Apply path validates/compiles once, publishes once, and reuses that result. Deleting any currently used modular asset returns the field to valid Straight, retaining A if available, falling back to the first built-in otherwise, and removing missing slot references. The IndexedDB repository and backend remain unchanged.

## Numeric verification

Fourteen new native cases plus 64 existing cases pass. The hand-authored `modular-golden.json` specifies all five bodies and six joint rectangles of one 903×903 mm repeat; it is not generated from compiler output. Tests verify exact assignment/positions/dimensions/joints, one boundary seam, distant index multiplication, optional D, rotated edge source crops, all Center/Frame/perimeter combinations, complete disjoint area coverage, fractional/zero/maximum joints, exact-size rejection, missing/invalid slots, adapter parity, immutability, deterministic output, 3×4 / 8×10 / 15×20 m rooms, meter-buffer conversion, shared candidate limits (including other zones), a fully occupied center with no hidden-field budget, exact body-extent fit without artificial wall joints, and deletion of each used slot. Eight pre-M4A full Straight compile SHA-256 fixtures remain identical.

TypeScript, lint, production build and npm test pass; existing bundle-size warnings remain.

Production geometry checks at 5.4×7.2 m with 2 mm joints and center/frame pass mixed built-in/local A/B/C/D, a rotated rectangular B, optional D removal, and resizing to 3×4 m. The 250-piece composition uses six unique material batches + grout; sharing A with Center and omitting D uses four + grout. The resized composition has 85 visible pieces / five meshes. Canvas clip rectangles exactly match compiled placements. Maximum 3D Float32 position error is 0.000118256 mm; UV error is 2.7816e-8. All images load; Layout/Top/Room captures were visually inspected. Incompatible C Apply preserves the previous geometry. The plan remains demand-rendered after Apply. The production geometry run recorded zero API calls and zero runtime exceptions.

The development precise V8 profiler measured zero compile calls or publications across modular slot/orientation/joint/room draft edits, one compile + one publication on valid Apply, and one validation compile with no publication for incompatible sizes. Optional D removal also applies once. No API calls or runtime exceptions in that run. All browser verification uses software WebGL/test-only DPR 0.5, not physical hardware performance. The separate production workflow passes Top/Floor/Overview/Detail/Reset, deletion of a used small slot → valid Straight, catalog selection → actual Simple mesh, and IndexedDB tile retention on refresh, with zero API calls and runtime exceptions. Run `modular-patterns.mjs` then `modular-workflow.mjs` against the same isolated browser profile/origin; the latter uses the former's saved fixtures and deletes one. Splitting the software-rendered checks avoids harness execution limits.

Two opt-in emulator cycles pass with the same modular definition/camera and 75 field pieces, plan demand mode after exit, continuous XR/Room mode and working Floor/Reset controls. Each exit leaves seven frame subscribers, zero XR input sources and one canvas. Existing SDK offer-superseded console messages were observed; no unexpected runtime exceptions or API calls. XR checks use test-only framebuffer scale 0.25 and disabled shadows in addition to DPR 0.5 to limit software-renderer cost. No physical-headset or hardware-performance claim.

The final rebuilt production bundle also passes a focused 3×4 m modular smoke check: 75 visible pieces, three asset meshes + grout, exact Canvas placement parity and demand mode. The final-source draft profiler repeats the zero-draft / one-Apply result. Both runs record zero API calls and runtime exceptions.

## M4B file inventory

- `src/layout/model.ts`, `src/layout/modules.ts`, `src/layout/compiler.ts`
- `src/ui/FloorDesign.tsx`, `src/state/useFloorDesignStore.ts`
- `src/App.tsx`, `src/scene/SceneActivity.tsx` (declarative loop policy)
- `tests/modular.test.ts`, `tests/fixtures/modular-golden.json`
- `tests/patterns.test.ts` (keep M4A-specific matrix explicit; modular has its own assertions)
- `tests/browser/modular-patterns.mjs`, `tests/browser/modular-drafts.mjs`, `tests/browser/modular-xr.mjs`, `tests/browser/modular-workflow.mjs`
- `docs/MODULAR_PATTERNS.md`, `docs/FLOOR_PATTERNS.md`, `PROJECT_MASTER_REFERENCE.md`

Pre-existing uncommitted M4A changes remain. No backend, storage, security, XR store/panels/locomotion, room architecture, renderer, dependency or secret files are changed by M4B. Stop after this preset; herringbone, wall tiling, quantities, waste, PDF, backend, AI and furniture editing remain outside scope. No commit, push or deployment.
