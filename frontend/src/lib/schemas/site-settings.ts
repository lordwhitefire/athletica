import { z } from "zod";

export const siteSettingsSchema = z.object({
    site_logo_asset: z.string().default(""),
    brand_name: z.string().default(""),
    brand_description: z.string().default(""),
    social_links: z.string().default("[]"),
    link_columns: z.string().default("[]"),
    copyright: z.string().default(""),
    bottom_tags: z.string().default("[]"),
});

export type SiteSettingsFormData = z.output<typeof siteSettingsSchema>;
