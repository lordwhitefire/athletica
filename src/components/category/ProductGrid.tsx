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
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No products found
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                    Try adjusting your filters to find what you are looking for
                </p>
                <Link
                    href="/"
                    className="px-6 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 transition-colors text-sm"
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div>
            <p className="text-sm text-gray-500 mb-4">
                Showing {start}–{end} of {totalProducts} products
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}