import type { Metadata } from "next";
import { getAllProducts } from "@/lib/getProducts";
import { getMainCategoryHref } from "@/lib/getNavigation";
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
    const result = await getAllProducts();

    if (result.error) throw new Error(result.error.message);

    const allProducts = result.data;

    const results = query
        ? allProducts.filter((p) => {
              const search = query.toLowerCase();
              return (
                  p.model.toLowerCase().includes(search) ||
                  p.brand.toLowerCase().includes(search) ||
                  p.name?.toLowerCase().includes(search) ||
                  p.category?.toLowerCase().includes(search) ||
                  p.color.toLowerCase().includes(search) ||
                  p.traction?.toLowerCase().includes(search)
              );
          })
        : [];

    const mainCategoryHref = await getMainCategoryHref();
    return <SearchResults query={query} results={results} mainCategoryHref={mainCategoryHref} />;
}
