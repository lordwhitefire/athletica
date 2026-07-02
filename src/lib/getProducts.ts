import { cache } from "react";
import * as fs from "fs";
import * as path from "path";
import { splitModel } from "@/lib/model";
import type { Product } from "@/types/product";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";

function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    ...raw,
    brand: typeof raw.brand === "object" && raw.brand ? (raw.brand as Record<string, unknown>).name as string : raw.brand as string,
  } as Product;
}

const getCachedProducts = cache(async (): Promise<ApiResult<Product[]>> => {
    try {
        const productsDir = path.join(process.cwd(), "..", "data", "products");
        const files = await fs.promises.readdir(productsDir);
        const products: Product[] = [];
        for (const file of files.filter(f => f.endsWith(".json"))) {
            const filePath = path.join(productsDir, file);
            const raw = JSON.parse(await fs.promises.readFile(filePath, "utf-8"));
            products.push(normalizeProduct(raw));
        }
        return ok(products);
    } catch (err) {
        return fromCaughtError(err, "products_read_failed");
    }
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
