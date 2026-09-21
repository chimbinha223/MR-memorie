import { brand } from "./data";
export function pageHead(path: string, title: string, description: string) {
  return {
    meta: [
      { title: title + " | MR Memorie" },
      { name: "description", content: description },
      { property: "og:title", content: title + " | MR Memorie" },
      { property: "og:description", content: description },
      { property: "og:url", content: brand.origin + path },
    ],
    links: [{ rel: "canonical", href: brand.origin + path }],
  };
}
