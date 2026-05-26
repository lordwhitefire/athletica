import type { Product } from "@/types/product";
import {
    getAllProductsSanity,
    getProductBySlugSanity,
    getProductsByModelLineSanity,
    getProductsByBrandSanity,
    getProductsByTractionSanity,
} from "@/lib/getProductsSanity";

let cachedProducts: Product[] | null = null;
let cachePromise: Promise<Product[]> | null = null;

async function getCachedProducts(): Promise<Product[]> {
    if (cachedProducts) return cachedProducts;
    if (cachePromise) return cachePromise;
    cachePromise = getAllProductsSanity().then((products) => {
        cachedProducts = products;
        return products;
    });
    return cachePromise;
}

export async function getAllProducts(): Promise<Product[]> {
    return getCachedProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
    const cached = cachedProducts?.find((p) => p.url_slug === slug);
    if (cached) return cached;
    return getProductBySlugSanity(slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
    const cached = cachedProducts?.find((p) => p.id === id);
    if (cached) return cached;
    const products = await getCachedProducts();
    return products.find((p) => p.id === id);
}

export async function getProductsByModelLine(modelLine: string, excludeId?: string): Promise<Product[]> {
    const cached = cachedProducts;
    if (cached) return cached.filter((p) => p.model_line === modelLine && p.id !== excludeId);
    return getProductsByModelLineSanity(modelLine, excludeId);
}

export async function getProductsByBrand(brand: string, excludeModelLine?: string, excludeId?: string): Promise<Product[]> {
    const cached = cachedProducts;
    if (cached) return cached.filter((p) => p.brand === brand && p.model_line !== excludeModelLine && p.id !== excludeId);
    return getProductsByBrandSanity(brand, excludeModelLine, excludeId);
}

export async function getProductsByTraction(traction: string, excludeId?: string): Promise<Product[]> {
    const cached = cachedProducts;
    if (cached) return cached.filter((p) => p.traction === traction && p.id !== excludeId);
    return getProductsByTractionSanity(traction, excludeId);
}

export async function getAllBrands(): Promise<string[]> {
    const products = await getCachedProducts();
    return [...new Set(products.map((p) => p.brand))].sort();
}

export async function getAllCategories(): Promise<string[]> {
    const products = await getCachedProducts();
    return [...new Set(products.map((p) => p.category))].sort();
}
