import { describe, test, expect } from "bun:test";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import {
  sessionToken,
  verifySession,
  authenticated,
  sessionCookie,
  passwordMatches,
  rateLimit,
} from "./auth.server";
import { authConfigured } from "./env.server";
import { sameOrigin, readLimited, readJson } from "./http.server";
import { verifyImage } from "./upload.server";
import { contentSchema } from "./content-schema";
import defaults from "../../data/content.json";
const env = {
  ADMIN_EMAIL: "owner@example.test",
  ADMIN_PASSWORD_HASH: await bcrypt.hash("Test-only-password-2026!", 10),
  AUTH_SECRET: "test-only-secret-".repeat(4),
};
describe("administrator security", () => {
  test("requires a configured hash, secret and single email", () => {
    expect(authConfigured({})).toBe(false);
    expect(authConfigured({ ...env, ADMIN_PASSWORD_HASH: "plain" })).toBe(false);
    expect(authConfigured(env)).toBe(true);
  });
  test("checks bcrypt and the only allowed identity", async () => {
    expect(await passwordMatches(env.ADMIN_EMAIL, "Test-only-password-2026!", env)).toBe(true);
    expect(await passwordMatches("other@example.test", "Test-only-password-2026!", env)).toBe(
      false,
    );
    expect(await passwordMatches(env.ADMIN_EMAIL, "wrong", env)).toBe(false);
  });
  test("rejects forged, expired and rotated sessions", async () => {
    const token = await sessionToken(env);
    expect(await verifySession(token, env)).toBe(true);
    expect(await verifySession(token + "forged", env)).toBe(false);
    expect(await verifySession(token, { ...env, AUTH_SECRET: "changed".repeat(8) })).toBe(false);
    expect(
      await verifySession(token, {
        ...env,
        ADMIN_PASSWORD_HASH: await bcrypt.hash("different", 10),
      }),
    ).toBe(false);
    const expired = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(env.ADMIN_EMAIL)
      .setAudience("mr-memorie-admin")
      .setIssuedAt(1)
      .setExpirationTime(2)
      .sign(new TextEncoder().encode(env.AUTH_SECRET + "|" + env.ADMIN_PASSWORD_HASH));
    expect(await verifySession(expired, env)).toBe(false);
  });
  test("cookies are HttpOnly and Secure over HTTPS; logout expires them", async () => {
    const req = new Request("https://example.test/admin");
    const token = await sessionToken(env);
    const cookie = sessionCookie(req, token);
    expect(cookie).toContain("__Host-mr_admin=");
    expect(cookie).toContain("; HttpOnly; SameSite=Lax;");
    expect(cookie).toContain("; Secure");
    expect(sessionCookie(req, "", true)).toContain("Max-Age=0");
    expect(await authenticated(new Request(req, { headers: { Cookie: cookie } }), env)).toBe(true);
    expect(await authenticated(req, env)).toBe(false);
  });
  test("rejects foreign and absent origins", () => {
    const req = (headers: HeadersInit) =>
      new Request("https://example.test/api/admin/publish", { headers });
    expect(() => sameOrigin(req({ Origin: "https://evil.test", "X-MR-Admin": "1" }))).toThrow();
    expect(() => sameOrigin(req({}))).toThrow();
    expect(() =>
      sameOrigin(req({ Origin: "https://example.test", "X-MR-Admin": "1" })),
    ).not.toThrow();
  });
  test("bounded bodies reject size violations and invalid JSON", async () => {
    await expect(
      readLimited(new Request("https://test", { method: "POST", body: "abcd" }), 3),
    ).rejects.toThrow();
    await expect(
      readJson(
        new Request("https://test", {
          method: "POST",
          body: "{",
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ).rejects.toThrow();
  });
  test("login limiter rejects the ninth attempt in its cache window", async () => {
    const prior = globalThis.caches;
    const map = new Map();
    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: {
        default: {
          match: async (r: Request) => map.get(r.url)?.clone(),
          put: async (r: Request, v: Response) => {
            map.set(r.url, v);
          },
        },
      },
    });
    try {
      const req = new Request("https://example.test/api/admin/login", {
        headers: { "cf-connecting-ip": "192.0.2.1" },
      });
      for (let i = 0; i < 8; i++) await rateLimit(req, env);
      await expect(rateLimit(req, env)).rejects.toThrow("Demasiadas");
    } finally {
      Object.defineProperty(globalThis, "caches", { configurable: true, value: prior });
    }
  });
});
describe("uploads and content validation", () => {
  test("accepts real PNG, JPEG, WebP and AVIF", async () => {
    for (const [name, mime, ext] of [
      ["public/assets/logo.png", "image/png", "png"],
      ["public/assets/photographer-640.webp", "image/webp", "webp"],
      ["src/admin/fixtures/sample.jpg", "image/jpeg", "jpg"],
      ["src/admin/fixtures/sample.avif", "image/avif", "avif"],
    ]) {
      expect(verifyImage(new Uint8Array(await Bun.file(name).arrayBuffer()), mime)).toBe(ext);
    }
  });
  test("rejects SVG, scripts, spoofed MIME, truncated files and oversized files", async () => {
    expect(() => verifyImage(new TextEncoder().encode("<svg/>"), "image/png")).toThrow();
    const png = new Uint8Array(await Bun.file("public/assets/logo.png").arrayBuffer());
    expect(() => verifyImage(png, "image/jpeg")).toThrow();
    expect(() => verifyImage(png.slice(0, 10), "image/png")).toThrow();
    expect(() => verifyImage(new Uint8Array(5 * 1024 * 1024 + 1), "image/png")).toThrow();
  });
  test("rejects unsafe links, image paths, unknown fields and missing categories", () => {
    expect(contentSchema.safeParse(defaults).success).toBe(true);
    const content = structuredClone(defaults) as any;
    content.home.hero.primaryHref = "javascript:alert(1)";
    expect(contentSchema.safeParse(content).success).toBe(false);
    content.home.hero.primaryHref = "/contacto";
    content.brand.logo = "/images/../../secrets.png";
    expect(contentSchema.safeParse(content).success).toBe(false);
    content.brand.logo = defaults.brand.logo;
    content.GITHUB_TOKEN = "bad";
    expect(contentSchema.safeParse(content).success).toBe(false);
    delete content.GITHUB_TOKEN;
    content.portfolio = [
      {
        id: "1",
        src: "/assets/logo.png",
        alt: "Test",
        title: "",
        description: "",
        category: "missing",
        featured: false,
      },
    ];
    expect(contentSchema.safeParse(content).success).toBe(false);
  });
});
