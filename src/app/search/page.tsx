import type { Metadata } from "next";
import { searchProducts } from "@/lib/products/product-service";
import { toPageProductSummary } from "@/lib/products/product-adapter";
import { getMainCategoryHref, getMainCategoryLabel } from "@/lib/content/content-service";
import SearchResults from "./SearchResults";

export const metadata: Metadata = {
    title: "Search",
};

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
    }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const query = (q || "").trim();

    const result = query
        ? await searchProducts(query, { page: 1, pageSize: 100 })
        : { items: [], total: 0, page: 1, pageSize: 100, totalPages: 0 };

    const results = result.items.map(toPageProductSummary);

    const [mainCategoryHref, mainCategoryLabel] = await Promise.all([
        getMainCategoryHref(),
        getMainCategoryLabel(),
    ]);
    return <SearchResults query={query} results={results} mainCategoryHref={mainCategoryHref} mainCategoryLabel={mainCategoryLabel} />;
}