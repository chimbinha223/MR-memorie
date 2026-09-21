import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/ensaios/casuais")({
  head: ({ matches }) =>
    pageHead(
      "/ensaios/casuais",
      "Casual",
      "Fotografia de casual em Viana do Castelo. Conheça a experiência e peça orçamento.",
      matches[0]?.loaderData,
    ),
  component: () => <ServicePage id="casuais" />,
});
