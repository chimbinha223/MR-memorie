import "./lib/error-capture";
import { applySecurityHeaders } from "./lib/security-headers.server";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
      return applySecurityHeaders(Response.redirect(url.toString(), 301));
    }
    try {
      if (url.pathname === "/admin" || (url.pathname.startsWith("/admin/") && url.pathname !== "/admin/login")) {
        const { adminEnv } = await import("./admin/env.server");
        const { authenticated } = await import("./admin/auth.server");
        if (!await authenticated(request, await adminEnv())) return applySecurityHeaders(new Response(null, { status:302, headers:{ Location:"/admin/login", "Cache-Control":"no-store" } }));
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin")) { normalized.headers.set("Cache-Control","no-store"); normalized.headers.set("X-Robots-Tag","noindex, nofollow"); }
      return applySecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
