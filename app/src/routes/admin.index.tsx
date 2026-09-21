import { createFileRoute } from "@tanstack/react-router";
import AdminPanel from "../admin/AdminPanel";
export const Route = createFileRoute("/admin/")({ component: AdminPanel });
