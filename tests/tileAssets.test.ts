import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { adminLogin, adminLogout, adminSession, sign, verify, requireAdmin } from "../server/admin.ts";
import { tileAssets, uploadUrl, deleteTile } from "../server/tileAssets.ts";
import { createSupabaseFixture } from "./fixtures/supabaseFixture.ts";
import { cmToMm, mmToM } from "../src/utils/units.ts";
import { tileToProduct } from "../src/tiles/materialAdapter.ts";
import { validCrop, validDimensionMm, type TileAssetView } from "../shared/tileAsset.ts";
const fixture = createSupabaseFixture();
const nativeFetch = globalThis.fetch;
const previousEnv = { ...process.env };
const origin = "http://tile.test";
const code = "fixture-access-code-please-do-not-use";
let cookie = "";
const image = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
function request(path: string, method = "GET", data?: unknown, options: { cookie?: string; origin?: string; ip?: string } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", Origin: options.origin ?? origin, Cookie: options.cookie ?? cookie };
  if (options.ip) headers["x-forwarded-for"] = options.ip;
  return new Request(`${origin}/api/${path}`, { method, headers, body: data === undefined ? undefined : JSON.stringify(data) });
}
async function reserve(bytes = image, mime = "image/png") {
  const response = await uploadUrl(request("tile-assets/upload-url", "POST", { mimeType: mime, fileSize: bytes.length, filename: "../../source.png" }));
  assert.equal(response.status, 200);
  const value = await response.json() as { uploadUrl: string; uploadReceipt: string };
  const uploaded = await fixture.fetch(new Request(value.uploadUrl, { method: "PUT", headers: { "Content-Type": mime }, body: bytes }));
  assert.equal(uploaded.status, 200);
  return value.uploadReceipt as string;
}
async function save(receipt: string, extra: Record<string, unknown> = {}) {
  return tileAssets(request("tile-assets", "POST", { uploadReceipt: receipt, name: "Uploaded Stone", widthMm: 600, heightMm: 1200, materialType: "Marble", finish: "honed", imageRotation: 90, cropData: null, ...extra }));
}
before(async () => {
  Object.assign(process.env, { ADMIN_ACCESS_CODE: code, ADMIN_SESSION_SECRET: "fixture-session-secret-at-least-32-characters", SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_SECRET_KEY: fixture.secret });
  delete process.env.NODE_ENV; delete process.env.VERCEL; delete process.env.PUBLIC_DEMO_MODE;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => fixture.fetch(input instanceof Request ? input : new Request(input, init))) as typeof fetch;
  const logged = await adminLogin(request("admin/login", "POST", { code }));
  cookie = logged.headers.get("set-cookie")!.split(";")[0];
});
after(() => { globalThis.fetch = nativeFetch; process.env = previousEnv; });
test("gate rejects invalid code, cross-origin writes, missing and expired sessions", async () => {
  assert.equal((await adminLogin(request("admin/login", "POST", { code: "wrong" }))).status, 401);
  assert.equal((await adminLogin(request("admin/login", "POST", { code }, { origin: "https://evil.test" }))).status, 403);
  assert.equal((await tileAssets(request("tile-assets", "GET", undefined, { cookie: "" }))).status, 401);
  assert.equal((await tileAssets(request("tile-assets", "GET", undefined, { cookie: `tile_admin=${sign({ kind: "session" }, -1)}` }))).status, 401);
  const tampered = cookie.slice(0, -1) + (cookie.endsWith("a") ? "b" : "a");
  assert.equal((await tileAssets(request("tile-assets", "GET", undefined, { cookie: tampered }))).status, 401);
});
test("production cookie is HttpOnly, Secure, Strict, eight hours; logout clears it", async () => {
  process.env.NODE_ENV = "production";
  const response = await adminLogin(request("admin/login", "POST", { code }));
  const value = response.headers.get("set-cookie")!;
  assert.match(value, /HttpOnly/); assert.match(value, /Secure/); assert.match(value, /SameSite=Strict/); assert.match(value, /Max-Age=28800/);
  delete process.env.NODE_ENV;
  assert.equal(((await (await adminSession(request("admin/session"))).json()) as { authenticated: boolean }).authenticated, true);
  assert.match((await adminLogout(request("admin/logout", "POST", {}))).headers.get("set-cookie")!, /Max-Age=0/);
});
test("login attempts are bounded per instance", async () => {
  for (let i = 0; i < 8; i++) assert.equal((await adminLogin(request("admin/login", "POST", { code: "wrong" }, { ip: "192.0.2.12" }))).status, 401);
  assert.equal((await adminLogin(request("admin/login", "POST", { code }, { ip: "192.0.2.12" }))).status, 429);
});
test("reject invalid MIME/size, arbitrary receipts and non-upload ids", async () => {
  for (const data of [{ mimeType: "image/svg+xml", fileSize: 100 }, { mimeType: "image/png", fileSize: 5_000_001 }, { mimeType: "image/png", fileSize: 0 }]) assert.equal((await uploadUrl(request("tile-assets/upload-url", "POST", data))).status, 400);
  assert.equal((await save("tiles/../../evil.png")).status, 400);
  assert.equal((await deleteTile(request("tile-assets/ceramic-01", "DELETE", {}))).status, 400);
  const receipt = await reserve();
  for (const extra of [{ name: " " }, { widthMm: -1 }, { heightMm: 0 }, { widthMm: "600" }, { finish: "metallic" }, { imageRotation: 45 }, { cropData: { x: 2, y: 0, width: 1, height: 1 } }]) assert.equal((await save(receipt, extra)).status, 400);
});
test("signed upload → persistent mm metadata → reload/signed read → apply adapter → delete", async () => {
  const receipt = await reserve();
  const response = await save(receipt);
  assert.equal(response.status, 201);
  const { tile } = await response.json() as { tile: TileAssetView };
  assert.equal(tile.width_mm, 600); assert.equal(tile.height_mm, 1200); assert.equal(tile.source_filename, "source.png");
  assert.match(tile.storage_path, /^tiles\/[0-9a-f-]{36}\.png$/); assert.ok(tile.imageUrl?.includes("/object/sign/"));
  assert.equal(fixture.tiles.get(tile.id)!.imageUrl, undefined);
  const reload = await (await tileAssets(request("tile-assets"))).json() as { tiles: TileAssetView[] };
  assert.equal(reload.tiles[0].id, tile.id);
  assert.notEqual(reload.tiles[0].imageUrl, tile.imageUrl);
  const product = tileToProduct(tile);
  assert.equal(6 / mmToM(product.physicalSizeMm!.width), 10); assert.equal(7 / mmToM(product.physicalSizeMm!.height), 7 / 1.2);
  assert.equal(product.roughnessValue, 0.6); assert.equal(product.textureRotationDeg, 0);
  assert.equal((await save(receipt)).status, 200); assert.equal(fixture.tiles.size, 1);
  assert.equal((await deleteTile(request(`tile-assets/${tile.id}`, "DELETE", {}))).status, 200);
  assert.ok(!fixture.tiles.has(tile.id)); assert.ok(!fixture.files.has(tile.storage_path));
});
test("stored byte signature, size and MIME are verified, not trusted from the browser", async () => {
  const receipt = await reserve(new TextEncoder().encode("<svg></svg>"));
  assert.equal((await save(receipt)).status, 400);
  const second = await reserve();
  const path = [...fixture.files.keys()].at(-1)!;
  fixture.files.get(path)!.mime = "image/jpeg";
  assert.equal((await save(second)).status, 400);
});
test("metadata failure is retryable without reupload; read signing failure is explicit", async () => {
  const receipt = await reserve(); fixture.faults.insert = true;
  assert.equal((await save(receipt)).status, 502); fixture.faults.insert = false;
  fixture.faults.read = true;
  const { tile } = await (await save(receipt)).json() as { tile: TileAssetView };
  assert.equal(tile.imageUrl, null); assert.ok(tile.imageError);
  fixture.faults.read = false;
  await deleteTile(request(`tile-assets/${tile.id}`, "DELETE", {}));
});
test("delete restores metadata on Storage failure and supports signed cleanup after failed restoration", async () => {
  const { tile } = await (await save(await reserve())).json() as { tile: TileAssetView };
  fixture.faults.remove = true;
  let response = await deleteTile(request(`tile-assets/${tile.id}`, "DELETE", {}));
  assert.equal(response.status, 502); assert.ok(fixture.tiles.has(tile.id));
  fixture.faults.insert = true;
  response = await deleteTile(request(`tile-assets/${tile.id}`, "DELETE", {}));
  const failure = await response.json() as { cleanupPending: boolean; cleanupReceipt: string };
  assert.equal(failure.cleanupPending, true); assert.ok(failure.cleanupReceipt); assert.ok(!fixture.tiles.has(tile.id));
  fixture.faults.insert = fixture.faults.remove = false;
  response = await deleteTile(request(`tile-assets/${tile.id}`, "DELETE", { cleanupReceipt: failure.cleanupReceipt }));
  assert.equal(response.status, 200); assert.ok(!fixture.files.has(tile.storage_path));
});
test("secrets stay on upstream headers, current secret is not sent as Bearer; responses never echo it", async () => {
  const response = await tileAssets(request("tile-assets"));
  assert.ok(!(await response.text()).includes(fixture.secret));
  const call = fixture.calls.find(c => c.url === "/rest/v1/tile_assets")!;
  assert.equal(call.headers.get("apikey"), fixture.secret); assert.equal(call.headers.get("authorization"), null);
  fixture.faults.signUpload = true;
  assert.equal((await uploadUrl(request("tile-assets/upload-url", "POST", { mimeType: "image/png", fileSize: 10 }))).status, 502);
  fixture.faults.signUpload = false;
});
test("central unit and crop validators enforce the persistence boundary", () => {
  assert.equal(cmToMm(60), 600); assert.equal(mmToM(600), 0.6);
  assert.ok(validDimensionMm(600.125)); assert.ok(!validDimensionMm(Infinity)); assert.ok(!validDimensionMm(0));
  assert.ok(validCrop({ x: 0.1, y: 0, width: 0.9, height: 1 })); assert.ok(!validCrop({ x: -1, y: 0, width: 1, height: 1 }));
});
test("legacy service-role fallback stays server-side and uses Bearer only for the legacy JWT", async () => {
  const prior = globalThis.fetch;
  const key = process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fixture-legacy-jwt";
  let observed: Headers | null = null;
  globalThis.fetch = (async (_input: unknown, init?: RequestInit) => { observed = new Headers(init?.headers); return Response.json([]); }) as typeof fetch;
  try {
    const response = await tileAssets(request("tile-assets"));
    assert.equal(response.status, 200);
    assert.equal(observed!.get("apikey"), "fixture-legacy-jwt");
    assert.equal(observed!.get("authorization"), "Bearer fixture-legacy-jwt");
    assert.ok(!(await response.text()).includes("fixture-legacy-jwt"));
  } finally { globalThis.fetch = prior; process.env.SUPABASE_SECRET_KEY = key; delete process.env.SUPABASE_SERVICE_ROLE_KEY; }
});


test("public demo session/guards bypass missing admin configuration before reading cookies or secrets", async () => {
  const prior={...process.env};
  try {
    process.env.PUBLIC_DEMO_MODE="true";
    for(const key of ["ADMIN_ACCESS_CODE","ADMIN_SESSION_SECRET","SUPABASE_SECRET_KEY","SUPABASE_SERVICE_ROLE_KEY"])delete process.env[key];
    const response=await adminSession(request("admin/session","GET",undefined,{cookie:"tile_admin=malformed.token"}));
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{authenticated:true,demoMode:true});
    assert.equal(response.headers.get("cache-control"),"no-store");assert.equal(response.headers.get("set-cookie"),null);
    assert.doesNotThrow(()=>requireAdmin(request("tile-assets","GET",undefined,{cookie:""})));
    assert.equal((await adminLogin(request("admin/login","POST",undefined,{cookie:""}))).status,200);
    assert.equal((await adminLogout(request("admin/logout","POST",{}, {cookie:""}))).status,200);
    assert.equal((await uploadUrl(request("tile-assets/upload-url","POST",{}, {cookie:"",origin:"https://evil.test"}))).status,403);
  } finally {process.env=prior;}
});

test("public demo supports signed upload/list/apply adapter/delete without login or admin keys; protected mode rejects demo receipts", async () => {
  const prior={...process.env},previousCookie=cookie;let receipt="";
  try {
    process.env.PUBLIC_DEMO_MODE="true";delete process.env.ADMIN_ACCESS_CODE;delete process.env.ADMIN_SESSION_SECRET;cookie="";
    receipt=await reserve();const response=await save(receipt);assert.equal(response.status,201);
    const {tile}=await response.json() as {tile:TileAssetView};assert.equal(tileToProduct(tile).physicalSizeMm!.width,600);
    assert.equal((await tileAssets(request("tile-assets"))).status,200);assert(tile.imageUrl);
    assert.equal((await deleteTile(request(`tile-assets/${tile.id}`,"DELETE",{}))).status,200);
    assert(!fixture.tiles.has(tile.id));assert(!fixture.files.has(tile.storage_path));
  } finally {process.env=prior;cookie=previousCookie;}
  assert.equal(verify(receipt,"upload"),null,"Demo receipts cannot cross into protected mode");
  assert.equal((await tileAssets(request("tile-assets","GET",undefined,{cookie:""}))).status,401);
});

test("only exact true enables public demo; absent/false preserve protected login/session flow", async () => {
  const prior={...process.env};
  try {
    for(const flag of [undefined,"false","TRUE","1",""]){
      if(flag===undefined)delete process.env.PUBLIC_DEMO_MODE;else process.env.PUBLIC_DEMO_MODE=flag;
      assert.deepEqual(await (await adminSession(request("admin/session","GET",undefined,{cookie:""}))).json(),{authenticated:false});
      assert.equal((await tileAssets(request("tile-assets","GET",undefined,{cookie:""}))).status,401);
      assert.equal((await adminLogin(request("admin/login","POST",{code:"wrong"},{ip:`test-${flag}`}))).status,401);
    }
  } finally {process.env=prior;}
});
