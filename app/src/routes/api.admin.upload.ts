import { createFileRoute } from "@tanstack/react-router";
import { api, sameOrigin, readLimited, ApiError, json } from "../admin/http.server";
import { requireAdmin } from "../admin/auth.server";
import { verifyImage } from "../admin/upload.server";
import { github, base64, makeReceipt } from "../admin/github.server";
export const Route = createFileRoute("/api/admin/upload")({
  server: {
    handlers: {
      POST: ({ request }) =>
        api(async () => {
          sameOrigin(request);
          const env = await requireAdmin(request);
          if (!env.GITHUB_TOKEN)
            throw new ApiError(503, "Configure a ligação ao GitHub antes de enviar fotografias.");
          if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
            throw new ApiError(415, "Formato de envio inválido.");
          const bytes = await readLimited(request, 6 * 1024 * 1024);
          const form = await new Response(bytes, {
            headers: { "Content-Type": request.headers.get("content-type")! },
          }).formData();
          const file = form.get("file"),
            purpose = form.get("purpose");
          if (
            !(file instanceof File) ||
            form.getAll("file").length !== 1 ||
            !["gallery", "brand"].includes(String(purpose))
          )
            throw new ApiError(400, "Escolha uma fotografia.");
          const data = new Uint8Array(await file.arrayBuffer());
          const ext = verifyImage(data, file.type);
          const path =
            "app/public/images/" +
            (purpose === "gallery" ? "gallery/" : "") +
            crypto.randomUUID() +
            "." +
            ext;
          const blob = await github(env, "git/blobs", "POST", {
            content: base64(data),
            encoding: "base64",
          });
          const receipt = await makeReceipt(path, blob.sha, env);
          return json({
            path,
            sha: blob.sha,
            receipt,
            src: "/" + path.slice("app/public/".length),
          });
        }),
    },
  },
});
