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
        if (sort) filters.sort = sort as ActiveFilters["sort"];

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
        <main className="max-w-[1024px] mx-auto px-6 py-8">

            {/* Breadcrumb */}
            <Breadcrumb items={breadcrumbs} />

            {/* Category header — red left border, big italic title, full description */}
            <div className="mb-12 border-l-8 border-primary pl-8 py-2">
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-2 font-headline">
                    {pageTitle}
                </h1>
                {pageSubtitle && (
                    <p className="text-secondary max-w-2xl font-body text-lg leading-relaxed">
                        {pageSubtitle}
                    </p>
                )}
            </div>

            {/* Active filters bar */}
            <ActiveFiltersBar />

            {/* Sidebar + grid */}
            <div className="flex flex-col lg:flex-row gap-12">

                {/* Filter sidebar */}
                <FilterSidebar
                    filterOptions={filterOptions}
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                />

                {/* Product area */}
                <div className="flex-1 min-w-0">

                    {/* Count + sort row */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b border-surface-container">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Mobile filter toggle */}
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="lg:hidden flex items-center gap-2 px-3 py-2 border border-surface-container-highest text-sm font-bold uppercase tracking-wide hover:border-primary hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">tune</span>
                                <span>Filters</span>
                            </button>
                            <span className="text-sm font-label uppercase text-secondary tracking-widest">
                                Showing {totalProducts} products
                            </span>
                        </div>
                        <SortDropdown />
                    </div>

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
        </main>
    );
}