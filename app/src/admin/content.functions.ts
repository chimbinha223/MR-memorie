import { createServerFn } from "@tanstack/react-start";
import defaults from "../../data/content.json";
import { contentSchema, type ContentSnapshot } from "./content-schema";
export const loadPublicContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContentSnapshot> => {
    try {
      const { adminEnv } = await import("./env.server");
      const { publicSnapshot } = await import("./github.server");
      return await publicSnapshot(await adminEnv());
    } catch {
      // Public pages remain available even before runtime settings are configured.
      // This fallback applies only to public reads; administrator writes still fail closed.
      return {
        content: contentSchema.parse(defaults),
        revision: "",
        assetBase: "",
        initialized: false,
      };
    }
  },
);
