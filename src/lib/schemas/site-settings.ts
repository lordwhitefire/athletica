import { z } from "zod";

export const siteSettingsSchema = z.object({
    site_logo_asset: z.string().optional().default(""),
    brand_name: z.string().optional().default(""),
    brand_description: z.string().optional().default(""),
    social_links: z.string().optional().default("[]"),
    link_columns: z.string().optional().default("[]"),
    copyright: z.string().optional().default(""),
    bottom_tags: z.string().optional().default("[]"),
});

export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;
