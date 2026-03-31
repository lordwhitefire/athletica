import { Product, ActiveFilters } from "@/types/product";
import { getAllProducts } from "@/lib/getProducts";

type CategoryRoute = {
    filters: ActiveFilters;
    pageTitle: string;
    pageSubtitle?: string;
};

export type ResolvedRoute =
    | { type: "product"; product: Product }
    | { type: "category"; filters: ActiveFilters; pageTitle: string; pageSubtitle?: string }
    | { type: "not_found" };

const slugToFilterMap: Record<string, CategoryRoute> = {
    "football-boots": {
        filters: { category: ["Football Boots"] },
        pageTitle: "Football Boots",
        pageSubtitle: "All football boots",
    },
    "adidas-football-boots": {
        filters: { category: ["Football Boots"], brand: ["adidas"] },
        pageTitle: "adidas Football Boots",
        pageSubtitle: "Latest adidas football boots",
    },
    "nike-football-boots": {
        filters: { category: ["Football Boots"], brand: ["Nike"] },
        pageTitle: "Nike Football Boots",
        pageSubtitle: "Latest Nike football boots",
    },
    "puma-football-boots": {
        filters: { category: ["Football Boots"], brand: ["Puma"] },
        pageTitle: "Puma Football Boots",
        pageSubtitle: "Latest Puma football boots",
    },
    "new-balance-football-boots": {
        filters: { category: ["Football Boots"], brand: ["New Balance"] },
        pageTitle: "New Balance Football Boots",
        pageSubtitle: "Latest New Balance football boots",
    },
    "mizuno-football-boots": {
        filters: { category: ["Football Boots"], brand: ["Mizuno"] },
        pageTitle: "Mizuno Football Boots",
        pageSubtitle: "Latest Mizuno football boots",
    },
    "joma-football-boots": {
        filters: { category: ["Football Boots"], brand: ["Joma"] },
        pageTitle: "Joma Football Boots",
        pageSubtitle: "Latest Joma football boots",
    },
    "adidas-predator-football-boots": {
        filters: { category: ["Football Boots"], brand: ["adidas"], model_line: ["Predator"] },
        pageTitle: "adidas Predator Football Boots",
        pageSubtitle: "Total control on the pitch",
    },
    "adidas-x-football-boots": {
        filters: { category: ["Football Boots"], brand: ["adidas"], model_line: ["X"] },
        pageTitle: "adidas X Football Boots",
        pageSubtitle: "Pure speed",
    },
    "adidas-copa-football-boots": {
        filters: { category: ["Football Boots"], brand: ["adidas"], model_line: ["Copa"] },
        pageTitle: "adidas Copa Football Boots",
        pageSubtitle: "Classic touch",
    },
    "adidas-f50-football-boots": {
        filters: { category: ["Football Boots"], brand: ["adidas"], model_line: ["F50"] },
        pageTitle: "adidas F50 Football Boots",
        pageSubtitle: "Speed and precision",
    },
    "nike-mercurial-football-boots": {
        filters: { category: ["Football Boots"], brand: ["Nike"], model_line: ["Mercurial"] },
        pageTitle: "Nike Mercurial Football Boots",
        pageSubtitle: "Speed redefined",
    },
    "nike-phantom-football-boots": {
        filters: { category: ["Football Boots"], brand: ["Nike"], model_line: ["Phantom"] },
        pageTitle: "Nike Phantom Football Boots",
        pageSubtitle: "Precision passing",
    },
    "nike-tiempo-football-boots": {
        filters: { category: ["Football Boots"], brand: ["Nike"], model_line: ["Tiempo"] },
        pageTitle: "Nike Tiempo Football Boots",
        pageSubtitle: "Classic leather feel",
    },
    "fg-football-boots": {
        filters: { category: ["Football Boots"], traction: ["FG"] },
        pageTitle: "FG Football Boots",
        pageSubtitle: "Firm ground football boots",
    },
    "ag-football-boots": {
        filters: { category: ["Football Boots"], traction: ["AG"] },
        pageTitle: "AG Football Boots",
        pageSubtitle: "Artificial grass football boots",
    },
    "mg-football-boots": {
        filters: { category: ["Football Boots"], traction: ["MG"] },
        pageTitle: "MG Football Boots",
        pageSubtitle: "Multi ground football boots",
    },
    "sg-football-boots": {
        filters: { category: ["Football Boots"], traction: ["SG"] },
        pageTitle: "SG Football Boots",
        pageSubtitle: "Soft ground football boots",
    },
    "tf-football-boots": {
        filters: { category: ["Football Boots"], traction: ["TF"] },
        pageTitle: "Turf Football Boots",
        pageSubtitle: "Turf football boots",
    },
    "ic-football-boots": {
        filters: { category: ["Football Boots"], traction: ["IC"] },
        pageTitle: "Indoor Football Boots",
        pageSubtitle: "Indoor court football boots",
    },
    "goalkeeper-gloves": {
        filters: { category: ["Goalkeeper Gloves"] },
        pageTitle: "Goalkeeper Gloves",
        pageSubtitle: "Pro grip, every save",
    },
    "adidas-goalkeeper-gloves": {
        filters: { category: ["Goalkeeper Gloves"], brand: ["adidas"] },
        pageTitle: "adidas Goalkeeper Gloves",
        pageSubtitle: "adidas goalkeeper gloves",
    },
    "nike-goalkeeper-gloves": {
        filters: { category: ["Goalkeeper Gloves"], brand: ["Nike"] },
        pageTitle: "Nike Goalkeeper Gloves",
        pageSubtitle: "Nike goalkeeper gloves",
    },
    "puma-goalkeeper-gloves": {
        filters: { category: ["Goalkeeper Gloves"], brand: ["Puma"] },
        pageTitle: "Puma Goalkeeper Gloves",
        pageSubtitle: "Puma goalkeeper gloves",
    },
    "footballs": {
        filters: { category: ["Football"] },
        pageTitle: "Footballs",
        pageSubtitle: "Match and training balls",
    },
    "official-match-balls": {
        filters: { category: ["Football"], model_line: ["Official"] },
        pageTitle: "Official Match Balls",
        pageSubtitle: "UEFA and FIFA approved match balls",
    },
    "training-balls": {
        filters: { category: ["Football"], model_line: ["Training"] },
        pageTitle: "Training Balls",
        pageSubtitle: "Durable training footballs",
    },
    "futsal-balls": {
        filters: { category: ["Futsal Ball"] },
        pageTitle: "Futsal Balls",
        pageSubtitle: "Low bounce, full control",
    },
    "shin-guards": {
        filters: { category: ["Shin Guards"] },
        pageTitle: "Shin Guards",
        pageSubtitle: "Stay protected",
    },
    "training-wear": {
        filters: { category: ["Training Wear"] },
        pageTitle: "Training Wear",
        pageSubtitle: "Train like a pro",
    },
    "futsal-shoes": {
        filters: { category: ["Futsal Shoes"] },
        pageTitle: "Futsal Shoes",
        pageSubtitle: "Indoor court shoes",
    },
};

export function resolveRoute(slugArray: string[]): ResolvedRoute {
    // Join the slug and remove optional language prefix (e.g., 'en/', 'es/')
    let slug = slugArray.join("/");
    if (slug.startsWith("en/") || slug.startsWith("es/")) {
        slug = slug.substring(3);
    } else if (slug === "en" || slug === "es") {
        slug = "";
    }

    const products = getAllProducts();

    const matchedProduct = products.find((p) => p.url_slug === slug);
    if (matchedProduct) {
        return { type: "product", product: matchedProduct };
    }

    const matchedCategory = slugToFilterMap[slug];
    if (matchedCategory) {
        return {
            type: "category",
            filters: matchedCategory.filters,
            pageTitle: matchedCategory.pageTitle,
            pageSubtitle: matchedCategory.pageSubtitle,
        };
    }

    return { type: "not_found" };
}