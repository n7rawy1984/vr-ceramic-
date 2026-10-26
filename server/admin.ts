import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { HttpError, body, endpoint, json, sameOrigin } from "./http.ts";
const COOKIE = "tile_admin";
const SESSION_SECONDS = 8 * 60 * 60;
function config() {
  const code = process.env.ADMIN_ACCESS_CODE;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!code || code.length < 12 || !secret || Buffer.byteLength(secret) < 32) throw new HttpError(503, "Tile library access is not configured. See the setup guide.");
  return { code, secret };
}
function signature(payload: string) {
  const { secret, code } = config();
  return createHmac("sha256", secret).update(code).update("\0").update(payload).digest("base64url");
}
function equal(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}
export function sign(value: Record<string, unknown>, seconds: number) {
  const payload = Buffer.from(JSON.stringify({ ...value, exp: Math.floor(Date.now() / 1000) + seconds })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function verify(token: unknown, kind: string): Record<string, unknown> | null {
  if (typeof token !== "string" || token.length > 4096) return null;
  const [payload, mac, extra] = token.split(".");
  if (!payload || !mac || extra || !equal(mac, signature(payload))) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString());
    return value.kind === kind && Number.isInteger(value.exp) && value.exp > Date.now() / 1000 ? value : null;
  } catch { return null; }
}
function sessionToken(request: Request) {
  return request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
}
export function requireAdmin(request: Request) {
  sameOrigin(request);
  if (!verify(sessionToken(request), "session")) throw new HttpError(401, "Your access session has expired. Enter the access code again.");
}
function cookie(value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  return `${COOKIE}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
// Best-effort per-instance protection. Production distributed limits belong in
// Vercel Firewall; this is deliberately not an account/identity database.
const attempts = new Map<string, { count: number; until: number }>();
export const adminLogin = (request: Request) => endpoint(async () => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { Allow: "POST" });
  sameOrigin(request);
  const { code } = config();
  const key = createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local").digest("hex");
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  if (attempts.size >= 1000 && !attempts.has(key)) throw new HttpError(429, "Please wait before trying again.");
  const attempt = attempts.get(key) ?? { count: 0, until: now + 15 * 60_000 };
  if (attempt.count >= 8) return json({ error: "Too many attempts. Try again in 15 minutes." }, 429, { "Retry-After": "900" });
  const data = await body(request);
  if (typeof data.code !== "string" || data.code.length > 512 || !equal(data.code, code)) {
    attempt.count++;
    attempts.set(key, attempt);
    throw new HttpError(401, "Access code not recognized.");
  }
  attempts.delete(key);
  return json({ authenticated: true }, 200, { "Set-Cookie": cookie(sign({ kind: "session", nonce: randomUUID() }, SESSION_SECONDS), SESSION_SECONDS) });
});
export const adminSession = (request: Request) => endpoint(async () => {
  if (request.method !== "GET") return json({ error: "Method not allowed." }, 405, { Allow: "GET" });
  sameOrigin(request);
  config();
  return json({ authenticated: !!verify(sessionToken(request), "session") });
});
export const adminLogout = (request: Request) => endpoint(async () => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { Allow: "POST" });
  requireAdmin(request);
  return json({ authenticated: false }, 200, { "Set-Cookie": cookie("", 0) });
});
