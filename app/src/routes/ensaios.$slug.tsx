import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "../site/Site";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/ensaios/$slug")({
  head: ({ matches, params }) =>
    pageHead(
      "/ensaios/" + params.slug,
      "Experiência fotográfica",
      "Conheça esta experiência.",
      matches[0]?.loaderData,
    ),
  component: () => {
    const { slug } = Route.useParams();
    return <ServicePage id={slug} />;
  },
});
