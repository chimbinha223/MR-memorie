import { createFileRoute } from "@tanstack/react-router";
import { api, json } from "../admin/http.server";
import { requireAdmin } from "../admin/auth.server";
import { snapshot } from "../admin/github.server";
export const Route = createFileRoute("/api/admin/content")({
  server: {
    handlers: {
      GET: ({ request }) => api(async () => json(await snapshot(await requireAdmin(request)))),
    },
  },
});
