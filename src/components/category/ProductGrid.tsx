"use client";

import { Product } from "@/types/product";
import ProductCard from "@/components/category/ProductCard";
import Link from "next/link";

interface ProductGridProps {
    products: Product[];
    totalProducts: number;
    currentPage: number;
    productsPerPage: number;
}

export default function ProductGrid({
    products,
    totalProducts,
    currentPage,
    productsPerPage,
}: ProductGridProps) {
    const start = (currentPage - 1) * productsPerPage + 1;
    const end = Math.min(currentPage * productsPerPage, totalProducts);

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-6xl text-surface-container-highest mb-6">
                    search_off
                </span>
                <h3 className="font-headline font-black text-xl uppercase tracking-tight mb-2">
                    No products found
                </h3>
                <p className="text-secondary text-sm mb-8 max-w-sm">
                    Try adjusting your filters to find what you are looking for
                </p>
                <Link
                    href="/"
                    className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-on-surface transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div>
            <p className="text-xs md:text-sm font-label uppercase text-secondary tracking-widest mb-4 md:mb-8">
                Mostrando {start}–{end} de {totalProducts} productos
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-12">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}