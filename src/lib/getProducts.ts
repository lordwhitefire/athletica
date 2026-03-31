import { Product } from "@/types/product";
import productsData from "@/data/products.json";

// Cast the imported JSON to our Product type
const products: Product[] = productsData as Product[];

// Get all products
export function getAllProducts(): Product[] {
    return products;
}

// Get a single product by its url_slug
export function getProductBySlug(slug: string): Product | undefined {
    return products.find((p) => p.url_slug === slug);
}

// Get a single product by its id
export function getProductById(id: string): Product | undefined {
    return products.find((p) => p.id === id);
}

// Get all products that share the same model_line
// Used on product detail page for "More from this model line" carousel
export function getProductsByModelLine(
    modelLine: string,
    excludeId?: string
): Product[] {
    return products.filter(
        (p) => p.model_line === modelLine && p.id !== excludeId
    );
}

// Get all products from the same brand
// Used on product detail page for "More from this brand" carousel
export function getProductsByBrand(
    brand: string,
    excludeModelLine?: string,
    excludeId?: string
): Product[] {
    return products.filter(
        (p) =>
            p.brand === brand &&
            p.model_line !== excludeModelLine &&
            p.id !== excludeId
    );
}

// Get all products with the same traction type
// Used on product detail page for "Similar surface type" carousel
export function getProductsByTraction(
    traction: string,
    excludeId?: string
): Product[] {
    return products.filter(
        (p) => p.traction === traction && p.id !== excludeId
    );
}

// Get all unique brands from the full product list
export function getAllBrands(): string[] {
    return [...new Set(products.map((p) => p.brand))].sort();
}

// Get all unique categories from the full product list
export function getAllCategories(): string[] {
    return [...new Set(products.map((p) => p.category))].sort();
}