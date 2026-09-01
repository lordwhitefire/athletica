import { z } from "zod";

const bannerSchema = z.object({
    _key: z.string().optional(),
    id: z.string().optional(),
    title: z.string().optional().default(""),
    subtitle: z.string().optional().default(""),
    button_text: z.string().optional().default(""),
    link: z.string().optional().default(""),
    gradient: z.string().optional().default(""),
    accent_color: z.string().optional().default(""),
    image: z.union([z.string(), z.null(), z.record(z.string(), z.unknown())]).optional().default(null),
});

const sectionItemSchema = z.object({
    _key: z.string().optional(),
    product_ref: z.string().optional().default(""),
    image_asset: z.string().optional().default(""),
    title: z.string().optional().default(""),
    subtitle: z.string().optional().default(""),
    link: z.string().optional().default(""),
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
    sectionItem: sectionItemSchema,
    heroCarousel: heroCarouselSchema,
};

export type BannerInput = z.infer<typeof bannerSchema>;

export type SectionItemInput = z.infer<typeof sectionItemSchema>;
export type HeroCarouselInput = z.infer<typeof heroCarouselSchema>;
