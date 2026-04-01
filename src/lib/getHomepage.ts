import homepageData from "@/data/homepage.json";
import { getAllProducts } from "@/lib/getProducts";
import { filterProducts } from "@/lib/filterProducts";
import { HomepageConfig, HomepageSection, ProductCarouselSection } from "@/types/homepage";
import { Product, ActiveFilters } from "@/types/product";

export function getHomepageConfig(): HomepageConfig {
    return homepageData as unknown as HomepageConfig;
}

export function getHomepageSections(): HomepageSection[] {
    return homepageData.sections as unknown as HomepageSection[];
}

export function getProductsForCarousel(section: ProductCarouselSection): Product[] {
    const allProducts = getAllProducts();
    const filters: ActiveFilters = {};

    if (section.filter.category) filters.category = [section.filter.category];
    if (section.filter.brand) filters.brand = [section.filter.brand];
    if (section.filter.model_line) filters.model_line = [section.filter.model_line];
    if (section.filter.traction) filters.traction = [section.filter.traction];
    if (section.filter.min_price) filters.min_price = section.filter.min_price;
    if (section.filter.max_price) filters.max_price = section.filter.max_price;
    if (section.sort) filters.sort = section.sort;

    let filtered = filterProducts(allProducts, filters);

    if (filtered.length === 0) {
        filtered = allProducts.slice(0, section.limit);
    }

    if (filtered.length < section.limit) {
        const needed = section.limit - filtered.length;
        const extras = allProducts
            .filter((p) => !filtered.find((f) => f.id === p.id))
            .slice(0, needed);
        filtered = [...filtered, ...extras];
    }

    return filtered.slice(0, section.limit);
}