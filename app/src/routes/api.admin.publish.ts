import { createFileRoute } from "@tanstack/react-router";
import { api, json, sameOrigin, readJson, ApiError } from "../admin/http.server";
import { requireAdmin } from "../admin/auth.server";
import { publish } from "../admin/github.server";
async function handler(request: Request) {
  sameOrigin(request);
  const env = await requireAdmin(request);
  const body = await readJson(request, 700000);
  if (
    !body ||
    !/^[a-f0-9]{40}$/.test(body.revision) ||
    typeof body.mutationId !== "string" ||
    !/^[a-f0-9-]{36}$/.test(body.mutationId) ||
    !Array.isArray(body.uploads) ||
    body.uploads.length > 50 ||
    body.uploads.some(
      (u: unknown) =>
        !u ||
        typeof u !== "object" ||
        typeof (u as any).path !== "string" ||
        typeof (u as any).sha !== "string" ||
        typeof (u as any).receipt !== "string" ||
        (u as any).receipt.length > 3000,
    )
  )
    throw new ApiError(400, "Pedido de publicação inválido.");
  return json(await publish(env, body));
}
export const Route = createFileRoute("/api/admin/publish")({
  server: { handlers: { POST: ({ request }) => api(() => handler(request)) } },
});
