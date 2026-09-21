import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { AdminEnv } from "./env.server";
import { authConfigured, adminEnv } from "./env.server";
import { ApiError, edgeCache } from "./http.server";
const encoder = new TextEncoder();
export const SESSION_SECONDS = 4 * 60 * 60;
function key(env: AdminEnv) {
  return encoder.encode(env.AUTH_SECRET + "|" + env.ADMIN_PASSWORD_HASH);
}
function cookieName(request: Request) {
  return new URL(request.url).protocol === "https:" ? "__Host-mr_admin" : "mr_admin";
}
export async function sessionToken(env: AdminEnv) {
  if (!authConfigured(env))
    throw new ApiError(503, "O acesso administrativo ainda não foi configurado.");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(env.ADMIN_EMAIL!.trim().toLowerCase())
    .setAudience("mr-memorie-admin")
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(SESSION_SECONDS + "s")
    .sign(key(env));
}
export async function verifySession(token: string, env: AdminEnv) {
  if (!authConfigured(env) || token.length > 3000) return false;
  try {
    const { payload } = await jwtVerify(token, key(env), {
      algorithms: ["HS256"],
      audience: "mr-memorie-admin",
      maxTokenAge: SESSION_SECONDS,
    });
    return payload.role === "admin" && payload.sub === env.ADMIN_EMAIL!.trim().toLowerCase();
  } catch {
    return false;
  }
}
export async function authenticated(request: Request, env: AdminEnv) {
  const name = cookieName(request) + "=";
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(name))
    ?.slice(name.length);
  return raw ? verifySession(raw, env) : false;
}
export async function requireAdmin(request: Request) {
  const env = await adminEnv();
  if (!(await authenticated(request, env)))
    throw new ApiError(401, "A sessão terminou. Inicie sessão novamente.");
  return env;
}
export function sessionCookie(request: Request, token: string, logout = false) {
  return (
    cookieName(request) +
    "=" +
    token +
    "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" +
    (logout ? 0 : SESSION_SECONDS) +
    (new URL(request.url).protocol === "https:" ? "; Secure" : "")
  );
}
export async function passwordMatches(email: string, password: string, env: AdminEnv) {
  if (!authConfigured(env))
    throw new ApiError(503, "O acesso administrativo ainda não foi configurado.");
  const valid = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH!);
  return valid && email.trim().toLowerCase() === env.ADMIN_EMAIL!.trim().toLowerCase();
}
export async function rateLimit(request: Request, env: AdminEnv) {
  const cache = edgeCache();
  if (!cache) {
    if (import.meta.env.DEV) return;
    throw new ApiError(503, "O acesso está temporariamente indisponível.");
  }
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const k = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.AUTH_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", k, encoder.encode(ip)));
  const id = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
  const window = Math.floor(Date.now() / 600000);
  const cacheKey = new Request(new URL("/__admin_limit/" + window + "/" + id, request.url));
  const old = await cache.match(cacheKey);
  const count = old ? Number(await old.text()) : 0;
  if (count >= 8)
    throw new ApiError(429, "Demasiadas tentativas. Aguarde 10 minutos antes de tentar novamente.");
  await cache.put(
    cacheKey,
    new Response(String(count + 1), { headers: { "Cache-Control": "public, max-age=600" } }),
  );
}
