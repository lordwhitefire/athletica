"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Product, ActiveFilters } from "@/types/product";
import { filterProducts } from "@/lib/filterProducts";
import { generateFilters } from "@/lib/generateFilters";
import ProductGrid from "@/components/category/ProductGrid";
import FilterSidebar from "@/components/category/FilterSidebar";
import SortDropdown from "@/components/category/SortDropdown";
import ActiveFiltersBar from "@/components/category/ActiveFilters";
import Pagination from "@/components/category/Pagination";
import Breadcrumb, { BreadcrumbItem } from "@/components/navigation/Breadcrumb";

const PRODUCTS_PER_PAGE = 24;

interface CategoryPageProps {
    allProducts: Product[];
    baseFilters: ActiveFilters;
    pageTitle: string;
    pageSubtitle?: string;
    breadcrumbs: BreadcrumbItem[];
}

export default function CategoryPage({
    allProducts,
    baseFilters,
    pageTitle,
    pageSubtitle,
    breadcrumbs,
}: CategoryPageProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const searchParams = useSearchParams();

    const activeFilters: ActiveFilters = useMemo(() => {
        const filters: ActiveFilters = { ...baseFilters };

        const brands = searchParams.getAll("brand");
        if (brands.length > 0) filters.brand = brands;

        const modelLines = searchParams.getAll("model_line");
        if (modelLines.length > 0) filters.model_line = modelLines;

        const tractions = searchParams.getAll("traction");
        if (tractions.length > 0) filters.traction = tractions;

        const colors = searchParams.getAll("color");
        if (colors.length > 0) filters.color = colors;

        const genders = searchParams.getAll("gender");
        if (genders.length > 0) filters.gender = genders;

        const sizes = searchParams.getAll("size");
        if (sizes.length > 0) filters.size = sizes;

        const minPrice = searchParams.get("min_price");
        if (minPrice) filters.min_price = parseFloat(minPrice);

        const maxPrice = searchParams.get("max_price");
        if (maxPrice) filters.max_price = parseFloat(maxPrice);

        const sort = searchParams.get("sort");
        if (sort) {
            filters.sort = sort as ActiveFilters["sort"];
        }

        return filters;
    }, [searchParams, baseFilters]);

    const filteredProducts = useMemo(() => {
        return filterProducts(allProducts, activeFilters);
    }, [allProducts, activeFilters]);

    const filterOptions = useMemo(() => {
        const baseFiltered = filterProducts(allProducts, baseFilters);
        return generateFilters(baseFiltered);
    }, [allProducts, baseFilters]);

    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
    const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

    const paginatedProducts = useMemo(() => {
        const start = (safePage - 1) * PRODUCTS_PER_PAGE;
        return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
    }, [filteredProducts, safePage]);

    return (
        <div className="container mx-auto px-4 py-6">
            <Breadcrumb items={breadcrumbs} />

            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900">{pageTitle}</h1>
                {pageSubtitle && (
                    <p className="text-gray-500 mt-1 text-sm">{pageSubtitle}</p>
                )}
            </div>

            <ActiveFiltersBar />

            <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="lg:hidden flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded text-sm hover:border-green-500 hover:text-green-500 transition-colors"
                    >
                        <span>⚙</span>
                        <span>Filters</span>
                    </button>
                    <p className="text-sm text-gray-500">
                        {totalProducts} {totalProducts === 1 ? "product" : "products"}
                    </p>
                </div>
                <SortDropdown />
            </div>

            <div className="flex gap-8">
                <FilterSidebar
                    filterOptions={filterOptions}
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                />

                <div className="flex-1 min-w-0">
                    <ProductGrid
                        products={paginatedProducts}
                        totalProducts={totalProducts}
                        currentPage={safePage}
                        productsPerPage={PRODUCTS_PER_PAGE}
                    />
                    <Pagination
                        totalProducts={totalProducts}
                        productsPerPage={PRODUCTS_PER_PAGE}
                        currentPage={safePage}
                    />
                </div>
            </div>
        </div>
    );
}