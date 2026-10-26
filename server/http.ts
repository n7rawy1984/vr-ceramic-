export class HttpError extends Error {
  status: number;
  details: Record<string, unknown>;
  constructor(status: number, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers: {
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", ...headers,
  } });
}
export async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new HttpError(415, "Send JSON metadata.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing request data.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 16_384) { await reader.cancel(); throw new HttpError(413, "Metadata request is too large."); }
    chunks.push(value);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw Error();
    return parsed;
  } catch { throw new HttpError(400, "Invalid JSON metadata."); }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== new URL(request.url).origin) ||
      (request.method !== "GET" && !origin)) throw new HttpError(403, "Use this application to make the request.");
}
export async function endpoint(run: () => Promise<Response>) {
  try { return await run(); }
  catch (error) {
    if (error instanceof HttpError) return json({ error: error.message, ...error.details }, error.status);
    // Never echo upstream errors, URLs, environment values, or signing tokens.
    return json({ error: "The service is temporarily unavailable. Please retry." }, 503);
  }
}
