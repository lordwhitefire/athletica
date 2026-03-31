"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "biggest_discount", label: "Biggest Discount" },
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
        <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">
                Sort by:
            </label>
            <select
                value={currentSort}
                onChange={(e) => handleChange(e.target.value)}
                className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-white focus:outline-none focus:border-green-500 transition-colors cursor-pointer"
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