import { cache } from "react";
import { splitModel } from "@/lib/model";
import type { Product } from "@/types/product";
import type { ApiResult } from "@/lib/api-types";
import { ok } from "@/lib/api-types";
import { getAllProductsSanity } from "@/lib/getProductsSanity";

const getCachedProducts = cache(async (): Promise<ApiResult<Product[]>> => {
    return getAllProductsSanity();
});

export async function getAllProducts(): Promise<ApiResult<Product[]>> {
    return getCachedProducts();
}

export async function getProductBySlug(slug: string): Promise<ApiResult<Product | null>> {
    const result = await getCachedProducts();
    if (result.error) return result;
    const found = result.data.find((p) => p.url_slug === slug);
    return ok(found ?? null);
}

export async function getProductById(id: string): Promise<ApiResult<Product | undefined>> {
    const result = await getCachedProducts();
    if (result.error) return result;
    return ok(result.data.find((p) => p.id === id));
}

export async function getProductsByName(name: string, excludeId?: string): Promise<ApiResult<Product[]>> {
    const result = await getCachedProducts();
    if (result.error) return result;
    return ok(result.data.filter((p) => p.name === name && p.id !== excludeId));
}

export async function getProductsByModelPrefix(prefix: string, excludeId?: string): Promise<ApiResult<Product[]>> {
    const result = await getCachedProducts();
    if (result.error) return result;
    return ok(result.data.filter((p) => {
        if (p.id === excludeId) return false;
        const otherPrefix = splitModel(p.model).slice(0, -1).join("/");
        return otherPrefix === prefix;
    }));
}

export async function getProductsByBrand(brand: string, excludeName?: string, excludeId?: string): Promise<ApiResult<Product[]>> {
    const result = await getCachedProducts();
    if (result.error) return result;
    return ok(result.data.filter((p) => p.brand === brand && p.name !== excludeName && p.id !== excludeId));
}

export async function getProductsByTraction(traction: string, excludeId?: string): Promise<ApiResult<Product[]>> {
    const result = await getCachedProducts();
    if (result.error) return result;
    return ok(result.data.filter((p) => p.traction === traction && p.id !== excludeId));
}

export async function getAllBrands(): Promise<ApiResult<string[]>> {
    const result = await getCachedProducts();
    if (result.error) return result;
    return ok([...new Set(result.data.map((p) => p.brand))].sort());
}

export async function getAllCategories(): Promise<ApiResult<string[]>> {
    const result = await getCachedProducts();
    if (result.error) return result;
    return ok([...new Set(result.data.map((p) => p.category))].sort());
}
