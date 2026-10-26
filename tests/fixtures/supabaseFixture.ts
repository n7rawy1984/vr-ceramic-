/** Test-only Storage/PostgREST fixture. Never imported by application APIs. */
import { randomUUID } from "node:crypto";
export function createSupabaseFixture() {
  const tiles = new Map<string, Record<string, unknown>>();
  const files = new Map<string, { bytes: Uint8Array; mime: string }>();
  const signed = new Map<string, string>();
  const calls: { url: string; method: string; headers: Headers }[] = [];
  const faults = { insert: false, remove: false, read: false, signUpload: false };
  const secret = "sb_secret_fixture_server_only";
  async function fetchFixture(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS", "Access-Control-Allow-Headers": "content-type,x-upsert" };
    const json = (value: unknown, status = 200) => Response.json(value, { status, headers: cors });
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    calls.push({ url: url.pathname, method, headers: new Headers(request.headers) });
    if (method === "PUT" && path.startsWith("/storage/v1/object/upload/sign/tile-assets/")) {
      const object = path.split("/tile-assets/")[1];
      if (signed.get(url.searchParams.get("token") ?? "") !== object || files.has(object)) return json({ error: "Invalid upload" }, 403);
      const bytes = new Uint8Array(await request.arrayBuffer());
      const mime = request.headers.get("content-type") ?? "";
      if (bytes.length > 5_000_000 || !["image/jpeg", "image/png", "image/webp"].includes(mime)) return json({ error: "Bucket restriction" }, 413);
      files.set(object, { bytes, mime }); return json({ Key: `tile-assets/${object}` });
    }
    if (method === "GET" && path.startsWith("/storage/v1/object/sign/tile-assets/")) {
      const object = path.split("/tile-assets/")[1];
      const file = files.get(object);
      if (!file || signed.get(url.searchParams.get("token") ?? "") !== object) return json({ error: "Invalid read" }, 404);
      return new Response(new Uint8Array(file.bytes).buffer, { headers: { ...cors, "Content-Type": file.mime } });
    }
    if (request.headers.get("apikey") !== secret) return json({ error: "Elevated key required" }, 403);
    if (path === "/rest/v1/tile_assets") {
      const id = url.searchParams.get("id")?.replace(/^eq\./, "");
      if (method === "GET") return json([...tiles.values()].filter(t => !id || t.id === id));
      if (method === "POST") {
        if (faults.insert) return json({ error: "Fixture insert failure" }, 500);
        const value = await request.json() as Record<string, unknown>;
        if (tiles.has(value.id as string)) return json({ error: "Duplicate" }, 409);
        const row = { created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...value };
        tiles.set(value.id as string, row); return json([row], 201);
      }
      if (method === "DELETE") { const row = tiles.get(id!); tiles.delete(id!); return json(row ? [row] : []); }
    }
    if (method === "POST" && path.startsWith("/storage/v1/object/upload/sign/tile-assets/")) {
      if (faults.signUpload) return json({ error: "Sign failed" }, 500);
      const object = path.split("/tile-assets/")[1], token = randomUUID();
      signed.set(token, object);
      return json({ url: `/object/upload/sign/tile-assets/${object}?token=${token}` });
    }
    if (method === "POST" && path.startsWith("/storage/v1/object/sign/tile-assets/")) {
      if (faults.read) return json({ error: "Sign read failed" }, 500);
      const object = path.split("/tile-assets/")[1], token = randomUUID();
      signed.set(token, object);
      return json({ signedURL: `/object/sign/tile-assets/${object}?token=${token}` });
    }
    if (method === "GET" && path.startsWith("/storage/v1/object/info/tile-assets/")) {
      const file = files.get(path.split("/tile-assets/")[1]);
      return file ? json({ size: file.bytes.length, content_type: file.mime }) : json({ error: "Missing" }, 404);
    }
    if (method === "GET" && path.startsWith("/storage/v1/object/tile-assets/")) {
      const file = files.get(path.split("/tile-assets/")[1]);
      return file ? new Response(new Uint8Array(file.bytes.slice(0, 32)).buffer, { status: 206, headers: { "Content-Type": file.mime } }) : json({ error: "Missing" }, 404);
    }
    if (method === "DELETE" && path === "/storage/v1/object/tile-assets") {
      if (faults.remove) return json({ error: "Delete failed" }, 500);
      const { prefixes } = await request.json() as { prefixes: string[] };
      for (const object of prefixes) files.delete(object);
      return json([]);
    }
    return json({ error: "Fixture route not found" }, 404);
  }
  return { tiles, files, calls, faults, secret, fetch: fetchFixture };
}
