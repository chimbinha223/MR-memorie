export type AdminEnv = {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD_HASH?: string;
  AUTH_SECRET?: string;
  MR_MEMORIE_GITHUB_TOKEN?: string;
  MR_MEMORIE_GITHUB_OWNER?: string;
  MR_MEMORIE_GITHUB_REPO?: string;
  MR_MEMORIE_GITHUB_BRANCH?: string;
};
// Deliberately whitelist application-owned settings. Never read a platform CI credential.
export async function adminEnv(): Promise<AdminEnv> {
  if (import.meta.env.DEV)
    return {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
      AUTH_SECRET: process.env.AUTH_SECRET,
      MR_MEMORIE_GITHUB_TOKEN: process.env.MR_MEMORIE_GITHUB_TOKEN,
      MR_MEMORIE_GITHUB_OWNER: process.env.MR_MEMORIE_GITHUB_OWNER,
      MR_MEMORIE_GITHUB_REPO: process.env.MR_MEMORIE_GITHUB_REPO,
      MR_MEMORIE_GITHUB_BRANCH: process.env.MR_MEMORIE_GITHUB_BRANCH,
    };
  const { bindings } = await import("../lib/bindings.server");
  const source = bindings();
  return {
    ADMIN_EMAIL: source.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: source.ADMIN_PASSWORD_HASH,
    AUTH_SECRET: source.AUTH_SECRET,
    MR_MEMORIE_GITHUB_TOKEN: source.MR_MEMORIE_GITHUB_TOKEN,
    MR_MEMORIE_GITHUB_OWNER: source.MR_MEMORIE_GITHUB_OWNER,
    MR_MEMORIE_GITHUB_REPO: source.MR_MEMORIE_GITHUB_REPO,
    MR_MEMORIE_GITHUB_BRANCH: source.MR_MEMORIE_GITHUB_BRANCH,
  };
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
  const owner = env.MR_MEMORIE_GITHUB_OWNER || "chimbinha223";
  const repo = env.MR_MEMORIE_GITHUB_REPO || "MR-memorie";
  const branch = env.MR_MEMORIE_GITHUB_BRANCH || "main";
  if (
    !/^[A-Za-z0-9-]+$/.test(owner) ||
    !/^[A-Za-z0-9_.-]+$/.test(repo) ||
    !/^[-A-Za-z0-9_/.]+$/.test(branch) ||
    branch.includes("..")
  )
    throw new Error("Configuração do repositório inválida.");
  return { owner, repo, branch };
}
