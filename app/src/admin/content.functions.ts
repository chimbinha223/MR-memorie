import { createServerFn } from "@tanstack/react-start";
export const loadPublicContent = createServerFn({ method: "GET" }).handler(async () => {
  const { adminEnv } = await import("./env.server");
  const { publicSnapshot } = await import("./github.server");
  return publicSnapshot(await adminEnv());
});
