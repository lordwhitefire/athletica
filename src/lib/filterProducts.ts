import { Product, ActiveFilters } from "@/types/product";

export function filterProducts(
    products: Product[],
    filters: ActiveFilters
): Product[] {
    let result = [...products];

    // Filter by category
    if (filters.category && filters.category.length > 0) {
        result = result.filter((p) =>
            filters.category!.some(
                (c) => c.toLowerCase() === p.category.toLowerCase()
            )
        );
    }

    // Filter by brand
    if (filters.brand && filters.brand.length > 0) {
        result = result.filter((p) =>
            filters.brand!.some((b) => b.toLowerCase() === p.brand.toLowerCase())
        );
    }

    // Filter by model line
    if (filters.model_line && filters.model_line.length > 0) {
        result = result.filter(
            (p) =>
                p.model_line &&
                filters.model_line!.some(
                    (m) => m.toLowerCase() === p.model_line!.toLowerCase()
                )
        );
    }

    // Filter by traction
    if (filters.traction && filters.traction.length > 0) {
        result = result.filter(
            (p) =>
                p.traction &&
                filters.traction!.some(
                    (t) => t.toLowerCase() === p.traction!.toLowerCase()
                )
        );
    }

    // Filter by color
    if (filters.color && filters.color.length > 0) {
        result = result.filter((p) =>
            filters.color!.some((c) => c.toLowerCase() === p.color.toLowerCase())
        );
    }

    // Filter by gender
    if (filters.gender && filters.gender.length > 0) {
        result = result.filter((p) =>
            filters.gender!.some((g) => g.toLowerCase() === p.gender.toLowerCase())
        );
    }

    // Filter by size — only show products that have that size available
    if (filters.size && filters.size.length > 0) {
        result = result.filter((p) =>
            p.sizes.some(
                (s) =>
                    s.available &&
                    filters.size!.some(
                        (fs) => fs.toLowerCase() === s.size.toLowerCase()
                    )
            )
        );
    }

    // Filter by min price
    if (filters.min_price !== undefined) {
        result = result.filter((p) => p.price.current >= filters.min_price!);
    }

    // Filter by max price
    if (filters.max_price !== undefined) {
        result = result.filter((p) => p.price.current <= filters.max_price!);
    }

    // Sorting
    if (filters.sort) {
        switch (filters.sort) {
            case "price_asc":
                result.sort((a, b) => a.price.current - b.price.current);
                break;

            case "price_desc":
                result.sort((a, b) => b.price.current - a.price.current);
                break;

            case "biggest_discount":
                result.sort(
                    (a, b) => b.price.discount_percent - a.price.discount_percent
                );
                break;

            case "newest":
            default:
                // Newest keeps the original order from products.json
                // When you add a createdAt field later, sort by that here
                break;
        }
    }

    return result;
}