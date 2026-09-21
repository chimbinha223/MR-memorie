import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "/",
      "Fotografia em Viana do Castelo",
      "Casais, aniversários e ensaios casuais com a MR Memorie, em Viana do Castelo, Portugal.",
    ),
  component: Home,
});
