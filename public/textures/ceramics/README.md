# Ceramic texture drop-in folder

Place real product photography here using the filenames already referenced by
`src/catalog/materials.ts`:

- `ceramic-01.jpg` — Carrara White (CR-001)
- `ceramic-02.jpg` — Travertine Beige (CR-002)
- `ceramic-03.jpg` — Dark Stone (CR-003)

Each image should be a seamlessly tileable photo/scan of **one physical
tile** (square crop works for any aspect ratio — the app repeats it based on
the `tileWidth`/`tileHeight` values in the catalog, not the image's own
aspect ratio). Recommended size: 1024×1024px JPG, optimized under ~500KB for
standalone VR performance.

If a file is missing, the app automatically falls back to a generated demo
texture, so the configurator always looks correct even before real
photography is available.

To add a new product, add an entry to `FLOOR_CERAMICS` in
`src/catalog/materials.ts` and drop its texture (and optional thumbnail in
`/public/textures/thumbnails/`) in — no other code changes required. See
`src/catalog/README.md` for the full walkthrough.

## Texture size policy (desktop vs. Quest)

Keep two tiers in mind when sourcing real photography:

- **Source / master**: whatever the photographer or supplier delivers
  (often 2K–4K). Keep these outside `public/` (e.g. in a private asset
  archive) — they should never ship to the browser as-is.
- **Shipped / Quest-optimized**: what actually goes in this folder.
  Target **~1024×1024px JPEG, quality ~80%, under ~500KB**. That's plenty
  of detail at real-world tile scale (a 60×120cm tile only ever covers a
  small portion of the viewer's field of view) and keeps GPU memory and
  download size sane on a standalone headset.

The material system only ever takes a URL string (`MaterialProduct.texture`,
`normalTexture`, `roughnessTexture`), so swapping these JPGs for compressed
GPU formats later (KTX2/Basis via `KTX2Loader`) is a loader change, not a
material-system rewrite.
