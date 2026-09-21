import { createFileRoute } from "@tanstack/react-router";
import { publicSnapshot } from "../admin/github.server";
import { adminEnv } from "../admin/env.server";
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { content } = await publicSnapshot(await adminEnv());
        return new Response(
          "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nSitemap: " +
            content.brand.origin +
            "/sitemap.xml\n",
          { headers: { "content-type": "text/plain; charset=utf-8" } },
        );
      },
    },
  },
});
