"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const sortOptions = [
    { value: "newest", label: "Novedades" },
    { value: "price_asc", label: "Precio: Menor a Mayor" },
    { value: "price_desc", label: "Precio: Mayor a Menor" },
    { value: "biggest_discount", label: "Más Populares" },
];

export default function SortDropdown() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "newest";

    function handleChange(value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "newest") {
            params.delete("sort");
        } else {
            params.set("sort", value);
        }
        params.delete("page");
        const query = params.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
    }

    return (
        <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase text-neutral-400 tracking-widest whitespace-nowrap">
                Ordenar por:
            </span>
            <select
                value={currentSort}
                onChange={(e) => handleChange(e.target.value)}
                className="bg-transparent border-none text-sm font-bold uppercase focus:ring-0 cursor-pointer text-on-surface"
            >
                {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}