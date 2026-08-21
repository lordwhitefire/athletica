"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import type { ApiResult } from "@/lib/api-types";
import { slugify, generateId } from "@/lib/rebuild-nav-urls";
import { batchProcessedRowSchema, type BatchProcessedRow, type BatchUploadCreateResult } from "@/lib/schemas/batch-upload";
import { resolveModelPath } from "@/lib/products/product-service";

function assetRefToUrl(ref: string): string {
    if (ref.startsWith("http")) return ref;
    if (!ref.startsWith("image-")) return ref;
    return `https://cdn.sanity.io/images/cuiis46d/production/${ref
        .replace("image-", "")
        .replace(/-([^-]+)$/, ".$1")}`;
}

function imageLinksOf(row: BatchProcessedRow): string[] {
    const links: string[] = [];
    if (row.main_image?.asset._ref) links.push(assetRefToUrl(row.main_image.asset._ref));
    if (row.thumbnail?.asset._ref) links.push(assetRefToUrl(row.thumbnail.asset._ref));
    for (const img of row.image_gallery) {
        if (img.asset._ref) links.push(assetRefToUrl(img.asset._ref));
    }
    return links;
}

async function resolveBrandId(brandName: string): Promise<string | null> {
    const { data } = await adminSupabase
        .from("brands")
        .select("id")
        .or(`name.ilike.${brandName},slug.ilike.${brandName}`)
        .limit(1);
    if (data && data.length > 0) return data[0].id;

    const { data: created, error } = await adminSupabase
        .from("brands")
        .insert({ slug: slugify(brandName), name: brandName, logo_link: null })
        .select("id")
        .single();
    if (error || !created) return null;
    return created.id;
}

async function resolveCategoryId(categoryName: string): Promise<string | null> {
    if (!categoryName.trim()) return null;
    const { data } = await adminSupabase
        .from("categories")
        .select("id")
        .or(`name.ilike.${categoryName},slug.ilike.${categoryName}`)
        .limit(1);
    return data && data.length > 0 ? data[0].id : null;
}

async function resolveLeafModelId(model: string): Promise<string | null> {
    if (!model.trim()) return null;
    const node = await resolveModelPath(model);
    if (!node || node.hasChildren) return null;
    return node.id;
}

async function uniqueProductSlug(base: string): Promise<string> {
    const slug = slugify(base) || "product";
    const { data } = await adminSupabase.from("products").select("slug").like("slug", `${slug}%`);
    const existing = new Set(
        (data ?? [])
            .map((r) => r.slug)
            .filter((s): s is string => Boolean(s)),
    );
    if (!existing.has(slug)) return slug;
    let candidate = slug;
    let n = 2;
    while (existing.has(candidate)) {
        candidate = `${slug}-${n}`;
        n += 1;
    }
    return candidate;
}

function rowErrorMessage(err: unknown): string {
    if (err && typeof err === "object") {
        const e = err as { code?: string; message?: string; details?: string };
        if (e.code === "23505") return `duplicate value${e.details ? `: ${e.details}` : " (unique constraint)"}`;
        if (e.code === "23503") return `referenced record not found${e.details ? `: ${e.details}` : ""}`;
        if (e.code === "22P02") return `invalid value format${e.details ? `: ${e.details}` : ""}`;
        if (e.message) return e.message;
    }
    return err instanceof Error ? err.message : "Unknown error";
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
                const brandId = await resolveBrandId(row.brand);
                const categoryId = await resolveCategoryId(row.category);
                const leafModelId = await resolveLeafModelId(row.model);
                const imageLinks = imageLinksOf(row);

                const rowData: Record<string, unknown> = {
                    id: productId,
                    slug: await uniqueProductSlug(row.model),
                    name: row.name || row.model,
                    model: row.model,
                    description: JSON.stringify({
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
                    }),
                    price: row.price_current,
                    gender: row.gender,
                    color: row.color || "",
                    sizes: row.sizes.map((s) => s.size),
                    attributes: {
                        price: {
                            current: row.price_current,
                            original: row.price_original || 0,
                            discount_percent: row.price_discount_percent || 0,
                            member_price: row.price_member_price || 0,
                            currency: row.price_currency,
                        },
                        traction: row.traction || null,
                        sizes_detail: row.sizes,
                    },
                    status: "published",
                    asin: null,
                    category_id: categoryId,
                    brand_id: brandId,
                    leaf_model_id: leafModelId,
                    image_links: imageLinks.length > 0 ? imageLinks : null,
                };

                const { error } = await adminSupabase.from("products").insert(rowData as never);
                if (error) throw error;
                created++;
                results.push({ index: i, id: productId, success: true });
            } catch (err) {
                failed++;
                results.push({ index: i, id: productId, success: false, error: rowErrorMessage(err) });
            }
        }

        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        revalidatePath("/admin/products/batch-upload");
        revalidatePath("/admin/import-center");

        return ok({ created, failed, results });
    } catch (err) {
        return fromCaughtError(err, "batch_create_failed");
    }
}