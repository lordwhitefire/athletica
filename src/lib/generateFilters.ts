import { Product, FilterOptions } from "@/types/product";

export function generateFilters(products: Product[]): FilterOptions {
    // Collect all available sizes from all products
    // Only include sizes that are available (in stock)
    const availableSizes = products.flatMap((p) =>
        p.sizes.filter((s) => s.available).map((s) => s.size)
    );

    // Collect all colors including from color_variants
    const allColors = products.flatMap((p) => [
        p.color,
        ...p.color_variants.map((cv) => cv.color),
    ]);

    // Get all prices to calculate min and max
    const allPrices = products.map((p) => p.price.current);

    // Get all model lines — filter out null values
    const allModelLines = products
        .map((p) => p.model_line)
        .filter((m): m is string => m !== null);

    // Get all tractions — filter out null values
    const allTractions = products
        .map((p) => p.traction)
        .filter((t): t is string => t !== null);

    return {
        // Remove duplicates and sort alphabetically
        brands: [...new Set(products.map((p) => p.brand))].sort(),

        model_lines: [...new Set(allModelLines)].sort(),

        tractions: [...new Set(allTractions)].sort(),

        colors: [...new Set(allColors)].sort(),

        categories: [...new Set(products.map((p) => p.category))].sort(),

        genders: [...new Set(products.map((p) => p.gender))].sort(),

        sizes: [...new Set(availableSizes)],
        // Note: sizes are NOT sorted alphabetically because EU sizes
        // like "39 1/3" need custom sorting — we keep original order

        min_price:
            allPrices.length > 0 ? Math.floor(Math.min(...allPrices)) : 0,

        max_price:
            allPrices.length > 0 ? Math.ceil(Math.max(...allPrices)) : 1000,
    };
}