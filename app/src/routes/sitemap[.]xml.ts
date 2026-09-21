import { createFileRoute } from "@tanstack/react-router";
import { publicSnapshot } from "../admin/github.server";
import { adminEnv } from "../admin/env.server";
const xml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!,
  );
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { content } = await publicSnapshot(await adminEnv());
        const paths = [
          "/",
          "/sobre",
          "/portfolio",
          "/como-funciona",
          "/contacto",
          "/privacidade",
          ...content.services.map((s: { id: string }) => "/ensaios/" + s.id),
        ];
        return new Response(
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
            paths
              .map((p) => "<url><loc>" + xml(content.brand.origin + p) + "</loc></url>")
              .join("") +
            "</urlset>",
          { headers: { "content-type": "application/xml; charset=utf-8" } },
        );
      },
    },
  },
});
