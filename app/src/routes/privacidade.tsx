import { createFileRoute } from "@tanstack/react-router";
import { Privacy } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/privacidade")({
  head: () =>
    pageHead(
      "/privacidade",
      "Privacidade",
      "Informações sobre a navegação e o contato com a MR Memorie.",
    ),
  component: Privacy,
});
