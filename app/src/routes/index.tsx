import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/")({
  head: ({ matches }) =>
    pageHead(
      "/",
      "Fotografia em Viana do Castelo",
      "Casais, aniversários e ensaios casuais com a MR Memorie, em Viana do Castelo, Portugal.",
      matches[0]?.loaderData,
    ),
  component: Home,
});
