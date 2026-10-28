# M8 — Local Auto Design / AI Designer Foundation

M8 introduces desktop **✨ Auto Design**, with deterministic Minimal, Luxury and Bold concepts. This is a local metadata planner; it has no service connection, keys, image upload, backend route, new dependency or database migration. M8.1 is not implemented.

## Permanent architecture rule

**Geometry and the semantic project document remain the source of truth. AI must return structured design decisions, never a final room image as the source of truth.** Reference or generated imagery can eventually provide inspiration only; it cannot replace physical dimensions, LayoutCompiler, wall compilation, openings, project state or the actual 2D/3D/XR scene.

```
DesignIntent → DesignPlanner → versioned DesignDecision
→ strict preparation with real compilers → one batched semantic publication
→ existing 2D plan, wall elevations, 3D meshes and XR
```

`src/autoDesign/model.ts` defines `DesignIntent`, semantic material roles (`primary`, `secondary`, `accent`, `feature`), `DesignPlanner.generate(input): Promise<DesignDecision>` and `DesignConcepts` for future multiple proposals. Optional prompt and local image references distinguish reference, moodboard and material inputs. They are type preparation only: there is no image-input UI or transport. `LocalRulePlanner` implements the interface. A future AIPlanner must implement exactly this decision boundary and pass the same validation; no AIPlanner service or stub pretends to generate anything today.

## Decision model

Version 1 contains style, the existing floor design/installation, four independent existing wall assignments, feature-wall identifier, existing ceiling and lighting settings, furniture visibility, warnings and reasons. There are no meshes, images, URLs, compiled placements or architectural dimensions in a decision. Applying merges these commands into the captured project; width, length, height and all window facts are carried from the baseline unchanged. The existing door is derived from those architectural facts as before.

The session owns baseline identity/fingerprint and source/variant facts separately from the decision. Decision history is ephemeral and is not necessary for restoring a project. Future planner output is untrusted until normalized and compiled.

## Inputs, roles and material analysis

The dialog offers Primary, Secondary and Accent; any one or more can be supplied. If Primary is absent, the first supplied role in primary/secondary/accent/feature order supplies the field. Explicit primary selection always wins: the planner does not claim to recognize premium stone or silently replace a selected floor based on color. `feature` is also supported at the planner boundary for future callers.

Every reference is a physical **variant ID**, retaining its shared source, product kind and image transform. Choices include built-ins, uploads, Tile and Slab variants, and explicitly labeled existing project-size assignments from Simple, Field, Center, Frame and walls. The current floor assignment is selected initially, preferring its supplied override. Selecting a library option explicitly uses library dimensions; selecting a project-size option preserves the supplied override in every zone to which that role is assigned. The planner creates neither size variants nor arbitrary project physical sizes. Composition width/height and frame band dimensions are room-design geometry, not material-body overrides.

`materialFacts` reads effective physical dimensions, kind, transform and the existing M7 pixel-density quality. Quality accounts for prepared pixel dimensions, physical override and image rotation. It does not decode images, access canvas, fetch textures or write source metadata. There is no new color extraction: catalog baseColor is not a measured color for uploaded images, so it is deliberately not used to infer contrast. Explicit roles make costly analysis unnecessary. No analysis persistence/cache or IndexedDB expansion is needed for these inexpensive metadata calculations.

Low close-up quality produces advisory proposal warnings for materials actually used. Unknown resolution is unknown, not a rejection. Luxury prefers Slab among possible feature materials, then higher effective pixel density, then role order; an explicit `feature` role wins. Bold keeps Accent ahead of Secondary to respect its requested emphasis, even if its resolution is lower. Quality never blocks Apply by itself.

## Exact deterministic preset rules

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

## Files changed

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

## Future boundary

M8 ends at this local foundation. M8.1 may add an AIPlanner only after explicit authorization. It would interpret prompt/reference inputs and return one or several compatible versioned decisions. It must still preserve architectural constraints, physical-size identities and the same prepare/validate/atomic Apply contract. Inspiration imagery must always remain secondary to the real project and geometry.
