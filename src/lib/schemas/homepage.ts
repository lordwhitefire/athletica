import { z } from "zod";

const bannerSchema = z.object({
    _key: z.string().optional(),
    image_asset: z.string().optional().default(""),
    title: z.string().optional().default(""),
    subtitle: z.string().optional().default(""),
    cta_text: z.string().optional().default(""),
    cta_link: z.string().optional().default(""),
    text_color: z.string().optional().default(""),
    overlay_opacity: z.number().optional().default(0),
    text_position: z.string().optional().default("center"),
});

const sectionItemSchema = z.object({
    _key: z.string().optional(),
    product_ref: z.string().optional().default(""),
    image_asset: z.string().optional().default(""),
    title: z.string().optional().default(""),
    subtitle: z.string().optional().default(""),
    link: z.string().optional().default(""),
});

const sectionSchema = z.object({
    _key: z.string().optional(),
    title: z.string().optional().default(""),
    section_type: z.string().optional().default(""),
    display_style: z.string().optional().default("grid"),
    items: z.array(sectionItemSchema).optional().default([]),
});

const heroCarouselSchema = z.object({
    _key: z.string().optional(),
    image_asset: z.string().optional().default(""),
    title: z.string().optional().default(""),
    subtitle: z.string().optional().default(""),
    cta_text: z.string().optional().default(""),
    cta_link: z.string().optional().default(""),
});

export const homepageValidation = {
    banner: bannerSchema,
    section: sectionSchema,
    sectionItem: sectionItemSchema,
    heroCarousel: heroCarouselSchema,
};

export type BannerInput = z.infer<typeof bannerSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type SectionItemInput = z.infer<typeof sectionItemSchema>;
export type HeroCarouselInput = z.infer<typeof heroCarouselSchema>;
