import { createFileRoute } from "@tanstack/react-router";
import { Privacy } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/privacidade")({
  head: ({ matches }) =>
    pageHead(
      "/privacidade",
      "Privacidade",
      "Informações sobre a navegação e o contato com a MR Memorie.",
      matches[0]?.loaderData,
    ),
  component: Privacy,
});
