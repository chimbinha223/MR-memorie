import { defaultSnapshot } from "./content-context";
import type { ContentSnapshot } from "../admin/content-schema";
export function pageHead(
  path: string,
  title: string,
  description: string,
  snapshot?: ContentSnapshot,
) {
  const { content } = snapshot || defaultSnapshot;
  const override = content.seo.pages[path];
  const service = content.services.find((s) => "/ensaios/" + s.id === path);
  const finalTitle =
    override?.title ||
    (path === "/" ? content.seo.title : (service?.title || title) + " | " + content.brand.name);
  const finalDescription =
    override?.description ||
    (path === "/" ? content.seo.description : service?.summary || description);
  return {
    meta: [
      { title: finalTitle },
      { name: "description", content: finalDescription },
      { property: "og:title", content: finalTitle },
      { property: "og:description", content: finalDescription },
      { property: "og:url", content: content.brand.origin + path },
    ],
    links: [{ rel: "canonical", href: content.brand.origin + path }],
  };
}
