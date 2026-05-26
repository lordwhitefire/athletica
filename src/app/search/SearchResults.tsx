"use client";

import Link from "next/link";
import { Product } from "@/types/product";
import ProductCard from "@/components/category/ProductCard";

interface SearchResultsProps {
    query: string;
    results: Product[];
}

export default function SearchResults({ query, results }: SearchResultsProps) {
    return (
        <main className="bg-surface min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-10">
                {query ? (
                    <>
                        <div className="mb-10">
                            <h1 className="text-3xl md:text-4xl font-black font-headline text-on-surface tracking-tighter">
                                Search Results
                            </h1>
                            <p className="text-on-surface-variant mt-2">
                                {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                            </p>
                        </div>

                        {results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <span className="material-symbols-outlined text-6xl text-surface-container-highest mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    search_off
                                </span>
                                <h2 className="font-headline font-black text-xl text-on-surface mb-2">No results found</h2>
                                <p className="text-on-surface-variant text-sm mb-8 max-w-sm">
                                    Try adjusting your search terms or browse our categories.
                                </p>
                                <Link
                                    href="/football-boots"
                                    className="px-8 py-3 bg-primary text-on-primary font-black text-xs uppercase tracking-widest rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
                                >
                                    Browse Football Boots
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-12">
                                {results.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <span className="material-symbols-outlined text-6xl text-surface-container-highest mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>
                            search
                        </span>
                        <h2 className="font-headline font-black text-xl text-on-surface mb-2">Search our store</h2>
                        <p className="text-on-surface-variant text-sm max-w-sm">
                            Use the search bar above to find football boots, gloves, and more.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
