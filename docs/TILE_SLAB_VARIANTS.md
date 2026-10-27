# Tile and Slab variants — M7

M7 adds physical sizes to the existing device-local library. No backend, authentication, cloud sync, AI designer, new patterns or bookmatch authoring UI. M8 remains future work and is not started. The implementation and verification are complete; the work is intentionally uncommitted.

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
