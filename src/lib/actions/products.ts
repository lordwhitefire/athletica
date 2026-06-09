"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { productFormSchema } from "@/lib/schemas/product";

export async function getAllProductsAdmin(search?: string): Promise<ApiResult<unknown[]>> {
    try {
        let query = `*[_type == "product"]`;
        if (search) {
            query = `*[_type == "product" && model match $search]`;
        }
        query += ` | order(model asc) { _id, id, model, "brand_name": coalesce(brand->name, brand), "brand_ref": brand._ref, category, price, url_slug, color }`;
        const params = search ? { search: `${search}*` } : {};
        const results = await adminClient.fetch(query, params);
        return ok(results as unknown[]);
    } catch (err) {
        return fromCaughtError(err, "admin_products_fetch_failed");
    }
}

export async function getProductByIdAdmin(id: string): Promise<ApiResult<unknown>> {
    try {
        const product = await adminClient.fetch(`*[_id == $id][0] { ..., "brand_name": coalesce(brand->name, brand), "brand_ref": brand._ref }`, { id });
        return ok(product);
    } catch (err) {
        return fromCaughtError(err, "admin_product_fetch_by_id_failed");
    }
}

function imgRef(assetId: string | null) {
    if (!assetId) return undefined;
    return { _type: "image" as const, asset: { _type: "reference" as const, _ref: assetId } };
}

function parseJsonArray(raw: string | undefined): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
    } catch {
        return [];
    }
}

function parseGalleryAssets(raw: string): { _type: "image"; asset: { _type: "reference"; _ref: string }; _key: string }[] {
    if (!raw) return [];
    return raw.split(",").filter(Boolean).map((id, i) => ({
        _type: "image" as const,
        asset: { _type: "reference" as const, _ref: id.trim() },
        _key: `gallery-${i}`,
    }));
}

export async function createProduct(formData: FormData): Promise<ApiResult<{ id: string }>> {
    try {
        const raw = Object.fromEntries(formData.entries());

        const parsed = validateOrFail(productFormSchema, raw);
        if ("error" in parsed) return parsed.error;

        const brandRef = raw.brand_ref as string;
        const doc: Record<string, unknown> = {
            _type: "product",
            _id: raw.id as string,
            id: raw.id as string,
            url_slug: { _type: "slug", current: raw.url_slug as string },
            model: raw.model as string,
            brand: brandRef ? { _type: "reference", _ref: brandRef } : null,
            category: raw.category as string,
            traction: (raw.traction as string) || null,
            name: (raw.name as string) || null,
            gender: (raw.gender as string) || "Unisex",

            color: (raw.color as string) || "",
            price: {
                current: parseFloat(raw.price_current as string) || 0,
                original: parseFloat(raw.price_original as string) || 0,
                discount_percent: parseFloat(raw.discount_percent as string) || 0,
                member_price: parseFloat(raw.member_price as string) || 0,
                currency: (raw.currency as string) || "EUR",
            },
            sizes: [],
            description: {
                subtitle: (raw.desc_subtitle as string) || "",
                tagline: (raw.desc_tagline as string) || "",
                intro: (raw.desc_intro as string) || "",
                collection: (raw.desc_collection as string) || "",
                key_benefits: parseJsonArray(raw.key_benefits_json as string),
                technical_details: {
                    range: (raw.tech_range as string) || "",
                    sole_type: (raw.tech_sole as string) || "",
                    upper_material: (raw.tech_upper as string) || "",
                    adjustment: (raw.tech_adjustment as string) || "",
                },
            },
        };

        const mainImg = imgRef((raw.main_image_asset as string) || null);
        const thumb = imgRef((raw.thumbnail_asset as string) || null);
        const gallery = parseGalleryAssets(raw.gallery_assets as string);

        if (mainImg) doc.main_image = mainImg;
        if (thumb) doc.thumbnail = thumb;
        if (gallery.length > 0) doc.image_gallery = gallery;

        await adminClient.createOrReplace(doc as Parameters<typeof adminClient.createOrReplace>[0]);
        revalidatePath("/admin/products");
        return ok({ id: raw.id as string });
    } catch (err) {
        return fromCaughtError(err, "product_create_failed");
    }
}

export async function updateProduct(id: string, formData: FormData): Promise<ApiResult<{ id: string }>> {
    try {
        const raw = Object.fromEntries(formData.entries());

        const parsed = validateOrFail(productFormSchema, raw);
        if ("error" in parsed) return parsed.error;

        const brandRef = raw.brand_ref as string;
        const patch: Record<string, unknown> = {
            model: raw.model as string,
            brand: brandRef ? { _type: "reference", _ref: brandRef } : null,
            category: raw.category as string,
            traction: (raw.traction as string) || null,
            name: (raw.name as string) || null,
            gender: (raw.gender as string) || "Unisex",

            color: (raw.color as string) || "",
            price: {
                current: parseFloat(raw.price_current as string) || 0,
                original: parseFloat(raw.price_original as string) || 0,
                discount_percent: parseFloat(raw.discount_percent as string) || 0,
                member_price: parseFloat(raw.member_price as string) || 0,
                currency: (raw.currency as string) || "EUR",
            },
            description: {
                subtitle: (raw.desc_subtitle as string) || "",
                tagline: (raw.desc_tagline as string) || "",
                intro: (raw.desc_intro as string) || "",
                collection: (raw.desc_collection as string) || "",
                key_benefits: parseJsonArray(raw.key_benefits_json as string),
                technical_details: {
                    range: (raw.tech_range as string) || "",
                    sole_type: (raw.tech_sole as string) || "",
                    upper_material: (raw.tech_upper as string) || "",
                    adjustment: (raw.tech_adjustment as string) || "",
                },
            },
        };

        const mainImg = imgRef((raw.main_image_asset as string) || null);
        const thumb = imgRef((raw.thumbnail_asset as string) || null);
        const gallery = parseGalleryAssets(raw.gallery_assets as string);

        if (mainImg !== undefined) patch.main_image = mainImg;
        if (thumb !== undefined) patch.thumbnail = thumb;
        if (gallery.length > 0) {
            patch.image_gallery = gallery;
        } else {
            patch.image_gallery = [];
        }

        await adminClient.patch(id).set(patch).commit();
        revalidatePath("/admin/products");
        return ok({ id });
    } catch (err) {
        return fromCaughtError(err, "product_update_failed");
    }
}

export async function deleteProduct(id: string): Promise<ApiResult<{ deleted: true }>> {
    try {
        await adminClient.delete(id);
        revalidatePath("/admin/products");
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "product_delete_failed");
    }
}
