import { createFileRoute } from "@tanstack/react-router";
import { About } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/sobre")({
  head: () =>
    pageHead("/sobre", "Sobre", "Um olhar atento aos momentos, às pessoas e às histórias."),
  component: About,
});
