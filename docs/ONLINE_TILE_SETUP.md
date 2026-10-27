# Online Tile Upload — setup and operations

This is a **single-operator** library. There is no Supabase Auth, account, profile, identity table, ownership column, or multi-tenant model. The public showroom and three demos remain usable without unlocking the library.

The implementation is local and uncommitted. **No Supabase project was configured for this session, no remote migration was executed, and nothing was deployed.** Automated API/browser verification uses a local test-only Storage/PostgREST fixture. That does not prove production Supabase configuration or Vercel routing. Complete the live checklist below after setup.

## 1. Supabase project and database

Create a Supabase project (a dedicated project avoids inherited broad Storage policies). In SQL Editor, review and run [the migration](../supabase/migrations/20261025_tile_assets.sql). It creates `public.tile_assets`, enables RLS, revokes `PUBLIC`/`anon`/`authenticated` access, and grants the elevated server role only SELECT/INSERT/DELETE. It does not modify existing tables or delete data. It deliberately fails if `tile_assets` already exists: inspect that schema before applying, rather than dropping it.

Fields: UUID id; required name; unique storage_path; optional source_filename; validated mime_type/file_size; positive width_mm/height_mm as `numeric(10,3)`; material_type; finish; image_rotation (0/90/180/270); optional normalized crop_data JSON; created_at/updated_at. No user/owner/organization/created_by columns. Metadata is immutable in this milestone; updated_at equals creation time. A later editing API must introduce timestamp updates.

Keep the Data API enabled for the `public` schema: the server uses PostgREST, but anonymous clients cannot read/write this table. There are no anonymous database-write policies.

## 2. Private Storage bucket

Create **`tile-assets`** in Storage:

- Public bucket: **off**.
- Allowed MIME types: **image/jpeg**, **image/png**, **image/webp** only.
- File size limit: **5 MB**. The application additionally enforces an exact maximum of **5,000,000 bytes**, both before signing and when confirming the stored object.
- Do not add public/anon/authenticated upload, list, delete or read policies for this bucket. Inspect any existing broad `storage.objects` policies if reusing a project.

For an exact byte cap, Supabase's bucket creation API accepts `file_size_limit: 5000000` and `allowed_mime_types: ["image/jpeg","image/png","image/webp"]`. Use server-side credentials only if configuring through an API; do not paste an elevated key into the browser console. Dashboard configuration is sufficient with the stricter API-side save validation.

Files are named `tiles/<server-generated-uuid>.<jpg|png|webp>`, not by the original filename. Only paths minted in an application-signed upload receipt can be saved. A caller cannot choose a bucket or arbitrary path.

## 3. Server environment

Copy `.env.example` to **`.env.local`** for local work. Both `.env.local` and other real `.env*` files are ignored; `.env.example` contains placeholders only. Never commit a real environment file or prefix server credentials with `VITE_`.

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_ACCESS_CODE=<a-long-random-operator-code>
ADMIN_SESSION_SECRET=<a-separate-random-session-secret>
```

Use the current Supabase secret key. A legacy `SUPABASE_SERVICE_ROLE_KEY` is supported server-side only when `SUPABASE_SECRET_KEY` is absent. The REST adapter sends current secret keys on `apikey`, not as a JWT Bearer token; the legacy fallback uses both apikey and Bearer. **No publishable/anon key is needed in the frontend**, including signed uploads.

Generate each admin value separately, for example `openssl rand -hex 32`. The code enforces at least 12 characters for the access code and at least 32 bytes for the session secret; use randomly generated values rather than a memorable short code. Changing either value invalidates existing application sessions and upload/cleanup receipts.

Do not put these values in React, Vite `define`, a public asset, URL query parameter, screenshot, issue, or chat message.

### Temporary public presentation mode

Set the server environment variable **`PUBLIC_DEMO_MODE=true`** for the presentation. In Vercel, configure it for the intended environment and create a deployment that uses it; locally, restart `npm run dev:api` after setting it in `.env.local`. Do not use a `VITE_` prefix. No deployment was performed for this change.

Only the exact value `true` enables this exception. The session endpoint returns authenticated demo access before reading admin configuration, and library endpoints accept visitors without a cookie or login. Every visitor can upload, list, apply and delete library assets while enabled. Existing Supabase URL/server credentials remain required for storage operations; admin code/session-secret configuration is not required in this mode. Upload receipts remain signed using a domain-separated MAC with the existing server-only Supabase key. Storage, schema, signed URLs and same-origin checks remain unchanged.

Remove the flag or set it to `false` and restart/redeploy to restore the existing protected flow, including its admin configuration requirements. A session/API failure stays inside My Tiles with retry/close controls; the showroom, built-in materials and Floor Design remain available. Local fixture tests verified demo upload/library/Apply, recovery from a simulated session-function 500, and protected behavior with the flag off. These checks do not establish the cause of the reported live Vercel function failure or verify a deployed fix.

## 4. Local development

Use **Node 24** (the existing development environment uses 24.14.1). No global Vercel CLI or Supabase SDK is required.

Terminal A:

```bash
npm run dev:api
```

This loads `.env.local` using Node's native env-file support and starts a loopback-only API on **127.0.0.1:3001**. Restart it after server/environment changes. Terminal B:

```bash
npm run dev
```

Open Vite at its reported URL (normally localhost:5173). Vite proxies `/api` to port 3001 without changing the browser-origin Host. Plain Vite alone does not execute the production `api/` files. With no environment configured, the gate gives a setup error; demos still work.

The local Node adapter calls exactly the same server handlers as the Vercel entrypoints. It is not a mock backend. For platform-parity testing, the optional command **`npx vercel dev`** from the project root runs Vercel's local environment after linking the intended Vercel project. It can download the CLI and write `.vercel/`; it was not run in this session. Do not start both local API workflows on conflicting ports. No CLI global installation is necessary.

## 5. Vercel settings (manual; no deployment performed)

The frontend remains Vite on Vercel. Root `api/admin/*.ts` and `api/tile-assets/*.ts` export Web Request handlers for Vercel's Node runtime. No frontend framework rewrite or added runtime package is required. Helpers live under `server/`, outside the frontend entry graph.

In the existing Vercel project:

1. Use Framework Preset **Vite**, build **`npm run build`**, output **`dist`**.
2. Select Node **24.x** for native TypeScript/local parity.
3. Set the four server environment variables above in the desired environment(s). Keep preview and production access codes separate where practical. Do not use `VITE_` equivalents.
4. Ensure no broad SPA rewrite intercepts `/api/*` (this repository needs no such rewrite).
5. Configure a Vercel Firewall rate-limit rule for **POST `/api/admin/login`** before public use. The code has an eight-failure/15-minute **per-instance** limiter, not a distributed guarantee across serverless instances. A long random code remains essential.
6. Deploy only when explicitly authorized. Verify HTTPS API requests on the actual deployment; local `vite build` does not validate platform function routing.

## 6. Routes and session boundary

| Endpoint | Purpose |
|---|---|
| POST `/api/admin/login` | Verify one operator access code; issue session cookie |
| GET `/api/admin/session` | Check the cookie without exposing its contents |
| POST `/api/admin/logout` | Clear the operator cookie |
| POST `/api/tile-assets/upload-url` | Validate type/expected size; mint UUID path, signed upload URL and receipt |
| POST `/api/tile-assets` | Verify receipt and stored object; insert immutable mm metadata |
| GET `/api/tile-assets` | List saved metadata with temporary signed image access |
| DELETE `/api/tile-assets/:id` | Delete uploaded metadata/image; recover or report partial failure |

Session lifetime: **8 hours**, HttpOnly, Path=/api, SameSite=Strict, Secure on Vercel/production; local HTTP omits Secure. Sessions are HMAC signed and tied to current code/secret, not localStorage. There is no user database. State-changing JSON requests require an exact same Origin, and cross-site requests are rejected. Responses are `no-store`; request bodies are capped at 16 KB; upstream errors/credentials are never echoed.

Logout clears the browser's cookie and uploaded-library state; it does not centrally revoke a stolen stateless cookie. Rotate the code/secret to revoke all application sessions. Supabase signed image/upload URLs are bearer capabilities with independent lifetimes; locking the library does not revoke already issued URLs.

## 7. Upload, image preparation and physical scale

1. Unlock My Tiles with the operator code.
2. Add a JPEG/PNG/WebP (≤5,000,000 bytes), name, width/height in cm, material and finish.
3. Review the preview. Rotate 0/90/180/270 clockwise and optionally trim edges using the crop sliders. No image-editor dependency is installed.
4. Browser canvas crops the decoded source first, then rotates. Original source bytes are not retained; preparation metadata is history, not an editable source archive. The stored image already contains those transformations. `image_rotation`/`crop_data` record preparation history and are **not applied a second time** in the renderer. Rotation does not automatically swap entered physical dimensions.
5. Preparation caps the output long edge at 4096px; rejects input above 40 MP or 16,384px on a side; closes bitmaps and revokes preview URLs. Prepared images must still pass the 5 MB limit. The source filename is retained as metadata, while the canonical object name is generated.
6. The browser requests a signed upload URL, then **PUTs bytes directly to Supabase Storage** with no application credential and `credentials: omit`. Application functions handle JSON only. Confirmation reads Storage metadata and at most the first 32 image bytes for signature validation; it does not proxy the full upload.
7. Save verifies the stored MIME/size against the server-issued receipt and checks JPEG/PNG/WebP header bytes. This is a format-header check, not antivirus scanning or full server image decoding; browser preparation performs decoding.
8. Save stores dimensions as canonical millimeters (60 cm → 600 mm). Apply uses the compatibility adapter with `physicalSizeMm`, then converts mm → meters at the existing material boundary. A 600×600 mm tile repeats **10×11.6667** over the unchanged 6×7 m floor, not once across it.

Finish roughness mapping: **Polished 0.28; Satin 0.42; Honed 0.60; Matte 0.82**. This is representative, not calibrated. Existing grout shader behavior is preserved, with no engineering joint-width control or quantities. The Milestone 3 body/joint/pitch/seam/tolerance gate remains unresolved.

## 8. Library, privacy and recovery

- The small-library list uses the configured Data API row cap and has no pagination; introduce pagination if that cap becomes relevant. Saved metadata persists in Supabase; the selected room design/material is still session memory and resets on page reload. Reopen My Tiles after refresh to load saved tiles; this milestone does not add project persistence.
- List/open/Refresh returns new **one-hour** signed read URLs; database rows store only storage_path. Images are never permanent public URLs. The UI renews URLs periodically while the library component remains mounted and lists again on reopen.
- A signing/image decode/load failure is visible. Refresh library to renew access. Uploaded image failures never silently replace the image with procedural marble; built-in demos retain their fallback.
- Apply preloads the saved image; unavailable images disable Apply or report an error. Uploaded and built-in selections participate in the existing previous-product Compare.
- Cached source textures are immutable; each material clones maps before setting repeat/rotation and disposes its own clones. Old maps are not shown with new physical dimensions. Source cache is bounded to 24 entries and includes the image URL, so renewed/changed URLs can retry loading.
- Save retries reuse the same receipt/asset id. If a database response is uncertain, the server checks that id before reporting failure; an already saved row is returned rather than duplicated. A successfully uploaded image is retained for a metadata retry.
- Application upload receipts expire in **30 minutes**. Supabase's signed upload URL lifetime is currently **2 hours**. Abandoned uploads can leave private objects without metadata; periodically review old unreferenced paths in Storage. Do not automatically delete any object still referenced by tile_assets. Server termination between steps can also require operator cleanup.
- Delete asks for confirmation and accepts generated UUID ids only (never demos). It removes the database row first, then the Storage object. If Storage removal fails, it tries to restore metadata so Delete can be retried. If restoration also fails, the response supplies a signed, path-bound **8-hour cleanup receipt** and the UI retains it for retry. Retry before closing/reloading the library. If that capability is lost or expires, inspect Storage manually for the orphan; Postgres and Storage are not one atomic transaction.
- No folders, accounts, commercial Product/Variant/SKU editor, project save format, multiple simultaneous floor materials, patterns, zones, LayoutCompiler or 2D editor are included.

## 9. Verification and live acceptance

Local commands:

```bash
npx tsc -b
npm run lint
npm run build
npm test
# Direct runner also shows individual case names:
node tests/tileAssets.test.ts
```

Tests use a clearly isolated fixture under `tests/fixtures`; it is never imported by production APIs. They exercise session/CSRF, validation, signing/metadata/reload/delete, unit conversion, finish adaptation, idempotent retry, and partial-failure recovery. Browser fixture checks are not proof of live Supabase/Vercel operation.

After configuring a real project and explicitly deploying, verify: invalid access code; valid secure cookie; JPEG/PNG/WebP uploads; invalid MIME and >5 MB rejection; storage private/read URLs temporary; metadata survives browser refresh; exact 600 mm repeats; Apply/Compare/demo switching in all views; selected uploaded deletion resets safely; signed-read/save/delete errors; expired-session rejection; no secret in frontend bundles or application responses. Confirm the bucket's actual limits/permissions and Vercel routing. This is the remaining live acceptance gate.

## Official implementation references

- [Vercel Node runtime and root api handlers](https://vercel.com/docs/functions/runtimes/node-js)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel local development](https://vercel.com/docs/cli/dev)
- [Supabase current and legacy API key rules](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase signed uploads](https://supabase.com/docs/reference/javascript/file-buckets-createsigneduploadurl)
- [Storage REST endpoints](https://supabase.github.io/storage/)
- [Private bucket restrictions](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Temporary signed downloads](https://supabase.com/docs/guides/storage/serving/downloads)
