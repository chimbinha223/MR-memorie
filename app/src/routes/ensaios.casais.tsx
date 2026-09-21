import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/ensaios/casais")({
  head: () =>
    pageHead(
      "/ensaios/casais",
      "Casais",
      "Fotografia de casais em Viana do Castelo. Conheça a experiência e peça orçamento.",
    ),
  component: () => <ServicePage id="casais" />,
});
