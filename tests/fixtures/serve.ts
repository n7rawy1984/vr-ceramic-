/** Run only for browser tests; in-memory Supabase-compatible fixture. */
import { createServer } from "node:http";
import { createSupabaseFixture } from "./supabaseFixture.ts";
const fixture = createSupabaseFixture();
createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = new Request(`http://127.0.0.1:54329${req.url}`, {
    method: req.method, headers: req.headers as Record<string, string>,
    body: ["GET", "HEAD"].includes(req.method!) ? undefined : Buffer.concat(chunks),
  });
  const response = await fixture.fetch(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(54329, "127.0.0.1", () => console.log("TEST fixture only: http://127.0.0.1:54329"));
