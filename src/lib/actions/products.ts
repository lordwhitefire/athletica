"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { productFormSchema } from "@/lib/schemas/product";
import type {
    CatalogProduct,
    CatalogFilters,
    ProductStatus,
    MissingData,
} from "@/components/admin/product-catalog/product-catalog.interactions";
import type { ProductSummary } from "@/lib/products/types";
import {
    getProducts,
    getFacets,
    resolveBrandFilter,
    resolveCategoryFilter,
    resolveModelPath,
    getCachedCatalogStats,
    getCachedCategoryCounts,
} from "@/lib/products/product-service";
import type { ProductFilters } from "@/lib/products/types";

export type ProductQuery = {
    search?: string;
    category?: string;
    brand?: string;
    status?: "published" | "unpublished";
    missingData?: "asin" | "image" | "category" | "none";
    sort?: CatalogFilters["sort"];
    page?: number;
    pageSize?: number;
};

export interface CatalogFacets {
    categories: string[];
    brands: string[];
    kpis: {
        total: number;
        active: number;
        unpublished: number;
        missingAsin: number;
        missingImages: number;
        missingCategories: number;
        createdThisMonth: number;
    };
}

const ASIN_RE = /(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?#]|$)/i;

function extractAsin(value: string | null | undefined): string | null {
    if (!value) return null;
    const match = ASIN_RE.exec(value);
    if (match) return match[1];
    const last = value.split("/").filter(Boolean).pop() ?? "";
    return /^[A-Z0-9]{10}$/.test(last) ? last : null;
}

function sanityImageUrl(ref: string | null | undefined): string | null {
    if (!ref) return null;
    if (ref.startsWith("http")) return ref;
    if (!ref.startsWith("image-")) return null;
    return `https://cdn.sanity.io/images/cuiis46d/production/${ref
        .replace("image-", "")
        .replace(/-([^-]+)$/, ".$1")}`;
}

function assetToUrl(value: string | null | undefined): string | null {
    if (!value) return null;
    if (value.startsWith("http")) return value;
    return sanityImageUrl(value);
}

function slugify(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function missingDataOf(
    hasAsin: boolean,
    hasImage: boolean,
    hasCategory: boolean,
): MissingData {
    if (!hasAsin) return "asin";
    if (!hasImage) return "image";
    if (!hasCategory) return "category";
    return "none";
}

function toCatalogProduct(p: ProductSummary): CatalogProduct {
    return {
        id: p.id,
        name: p.name ?? p.model ?? "Unnamed",
        sku: p.model ?? p.id,
        brand: p.brand?.name ?? "",
        category: p.category?.name ?? "",
        categoryDetail: "",
        price: typeof p.price === "number" ? p.price : 0,
        status: p.status,
        asin: extractAsin(p.asin ?? undefined),
        imageUrl: p.image_links?.[0] ?? null,
        clicks: 0,
        addedAt: p.created_at,
        missingData: missingDataOf(
            Boolean(p.asin),
            Boolean(p.image_links && p.image_links.length > 0),
            Boolean(p.category),
        ),
    };
}

const CATALOG_SORT_MAP: Record<NonNullable<ProductQuery["sort"]>, ProductFilters["sort"]> = {
    newest: "newest",
    oldest: "oldest",
    "price-high": "price_desc",
    "price-low": "price_asc",
    name: "name_asc",
};

function catalogSortToServiceSort(
    sort: ProductQuery["sort"],
): ProductFilters["sort"] {
    return sort ? CATALOG_SORT_MAP[sort] : "newest";
}

/* ============================================================
   PRODUCT CATALOG — read via the Product Service
   The Product Service remains the single product access path.
   ============================================================ */

export async function getCatalogProducts(
    query: ProductQuery = {},
): Promise<ApiResult<{ items: CatalogProduct[]; total: number }>> {
    try {
        const filters: ProductFilters = {
            search: query.search,
            status: query.status ?? "all",
            missingData: query.missingData,
            sort: catalogSortToServiceSort(query.sort),
            page: 1,
            pageSize: 100,
        };

        if (query.category && query.category !== "all") {
            const slug = await resolveCategoryFilter(query.category);
            if (slug) filters.category = slug;
        }
        if (query.brand && query.brand !== "all") {
            const slug = await resolveBrandFilter(query.brand);
            if (slug) filters.brand = slug;
        }

        const result = await getProducts(filters);

        const items: CatalogProduct[] = result.items.map(toCatalogProduct);

        return ok({ items, total: result.total });
    } catch (err) {
        return fromCaughtError(err, "catalog_products_fetch_failed");
    }
}

export async function getCatalogFacets(): Promise<ApiResult<CatalogFacets>> {
    try {
        const [stats, categoryCounts] = await Promise.all([
            getCachedCatalogStats(),
            getCachedCategoryCounts(),
        ]);

        const { data: brandRows } = await adminSupabase
            .from("brands")
            .select("name")
            .order("name");

        return ok({
            categories: categoryCounts
                .map((c) => c.name)
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b)),
            brands: (brandRows ?? [])
                .map((b) => b.name)
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b)),
            kpis: {
                total: stats.total,
                active: stats.active,
                unpublished: stats.unpublished,
                missingAsin: stats.missingAsin,
                missingImages: stats.missingImages,
                missingCategories: stats.missingCategories,
                createdThisMonth: stats.createdThisMonth,
            },
        });
    } catch (err) {
        return fromCaughtError(err, "catalog_facets_fetch_failed");
    }
}

/* ============================================================
   PRODUCT EDITOR + QUICK CREATE + BULK OPS — write to Supabase
   ============================================================ */

export async function getAllProductsAdmin(search?: string): Promise<ApiResult<unknown[]>> {
    try {
        let q = adminSupabase
            .from("products")
            .select("*")
            .order("model", { ascending: true });
        if (search) {
            q = q.or(`name.ilike.%${search}%,model.ilike.%${search}%`);
        }
        const { data } = await q;
        return ok((data ?? []) as unknown[]);
    } catch (err) {
        return fromCaughtError(err, "admin_products_fetch_failed");
    }
}

function parseDescriptionJson(raw: string | null): Record<string, unknown> {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export async function getProductByIdAdmin(id: string): Promise<ApiResult<unknown | null>> {
    try {
        const { data: product } = await adminSupabase
            .from("products")
            .select("*")
            .eq("id", id)
            .single();

        if (!product) return ok(null);

        const [brandRes, categoryRes] = await Promise.all([
            product.brand_id
                ? adminSupabase.from("brands").select("id, name").eq("id", product.brand_id).single()
                : { data: null },
            product.category_id
                ? adminSupabase.from("categories").select("id, name").eq("id", product.category_id).single()
                : { data: null },
        ]);

        const attributes = (product.attributes ?? {}) as Record<string, unknown>;
        const price = (attributes.price ?? {}) as Record<string, unknown>;
        const images = product.image_links ?? [];

        return ok({
            id: product.id,
            url_slug: product.slug,
            model: product.model ?? "",
            name: product.name ?? "",
            category: categoryRes.data?.name ?? "",
            brand: brandRes.data ? { _ref: brandRes.data.id } : null,
            traction: (attributes.traction as string | undefined) ?? null,
            gender: product.gender ?? "Unisex",
            color: product.color ?? "",
            price: {
                current: typeof price.current === "number" ? price.current : product.price ?? 0,
                original: typeof price.original === "number" ? price.original : product.price ?? 0,
                discount_percent: typeof price.discount_percent === "number" ? price.discount_percent : 0,
                member_price: typeof price.member_price === "number" ? price.member_price : product.price ?? 0,
                currency: typeof price.currency === "string" ? price.currency : "EUR",
            },
            description: parseDescriptionJson(product.description as string | null),
            sizes: Array.isArray(product.sizes) ? product.sizes : [],
            sizes_detail: Array.isArray(attributes.sizes_detail) ? attributes.sizes_detail : [],
            asin: product.asin ?? "",
            main_image: images[0] ? { asset: { _type: "reference", _ref: images[0] } } : undefined,
            thumbnail: images[1]
                ? { asset: { _type: "reference", _ref: images[1] } }
                : images[0]
                    ? { asset: { _type: "reference", _ref: images[0] } }
                    : undefined,
            image_gallery: images.map((link: string) => ({ asset: { _type: "reference", _ref: link } })),
        });
    } catch (err) {
        return fromCaughtError(err, "admin_product_fetch_by_id_failed");
    }
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

function parseGalleryAssets(raw: string): string[] {
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

async function resolveCategoryId(name: string): Promise<string | null> {
    const { data } = await adminSupabase
        .from("categories")
        .select("id")
        .or(`name.ilike.${name},slug.ilike.${name}`)
        .limit(1);
    return data && data.length > 0 ? data[0].id : null;
}

async function resolveLeafModelId(modelPath: string): Promise<string | null> {
    if (!modelPath.trim()) return null;
    const node = await resolveModelPath(modelPath);
    if (!node) return null;
    if (node.hasChildren) return null;
    return node.id;
}

function buildDescriptionObject(raw: Record<string, string>): string {
    return JSON.stringify({
        subtitle: raw.desc_subtitle ?? "",
        tagline: raw.desc_tagline ?? "",
        intro: raw.desc_intro ?? "",
        collection: raw.desc_collection ?? "",
        key_benefits: parseJsonArray(raw.key_benefits_json),
        technical_details: {
            range: raw.tech_range ?? "",
            sole_type: raw.tech_sole ?? "",
            upper_material: raw.tech_upper ?? "",
            adjustment: raw.tech_adjustment ?? "",
        },
    });
}

function buildPriceAttributes(raw: Record<string, string>) {
    return {
        price: {
            current: parseFloat(raw.price_current as string) || 0,
            original: parseFloat(raw.price_original as string) || 0,
            discount_percent: parseFloat(raw.discount_percent as string) || 0,
            member_price: parseFloat(raw.member_price as string) || 0,
            currency: (raw.currency as string) || "EUR",
        },
        traction: (raw.traction as string) || null,
        sizes_detail: [],
    };
}

function parseSizesForm(rawSizes: string | undefined): string[] | null {
    if (rawSizes === undefined) return null;
    return rawSizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function parseSizesDetailForm(
    rawJson: string | undefined,
): { size: string; available: boolean }[] | null {
    if (rawJson === undefined || rawJson === "") return null;
    try {
        const parsed: unknown = JSON.parse(rawJson);
        if (!Array.isArray(parsed)) return null;
        return parsed
            .filter(
                (s): s is { size: string } =>
                    Boolean(s) && typeof s === "object" && typeof (s as { size?: unknown }).size === "string",
            )
            .map((s) => ({ size: s.size.trim(), available: (s as { available?: boolean }).available !== false }))
            .filter((s) => s.size.length > 0);
    } catch {
        return null;
    }
}

async function buildProductRow(
    raw: Record<string, string>,
    existing?: {
        attributes: unknown;
        image_links: string[] | null;
        sizes: string[] | null;
        asin?: string | null;
        status?: string | null;
    },
): Promise<{ row: Record<string, unknown>; id: string }> {
    const id = (raw.id as string) || slugify(raw.name || raw.model || "product");
    const name = (raw.name as string) || (raw.model as string) || "";
    const slug = (raw.url_slug as string) || slugify(name) || slugify(id);
    const brandId = (raw.brand_ref as string) || null;
    const categoryId = await resolveCategoryId((raw.category as string) || "");
    const leafModelId = await resolveLeafModelId((raw.model as string) || "");

    const existingAttributes = (existing?.attributes ?? {}) as Record<string, unknown>;
    const existingPrice = (existingAttributes.price ?? {}) as Record<string, unknown>;

    const newPrice = buildPriceAttributes(raw);
    const existingSizes = Array.isArray(existing?.sizes) ? (existing?.sizes as string[]) : [];
    const formSizes = parseSizesForm(raw.sizes);
    const sizes = formSizes ?? existingSizes;
    const formSizesDetail = parseSizesDetailForm(raw.sizes_detail);

    const images = [
        assetToUrl((raw.main_image_asset as string) || null),
        assetToUrl((raw.thumbnail_asset as string) || null),
        ...parseGalleryAssets((raw.gallery_assets as string) || "").map((g) => assetToUrl(g)),
    ].filter((x): x is string => Boolean(x));

    const rawAsin = ((raw.asin as string) || "").trim().toUpperCase();
    const asin = /^[A-Z0-9]{10}$/.test(rawAsin) ? rawAsin : existing?.asin ?? null;

    const attributes = {
        ...existingAttributes,
        price: {
            current: newPrice.price.current,
            original: newPrice.price.original,
            discount_percent: newPrice.price.discount_percent,
            member_price: newPrice.price.member_price,
            currency: newPrice.price.currency,
        },
        traction: newPrice.traction ?? existingPrice.traction ?? null,
        sizes_detail: formSizesDetail ?? existingAttributes.sizes_detail ?? [],
    };

    return {
        id,
        row: {
            id,
            slug,
            name: name || null,
            model: (raw.model as string) || null,
            description: buildDescriptionObject(raw),
            price: newPrice.price.current,
            gender: (raw.gender as string) || "Unisex",
            color: (raw.color as string) || "",
            sizes,
            attributes,
            status: existing?.status === "unpublished" ? ("unpublished" as const) : ("published" as const),
            asin,
            category_id: categoryId,
            brand_id: brandId,
            leaf_model_id: leafModelId,
            image_links: images.length > 0 ? images : null,
        },
    };
}

export async function createProduct(formData: FormData): Promise<ApiResult<{ id: string }>> {
    try {
        const raw = Object.fromEntries(formData.entries()) as Record<string, string>;

        const parsed = validateOrFail(productFormSchema, raw);
        if ("error" in parsed) return parsed.error;

        const { row } = await buildProductRow(raw);

        const { error } = await adminSupabase.from("products").upsert(row as never);
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ id: row.id as string });
    } catch (err) {
        return fromCaughtError(err, "product_create_failed");
    }
}

export async function updateProduct(id: string, formData: FormData): Promise<ApiResult<{ id: string }>> {
    try {
        const raw = Object.fromEntries(formData.entries()) as Record<string, string>;

        const parsed = validateOrFail(productFormSchema, raw);
        if ("error" in parsed) return parsed.error;

        const { data: existing } = await adminSupabase
            .from("products")
            .select("attributes, image_links, sizes, asin, status")
            .eq("id", id)
            .single();

        const { row } = await buildProductRow({ ...raw, id }, existing ?? undefined);

        const { error } = await adminSupabase
            .from("products")
            .update(row as never)
            .eq("id", id);
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ id });
    } catch (err) {
        return fromCaughtError(err, "product_update_failed");
    }
}

export async function deleteProduct(id: string): Promise<ApiResult<{ deleted: true }>> {
    try {
        const { error } = await adminSupabase.from("products").delete().eq("id", id);
        if (error) throw error;
        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "product_delete_failed");
    }
}

export async function createQuickProduct(
    formData: FormData,
    options?: { draft?: boolean }
): Promise<ApiResult<{ id: string }>> {
    try {
        const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
        const name = (raw.name || "").trim();
        const category = (raw.category || "").trim();
        const brandRef = raw.brand_ref as string;
        const asin = (raw.asin || "").trim();
        const modelPath = (raw.model || "").trim();

        if (!name || !category || !brandRef) {
            return fail("validation_error", "quick_product_invalid", "Name, category and brand are required.");
        }

        const id = asin || slugify(name);
        const categoryId = await resolveCategoryId(category);
        const leafModelId = await resolveLeafModelId(modelPath);
        const images = parseGalleryAssets(raw.gallery_assets || "")
            .map((g) => assetToUrl(g))
            .filter((x): x is string => Boolean(x));
        const row: Record<string, unknown> = {
            id,
            slug: slugify(name),
            name,
            model: modelPath || slugify(name),
            description: null,
            price: 0,
            gender: "Unisex",
            color: "",
            sizes: [],
            attributes: {
                price: { current: 0, original: 0, discount_percent: 0, member_price: 0, currency: "EUR" },
                traction: null,
                sizes_detail: [],
            },
            status: options?.draft ? "unpublished" : "published",
            asin: /^[A-Z0-9]{10}$/.test(asin.toUpperCase()) ? asin.toUpperCase() : null,
            category_id: categoryId,
            brand_id: brandRef,
            leaf_model_id: leafModelId,
            image_links: images.length > 0 ? images : null,
        };

        const { error } = await adminSupabase.from("products").upsert(row as never);
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ id });
    } catch (err) {
        return fromCaughtError(err, "product_create_failed");
    }
}

/* ============================================================
   CATALOG QUICK CREATE / BULK OPS
   ============================================================ */

export async function createCatalogProduct(
    payload: Record<string, unknown>,
): Promise<ApiResult<{ id: string }>> {
    try {
        const name = String(payload.name ?? "").trim();
        const sku = String(payload.sku ?? "").trim();
        const category = String(payload.category ?? "").trim();
        const brand = String(payload.brand ?? "").trim();
        const status = (payload.status as ProductStatus) ?? "unpublished";
        const price = Number(payload.price) || 0;
        const asin = payload.asin ? String(payload.asin).trim() : null;
        const modelPath = String(payload.model ?? "").trim();
        // SKU is auto-generated from the name when not provided — never refuse for a missing SKU.
        const finalSku = sku || slugify(name);

        if (!name || !category || !brand) {
            return fail("validation_error", "catalog_product_invalid", "Name, brand and category are required.");
        }

        const brandRes = await adminSupabase.from("brands").select("id").or(`name.ilike.${brand},slug.ilike.${brand}`).limit(1);
        const brandRow = brandRes.data && brandRes.data.length > 0 ? brandRes.data[0] : null;
        if (!brandRow) {
            return fail("validation_error", "catalog_brand_not_found", `Brand "${brand}" does not exist.`);
        }

        const categoryId = await resolveCategoryId(category);
        const id = slugify(finalSku || name);
        const images = Array.isArray(payload.images)
            ? (payload.images as unknown[]).map((img) => assetToUrl(String(img))).filter((x): x is string => Boolean(x))
            : parseGalleryAssets(String(payload.gallery_assets ?? ""))
                .map((g) => assetToUrl(g))
                .filter((x): x is string => Boolean(x));
        const row: Record<string, unknown> = {
            id,
            slug: slugify(name),
            name,
            model: modelPath || finalSku,
            description: null,
            price,
            gender: "Unisex",
            color: "",
            sizes: [],
            attributes: {
                price: { current: price, original: price, discount_percent: 0, member_price: price, currency: "EUR" },
                traction: null,
                sizes_detail: [],
            },
            status,
            asin,
            category_id: categoryId,
            brand_id: brandRow.id,
            leaf_model_id: await resolveLeafModelId(modelPath || finalSku),
            image_links: images.length > 0 ? images : null,
        };

        const { error } = await adminSupabase.from("products").upsert(row as never);
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ id });
    } catch (err) {
        return fromCaughtError(err, "catalog_product_create_failed");
    }
}

export async function updateCatalogProduct(
    id: string,
    payload: Record<string, unknown>,
): Promise<ApiResult<{ id: string }>> {
    try {
        const patch: Record<string, unknown> = {};

        if (payload.status !== undefined) {
            patch.status = payload.status as ProductStatus;
        }
        if (payload.name !== undefined) {
            patch.name = String(payload.name).trim();
            patch.slug = slugify(String(payload.name));
        }
        if (payload.sku !== undefined) {
            patch.model = String(payload.sku).trim();
        }
        if (payload.price !== undefined) {
            const price = Number(payload.price) || 0;
            patch.price = price;
            patch.attributes = { price: { current: price, original: price, discount_percent: 0, member_price: price, currency: "EUR" } };
        }
        if (payload.brand !== undefined) {
            const brandName = String(payload.brand).trim();
            const brandRes = await adminSupabase.from("brands").select("id").or(`name.ilike.${brandName},slug.ilike.${brandName}`).limit(1);
            const brandRow = brandRes.data && brandRes.data.length > 0 ? brandRes.data[0] : null;
            if (!brandRow) {
                return fail("validation_error", "catalog_brand_not_found", `Brand "${brandName}" does not exist.`);
            }
            patch.brand_id = brandRow.id;
        }
        if (payload.category !== undefined) {
            const categoryId = await resolveCategoryId(String(payload.category));
            patch.category_id = categoryId;
        }
        if (payload.asin !== undefined) {
            patch.asin = payload.asin ? String(payload.asin).trim() : null;
        }

        const { error } = await adminSupabase.from("products").update(patch as never).eq("id", id);
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ id });
    } catch (err) {
        return fromCaughtError(err, "catalog_product_update_failed");
    }
}

export async function bulkSetProductStatus(
    ids: string[],
    status: ProductStatus,
): Promise<ApiResult<{ updated: number }>> {
    try {
        const { error } = await adminSupabase
            .from("products")
            .update({ status } as never)
            .in("id", ids);
        if (error) throw error;
        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ updated: ids.length });
    } catch (err) {
        return fromCaughtError(err, "catalog_bulk_status_failed");
    }
}

export async function bulkAssignCategory(
    ids: string[],
    category: string,
): Promise<ApiResult<{ updated: number }>> {
    try {
        const categoryId = await resolveCategoryId(category);
        if (!categoryId) {
            return fail("validation_error", "catalog_category_not_found", `Category "${category}" does not exist.`);
        }
        const { error } = await adminSupabase
            .from("products")
            .update({ category_id: categoryId } as never)
            .in("id", ids);
        if (error) throw error;
        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ updated: ids.length });
    } catch (err) {
        return fromCaughtError(err, "catalog_bulk_category_failed");
    }
}

export async function bulkAssignBrand(
    ids: string[],
    brand: string,
): Promise<ApiResult<{ updated: number }>> {
    try {
        const brandRes = await adminSupabase.from("brands").select("id").or(`name.ilike.${brand},slug.ilike.${brand}`).limit(1);
        const brandRow = brandRes.data && brandRes.data.length > 0 ? brandRes.data[0] : null;
        if (!brandRow) {
            return fail("validation_error", "catalog_brand_not_found", `Brand "${brand}" does not exist.`);
        }
        const { error } = await adminSupabase
            .from("products")
            .update({ brand_id: brandRow.id } as never)
            .in("id", ids);
        if (error) throw error;
        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ updated: ids.length });
    } catch (err) {
        return fromCaughtError(err, "catalog_bulk_brand_failed");
    }
}

export async function bulkSetAsin(
    ids: string[],
    asin: string,
): Promise<ApiResult<{ updated: number }>> {
    try {
        const clean = asin.trim().toUpperCase();
        if (!/^[A-Z0-9]{10}$/.test(clean)) {
            return fail("validation_error", "catalog_asin_invalid", "ASIN must be 10 alphanumeric characters.");
        }
        const { error } = await adminSupabase
            .from("products")
            .update({ asin: clean } as never)
            .in("id", ids);
        if (error) throw error;
        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ updated: ids.length });
    } catch (err) {
        return fromCaughtError(err, "catalog_bulk_asin_failed");
    }
}

export async function bulkDeleteProducts(
    ids: string[],
): Promise<ApiResult<{ deleted: number }>> {
    try {
        const { error } = await adminSupabase.from("products").delete().in("id", ids);
        if (error) throw error;
        revalidateTag("products", "max");
        revalidatePath("/admin/products");
        return ok({ deleted: ids.length });
    } catch (err) {
        return fromCaughtError(err, "catalog_bulk_delete_failed");
    }
}

export interface CatalogExportRow {
    name: string;
    sku: string;
    brand: string;
    category: string;
    price: number;
    status: ProductStatus;
    asin: string | null;
    clicks: number;
    addedAt: string;
    missingData: MissingData;
}

export async function exportProductMetadata(
    ids?: string[],
): Promise<ApiResult<{ rows: CatalogExportRow[] }>> {
    try {
        const result = await getProducts({ page: 1, pageSize: 100, status: "all" });
        let items = result.items.map(toCatalogProduct);
        if (ids && ids.length > 0) {
            items = items.filter((item) => ids.includes(item.id));
        }
        return ok({
            rows: items.map((item) => ({
                name: item.name,
                sku: item.sku,
                brand: item.brand,
                category: item.category,
                price: item.price,
                status: item.status,
                asin: item.asin,
                clicks: item.clicks,
                addedAt: item.addedAt,
                missingData: item.missingData,
            })),
        });
    } catch (err) {
        return fromCaughtError(err, "catalog_export_failed");
    }
}

/* ============================================================
   IMPORT CENTER — validation report from Supabase
   ============================================================ */

export type ImportErrorRow = {
    row: number;
    issue: string;
    value: string;
    product: string;
    problem: string;
};

export type ImportIssueData = {
    key: string;
    label: string;
    count: number;
    critical: boolean;
    rows: ImportErrorRow[];
};

export type ImportValidationData = {
    totalRows: number;
    validRows: number;
    issueRows: number;
    criticalErrors: number;
    issues: ImportIssueData[];
};

export async function getImportValidationData(): Promise<ApiResult<ImportValidationData>> {
    try {
        const all: CatalogProduct[] = [];
        let page = 1;
        for (;;) {
            const result = await getProducts({ page, pageSize: 200, status: "all" });
            all.push(...result.items.map(toCatalogProduct));
            if (result.items.length === 0 || page >= result.totalPages) break;
            page += 1;
        }

        const byName = new Map<string, number>();
        const bySku = new Map<string, number>();
        for (const item of all) {
            byName.set(item.name, (byName.get(item.name) ?? 0) + 1);
            bySku.set(item.sku, (bySku.get(item.sku) ?? 0) + 1);
        }

        const issueDefs: { key: string; label: string; critical: boolean; test: (item: CatalogProduct) => boolean; value: (item: CatalogProduct) => string; problem: string }[] = [
            {
                key: "missingAsin",
                label: "Missing Amazon ASIN",
                critical: true,
                test: (item) => !item.asin,
                value: () => "—",
                problem: "Amazon ASIN is required for affiliate linking.",
            },
            {
                key: "missingImages",
                label: "Missing Images",
                critical: false,
                test: (item) => !item.imageUrl,
                value: () => "—",
                problem: "A product image is required for the storefront.",
            },
            {
                key: "missingCategories",
                label: "Missing Categories",
                critical: false,
                test: (item) => !item.category,
                value: () => "—",
                problem: "Every product must belong to a category.",
            },
            {
                key: "invalidPrice",
                label: "Invalid Price",
                critical: true,
                test: (item) => item.price <= 0,
                value: (item) => (item.price <= 0 ? String(item.price) : "—"),
                problem: "Price must be greater than 0.",
            },
            {
                key: "duplicates",
                label: "Duplicate Products",
                critical: false,
                test: (item) => (byName.get(item.name) ?? 0) > 1 || (bySku.get(item.sku) ?? 0) > 1,
                value: (item) => item.sku,
                problem: "Products with the same name or SKU already exist.",
            },
        ];

        const issues: ImportIssueData[] = [];
        const affectedRows = new Set<number>();
        let criticalCount = 0;

        issueDefs.forEach((def) => {
            const rows: ImportErrorRow[] = [];
            all.forEach((item, index) => {
                if (!def.test(item)) return;
                affectedRows.add(index + 1);
                if (def.critical) criticalCount += 1;
                rows.push({
                    row: index + 1,
                    issue: def.label,
                    value: def.value(item),
                    product: item.name,
                    problem: def.problem,
                });
            });
            issues.push({ key: def.key, label: def.label, count: rows.length, critical: def.critical, rows });
        });

        const issueRows = affectedRows.size;
        const totalRows = all.length;

        return ok({
            totalRows,
            validRows: totalRows - issueRows,
            issueRows,
            criticalErrors: criticalCount,
            issues,
        });
    } catch (err) {
        return fromCaughtError(err, "import_validation_fetch_failed");
    }
}