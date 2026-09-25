import { test, expect, afterEach } from "bun:test";
import {
  publish,
  makeReceipt,
  checkReceipt,
  snapshot,
  publicSnapshot,
  base64,
} from "./github.server";
import defaults from "../../data/content.json";
const env = {
  MR_MEMORIE_GITHUB_TOKEN: "test-only-token",
  AUTH_SECRET: "test-only-signing-secret-".repeat(3),
};
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const old = "a".repeat(40),
  next = "b".repeat(40),
  blob = "c".repeat(40),
  tree = "d".repeat(40);
function mockRepo(content: any = structuredClone(defaults), conflict = false) {
  let revision = old;
  let message = "initial";
  let pending = "";
  let entries: any[] = [];
  let writes: any[] = [];
  globalThis.fetch = (async (url: any, init: any) => {
    const path = String(url).split("/MR-memorie/")[1];
    const body = init?.body ? JSON.parse(init.body) : undefined;
    if (init?.method !== "GET") writes.push({ path, body });
    if (path.startsWith("git/ref/heads/")) return Response.json({ object: { sha: revision } });
    if (path.startsWith("contents/"))
      return Response.json({
        type: "file",
        encoding: "base64",
        size: 100,
        content: base64(new TextEncoder().encode(JSON.stringify(content))),
      });
    if (path.startsWith("git/commits/")) return Response.json({ message, tree: { sha: tree } });
    if (path === "git/trees") {
      entries = body.tree;
      return Response.json({ sha: tree });
    }
    if (path === "git/commits") {
      pending = body.message;
      return Response.json({ sha: next });
    }
    if (path.startsWith("git/refs/heads/")) {
      if (conflict) return Response.json({}, { status: 422 });
      revision = next;
      message = pending;
      content = JSON.parse(entries[0].content);
      return Response.json({ object: { sha: revision } });
    }
    throw new Error("Unexpected GitHub request " + path);
  }) as typeof fetch;
  return { writes, getEntries: () => entries, getRevision: () => revision };
}
test("publishes JSON and verified image in one commit; preserves shared images", async () => {
  const path = "/images/gallery/11111111-1111-1111-1111-111111111111.png";
  const current = structuredClone(defaults);
  current.home.hero.image = path;
  const repo = mockRepo(current);
  const content = structuredClone(current);
  content.brand.name = "Edited";
  const image = "/images/gallery/22222222-2222-2222-2222-222222222222.png";
  content.home.editorial.image = image;
  const upload = {
    path: "app/public" + image,
    sha: blob,
    receipt: await makeReceipt("app/public" + image, blob, env),
  };
  const result = await publish(env, {
    content,
    revision: old,
    uploads: [upload],
    mutationId: "12345678-1234-1234-1234-123456789012",
  });
  expect(result.revision).toBe(next);
  expect(repo.getEntries()).toHaveLength(2);
  expect(repo.writes.at(-1).body).toEqual({ sha: next, force: false });
  expect(repo.writes.filter((x) => x.path === "git/commits")).toHaveLength(1);
});
test("removes only images no longer referenced by any field", async () => {
  const path = "/images/gallery/11111111-1111-1111-1111-111111111111.png";
  const current = structuredClone(defaults);
  current.home.hero.image = path;
  const repo = mockRepo(current);
  const content = structuredClone(defaults);
  await publish(env, { content, revision: old, uploads: [], mutationId: "delete-test" });
  expect(repo.getEntries()).toContainEqual({
    path: "app/public" + path,
    mode: "100644",
    type: "blob",
    sha: null,
  });
});
test("rejects stale drafts before writing and non-fast-forward races", async () => {
  let repo = mockRepo();
  await expect(
    publish(env, { content: defaults, revision: next, uploads: [], mutationId: "conflict" }),
  ).rejects.toThrow("mais recente");
  expect(repo.writes).toHaveLength(0);
  repo = mockRepo(undefined, true);
  await expect(
    publish(env, { content: defaults, revision: old, uploads: [], mutationId: "race" }),
  ).rejects.toThrow();
  expect(repo.getRevision()).toBe(old);
});
test("retries a successful mutation without creating duplicate commits", async () => {
  const repo = mockRepo();
  const input = { content: defaults, revision: old, uploads: [], mutationId: "idempotency" };
  await publish(env, input);
  await publish(env, input);
  expect(repo.writes.filter((x) => x.path === "git/commits")).toHaveLength(1);
});
test("rejects unsigned image references and tampered receipts", async () => {
  const repo = mockRepo();
  const content = structuredClone(defaults);
  content.home.hero.image = "/images/unknown.png";
  await expect(
    publish(env, { content, revision: old, uploads: [], mutationId: "unsafe" }),
  ).rejects.toThrow("Envie a imagem");
  expect(repo.writes).toHaveLength(0);
  const path = "app/public/images/11111111-1111-1111-1111-111111111111.png";
  const receipt = await makeReceipt(path, blob, env);
  await expect(checkReceipt({ path, sha: old, receipt }, env)).rejects.toThrow();
  await expect(
    checkReceipt({ path, sha: blob, receipt }, { ...env, MR_MEMORIE_GITHUB_REPO: "another" }),
  ).rejects.toThrow();
});
test("snapshot decodes Unicode content without exposing authentication", async () => {
  const c = structuredClone(defaults);
  c.brand.name = "Fotografias e memórias";
  mockRepo(c);
  const s = await snapshot(env);
  expect(s.content.brand.name).toBe(c.brand.name);
  expect(JSON.stringify(s)).not.toContain(env.MR_MEMORIE_GITHUB_TOKEN);
});

test("public pages survive unavailable cache reads and writes", async () => {
  const previous = globalThis.caches;
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      default: {
        match: async () => {
          throw new Error("Cache unavailable");
        },
        put: async () => {
          throw new Error("Cache unavailable");
        },
      },
    },
  });
  try {
    const c = structuredClone(defaults);
    c.brand.name = "Live content";
    mockRepo(c);
    const result = await publicSnapshot(env);
    expect(result.content.brand.name).toBe("Live content");
    expect(result.revision).toBe(old);
  } finally {
    Object.defineProperty(globalThis, "caches", { configurable: true, value: previous });
  }
});
test("public pages use bundled content when cache and GitHub are unavailable", async () => {
  const previous = globalThis.caches;
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      default: {
        match: async () => {
          throw new Error("Cache unavailable");
        },
      },
    },
  });
  globalThis.fetch = (async () => {
    throw new Error("Network unavailable");
  }) as typeof fetch;
  try {
    const result = await publicSnapshot(env);
    expect(result.content.brand.name).toBe(defaults.brand.name);
    expect(result.initialized).toBe(false);
  } finally {
    Object.defineProperty(globalThis, "caches", { configurable: true, value: previous });
  }
});
