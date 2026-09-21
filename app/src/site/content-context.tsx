import { createContext, useContext, type ReactNode } from "react";
import defaults from "../../data/content.json";
import { contentSchema, imageURL, type ContentSnapshot } from "../admin/content-schema";
export const defaultSnapshot: ContentSnapshot = {
  content: contentSchema.parse(defaults),
  revision: "",
  assetBase: "",
  initialized: false,
};
const Context = createContext<ContentSnapshot>(defaultSnapshot);
export function SiteContentProvider({
  value,
  children,
}: {
  value: ContentSnapshot;
  children: ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useSiteContent() {
  const value = useContext(Context);
  return { ...value, resolveAsset: (path: string) => imageURL(path, value.assetBase) };
}
