# M10 — Optional AI Designer V1

AI Designer is an optional online planner alongside deterministic offline Auto Design. Current project geometry and semantic state remain authoritative: AI returns supported design choices, never a room image or mesh as the project. Reference imagery is inspiration only. No chat, generated artwork, custom geometry, cloud projects, accounts, Supabase integration or web-search tool was added.

## Request and application flow

`Current applied room + selected material candidates + optional request/style/images → AIPlanner → isolated endpoint → AIProvider / OpenAIResponsesProvider → strict version-1 plan → LocalRulePlanner semantic resolution → existing geometry validation → review → existing atomic Apply / Undo`.

AIPlanner implements the existing `DesignPlanner` interface. Its provider transport makes one POST, with no retries, capability probes or startup requests. A strict AI plan chooses a supported Minimal/Luxury/Bold rule family, strength, material role candidate IDs, supported floor/Center/Frame/wall/ceiling/lighting/furniture preferences, summary, warnings and rationale. Auto/Minimal/Luxury/Bold/Modern/Contemporary are available as style intent; Modern/Contemporary mood maps to an existing rule family rather than introducing a second rendering system.

Candidate keys map to actual selected variant IDs and exact effective project assignments. A variant may have its library body and separate current project-size candidates. The payload includes display name, Tile/Slab kind, effective mm body, override, finish and estimated image quality. The model cannot invent a material, change physical dimensions, create openings or request new geometry capabilities. Server and client validate the version, exact keys, enum values, text bounds and known candidate references independently.

Current room context comes from the applied stores, not a previous proposal. It includes real dimensions, current semantic finishes, architecture and lighting; the endpoint derives door/window opening rectangles with the same wall-surface function as the application. Provenance, previous material history, compiler placements, meshes, image source URLs and artwork ownership IDs are excluded. An assigned decorative panel is described by existence/name/shape/size. Its embedded project snapshot remains local.

Captured Preserve switches are authoritative at both planning and transaction boundaries. Known manually modified systems and an assigned panel's Floor preserve by default. Other systems can be proposed for redesign. Whole-Walls preservation remains the V1 limit. Unlocking Floor explicitly permits replacing its normal Center/panel; AI never creates a new panel. Explicit non-Auto preferences and named supported style choices override contrary AI choices with disclosure. The existing local compatibility checks visibly repair incompatible Checker/Modular/Slab requests to Straight or omit unsuitable Center/Frame choices. Unknown IDs, unsupported fields/capabilities, malformed results and unsafe geometry fail without room mutation.

AI previews validate only changed surfaces and retain prepared results. They do not publish scene state or dirty the project. Apply reuses those results, adds normalized local provenance and publishes through the same batched transaction as Auto Design. Unchanged semantic references/results are shared, preserving floor/panel/wall buffers. Local Auto Design previews retain their existing zero-geometry-compilation behavior. One-level Undo restores the complete immediate prior room and provenance. Project/material changes, guidance edits and cancellation invalidate pending or reviewed proposals.

## UX and isolation

The separate **🤖 AI Designer** button is unavailable when the build capability is off. Enabled users can enter an optional request, select style intent and material variants, add images, reuse Guided preferences and choose five Preserve switches. Generate shows **Designing…**, allows Cancel, and returns an **AI Design Proposal** with actual finishes, material-role usage, preserved systems, warnings and separate informational rationale. Rendering consumes only the semantic decision. Guidance edits remove stale previews; fresh matching-room results disable Apply. Provider failures offer **Use Auto Design instead**, which switches only on explicit user action.

Without configuration, connectivity or backend availability, My Tiles, Projects, Floor/Wall Design, local Guided/Adjust, room settings and panels remain local. There is no AI request at startup, Save/Open/Duplicate or local generation. AI error/timeout/rate-limit messages contain no provider internals or stack traces. Applied AI designs reopen offline without contacting AI. There is no AI UX in XR; the resulting shared room state follows the existing scene and XR lifecycle.

## Images and privacy

The UI explicitly states that selected imagery will be sent to the AI service. An image-consent checkbox is required for each image-bearing Generate action and resets afterward. Selecting files or editing controls transmits nothing. Images are temporary context, not geometry or new library assets.

Up to three JPG/PNG/WebP references, each at most 5 MB, are accepted. Input decoding rejects dimensions above 40 megapixels or 16,384 pixels per side. At transmission, images are re-encoded into temporary JPEG derivatives preserving aspect ratio, capped at 1024 pixels per side and 180 KB each. Up to six selected material variants can include prepared source imagery; multiple effective-size candidates share the same variant visual. Variant mirror/rotation transforms are applied only to the derivative. Built-in unavailable photographs use the same procedural swatch family as the room and are disclosed as procedural, not product photographs.

Original source Blobs, prepared library pixels, variants and project assets are never overwritten or re-saved. Temporary canvases and ImageBitmaps are released; no analysis object URLs, textures or asset records are created. Source images/reference names, data URLs, request text and rationale are not persisted in project documents. Only semantic intent, generated-by metadata, provider/model/version, application timestamp and existing subsystem baselines are saved locally. Old provenance remains compatible; project schema stays 6 and IndexedDB stays v4.

The server processes requests transiently and does not log/store project bodies, imagery or conversations. Responses requests use `store:false` and no conversation IDs. This is not a claim about the provider's independent abuse-monitoring or retention policies.

## Endpoint and deployment configuration

One deployed endpoint: **POST `/api/ai-design`**, separate from the retained legacy tile endpoints. OpenAI-specific REST code, fixed URL, authentication, versioned instructions and Responses extraction live in `server/ai/openai.ts`. No Assistants API, arbitrary URL forwarding or model supplied by the client is accepted. The provider uses Responses Structured Outputs with strict `text.format`, no tools, at most 3000 output tokens and optional `input_image` data URLs. See the official [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) and [image-input documentation](https://developers.openai.com/api/docs/guides/images-vision).

Required Vercel variables, **only when explicitly enabling AI**:

| Variable | Value / scope |
|---|---|
| `AI_DESIGN_ENABLED` | Exact `true` at build and runtime to enable. Default `false`; redeploy/rebuild after changing. |
| `OPENAI_API_KEY` | Real provider key, server-only; never a `VITE_` variable. |
| `OPENAI_MODEL` | Account-available model supporting Responses, image input and strict Structured Outputs. No model default is hardcoded. |

Vite injects only a boolean derived from `AI_DESIGN_ENABLED`; it never exposes the key or model environment variable. The server independently checks configuration on every request, so an enabled client cannot bypass a disabled backend. No production environment, provider account or deployment is modified by implementation/testing. `.env.example` contains placeholders only.

Local development uses the existing `npm run dev:api` adapter and Vite proxy. `API_PORT` selects the API server port; optional `LOCAL_API_PORT` selects the Vite dev/preview proxy port (default 3001). This proxy setting is development tooling, not an AI provider URL or a production requirement. The controlled test fixture uses port 5411 to avoid the user's existing API server.

## Request controls and remaining abuse risk

The endpoint enforces same-origin POST JSON, streaming body limits of 2.5 MB, 12 candidates, three reference/six material images, JPEG-only data URLs and actual JPEG header dimension/byte checks. Remote image URLs are rejected. Browser transport has a 55-second ceiling; server body/provider processing has a 40-second timeout with abort propagation. Client cancellation prevents publication even if an upstream request cannot be stopped by a hosting runtime. Output is bounded and refusal/incomplete/malformed responses are rejected safely.

Per warm server instance: five attempts per IP per ten minutes, thirty total per hour, at most two concurrent requests, and a bounded 512-entry IP map. Invalid requests consume attempts. No automatic retry multiplies paid calls. These are basic best-effort controls, not authentication or a distributed spending cap. Same-origin headers can be forged by non-browser clients; serverless instances/restarts and IP changes can bypass per-instance limits. Before public enablement, configure Vercel Firewall/rate controls and provider project budgets/alerts. M10 does not create an account system or durable quota database. AI remains disabled by default.

## Verification

`tests/aiDesigner.test.ts` covers context/privacy/overrides/openings, strict results and known IDs, repairs, locks/panels, shared prepare/apply/undo, local provenance round trips, stale/cancel guards, Responses requests/images/store:false, refusal/incomplete/provider errors, request controls, rate limits/concurrency, streaming limits and timeouts. `tests/fixtures/aiDesignServer.ts` substitutes only the upstream Responses transport and never contacts OpenAI. It is not imported by production code.

`tests/browser/ai-designer.mjs` exercises actual controls through that endpoint/provider adapter: text-only and visual proposals, consent, analysis limits, original sources, current complex floor/custom light locks, atomic Apply/Undo, panel identity, Save/Duplicate/reopen with API blocked, local offline Adjust, provider errors/cancel and deliberate fallback. A controlled build injects a fake server secret/model and scans client assets for leakage. Final output is rebuilt with AI disabled. Live provider quality is a separate acceptance step requiring an explicitly configured model/key; fixture results must not be described as live AI quality acceptance.

### Verified local results — 2026-10-28

TypeScript/production builds, zero-warning lint and all 17 native test files pass; the new AI file contains 13 passing cases. Controlled dev and production browser workflows passed text-only generation, one reference plus five material derivatives (largest controlled derivative 12,406 bytes), per-request image consent, original source SHA-256 equality, exact complex Modular floor/custom 55% lighting locks, proposal-first state, Apply/Undo, panel snapshot/geometry/UV/texture identity, duplication and reopening with API blocked. Unknown IDs, unsupported output, malformed JSON, provider errors/rate limits, timeouts, cancellation and deliberate offline local fallback passed. Each online Generate action made one POST; non-AI actions made zero API requests. No real OpenAI call was made because no live key/model is configured.

Dev profiling measured one wall/LayoutCompiler call and zero floor/panel compiler calls or mesh buffer builds while validating the locked-floor AI preview. Apply reused preparation with zero compiler calls; only affected wall buffers changed. Panel-preserving Undo required zero floor/panel compilation. Existing Guided regression retained zero lighting-only compiler/buffer/image work, one coherent publication, one affected wall compile, exact Modular/four-wall/light preservation, full Undo, form reset and persistence. Both AI-applied XR emulator cycles with a panel/Slab preserved state and buffers and ended at 11 subscribers, zero inputs, one canvas and 274 placements; one existing SDK offer-supersession notice was recorded, with no application exception.

The controlled AI-enabled build and the final AI-disabled build both passed client-asset scans for an injected fake server secret, model value and private environment references. The final production-preview check ran in a fresh Chrome process retaining the saved AI project, with the test AI backend stopped: AI stayed visibly disabled, the panel restored, local Adjust worked offline, and API/runtime error counts were zero. Final `dist` is rebuilt with `AI_DESIGN_ENABLED=false`. The user's existing port 3001 server was left untouched. All isolated test servers/browser processes were stopped. The existing build chunk-size advisory remains. These are local software-WebGL/controlled-provider results, not deployment, live model quality or Quest hardware acceptance.

### File inventory

- `api/ai-design.ts`, `server/aiDesign.ts`, `server/ai/openai.ts`: endpoint, request protection, Responses provider/instructions.
- `src/aiDesign/{capability,protocol,planner,images}.ts`: safe capability, bounded schemas/context, AIPlanner/HTTP transport and temporary derivatives.
- `src/autoDesign/{model,session,provenance}.ts`: compatible planning metadata, prepared proposal reuse and optional local AI provenance.
- `src/ui/AutoDesign.tsx`, `src/App.css`: separate AI entry/form and shared proposal/preserve/apply/undo UI.
- `.env.example`, `vite.config.ts`, `scripts/dev-api.ts`: placeholders, boolean-only build capability and isolated local routing/cancellation.
- `tests/aiDesigner.test.ts`, `tests/fixtures/aiDesignServer.ts`, `tests/browser/{ai-designer,ai-disabled,auto-design-xr}.mjs`: security/protocol/transaction, provider fixture, production/offline and AI-applied XR checks.
- `docs/AI_DESIGNER.md`, `PROJECT_MASTER_REFERENCE.md`: contract, limits, verification and deployment requirements.
