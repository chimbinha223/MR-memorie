import { createFileRoute } from "@tanstack/react-router";
import { HowItWorks } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/como-funciona")({
  head: () =>
    pageHead(
      "/como-funciona",
      "Como funciona",
      "Saiba como planejar seu ensaio e tirar suas dúvidas.",
    ),
  component: HowItWorks,
});
