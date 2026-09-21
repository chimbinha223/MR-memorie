import { createFileRoute, Outlet } from "@tanstack/react-router";
import adminCss from "../admin/admin.css?url";
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração | MR Memorie" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: adminCss }],
  }),
  component: () => <Outlet />,
});
