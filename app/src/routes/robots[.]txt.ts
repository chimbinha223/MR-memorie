import { createFileRoute } from "@tanstack/react-router";
import { brand } from "../site/data";
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response("User-agent: *\nAllow: /\nSitemap: " + brand.origin + "/sitemap.xml\n", {
          headers: { "content-type": "text/plain; charset=utf-8" },
        }),
    },
  },
});
