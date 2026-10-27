# Tile and Slab variants — M7

M7 adds physical sizes to the existing device-local library. No backend, authentication, cloud sync, AI designer, new patterns or bookmatch authoring UI. M8 remains future work and is not started. M7 is complete and committed at `4ae0734`; the M7.1 project-size follow-up is documented below.

## Material identity and physical identity

`MaterialSource` owns the prepared image Blob (or built-in catalog reference), stable ID, filename, MIME type, effective pixel dimensions, original preparation crop/rotation, finish and material type. `PhysicalVariant` owns a separate stable ID, source ID, name, width/height in millimeters, explicit `tile`/`slab` kind, default orientation and image-transform metadata. All sizes use the same stored image bytes and source URL. Finish remains material-specific.

Built-in materials retain their existing default IDs and procedural fallback. Additional built-in sizes store only variant metadata; their source refers to the existing built-in material. Procedural generation uses the original material aspect, independent of the new physical size.

The renderer maps the full prepared face onto the explicitly defined physical body. A different aspect is an intentional product definition, not automatic compatibility correction. Geometry always uses the selected variant's actual millimeters. This does not infer a manufacturer's SKU, rescan image proportions or preserve real-world features inside an arbitrary photograph.

## Sizes and shared workflows

My Tiles groups each material with expandable **Sizes**. **Create Size Variant** accepts name, explicit Tile/Slab and width/height in mm. Technical limits are 0.001–100000 mm, up to three decimal places; existing placement-count limits still protect render cost. The original size remains available. Rename changes its display name only. Delete Size hides that size and retains its ownership tombstone and source image. Built-in defaults are retained.

Simple Mode immediately changes repetition when a size is selected. Floor Design and Wall Design retain Draft → Apply. Main Field, Center Frame, Center, walls and Simple Mode all consume the same product list. An unrelated global library change does not dirty a project or rebuild its installation. Deleting an applied size reconciles only affected references using the existing safe fallback behavior; Open also explains missing references. Project duplication shares all references and images.

Checker retains equal oriented physical-body validation. For incompatible B, **Create matching size variant** explicitly creates a Tile size from B's material at A's required dimensions, selects it in the draft, and leaves Apply to the user. Modular offers the same explicit action for each preset slot's joint-aware required dimensions, respecting slot orientation. Neither workflow silently changes the original product or relaxes geometry validation.

Tile supports existing Straight, Running Bond 50/33, Checker and Multi-Size Modular rules. Slab is explicit product metadata, never inferred from size. M7 Slab supports Straight only, 0/90°, floor and all four walls, physical joints, room-edge/window/door cuts and local/project persistence. Non-Straight Main Field slab combinations are rejected clearly. Center and Center Frame retain their existing Straight placement and priority: Center > Center Frame > Main Field.

## Image detail and quality

Only upload preparation processes pixels. Existing preparation crops in original coordinates, rotates clockwise, and caps the long edge at 4096 px without upscaling. M7 preserves this existing cap. Source pixel dimensions are read from encoded PNG/JPEG/WebP headers after preparation, so they describe the effective stored crop/rotation, not the uncropped file. Legacy images are inspected once on hydration and backfilled without decoding/resampling.

Density is `min(effective pixel width / physical width mm, effective pixel height / physical height mm)`. The weaker axis prevents a sharp axis from masking a soft one. Future image-transform rotation swaps pixel axes; installation orientation rotates both image and physical axes together, preserving density. Mirrors do not affect density. Quality is calculated, never stored as a label or represented as printer DPI.

| Effective density | Label | Reason |
| --- | --- | --- |
| ≥ 2 px/mm | Excellent | At least two prepared samples per millimeter along both physical axes; useful for close detail. |
| ≥ 0.75 and < 2 px/mm | Good | Reasonable room-scale viewing, with less fine detail. |
| < 0.75 px/mm | Low for close-up | Less than one prepared sample over roughly 1.33 mm on one axis; softness becomes likely near the surface. |
| Unknown | Resolution unavailable | No invented quality claim for an unreadable image header. |

These are practical advisory tiers, not guarantees about photographic sharpness, viewing distance or display resolution. Low quality shows “This image may appear soft in close-up views at this physical size.” Apply remains enabled. Catalog selection, My Tiles sizes and floor/wall pickers expose quality. Detail uses the full stored prepared image, including when the physical size is small or very large; no size-dependent derivative is created.

## IndexedDB migration and deletion

Database `tile-configurator-local` upgrades from version 2 to 3. New `material-sources` and `physical-variants` stores sit alongside unchanged `projects` and `preferences`. Each valid legacy `tile-assets` record becomes source `source:<old ID>` plus a default Tile variant with **the original ID and physical dimensions**. Blob bytes, crop, rotation, finish and timestamps are retained. Moving the Blob and deleting the old row happen inside the single upgrade transaction: failure aborts the upgrade. Invalid legacy records remain untouched in the old store and produce a library warning; they are not erased. Existing version-1 databases also upgrade directly.

Delete Material is disabled while live sizes exist. Storage checks live variants and all saved project references in one read/write transaction before source deletion. Tombstones allow saved references to a deleted size to keep its source protected. Malformed projects conservatively block deletion when reference safety cannot be established. No automatic cascade across projects. Variant writes check source existence in the same transaction, including concurrent material deletion in another tab. Tabs do not live-synchronize their library UI; reload to refresh changes made in another tab.

## Project migration

Project schema 4 writes **physical variant IDs**. Existing `tileAssetId`, `selectedFloorId` and other reference field names remain for compatibility; their values now unambiguously identify physical sizes. Source IDs never replace those values. Schemas 1/2/3 normalize automatically. Because migration retains each old ID as its default variant, existing projects require no reference rewriting. Opening does not overwrite the stored original document; Save writes schema 4. Room, floor pattern/zones, four independent walls, lighting, ceiling/window, furniture and physical dimensions are preserved. Missing sizes warn and fall back only in affected references; incompatible compound fields use the existing safe field recovery while retaining unrelated zones/walls.

## Rendering, resource sharing and bookmatch foundation

The original pure millimeter compilers still supply 2D and 3D. Slab uses the same placement/clip/joint path as Straight tiles. Batched geometry remains grouped by physical variant. Floor and wall UV buffers and Canvas drawing share image transforms, preserving visible source regions at cuts and 0/90° orientation.

Decoded source textures are cached by source identity plus image URL rather than physical size. Material-local UV clones share the Three.js `Source` and original decoded image. The cache retains active sources and evicts unused entries beyond 24. Creating/renaming a size does not prepare, resize, encode or decode an image, allocate a new Blob URL, or write a source. Unrelated sizes preserve product identities, semantic compiler keys and existing geometry. Thumbnails use a source-keyed procedural swatch; they never replace the full-resolution scene texture.

`SlabPair` models normal/mirrored relationships between two variant IDs and distinguishes `two-images` from `mirrored-source`. `ImageTransform` supports mirrorX, mirrorY and 0/90/180/270 rotation. This transform is supported by compiled floor/wall UVs, their Canvas previews and the Simple material shader. Mirroring is a design simulation, not a claim that a photographed physical slab has a second face. Pair authoring, pair storage/UI, bookmatch compositions and per-placement editing are deferred. There is no XR variant-management UI; shared scene geometry and existing XR lifecycle remain in use.

## Verification

Automated numeric/repository tests cover shared Blob/URL ownership, unchanged source writes, quality tiers and orientation, encoded dimensions, legacy IDs/metadata, safe source deletion and saved tombstones, explicit Checker compatibility, Slab floor/wall cuts at 0/90°, pattern rejection, stable cache keys, Schema 3 preservation and mirrored UV foundations.

Opt-in local browser checks:

- `tests/browser/variants.mjs <local-preview-url> --phase=migration|workflow|modular|slab|upload`: actual DB v2 → v3 and Schema 3 → 4 restoration; explicit UI creation/Checker/Modular; real slab wall/elevation/save/Open; upload-form crop/rotation and millimeter Slab application.
- `tests/browser/variant-resources.mjs <local-preview-url> --phase=resources|ceiling`: prepared crop/rotation pixel facts, density labels, V8 call counts, Blob writes/URLs/decode instrumentation, decoded texture identity across floor/walls, Simple immediate scale, Detail resolution, duplicate/delete protection; nine ceiling brightness/color screenshots plus old/new fill comparison.
- Existing wall, presentation and XR scripts exercise independent walls/openings, five floor patterns, Simple transitions, lighting/cutaway/shadows and emulator entry/exit. All network checks block and count `/api/*` requests.

Browser checks use isolated headless Chrome/software WebGL. They do not establish Quest hardware performance or visual user acceptance. Screenshots are review evidence in `/tmp/m7-*.png`, not production assets. Consult the final report for checks actually completed in this run.

## Ceiling cleanup

The ceiling already uses a roughness-0.95 lit Standard material. The concentrated patch came from the inverse-square point fill at 85% of room height, only 0.45 m below a 3 m ceiling. Moving the same fill to 50% height spreads its contribution broadly. Brightness/color controls, ambient/hemisphere fill and directional shadow caster are preserved; the ceiling remains lit. The production captures compare old and new point positions at Cool 200%, and cover Warm/Neutral/Cool at 25/100/200%. The old position produces a visible central circle; the new position produces a smooth ceiling response.

## Verification results recorded during M7

TypeScript, lint (zero warnings), all ten native test files (including fourteen new M7 cases), production build and `git diff --check` pass. The build retains the existing large-chunk advisory.

Production browser acceptance has verified actual DB v2 → v3 / Schema 3 → 4 migration without image-byte or design loss; explicit Checker mismatch/recovery; 1200×2400 Slab wall/elevation with 16 real clipped placements, exact compiler position/UV buffers and identical Save/Open geometry; actual upload/crop/90° preparation to 1024×1536 effective pixels with immediate Simple Slab application; all five restored floor patterns with independent walls/window/door geometry, Simple transitions and legacy/missing-wall recovery; and all nine required ceiling color/brightness combinations with the old/new fill comparison.

Development resource profiling verified zero `prepareImage`, `generateCeramicCanvas`, `compileLayout`, `compileWall`, `floorBatchBuffers` and `wallBatchBuffers` calls during metadata-only size creation/rename, zero source writes/new Blob URLs/bitmap creation, unchanged existing geometry and project dirty state, and identical decoded Three.js Source/image objects across floor and wall variants. Density changed through Excellent/Good/Low while the prepared pixels stayed unchanged; Detail used the same full 1024×1536 image. Duplicate projects shared images, surviving sizes rendered after deletion, and saved references blocked source deletion.

Completed browser phases report zero `/api/*` requests and zero application runtime exceptions. Additional production checks passed the explicit Modular B matching action at 90° (600×299 mm, no new Blob, draft until Apply), all four cutaway sides/hysteresis/exact material restoration, identical shadow-map pixels through cutaway, live lighting at 25/50/100/150/200%, all presets/custom color, custom-color reload, camera presets/manual orbit and the compact Room Settings dialog. Two XR emulator enter/exit cycles also passed with a Modular floor and a Slab wall sharing an uploaded source: identical floor installation/wall geometry, original desktop camera, demand plan rendering after exit, continuous XR rendering and automatic cutaway restoration inside XR. Both recovered to 11 subscribers, zero retained inputs, one canvas and 75 floor placements. There were no application runtime exceptions or API requests; the emulator emitted one existing SDK “Offer superseded by a new offerSession call” notice. Physical Quest hardware was not tested.

# M7.1 — Project physical sizes

M7 is committed at `4ae0734`. M7.1 adds assignment-local physical sizes while retaining the source/variant model and all M7 behavior. M8 is not part of this work.

| Concept | Ownership and behavior |
| --- | --- |
| Library Variant | A reusable physical product in My Tiles. Its width, height, kind and source stay unchanged when a project experiments. |
| Project Physical Size | Optional `physicalOverride: {widthMm,heightMm}` on one design assignment. Uses the same library variant/source with different design dimensions. Other assignments and projects remain independent. |
| Save as New Size | Explicitly creates a new PhysicalVariant from the same source, selects that variant in the assignment and clears that assignment's temporary size. The original remains available. |

`src/tiles/physicalSize.ts` supplies the single `effectiveSize` rule: override when present, otherwise the library dimensions. `effectiveProduct` adapts that rule for Simple rendering and advisory quality; floor/Modular/wall compilation resolves the same rule per assignment. There is no second asset library or synthetic product ID. Compiled placements retain their library variant IDs and carry real effective tile bounds. Batching the same variant across differently sized zones remains valid because each placement supplies its own UV mapping.

Optional fields live on Main Field/Modular A, Checker B (`secondaryPhysicalOverride` beside its existing secondary ID), Modular B/C/D, Center Frame, Center, legacy Border and each independent wall. Simple Mode stores its selected size in `materialState.physicalOverride`; Compare retains an independent `previousPhysicalOverride`. Changing a selected library variant resets that assignment's old size; changing orientation preserves the assignment size. Kind and source mirror/rotation metadata are never changed by a physical size.

The compact **Physical size** controls show **Library size** and **Use in this project**, with millimeter inputs, **Reset to Library Size** and **Save as New Size**. Simple Mode uses explicit **Apply Size**. Floor and wall input changes remain local drafts and apply with **Apply Design** / **Apply Surface**; typing never publishes a design. The quality within the controls previews entered dimensions immediately. The existing quality tiers and broad 0.001–100000 mm / three-decimal guards remain unchanged, and low quality does not block Apply.

Checker still rejects unequal effective bodies. Its explicit **Use … mm in this project** action sets only B's project size; the separate permanent matching-variant action remains available. Modular offers the same project action with joint-aware expected dimensions and inverse axis mapping for 90° slots. A Slab remains a Slab at any experimental size and retains Straight-only validation.

Saving a size creates metadata only, using a material-based default name with a numeric suffix when needed. It preserves Tile/Slab kind and the selected variant’s image mirror/rotation metadata. Simple selection updates immediately; Floor/Wall selection stays in the draft until Apply. Global variant creation alone follows existing library dirty-state semantics. Applying a project size changes the project fingerprint; Save clears dirty. Reset removes the optional fact, rather than writing a null size.

Project schema **5** preserves all optional dimensions in Save/Open/Duplicate. Schemas 1–4 remain supported; absent sizes continue using library dimensions and remain absent after normalization. Open does not rewrite a saved older document. IndexedDB remains **v3**, with no store migration or changes to source records. Size overrides never write source Blobs, resize/re-encode images or introduce new image URLs. A missing underlying variant still warns and falls back; its size is removed from the affected assignment so it cannot accidentally resize the fallback product. Saved project references and source-deletion safety continue to use the original variant IDs.

New native coverage in `tests/physicalOverrides.test.ts` checks independent same-variant zones/slots, effective Checker validation, Modular equivalence to permanent sizes, all four Slab walls at 0/90° with exact opening/UV parity, quality, guards, schema 4/5 normalization, copied project independence, safe missing references, metadata-only new variants and per-wall cache behavior. Browser acceptance is in `tests/browser/physical-overrides.mjs <local-preview-url> --phase=simple|floor|wall|migration|profile`; profile requires the development preview and its V8 function names. Completed verification results are recorded below.

## M7.1 verification

TypeScript, zero-warning lint, all eleven native test files (including eleven new project-size cases), production build and whitespace checks pass. The existing build chunk-size advisory remains.

Production browser checks passed exact Simple 600→1200 repetition scaling and exact reset, independent Project A 900×900 / Project B 600×600 state, duplicate size snapshots, Save as New Size with a shared source and clean selected reference, Checker mismatch→explicit project-size compatibility with identical Save/Open, Modular B/C project sizes without new library records, and a 1200×2600 wall with exact compiler position/UV buffers, matching elevation and restored window-clipped geometry. A schema 4 document in the actual v3 database restored as runtime schema 5 with identical room/floor/walls/lighting, no null size fields and no write to its original project record.

Development profiling recorded zero compiler calls, buffer builds, source-texture calls and texture clones while typing. Applying a floor size made one design publication and one LayoutCompiler call. Applying a wall size made one wall publication, one WallCompiler call and its one nested LayoutCompiler call; the other three wall geometries and floor buffers were unchanged. React development StrictMode replayed buffer construction (four floor and two wall buffer calls) while applied-state publications and compilation stayed single. Across all tested size changes there were zero bitmap creations, image encodes, source Blob writes or new image URLs. A 1536×1536 source moved through Excellent / Good / Low quality tiers without changing its pixels.

The existing production core regression passed independent walls, window/door clipping, Save/Open/reload, Simple transitions and all five floor patterns with unchanged saved wall buffers. The production presentation regression also passed all four cutaway sides/hysteresis/exact material restoration, identical shadow pixels through cutaway, lighting values 25/50/100/150/200%, warm/neutral/cool/custom presets, custom-color reload, camera presets/manual orbit and compact Room Settings. Two XR emulator cycles preserved a Modular floor with project sizes 900×900 / 449×900 / 449×449 and a shared-source Slab wall with project size 1200×2600. Both returned to 11 subscribers, zero retained inputs, one canvas and 36 floor placements, with the original desktop camera, continuous XR rendering, demand plan rendering after exit and cutaway restored inside XR. Completed browser phases recorded zero API requests and no application runtime exceptions; XR emitted one existing SDK superseded-offer notice. Quest hardware was not tested. Isolated verification services were stopped after completion.
