import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/ensaios/aniversarios")({
  head: ({ matches }) =>
    pageHead(
      "/ensaios/aniversarios",
      "Aniversários",
      "Fotografia de aniversários em Viana do Castelo. Conheça a experiência e peça orçamento.",
      matches[0]?.loaderData,
    ),
  component: () => <ServicePage id="aniversarios" />,
});
