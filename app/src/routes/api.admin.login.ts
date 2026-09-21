import { createFileRoute } from "@tanstack/react-router";
import { api, json, sameOrigin, readJson, ApiError } from "../admin/http.server";
import { adminEnv, authConfigured } from "../admin/env.server";
import { passwordMatches, sessionToken, sessionCookie, rateLimit } from "../admin/auth.server";
async function login(request: Request) {
  sameOrigin(request);
  const env = await adminEnv();
  if (!authConfigured(env))
    throw new ApiError(503, "Configure o acesso administrativo nas definições do site.");
  await rateLimit(request, env);
  const body = await readJson(request, 3000);
  if (
    !body ||
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    typeof body.password !== "string" ||
    new TextEncoder().encode(body.password).length > 72 ||
    !body.password
  )
    throw new ApiError(400, "Introduza o email e a palavra-passe.");
  if (!(await passwordMatches(body.email, body.password, env)))
    throw new ApiError(401, "Email ou palavra-passe incorretos.");
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(request, await sessionToken(env)) });
}
export const Route = createFileRoute("/api/admin/login")({
  server: { handlers: { POST: ({ request }) => api(() => login(request)) } },
});
