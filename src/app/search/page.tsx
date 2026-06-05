import type { Metadata } from "next";
import { getAllProducts } from "@/lib/getProducts";
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
    const allProducts = await getAllProducts();

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

    return <SearchResults query={query} results={results} />;
}
