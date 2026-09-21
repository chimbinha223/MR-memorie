import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import meta from "../app-meta.json";
import { loadPublicContent } from "../admin/content.functions";
import { SiteContentProvider, defaultSnapshot } from "../site/content-context";
import { imageURL } from "../admin/content-schema";
declare const __HF_DESIGN_INSPECTOR__: boolean;
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: ({ location }) =>
    location.pathname.startsWith("/admin") ? defaultSnapshot : loadPublicContent(),
  head: ({ loaderData, match }) => {
    const site = (loaderData || defaultSnapshot).content;
    const admin = match.pathname.startsWith("/admin");
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: site.seo.title },
        { name: "description", content: site.seo.description },
        {
          name: "robots",
          content: admin
            ? "noindex, nofollow"
            : site.seo.noindex
              ? "noindex, follow"
              : "index, follow",
        },
        { property: "og:title", content: site.seo.title },
        { property: "og:description", content: site.seo.description },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "pt_PT" },
        {
          property: "og:image",
          content: new URL(
            imageURL(site.seo.ogImage, loaderData?.assetBase || ""),
            site.brand.origin,
          ).href,
        },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:image",
          content: new URL(
            imageURL(site.seo.ogImage, loaderData?.assetBase || ""),
            site.brand.origin,
          ).href,
        },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: meta.favicon_url },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@400;500;600&display=swap",
        },
      ],
    };
  },
  shellComponent: Shell,
  component: Root,
  notFoundComponent: () => (
    <div className="error-page">
      <p>MR MEMORIE</p>
      <h1>Esta página não está aqui.</h1>
      <a href="/">Voltar ao início</a>
    </div>
  ),
  errorComponent: () => (
    <div className="error-page">
      <p>MR MEMORIE</p>
      <h1>Não foi possível abrir a página.</h1>
      <a href="/">Tentar novamente</a>
    </div>
  ),
});
function Shell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
function Root() {
  const { queryClient } = Route.useRouteContext();
  const snapshot = Route.useLoaderData();
  useEffect(() => {
    if (__HF_DESIGN_INSPECTOR__ && !window.location.pathname.startsWith("/admin"))
      void import("../module/design-inspector/runtime")
        .then((m) => m.installHiggsfieldDesignInspector())
        .catch(() => {});
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <SiteContentProvider value={snapshot}>
        <Outlet />
      </SiteContentProvider>
    </QueryClientProvider>
  );
}
