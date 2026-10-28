# Auto Design — M8 Foundation and M8.1 Guidance

M8 introduced desktop **✨ Auto Design**, with deterministic Minimal, Luxury and Bold concepts. M8.1 extends it with local Guided Auto Design; the guided rules below supersede the original automatic-only defaults where guidance is supplied. This is a local metadata planner; it has no service connection, keys, image upload, backend route, new dependency or database migration. M8.1 is Guided Auto Design, not AI integration. External AI and Decorative Panel / Mural Designer remain unimplemented.

## Permanent architecture rule

**Geometry and the semantic project document remain the source of truth. AI must return structured design decisions, never a final room image as the source of truth.** Reference or generated imagery can eventually provide inspiration only; it cannot replace physical dimensions, LayoutCompiler, wall compilation, openings, project state or the actual 2D/3D/XR scene.

```
DesignIntent → DesignPlanner → versioned DesignDecision
→ strict preparation with real compilers → one batched semantic publication
→ existing 2D plan, wall elevations, 3D meshes and XR
```

`src/autoDesign/model.ts` defines `DesignIntent`, semantic material roles (`primary`, `secondary`, `accent`, `feature`), `DesignPlanner.generate(input): Promise<DesignDecision>` and `DesignConcepts` for future multiple proposals. Optional prompt and local image references distinguish reference, moodboard and material inputs. They are type preparation only: there is no image-input UI or transport. `LocalRulePlanner` implements the interface. A future AIPlanner must implement exactly this decision boundary and pass the same validation; no AIPlanner service or stub pretends to generate anything today.

## M8.1 — Guided Auto Design

The existing `DesignIntent` now accepts optional `guidance`; omitted guidance retains the Balanced M8 baseline. The same asynchronous planner interface and version-1 decision remain in use. Decisions add optional strength, preserved-system names and the full preserved Simple material state. These are ephemeral proposal metadata, not new project fields. A future AI planner can consume the same roles, style, strength, preferences and locks; no AIPlanner is implemented or connected.

### Controls and precedence

The compact dialog keeps Style and Design Strength visible, groups Materials, Surfaces & room, and Preserve current choices into collapsible sections, and scrolls within its existing bounded modal. Generate brings the proposal into view and focuses its summary for keyboard/screen-reader review. Designers can choose:

| Guidance | Choices / default |
|---|---|
| Style | Minimal / Luxury / Bold; default Minimal |
| Design Strength | Subtle / Balanced / Dramatic; default Balanced |
| Material roles | Primary / Secondary / Accent from shared variants or existing project-size assignments |
| Floor Pattern | Auto / Straight / Running Bond 50 / Running Bond 33 / Checker / Modular |
| Center / Center Frame | Auto / On / Off |
| Feature Wall | Auto / Front / Back / Left / Right / None |
| Wall Coverage | Auto / Feature Wall Only / Multiple Walls |
| Ceiling | Auto / Simple / Gypsum |
| Lighting | Auto / Warm / Neutral / Cool |
| Furniture | Auto / Show / Hide |
| Preserve | Keep Current Floor / Walls / Ceiling / Lighting / Furniture; initially unchecked |

All surface preferences default Auto. Initial Primary is the exact current active floor assignment, including its own override even when Simple uses the same variant at a different size; other roles default None. Explicit roles are never replaced with other library identities. Missing Primary may use the first supplied role, as in M8. Empty optional roles stay absent; no fictitious third material is introduced. When Floor is locked, an otherwise empty material set can use the current floor assignment for any unlocked finishes.

Deterministic precedence is **(1) locked current state, (2) explicit preference, (3) explicit material role, (4) style/strength defaults, (5) a clearly disclosed safe fallback**. A requested pattern cannot override product geometry; an impossible preference produces a warning rather than stretched bodies. A lock overrides and disables its corresponding preference controls while retaining their values for later unlocking. The transaction also enforces the captured locks independently of planner output, so a future planner cannot bypass them.

Floor preservation includes the complete enabled/started mode, installation, pattern and Modular slots, Center/Frame/Border, joints, orientations, every physical override, selected/previous Simple variant and their overrides, and Compare semantic state. Walls preserve all four assignments exactly. Ceiling preserves style/inset/drop. Lighting preserves enabled state, custom color, brightness and fixture visibility. Furniture has its own optional preservation switch.

**Try Another Style** cycles the same three styles while retaining all guidance, selected roles and locks. **Reset Guidance** clears the proposal, restores Minimal/Balanced, Auto preferences, unchecked preserve switches and the initial current-floor material selection; it changes only the form. Generate, Cancel and Reset do not dirty or mutate the project.

### Strength and explicit choices

| Strength | Automatic Center / Frame | Automatic feature emphasis | Brightness offset |
|---|---|---|---|
| Subtle | Off | No new feature wall | −15 percentage points |
| Balanced | M8 rules: Luxury/Bold composition, Minimal off | M8 Slab/quality-aware Luxury; Accent-first Bold | 0 |
| Dramatic | Also eligible in Minimal; center uses 50% of each room axis | Accent-first when supplied, then suitable remaining role | +15 percentage points |

Brightness bases remain Minimal 90%, Luxury 85%, Bold 115%, giving a bounded implemented range of 70–130%. Explicit lighting family wins over the style's neutral/warm/cool family, while brightness follows strength. Locked lighting preserves even a custom color or On/Off exactly.

Balanced/explicit-Subtle centers use 40% of each room axis; Dramatic uses 50%. The shorter room dimension must be at least 2000 mm and the effective unrotated body must fit the center. A separate Secondary role supplies Luxury/Minimal center; Bold uses Accent then Secondary. Dramatic can use Accent when Secondary is absent. A separate supplied role may deliberately reference the same variant; identities are not swapped. Center Off always wins. Frame On with Center Auto requests the necessary center; Center Off prevents it and reports the conflict.

Balanced/explicit-Subtle frame bands are `min(150, floor(shorterRoom × .04))` mm; Dramatic uses `min(200, floor(shorterRoom × .05))` mm. Luxury/Minimal use Accent for frame, Bold uses Secondary. A frame still requires an enabled center and a separate Tile role with shorter body edge at most four band widths. Slabs never enter a narrow frame. Unsatisfied explicit On gives a readable explanation; the affected zone remains Off. Center Frame remains centered around Center, with existing Center > Frame > Field priority and no perimeter substitution.

Explicit feature walls win in every style, including Minimal/Subtle. None prevents new wall tiling even with Multiple Walls, unless Walls are preserved (lock wins). A door/window on a selected wall produces an opening-clipping advisory; the existing compiler performs the actual subtraction on Apply. An explicit wall with one material can use Primary. Auto retains architecture ranking; Dramatic prefers supplied Accent, while Balanced Luxury still ranks suitable Slabs then quality. Feature Wall Only creates at most one tiled wall. Multiple Walls creates at most two: the feature plus a Primary companion, ranked by fewer openings, greater width, then back/left/right/front. It never aggressively fills all four. Other walls become neutral unless Walls are preserved.

Explicit Simple/Gypsum overrides style; Gypsum uses existing inset/drop and falls back visibly to Simple if they do not fit. Auto ceiling remains Luxury Gypsum, otherwise Simple. Explicit Show/Hide wins over the default hidden furniture; no furniture is created or edited.

### Pattern compatibility and fallbacks

Auto remains conservative Straight. Specific Straight and Running Bond 50/33 are attempted with Primary. Slab pattern slots remain Straight-only. Checker assigns Primary=A and Secondary=B and requires equal effective unrotated dimensions and Tile kind. Modular assigns Primary=A (square), Secondary=B (upright rectangle), Accent=C (small square), reuses the current joint, and selects B orientation 0/90 only when compatible with the existing joint-aware module. The shared `multiSizeModule` compatibility helper checks nominal dimensions; Generate does not run the surface/layout compiler. Checker/Modular never create variants, rewrite overrides, substitute arbitrary library roles, or stretch images. Invalid sizes, missing roles or Slabs lead to an explicit **Fallback: Straight** warning. The proposal displays **Can apply with adjustments** when needed.

Warnings for low source resolution remain advisory. Explicit user material/wall choices remain possible even when the source may look soft. Impossible architectural/size budgets can still be rejected during strict Apply, without publication.

### Selective preparation, publication and Undo

`src/autoDesign/prepare.ts` replaces Auto Design's former full-project preparation with strict selective preparation. It normalizes and validates the entire semantic decision and all references, then shares equal subtrees with a trusted snapshot of the current applied stores. Unchanged Floor installation/room dimensions reuse the current compiled result. Each enabled changed wall compiles only if its assignment or architectural surface differs. Existing validated unchanged walls are not recompiled. Disabled walls need no compilation. Missing materials remain a hard error; ordinary project Open's graceful fallback is unchanged.

The existing batched publisher and prepared-result FloorDesignProvider are reused. Unchanged room size, installation, wall assignments, window, ceiling and architecture keep their reference identity so a lighting-only Apply cannot accidentally build geometry. `captureAppliedProjectReferences` is an internal synchronous snapshot for preparation; normal capture/save still normalize and clone. No cache entry is published until all validation succeeds.

Undo uses the same selective preparation against the current applied snapshot, restoring the complete before state, including preserved and changed systems. A lighting-only Undo likewise leaves geometry untouched. Stale project/design/library protection remains; project switches clear ephemeral recovery. Resulting state persists normally under schema 5 / IndexedDB v3; no form guidance is persisted in the project. No-op proposals preserve normal fingerprint-based dirty semantics.

### M8.1 verification

New native coverage is `tests/guidedAutoDesign.test.ts` (20 cases), alongside all original M8 and geometry/project suites. `tests/browser/guided-auto-design.mjs` runs production/offline UI and development V8 coverage, with real applied Modular physical overrides, four different walls, custom 55% lighting, complete Undo, explicit window wall, pattern fallback, two-wall coverage, Reset, Save/Open/Duplicate/reload, and 1280/820 px panel checks. Reproduce using the existing isolated Chrome/CDP fixture and `--profile` against development. `tests/browser/auto-design.mjs` retains the M8 baseline regression; `auto-design-xr.mjs --guided` exercises explicit guided choices through XR. All checks passed: TypeScript/production build, zero-warning lint, all thirteen native test files (20 new guided cases), development profiling, final production/offline browser acceptance, the original M8 browser regression and two guided XR cycles. The proposal-focus check verifies the generated summary receives focus and is visible even after expanding the full guidance form. Every completed browser runner recorded zero API requests and no application runtime errors; XR retained state, floor result, Slab buffers and camera with stable 11 subscribers / zero inputs / one canvas, and emitted one existing SDK superseded-offer notice. These are local software-WebGL results, not Quest hardware or deployment validation.

Expected Apply costs: lighting-only = zero layout/wall compilation and zero geometry builds; one changed wall = one wall compiler and its one LayoutCompiler invocation; floor plus one wall = one floor plus one wall compilation. All publish one complete semantic state inside the existing React batch. Generate/Cancel always compile/publish zero. New material textures may load normally on Apply; existing source textures are not regenerated by guidance changes.

Measured development costs on the documented fixtures:

| Operation | LayoutCompiler calls (including walls) | Wall compiler calls | Floor buffers | Wall buffers |
|---|---:|---:|---:|---:|
| Generate / Cancel | 0 | 0 | 0 | 0 |
| Lighting-only Apply / Undo | 0 | 0 | 0 | 0 |
| One changed wall | 1 | 1 | 0 | 2 |
| M8 Minimal floor Apply | 1 | 0 | 2 | 0 |
| M8 Luxury floor + feature wall | 2 | 1 | 6 | 2 |

Each Apply emitted one complete semantic design publication. Buffer counts reflect development StrictMode memo replays per active material group, not additional compiler invocations. Lighting-only operations also had zero wall-segment work and zero texture/image preparation; a newly selected procedural material on the isolated one-wall test created its normal first-use source texture on Apply, not on Generate. Original M8 buffer counts below are retained as historical measurements; unchanged-reference sharing reduces them in M8.1.

The following sections retain the M8 foundation and historical baseline rules. Guided precedence and selective preparation above take priority where M8.1 extends them.

## Decision model

Version 1 contains style, the existing floor design/installation, four independent existing wall assignments, feature-wall identifier, existing ceiling and lighting settings, furniture visibility, warnings and reasons. There are no meshes, images, URLs, compiled placements or architectural dimensions in a decision. Applying merges these commands into the captured project; width, length, height and all window facts are carried from the baseline unchanged. The existing door is derived from those architectural facts as before.

The session owns baseline identity/fingerprint and source/variant facts separately from the decision. Decision history is ephemeral and is not necessary for restoring a project. Future planner output is untrusted until normalized and compiled.

## Inputs, roles and material analysis

The dialog offers Primary, Secondary and Accent; any one or more can be supplied. If Primary is absent, the first supplied role in primary/secondary/accent/feature order supplies the field. Explicit primary selection always wins: the planner does not claim to recognize premium stone or silently replace a selected floor based on color. `feature` is also supported at the planner boundary for future callers.

Every reference is a physical **variant ID**, retaining its shared source, product kind and image transform. Choices include built-ins, uploads, Tile and Slab variants, and explicitly labeled existing project-size assignments from Simple, Field, Center, Frame and walls. The current floor assignment is selected initially, preferring its supplied override. Selecting a library option explicitly uses library dimensions; selecting a project-size option preserves the supplied override in every zone to which that role is assigned. The planner creates neither size variants nor arbitrary project physical sizes. Composition width/height and frame band dimensions are room-design geometry, not material-body overrides.

`materialFacts` reads effective physical dimensions, kind, transform and the existing M7 pixel-density quality. Quality accounts for prepared pixel dimensions, physical override and image rotation. It does not decode images, access canvas, fetch textures or write source metadata. There is no new color extraction: catalog baseColor is not a measured color for uploaded images, so it is deliberately not used to infer contrast. Explicit roles make costly analysis unnecessary. No analysis persistence/cache or IndexedDB expansion is needed for these inexpensive metadata calculations.

Low close-up quality produces advisory proposal warnings for materials actually used. Unknown resolution is unknown, not a rejection. Luxury prefers Slab among possible feature materials, then higher effective pixel density, then role order; an explicit `feature` role wins. Bold keeps Accent ahead of Secondary to respect its requested emphasis, even if its resolution is lower. Quality never blocks Apply by itself.

## M8 baseline deterministic preset rules

All presets enable the compiled floor and use **Straight**, orientation 0, 3 mm joints. Straight keeps Slabs valid without inventing Checker/Modular matching sizes. The other stable patterns remain available manually; M8 does not generate them. Room-perimeter Border is disabled. All four walls begin neutral; at most one is tiled. Furniture is hidden, lighting enabled and the optional existing light fixture hidden.

| Rule | Minimal | Luxury | Bold |
|---|---|---|---|
| Field | Primary/fallback role | Primary/fallback role | Primary/fallback role |
| Center candidate | None | Secondary | Accent, else Secondary |
| Center frame candidate | None | Accent | Secondary |
| Feature material | None | Explicit Feature, else Slab-first/quality-ranked Secondary or Accent | Explicit Feature, else Accent, else Secondary |
| Ceiling | Simple | Gypsum if existing inset/drop fits; else Simple with explanation | Simple |
| Light | Neutral `#ffffff`, 90% | Warm `#fff0d6`, 85% | Cool `#dceaff`, 115% |

A center is enabled only when a separate candidate role exists, the shorter room dimension is at least 2000 mm, and the candidate's effective unrotated body fits inside a centered rectangle of `floor(roomWidth × .4)` by `floor(roomLength × .4)` mm. Otherwise the planner omits it and explains oversized-body adaptation. A single supplied role remains conservative. A supplied Secondary matching Primary's variant can still form a deliberate composition when assigned separately.

A frame requires an enabled center and a separate frame role. Its band is `min(150, floor(shorterRoomDimension × .04))` mm. The frame product must be Tile, and its shorter effective body edge must be at most four times that band. This permits normal tile cuts while excluding huge bodies and all Slabs from a narrow frame. It is the existing **Center Frame around Center**, preserving compiler priority **Center > Frame > Field**; no perimeter conversion occurs. No new ceiling geometry, lights, wall pattern or furniture geometry is created.

Extreme dimensions or extremely small supplied bodies can exceed existing compiler guards. Generate remains metadata-only; Apply then rejects the whole proposal with the compiler's error. The planner does not invent replacement physical dimensions to make a rejected layout pass.

## Feature wall and openings

`featureWallFor` calls the existing pure `wallSurface` for front/back/left/right; it does not inspect rendered pixels. Rank by:

1. Fewer openings (uninterrupted surfaces first).
2. Greater usable area: wall area minus actual door/window rectangles.
3. Greater width.
4. Fixed tie order: **back, left, right, front**.

In a default room the longer uninterrupted left wall wins; equal uninterrupted dimensions choose back. A large uninterrupted surface takes priority over the door/window walls. Slabs use the same real Straight wall compiler and opening subtraction as manual finishes, including physical cut UVs. No new wall placement engine exists. There is no screen-visibility heuristic that changes the design when a camera moves.

## Proposal, Apply and rollback

Opening the dialog and changing material/style inputs are local UI state. Generate awaits the planner and displays a compact semantic summary of floor, center/frame, feature/neutral walls, ceiling, lighting, furniture, warnings and reasons. No geometry compilation, publication or dirty-state change occurs. **Try Another Style** cycles Minimal → Luxury → Bold → Minimal deterministically. Cancel/Escape discard the proposal and invalidate pending generation.

The session clones its complete before state and checks project identity, semantic fingerprint and library facts before Apply. An asynchronous planner response is discarded if those inputs changed or Cancel/new generation superseded it. Project switches invalidate the proposal and one-level undo, including switch-away-and-back. A changed library requires regenerating; missing material references are strictly rejected rather than using project Open's graceful missing-material fallback.

Apply reconstructs and normalizes a complete target state, validates architecture and references, compiles enabled walls through the shared wall cache and compiles the floor. Only after every preparation step succeeds does `restoreProject` publish through the existing synchronous batched `publishAppliedProject`. The FloorDesignProvider consumes the prepared floor result; wall consumers reuse their prepared cache entries. There is one complete floor-design store publication and one companion material/camera store publication, batched for React. No partial design is rendered. Validation errors leave the applied state unchanged and stay visible in the dialog. Compilation may warm a cache on failure, but cannot publish geometry or semantic state.

**Undo Auto Design** prepares and restores the full before state, including the pre-existing manual installation, independent walls, architecture/ceiling/furniture, lighting, selected/previous Simple material, both physical-size overrides and Compare. It is one level only. Subsequent semantic edits hide undo and cause session-level rejection if invoked; camera/presentation changes and Save within an existing named project do not invalidate it. The first Save of an untitled room establishes a new project identity and clears ephemeral rollback. Missing materials also prevent rollback without mutation. Applying another Auto Design replaces the rollback snapshot with the state immediately before that Apply. Project switches/reload discard this ephemeral recovery, rather than overwriting another project.

## Persistence and render consumers

Apply changes normal semantic state and dirty detection runs through the existing project runtime. Save/Open/Duplicate/last-active restoration use schema **5** unchanged; IndexedDB stays **v3**. The saved result has no dependency on the planner or decision model. Cancel/Generate do not alter saved/applied state or dirty status. Existing project CRUD and missing-reference handling on ordinary Open remain unchanged.

The prepared floor result drives the technical plan and 3D floor. Shared applied wall state/cache drives elevation and wall meshes. Ceiling, lights, furniture and camera reset use existing systems; there is no second manual Apply. Auto Design has no XR UI; the desktop entry/dialog is unmounted while XR is active, and the same applied compiled scene renders in XR.

## Verification

Reproducible checks:

- `npm test`: existing suites plus `tests/autoDesign.test.ts` (18 M8 cases).
- `npm run lint`, `npm run build`.
- `CDP_PORT=<isolated Chrome port> node tests/browser/auto-design.mjs <local production URL>`.
- Same browser runner against development with `--profile` for V8 precise function coverage and store publication counters.
- `node tests/browser/auto-design-xr.mjs <local XR emulator URL>` with `CDP_PORT` set.

Browser verification uses generated fixture sources and a task-owned software WebGL browser; no deployment, supplier appearance calibration or Quest hardware claim. Verification passed production build/TypeScript, zero-warning lint and all twelve native files, including 18 new M8 cases. Production browser acceptance passed offline Generate, all style cycles, correct selection between distinct Simple/Field sizes for the same variant, Cancel, full Undo, Slab position/UV equality, 2D/3D parity and Save/Duplicate/Open/reload identity. Two applied-Luxury XR emulator cycles retained state, compiled floor, Slab buffers and camera, with 11 subscribers, zero inputs and one canvas in both recovered desktop states. All completed browser runs reported zero `/api/*` requests and no application runtime exceptions; the XR SDK emitted one existing superseded-offer notice. The existing large-chunk build advisory remains outside this milestone.

Development V8 coverage and store observers measured:

| Operation | `compileLayout` calls | `compileWall` calls | Complete design publications |
|---|---:|---:|---:|
| Generate / Cancel | 0 | 0 | 0 |
| Minimal Apply, neutral walls | 1 | 0 | 1 |
| Luxury Apply, one feature wall | 2 | 1 | 1 |

The Luxury total includes the wall compiler's own LayoutCompiler invocation: one floor plus one wall, without a repeat on publication. Each transaction also publishes the companion Simple-material/camera store once inside the existing React batch. `prepareImage` and `generateCeramicCanvas` counts were zero across generation and these measured Applies. Development StrictMode replays per-asset geometry memo calculations (four floor buffer calls for Minimal; eight floor and two wall buffer calls for the multi-asset Luxury fixture); these are not additional semantic publications or layout compilations.

## Original M8 files changed

- `src/autoDesign/model.ts` — planner intent/interface and versioned semantic decision.
- `src/autoDesign/planner.ts` — deterministic presets, effective material facts and feature-wall selection.
- `src/autoDesign/session.ts` — strict preparation, stale-input checks, Apply and one-level rollback.
- `src/ui/AutoDesign.tsx` — desktop inputs, proposal summary, Apply/Cancel/style cycle and undo.
- `src/ui/Hud.tsx` — desktop entry.
- `src/App.css` — responsive proposal dialog and controls.
- `tests/autoDesign.test.ts` — 18 native domain/transaction cases.
- `tests/browser/auto-design.mjs` — production/offline UI, persistence, geometry and development profiling.
- `tests/browser/auto-design-xr.mjs` — two-cycle applied-design XR regression.
- `docs/AUTO_DESIGN.md` — architecture, exact rules and evidence.
- `PROJECT_MASTER_REFERENCE.md` — current M8 scope/checkpoint and verification.

## M8.1 files changed

- `src/autoDesign/model.ts`: guided input, defaults, strength, locks and additive decision metadata.
- `src/autoDesign/locks.ts` (new): shared enforcement of preserved subsystems.
- `src/autoDesign/prepare.ts` (new): strict selective preparation and unchanged-reference sharing.
- `src/autoDesign/planner.ts`: guidance/strength rules, compatibility checks and disclosed fallbacks.
- `src/autoDesign/session.ts`: boundary lock enforcement, generation reference checks and selective preparation compatibility.
- `src/projects/runtime.ts`: trusted internal reference snapshot; normal project capture remains normalized/cloned.
- `src/ui/AutoDesign.tsx`: collapsible guided form, actual/preserved summary, proposal focus, Reset and retained style-cycle inputs.
- `src/App.css`: compact sections, preservation controls and disabled-state styling.
- `tests/guidedAutoDesign.test.ts` (new): 20 domain, precedence, compatibility, selective preparation and rollback cases.
- `tests/browser/guided-auto-design.mjs` (new): real UI, responsive/offline/persistence and exact performance acceptance.
- `tests/browser/auto-design.mjs`: tolerate the additive strength label while retaining baseline M8 acceptance.
- `tests/browser/auto-design-xr.mjs`: optional explicit guided choices through the existing two XR cycles.
- `docs/AUTO_DESIGN.md` and `PROJECT_MASTER_REFERENCE.md`: current scope, rules and verification.

## Future boundary

Stop after M8.1 Guided Auto Design. External AI integration remains future work requiring explicit authorization; a future planner must preserve the same structured decision/geometry contract. Decorative Panel / Mural Designer is the next roadmap feature, as a standalone feature rather than a forced floor pattern, and is not started in this sprint.
