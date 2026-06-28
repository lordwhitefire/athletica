"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import type { ApiResult } from "@/lib/api-types";
import { slugify, generateId } from "@/lib/rebuild-nav-urls";
import { batchProcessedRowSchema, type BatchProcessedRow, type BatchUploadCreateResult } from "@/lib/schemas/batch-upload";

async function getBrandRef(brandName: string): Promise<string | null> {
    try {
        const query = `*[_type == "brand" && lower(name) == $name][0] { _id }`;
        const result = await adminClient.fetch<{ _id: string } | null>(query, { name: brandName.toLowerCase() });
        return result?._id ?? null;
    } catch {
        return null;
    }
}

export async function batchCreateProducts(
    rows: BatchProcessedRow[]
): Promise<ApiResult<BatchUploadCreateResult>> {
    try {
        const parsed = batchProcessedRowSchema.array().safeParse(rows);
        if (!parsed.success) {
            return fail("validation_error", "invalid_rows", "One or more rows failed validation before import.");
        }

        const results: BatchUploadCreateResult["results"] = [];
        let created = 0;
        let failed = 0;

        for (let i = 0; i < parsed.data.length; i++) {
            const row = parsed.data[i];
            const productId = generateId();

            try {
                const brandRef = await getBrandRef(row.brand);

                const doc: Record<string, unknown> = {
                    _type: "product",
                    _id: productId,
                    id: productId,
                    url_slug: { _type: "slug", current: slugify(row.model) },
                    model: row.model,
                    brand: brandRef ? { _type: "reference", _ref: brandRef } : row.brand,
                    category: row.category || "",
                    traction: row.traction || null,
                    name: row.name || null,
                    gender: (row.gender as string) || "Unisex",
                    color: row.color || "",
                    price: {
                        current: row.price_current,
                        original: row.price_original || 0,
                        discount_percent: row.price_discount_percent || 0,
                        member_price: row.price_member_price || 0,
                        currency: row.price_currency,
                    },
                    sizes: row.sizes.length > 0 ? row.sizes : [],
                    description: {
                        subtitle: row.description_subtitle || "",
                        tagline: row.description_tagline || "",
                        intro: row.description_intro || "",
                        collection: row.description_collection || "",
                        key_benefits: row.description_key_benefits || [],
                        technical_details: {
                            range: row.technical_range || "",
                            sole_type: row.technical_sole_type || "",
                            upper_material: row.technical_upper_material || "",
                            adjustment: row.technical_adjustment || "",
                        },
                    },
                };

                if (row.main_image) doc.main_image = row.main_image;
                if (row.thumbnail) doc.thumbnail = row.thumbnail;
                if (row.image_gallery && row.image_gallery.length > 0) doc.image_gallery = row.image_gallery;

                await adminClient.createOrReplace(doc as Parameters<typeof adminClient.createOrReplace>[0]);
                created++;
                results.push({ index: i, id: productId, success: true });
            } catch (err) {
                failed++;
                const msg = err instanceof Error ? err.message : "Unknown error";
                results.push({ index: i, id: productId, success: false, error: msg });
            }
        }

        revalidatePath("/admin/products");
        revalidatePath("/admin/products/batch-upload");

        return ok({ created, failed, results });
    } catch (err) {
        return fromCaughtError(err, "batch_create_failed");
    }
}
