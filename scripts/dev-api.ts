/** Node 24 local adapter for the same Web Request handlers used on Vercel. */
import { createServer } from "node:http";
import { adminLogin, adminLogout, adminSession } from "../server/admin.ts";
import { tileAssets, uploadUrl, deleteTile } from "../server/tileAssets.ts";
import { json } from "../server/http.ts";
const routes = new Map([
  ["/api/admin/login", adminLogin], ["/api/admin/logout", adminLogout], ["/api/admin/session", adminSession],
  ["/api/tile-assets", tileAssets], ["/api/tile-assets/upload-url", uploadUrl],
]);
const port = Number(process.env.API_PORT || 3001);
createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `127.0.0.1:${port}`}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(",") : value);
    const init: RequestInit & { duplex?: string } = { method: req.method, headers };
    if (!["GET", "HEAD"].includes(req.method ?? "GET")) {
      // Node's Request accepts the incoming byte stream; body() enforces 16 KB.
      init.body = req as unknown as ReadableStream;
      init.duplex = "half";
    }
    const handler = routes.get(url.pathname) ?? (/^\/api\/tile-assets\/[^/]+$/.test(url.pathname) ? deleteTile : null);
    const response = handler ? await handler(new Request(url, init as RequestInit)) : json({ error: "API route not found." }, 404);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch { res.writeHead(500, { "Content-Type": "application/json" }); res.end('{"error":"Local API request failed."}'); }
}).listen(port, "127.0.0.1", () => console.log(`Local API: http://127.0.0.1:${port}`));
