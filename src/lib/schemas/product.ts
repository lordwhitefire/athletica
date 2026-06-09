import { z } from "zod";

const priceCurrentRegex = /^[\d.]+$/;
const priceOriginalRegex = /^[\d.]+$/;
const discountPercentRegex = /^[\d.]+$/;
const memberPriceRegex = /^[\d.]+$/;

export const productFormSchema = z.object({
    url_slug: z.string().min(1, "URL slug is required."),
    model: z.string().min(1, "Model is required."),
    name: z.string().min(1, "Name is required."),
    category: z.string().min(1, "Category is required."),
    brand_ref: z.string().min(1, "Brand is required."),
    traction: z.string().nullable().optional(),
    gender: z.string().min(1, "Gender is required."),
    color: z.string().min(1, "Color is required."),
    price_current: z.string().regex(priceCurrentRegex, "Invalid price."),
    price_original: z.string().regex(priceOriginalRegex, "Invalid original price."),
    discount_percent: z.string().regex(discountPercentRegex, "Invalid discount."),
    member_price: z.string().regex(memberPriceRegex, "Invalid member price."),
    currency: z.string().min(1, "Currency is required."),
    desc_subtitle: z.string().optional().default(""),
    desc_tagline: z.string().optional().default(""),
    desc_intro: z.string().optional().default(""),
    desc_collection: z.string().optional().default(""),
    key_benefits_json: z.string().optional().default("[]"),
    tech_range: z.string().optional().default(""),
    tech_sole: z.string().optional().default(""),
    tech_upper: z.string().optional().default(""),
    tech_adjustment: z.string().optional().default(""),
    main_image_asset: z.string().optional().default(""),
    thumbnail_asset: z.string().optional().default(""),
    gallery_assets: z.string().optional().default(""),
    id: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export const productSanitySchema = z.object({
    _id: z.string(),
    url_slug: z.object({ current: z.string() }).or(z.string()),
    model: z.string(),
    brand: z.union([
        z.object({ _ref: z.string() }),
        z.string(),
    ]),
    category: z.string(),
    traction: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    gender: z.string(),
    main_image: z.union([
        z.object({ asset: z.object({ _ref: z.string(), _type: z.string() }) }),
        z.string(),
    ]).optional(),
    thumbnail: z.union([
        z.object({ asset: z.object({ _ref: z.string(), _type: z.string() }) }),
        z.string(),
    ]).optional(),
    color: z.string(),
    price: z.object({
        current: z.number(),
        original: z.number(),
        discount_percent: z.number(),
        member_price: z.number(),
        currency: z.string(),
    }),
    description: z.object({
        subtitle: z.string().optional(),
        tagline: z.string().optional(),
        intro: z.string().optional(),
        collection: z.string().optional(),
        key_benefits: z.array(z.string()).optional(),
        technical_details: z.object({
            range: z.string().optional(),
            sole_type: z.string().optional(),
            upper_material: z.string().optional(),
            adjustment: z.string().optional(),
        }).optional(),
    }).optional(),
});

export type ProductSanityData = z.infer<typeof productSanitySchema>;
