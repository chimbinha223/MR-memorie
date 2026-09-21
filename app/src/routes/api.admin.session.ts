import { createFileRoute } from "@tanstack/react-router";
import { api, json } from "../admin/http.server";
import { authenticated } from "../admin/auth.server";
import { adminEnv, authConfigured } from "../admin/env.server";
async function session(request: Request) {
  const env = await adminEnv();
  return json({
    authenticated: await authenticated(request, env),
    configured: authConfigured(env),
  });
}
export const Route = createFileRoute("/api/admin/session")({
  server: { handlers: { GET: ({ request }) => api(() => session(request)) } },
});
