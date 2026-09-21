export type AdminEnv = {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD_HASH?: string;
  AUTH_SECRET?: string;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
};
export async function adminEnv(): Promise<AdminEnv> {
  if (import.meta.env.DEV) return process.env;
  const { bindings } = await import("../lib/bindings.server");
  return bindings() as AdminEnv;
}
export function authConfigured(env: AdminEnv) {
  return !!(
    env.ADMIN_EMAIL &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ADMIN_EMAIL) &&
    env.AUTH_SECRET &&
    env.AUTH_SECRET.length >= 32 &&
    env.ADMIN_PASSWORD_HASH &&
    /^\$2[aby]\$(1[0-4])\$[./A-Za-z0-9]{53}$/.test(env.ADMIN_PASSWORD_HASH)
  );
}
export function repoConfig(env: AdminEnv) {
  const owner = env.GITHUB_OWNER || "chimbinha223";
  const repo = env.GITHUB_REPO || "MR-memorie";
  const branch = env.GITHUB_BRANCH || "main";
  if (
    !/^[A-Za-z0-9-]+$/.test(owner) ||
    !/^[A-Za-z0-9_.-]+$/.test(repo) ||
    !/^[-A-Za-z0-9_/.]+$/.test(branch) ||
    branch.includes("..")
  )
    throw new Error("Configuração do repositório inválida.");
  return { owner, repo, branch };
}
