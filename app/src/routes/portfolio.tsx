import { createFileRoute } from "@tanstack/react-router";
import { Portfolio } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/portfolio")({
  head: ({ matches }) =>
    pageHead(
      "/portfolio",
      "Portfólio",
      "Fotografias de casais, aniversários e momentos espontâneos.",
      matches[0]?.loaderData,
    ),
  component: Portfolio,
});
