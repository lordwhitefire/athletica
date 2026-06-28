import { z } from "zod";

export const sizeSchema = z.object({
    size: z.string().min(1, "Size label is required."),
    available: z.boolean().default(true),
    stock: z.number().int().min(0).default(0),
});

export type SizeItem = z.output<typeof sizeSchema>;

export const batchProcessedRowSchema = z.object({
    model: z.string().min(1, "Model is required."),
    brand: z.string().min(1, "Brand name is required."),
    price_current: z.number().positive("Price must be positive."),
    price_currency: z.enum(["EUR", "USD", "GBP"]),

    category: z.string().optional().default(""),
    traction: z.string().optional().default(""),
    name: z.string().optional().default(""),
    gender: z.enum(["Unisex", "Male", "Female"]).optional().default("Unisex"),
    color: z.string().optional().default(""),

    price_original: z.number().optional().default(0),
    price_discount_percent: z.number().optional().default(0),
    price_member_price: z.number().optional().default(0),

    description_subtitle: z.string().optional().default(""),
    description_tagline: z.string().optional().default(""),
    description_intro: z.string().optional().default(""),
    description_collection: z.string().optional().default(""),
    description_key_benefits: z.array(z.string()).optional().default([]),

    technical_range: z.string().optional().default(""),
    technical_sole_type: z.string().optional().default(""),
    technical_upper_material: z.string().optional().default(""),
    technical_adjustment: z.string().optional().default(""),

    main_image: z
        .object({ _type: z.literal("image"), asset: z.object({ _type: z.literal("reference"), _ref: z.string() }) })
        .nullable()
        .optional()
        .default(null),
    thumbnail: z
        .object({ _type: z.literal("image"), asset: z.object({ _type: z.literal("reference"), _ref: z.string() }) })
        .nullable()
        .optional()
        .default(null),
    image_gallery: z
        .array(
            z.object({ _type: z.literal("image"), asset: z.object({ _type: z.literal("reference"), _ref: z.string() }), _key: z.string() })
        )
        .optional()
        .default([]),

    sizes: z.array(sizeSchema).optional().default([]),
});

export type BatchProcessedRow = z.output<typeof batchProcessedRowSchema>;

export interface BatchUploadPreviewRow {
    index: number;
    model: string;
    brand: string;
    priceCurrent: number;
    currency: string;
    valid: boolean;
    errors: string[];
    imageStatus: { filename: string; status: "uploaded" | "failed"; sanityRef?: string }[];
}

export interface BatchUploadParseResult {
    totalRows: number;
    validRows: number;
    errorRows: number;
    rows: BatchUploadPreviewRow[];
    productData: BatchProcessedRow[];
    imageSummary: { total: number; uploaded: number; failed: number };
}

export interface BatchUploadCreateResult {
    created: number;
    failed: number;
    results: { index: number; id: string; success: boolean; error?: string }[];
}
