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
                label: value,
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
        <div className="flex flex-wrap items-center gap-3 mb-10">
            <span className="text-xs font-label font-bold uppercase text-neutral-400 mr-2">
                Filtros Activos:
            </span>

            {activeFilters.map((filter) => (
                <button
                    key={`${filter.key}-${filter.value}`}
                    onClick={() => removeFilter(filter.key, filter.value)}
                    className="bg-surface-container-highest px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-2 hover:bg-surface-container-high transition-colors"
                >
                    <span>{filter.label}</span>
                    <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
            ))}

            <button
                onClick={clearAll}
                className="text-xs font-label font-bold uppercase text-primary hover:underline underline-offset-4 ml-2 transition-colors"
            >
                Limpiar Todo
            </button>
        </div>
    );
}