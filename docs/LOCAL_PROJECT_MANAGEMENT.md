# Milestone 5 — Local Project Management

Projects are local to this browser profile and site origin. The showroom still works without creating a project. Projects / Save Project controls show the active name and Saved / Unsaved status. One compact modal provides New, Open, Rename, Duplicate and confirmed Delete. No backend, login, cloud sync, new dependencies or tile-image copies.

## Architecture and schema

- `model.ts`: versioned semantic document, explicit safe normalization, asset-reference enumeration and canonical state fingerprint.
- `storage.ts`: project records and last-active preference, using the same database connection as tiles.
- `repository.ts`: CRUD, active metadata, applied/saved baseline, hydration, ordering, operation/error handling and subscriptions.
- `resolve.ts`: resolve missing identities before calling the unchanged layout compiler.
- `runtime.ts`: capture the existing stores, hydrate the global tile repository, and publish the prepared state in one synchronous batch.
- `ProjectProvider` connects the repository to the existing FloorDesignProvider result cache; the latter reuses the prepared compile on restoration. `Projects.tsx` supplies the modal, feedback and beforeunload handling.

The v1 record is:

```ts
{
  schemaVersion: 1,
  id, name, createdAt, updatedAt,
  projectDocument: {
    roomSize,                 // existing RoomSizeMm
    architecture,             // existing RoomArchitecture
    floorDesign: {
      enabled, started,
      installation            // existing complete FloorInstallation
    },
    materialState: {
      selectedFloorId, previousFloorId, compareActive
    }
  },
  assetNames                  // referenced ID -> last known human-readable name
}
```

Room dimensions, height, windows, gypsum settings, tile bodies and joints retain their existing canonical millimeter units. Installation includes Straight / Running Bond 50% / Running Bond 33% / Checker / Modular, all slot IDs and orientations, full joint, legacy disabled perimeter settings, Center Frame and Center. No compiled placements, geometry buffers, texture objects, image URLs, Base64 or Blobs are serialized. Compare state is restored in Simple mode; compiled mode keeps Compare inactive.

Names trim leading/trailing whitespace, accept ordinary Unicode/punctuation, and have a 1–120 character limit. IDs use `crypto.randomUUID()`. Metadata dates are ISO UTC; display uses the browser locale. Projects sort by updatedAt descending with an ID tie-breaker.

## Shared IndexedDB, version 2

Database remains **`tile-configurator-local`**. Version 2 adds stores without recreating or clearing the version-1 tile store:

| Store | Key | Owns |
|---|---|---|
| `tile-assets` | `id` | Existing prepared image Blobs and physical tile metadata |
| `projects` | `id` | Versioned semantic project records |
| `preferences` | `key` | `{key:'last-project', value: projectId}` |

`localDatabase.ts` owns one shared connection, handles blocked upgrades/version changes, and resolves writes on transaction **completion**, not request success. Tile persistence still uses the same records, store, image preparation, URL ownership and tile repository. Its adapter only delegates connection/transaction handling to this common module.

One Save performs one readwrite transaction over projects + preferences: put one complete project and its last-active ID. Failed/aborted writes cannot produce a fake saved baseline. Open updates only the last-active preference; it does not rewrite the project or updatedAt. No IndexedDB writes occur on renders or draft keystrokes.

## Draft, applied, saved and dirty

These remain separate:

1. Floor Design / Room Settings form drafts.
2. Applied runtime room, architecture, mode, installation and material state.
3. The last successfully committed project document.

Save captures only (2), then makes it the saved baseline after its transaction commits. Existing local form drafts are not published or persisted. Dirty compares a canonical semantic snapshot to that baseline. Changes to applied geometry, mode/material/Compare settings or room architecture count; camera movement/FOV/views, plan presentation, selected pieces, modal visibility and draft typing do not.

Without an active project the baseline is the clean application defaults. Engineers can design first and name the project at first Save. New Project asks for a name, writes a default project, makes it active, resets the applied room/design/material and leaves My Tiles intact. Deleting the active record returns to clean unsaved defaults with no active ID.

An applied edit during a pending Save stays dirty: the committed captured snapshot, not a later edit, becomes the baseline. Metadata-only Rename does not change this baseline or recompile. Duplicate copies the **saved version**, with a new ID/name/createdAt/updatedAt, leaving the current active design intact. It shares all tile references. Its button title explicitly identifies the saved version.

Unsaved switching uses Save & Open / Discard & Open / Cancel (or Create equivalents). If the current design is unnamed, Save & Open asks for its name first. Failed target preparation keeps the existing runtime design. Delete always asks for confirmation and explicitly warns when deleting the dirty active project. Dirty designs install one standard beforeunload handler; clean designs remove it. This requests the browser's standard reload/close warning where permitted; there is no autosave. Save feedback clears shortly afterward.

## Open and reload flow

```text
read record
→ normalize version/schema and architecture
→ hydrate the existing shared tile repository
→ resolve IDs and missing-tile fallbacks
→ compile once and prepare the result
→ remember active ID durably
→ prime the existing FloorDesignProvider cache
→ publish room/architecture/installation/mode and material state in one batch
→ publish active metadata/baseline and warnings
```

The floor store receives one update containing all restored floor/room/architecture fields. The existing material/camera store receives its update in the same synchronous React batch. The prepared result cache compares asset objects as well as room/installation identities, so the shared product-array wrapper cannot cause a second compile. No UI-click reconstruction or manual Apply after Open.

Open closes the old Floor Design / Room Settings panels and discards their unapplied local forms. Room/Overview is the restored presentation through the existing camera request mechanism. Free camera pose/FOV, open panels, selection and plan-vs-room are deliberately transient; they are not project content. A compiled project remains compiled and Layout opens its restored geometry immediately. Normalization ensures an enabled compiled design is marked started, preserving its authored installation when the editor opens.

Startup remembers the last **saved active ID**, not unsaved edits. If present/valid, it restores after local tile hydration. A short startup indicator prevents editing the initial default scene while restoration is pending. Missing/unreadable/unsupported last records return to defaults; other records remain available. Storage failure leaves the main showroom usable with Retry Projects. A retry does not overwrite applied work edited while Projects was unavailable.

## Asset references and missing tiles

Projects own only IDs and last-known names. The global tile repository owns each image/metadata record. Opening/duplicating/deleting a project neither clones image Blobs nor deletes shared tiles. Asset deletion remains a separate global My Tiles action.

On Open, unavailable references produce a named warning without revealing opaque IDs. Missing material/zone IDs use existing built-ins. A broken Checker pair or Modular set safely becomes Straight, retaining available A or using the default; unavailable optional references are removed. Other room, architecture, joint and zone settings remain. If a fallback cannot compile within the unchanged geometry limits, Simple mode keeps the room/settings available and asks the user to review Floor Design. The saved record is not overwritten automatically. A changed fallback is dirty so Save is an explicit decision to retain it.

## Validation/versioning and limitations

`normalizeProjectDocument(unknown)` is the version boundary. v1 reconstructs known fields, checks primitive types, finite dimensions, orientations, patterns/preset/zone rules, names/dates, and existing architecture constraints. Enabled compiled geometry must also pass the unchanged compiler during preparation. Unknown future versions are rejected rather than treated as v1. There is no earlier project version to migrate; future migrations belong in this explicit version switch. Corrupt/unsupported list entries are skipped with feedback, not deleted. A bad explicit Open leaves the active project unchanged.

This is explicit local saving. No autosave, cloud backup, accounts, import/export, file attachments/notes, multi-tab conflict merging, purchasing output or new pattern/geometry rules. Multiple tabs do not live-refresh the project list; saves use last-writer behavior. Clearing this origin's browser storage clears its projects and tiles. Renaming/duplicating uses the saved record; unapplied forms and unsaved runtime edits are not implicitly included. No physical-headset or hardware-performance claim.

## Verification

- 20 project cases plus all 78 prior cases pass. They cover CRUD/metadata-only operations, one-write saves, exact all-pattern recompile, Modular A/B/C/D + orientations/center/frame, room/window/ceiling/furniture, Simple/Compare, reload/last-active defaults, shared references, every missing Modular slot, warning names, dirty/baseline behavior, pending Save edits, invalid schema/geometry, failed Save/Delete/Open, storage retry without discarding edited work, and exact restoration through the real runtime stores.
- TypeScript, lint, production build and npm test pass; existing large-chunk warnings remain.
- Production UI verifies a real version-1 tile store upgrade to v2 with four existing image records preserved, an actual local image upload, named first Save, Rename/Duplicate without geometry changes, unsaved Cancel and Save & Open, New defaults, confirmed active deletion and last-active reload. Desktop and 640px modal captures were inspected.
- Production all-pattern restores produce byte-identical compiler results before Save and after Open; Canvas clip rectangles exactly match the restored placements. The shared 3D batch vertices and source UVs also match (maximum Float32 position difference 0.000118256 mm, UV difference 2.9141e-8). The Modular fixture includes all four slots, individual orientations, 2mm joint, center and frame.
- Dev V8 precise coverage measures **0 compiles for Save, Rename, Duplicate and unapplied draft edits**; **1 compile and 1 floor-store publication per Open**. Real IDB transaction instrumentation measures **1 project transaction per Save**. Saving a 7mm joint draft retains the applied 2mm value. No API calls or runtime exceptions in the completed UI/profiler checks.

Browser fixtures use an isolated local profile and generated PNGs. Tests use software WebGL with test-only DPR0.5 and disabled shadows to bound software-rendering cost. Run `projects-ui.mjs`, `projects-restore.mjs`, then `projects-safety.mjs` against the same isolated production profile/origin; later checks intentionally use earlier saved fixtures. `projects-profile.mjs` independently seeds its own development profile. Production restoration also passes compiled reload, applied-only Floor Design and Room Settings saving, Overview/Floor/Top, shared-tile retention after deleting one project, and real missing-tile fallback. The safety suite passes Discard & Open, dirty/clean beforeunload listener ownership, reachable compact Room/Layout controls, and an unsupported last-active record returning to clean defaults while retaining other projects. All suites report zero API calls and runtime exceptions.

## Files changed

- `src/projects/model.ts`
- `src/projects/storage.ts`
- `src/projects/repository.ts`
- `src/projects/resolve.ts`
- `src/projects/runtime.ts`
- `src/projects/context.ts`
- `src/projects/ProjectProvider.tsx`
- `src/tiles/localDatabase.ts`
- `src/tiles/localTileStorage.ts`
- `src/layout/FloorDesignContext.tsx`
- `src/layout/useFloorDesign.ts`
- `src/ui/Projects.tsx`
- `src/App.tsx`
- `src/App.css`
- `tests/projects.test.ts`
- `tests/browser/projects-fixture.mjs`
- `tests/browser/projects-ui.mjs`
- `tests/browser/projects-restore.mjs`
- `tests/browser/projects-safety.mjs`
- `tests/browser/projects-profile.mjs`
- `docs/LOCAL_PROJECT_MANAGEMENT.md`
- `PROJECT_MASTER_REFERENCE.md`

M5 starts from clean checkpoint `ebdeeb5`. Layout math/pattern modules, renderer buffers, camera implementation, room geometry, XR lifecycle/store/panels, tile preparation/repository, backend/Supabase, dependencies and secrets remain unchanged. The only tile-persistence integration change is sharing its nondestructive database connection/transaction helper. No commit, push or deployment; no next milestone.
