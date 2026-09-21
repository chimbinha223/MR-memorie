import { createFileRoute } from "@tanstack/react-router";
import { api, json, sameOrigin } from "../admin/http.server";
import { sessionCookie, requireAdmin } from "../admin/auth.server";
async function logout(request: Request) {
  sameOrigin(request);
  await requireAdmin(request);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(request, "", true) });
}
export const Route = createFileRoute("/api/admin/logout")({
  server: { handlers: { POST: ({ request }) => api(() => logout(request)) } },
});
