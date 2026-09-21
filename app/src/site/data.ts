import defaults from "../../data/content.json";
import { contentSchema, type SiteContent } from "../admin/content-schema";
const content = contentSchema.parse(defaults);
export const { brand, services, steps, faqs, portfolio } = content;
export type ServiceId = string;
export type PortfolioPhoto = SiteContent["portfolio"][number];
