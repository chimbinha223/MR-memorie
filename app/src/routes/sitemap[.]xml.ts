import { createFileRoute } from "@tanstack/react-router";
import { brand } from "../site/data";
const paths = [
  "/",
  "/sobre",
  "/portfolio",
  "/ensaios/casais",
  "/ensaios/aniversarios",
  "/ensaios/casuais",
  "/como-funciona",
  "/contacto",
  "/privacidade",
];
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
            paths.map((p) => "<url><loc>" + brand.origin + p + "</loc></url>").join("") +
            "</urlset>",
          { headers: { "content-type": "application/xml; charset=utf-8" } },
        ),
    },
  },
});
