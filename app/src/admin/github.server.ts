import { ApiError, readLimited, edgeCache } from "./http.server";
import { repoConfig, type AdminEnv } from "./env.server";
import {
  contentSchema,
  collectImagePaths,
  type SiteContent,
  type UploadReceipt,
  type ContentSnapshot,
} from "./content-schema";
import defaultContent from "../../data/content.json";
import { SignJWT, jwtVerify } from "jose";
export const CONTENT_PATH = "app/data/content.json";
export async function github(env: AdminEnv, path: string, method = "GET", body?: unknown) {
  const { owner, repo } = repoConfig(env);
  const response = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/" + path, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "MR-Memorie-Admin",
      ...(env.MR_MEMORIE_GITHUB_TOKEN
        ? { Authorization: "Bearer " + env.MR_MEMORIE_GITHUB_TOKEN }
        : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if (response.status === 404)
      throw new ApiError(404, "O ficheiro ou repositório não foi encontrado.");
    if (response.status === 401 || response.status === 403)
      throw new ApiError(
        503,
        "Verifique a ligação e as permissões do GitHub nas definições do site.",
      );
    if (response.status === 409 || response.status === 422)
      throw new ApiError(
        409,
        "O conteúdo mudou entretanto. Carregue a versão mais recente antes de publicar.",
      );
    throw new ApiError(502, "O GitHub está temporariamente indisponível. Tente novamente.");
  }
  const bytes = await readLimited(
    new Request("https://internal.local", {
      method: "POST",
      body: response.body,
      duplex: "half",
    } as RequestInit),
    2500000,
  );
  return JSON.parse(new TextDecoder().decode(bytes));
}
export function base64(bytes: Uint8Array) {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 16384)
    binary += String.fromCharCode(...bytes.subarray(start, start + 16384));
  return btoa(binary);
}
export function decode64(s: string) {
  return Uint8Array.from(atob(s.replace(/\s/g, "")), (c) => c.charCodeAt(0));
}
export async function head(env: AdminEnv) {
  const { branch } = repoConfig(env);
  const ref = await github(env, "git/ref/heads/" + encodeURIComponent(branch));
  if (!/^[a-f0-9]{40}$/.test(ref.object?.sha))
    throw new ApiError(502, "Resposta inválida do GitHub.");
  return ref.object.sha as string;
}
export async function snapshot(env: AdminEnv) {
  const revision = await head(env);
  const { owner, repo } = repoConfig(env);
  let content: SiteContent,
    initialized = true;
  try {
    const file = await github(env, "contents/" + CONTENT_PATH + "?ref=" + revision);
    if (file.type !== "file" || file.encoding !== "base64" || file.size > 512000)
      throw new ApiError(502, "O ficheiro de conteúdos é inválido.");
    content = contentSchema.parse(JSON.parse(new TextDecoder().decode(decode64(file.content))));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      content = contentSchema.parse(defaultContent);
      initialized = false;
    } else throw e;
  }
  return {
    content,
    revision,
    initialized,
    assetBase:
      "https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + revision + "/app/public",
  };
}
export function publicCacheKey(env: AdminEnv) {
  const { owner, repo, branch } = repoConfig(env);
  return new Request(
    "https://mr-memorie.higgsfield.app/__content_cache/" +
      owner +
      "/" +
      repo +
      "/" +
      encodeURIComponent(branch),
  );
}
export async function publicSnapshot(env: AdminEnv): Promise<ContentSnapshot> {
  const cache = edgeCache(),
    cacheKey = publicCacheKey(env),
    staleKey = new Request(cacheKey.url + "/last-good");
  const cached = await cache?.match(cacheKey);
  if (cached) return cached.json() as Promise<ContentSnapshot>;
  try {
    const result = await snapshot(env);
    if (cache) {
      const body = JSON.stringify(result);
      await cache.put(
        staleKey,
        new Response(body, {
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
        }),
      );
      await cache.put(
        cacheKey,
        new Response(body, {
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=30" },
        }),
      );
    }
    return result;
  } catch {
    const previous = await cache?.match(staleKey);
    if (previous) return previous.json() as Promise<ContentSnapshot>;
    return {
      content: contentSchema.parse(defaultContent),
      revision: "",
      assetBase: "",
      initialized: false,
    };
  }
}
function receiptKey(env: AdminEnv) {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32)
    throw new ApiError(503, "Configure os segredos do site.");
  return new TextEncoder().encode(env.AUTH_SECRET);
}
export async function makeReceipt(path: string, sha: string, env: AdminEnv) {
  const { owner, repo, branch } = repoConfig(env);
  return new SignJWT({ path, sha, repository: owner + "/" + repo, branch })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("mr-image-upload")
    .setExpirationTime("2h")
    .sign(receiptKey(env));
}
export async function checkReceipt(upload: UploadReceipt, env: AdminEnv) {
  try {
    const { payload } = await jwtVerify(upload.receipt, receiptKey(env), {
      algorithms: ["HS256"],
      audience: "mr-image-upload",
    });
    const { owner, repo, branch } = repoConfig(env);
    if (
      payload.path !== upload.path ||
      payload.sha !== upload.sha ||
      payload.repository !== owner + "/" + repo ||
      payload.branch !== branch
    )
      throw new Error();
    if (
      !/^app\/public\/images\/(?:gallery\/)?[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(
        upload.path,
      ) ||
      !/^[a-f0-9]{40}$/.test(upload.sha)
    )
      throw new Error();
  } catch {
    throw new ApiError(
      400,
      "Um envio de imagem expirou ou é inválido. Volte a selecionar a fotografia.",
    );
  }
}
export async function publish(
  env: AdminEnv,
  input: { content: unknown; revision: string; uploads: UploadReceipt[]; mutationId: string },
) {
  if (!env.MR_MEMORIE_GITHUB_TOKEN)
    throw new ApiError(503, "Configure a ligação ao GitHub antes de publicar.");
  const parsed = contentSchema.safeParse(input.content);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Reveja os campos: " +
        parsed.error.issues
          .slice(0, 3)
          .map((i) => i.path.join(".") + ": " + i.message)
          .join("; "),
    );
  const content = parsed.data;
  const serialized = JSON.stringify(content, null, 2) + "\n";
  if (new TextEncoder().encode(serialized).length > 512000)
    throw new ApiError(413, "O conteúdo excede o limite permitido.");
  const digest = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(serialized))),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  const message = "Publicar conteúdos MR Memorie [" + input.mutationId + "] " + digest;
  const current = await snapshot(env);
  const commit = await github(env, "git/commits/" + current.revision);
  if (commit.message === message) {
    return {
      ...current,
      commitUrl:
        "https://github.com/" +
        repoConfig(env).owner +
        "/" +
        repoConfig(env).repo +
        "/commit/" +
        current.revision,
    };
  }
  if (current.revision !== input.revision)
    throw new ApiError(
      409,
      "Existe uma versão mais recente. Guarde uma cópia do rascunho e carregue a versão atual antes de publicar.",
    );
  const before = collectImagePaths(current.content),
    after = collectImagePaths(content);
  const entries: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha?: string | null;
    content?: string;
  }> = [{ path: CONTENT_PATH, mode: "100644", type: "blob", content: serialized }];
  const attached = new Set<string>();
  for (const upload of input.uploads) {
    await checkReceipt(upload, env);
    const path = "/" + upload.path.slice("app/public/".length);
    if (!after.has(path)) continue;
    if (attached.has(path)) throw new ApiError(400, "Imagem repetida no pedido.");
    attached.add(path);
    entries.push({ path: upload.path, mode: "100644", type: "blob", sha: upload.sha });
  }
  for (const path of after) {
    if (path.startsWith("/images/") && !before.has(path) && !attached.has(path))
      throw new ApiError(400, "Envie a imagem antes de a utilizar no conteúdo.");
  }
  for (const path of before) {
    if (path.startsWith("/images/") && !after.has(path))
      entries.push({ path: "app/public" + path, mode: "100644", type: "blob", sha: null });
  }
  const tree = await github(env, "git/trees", "POST", {
    base_tree: commit.tree.sha,
    tree: entries,
  });
  const next = await github(env, "git/commits", "POST", {
    message,
    tree: tree.sha,
    parents: [current.revision],
  });
  const { owner, repo, branch } = repoConfig(env);
  await github(env, "git/refs/heads/" + encodeURIComponent(branch), "PATCH", {
    sha: next.sha,
    force: false,
  });
  await edgeCache()?.delete(publicCacheKey(env));
  return {
    content,
    revision: next.sha,
    initialized: true,
    assetBase:
      "https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + next.sha + "/app/public",
    commitUrl: "https://github.com/" + owner + "/" + repo + "/commit/" + next.sha,
  };
}
