"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const filterLabels: Record<string, string> = {
    brand: "Brand",
    model_line: "Model",
    traction: "Surface",
    color: "Color",
    gender: "Gender",
    size: "Size",
    min_price: "Min Price",
    max_price: "Max Price",
};

const ignoredParams = ["sort", "page"];

export default function ActiveFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const activeFilters: { key: string; value: string; label: string }[] = [];

    searchParams.forEach((value, key) => {
        if (!ignoredParams.includes(key)) {
            activeFilters.push({
                key,
                value,
                label: `${filterLabels[key] || key}: ${value}`,
            });
        }
    });

    if (activeFilters.length === 0) return null;

    function removeFilter(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        const existing = params.getAll(key);
        params.delete(key);
        existing.filter((v) => v !== value).forEach((v) => params.append(key, v));
        params.delete("page");
        const query = params.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
    }

    function clearAll() {
        const params = new URLSearchParams();
        const sort = searchParams.get("sort");
        if (sort) params.set("sort", sort);
        const query = params.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
    }

    return (
        <div className="flex items-center gap-2 flex-wrap py-3 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Active Filters:
            </span>
            {activeFilters.map((filter) => (
                <button
                    key={`${filter.key}-${filter.value}`}
                    onClick={() => removeFilter(filter.key, filter.value)}
                    className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                >
                    <span>{filter.label}</span>
                    <span className="font-bold">x</span>
                </button>
            ))}
            <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors underline ml-1"
            >
                Clear all
            </button>
        </div>
    );
}