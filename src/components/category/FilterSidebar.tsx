"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FilterOptions } from "@/types/product";

interface FilterSidebarProps {
    filterOptions: FilterOptions;
    isOpen: boolean;
    onClose: () => void;
}

interface FilterSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-100 py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left"
            >
                <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
                    {title}
                </span>
                <span className="text-xs text-gray-400">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && <div className="mt-3">{children}</div>}
        </div>
    );
}

export default function FilterSidebar({ filterOptions, isOpen, onClose }: FilterSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function getActiveValues(key: string): string[] {
        return searchParams.getAll(key);
    }

    function toggleFilter(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        const existing = params.getAll(key);
        params.delete(key);
        if (existing.includes(value)) {
            existing.filter((v) => v !== value).forEach((v) => params.append(key, v));
        } else {
            [...existing, value].forEach((v) => params.append(key, v));
        }
        params.delete("page");
        const query = params.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
    }

    function handlePriceChange(type: "min" | "max", value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (!value) {
            params.delete(type === "min" ? "min_price" : "max_price");
        } else {
            params.set(type === "min" ? "min_price" : "max_price", value);
        }
        params.delete("page");
        const query = params.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
    }

    const minPrice = searchParams.get("min_price") || "";
    const maxPrice = searchParams.get("max_price") || "";

    const sidebarContent = (
        <div className="space-y-0">
            {filterOptions.brands.length > 0 && (
                <FilterSection title="Brand">
                    <ul className="space-y-2">
                        {filterOptions.brands.map((brand) => {
                            const isActive = getActiveValues("brand").includes(brand);
                            return (
                                <li key={brand}>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => toggleFilter("brand", brand)}
                                            className="w-4 h-4 accent-green-500 cursor-pointer"
                                        />
                                        <span className={`text-sm transition-colors ${isActive ? "text-green-600 font-medium" : "text-gray-600 group-hover:text-gray-900"}`}>
                                            {brand}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </FilterSection>
            )}

            {filterOptions.model_lines.length > 0 && (
                <FilterSection title="Model Line" defaultOpen={false}>
                    <ul className="space-y-2">
                        {filterOptions.model_lines.map((model) => {
                            const isActive = getActiveValues("model_line").includes(model);
                            return (
                                <li key={model}>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => toggleFilter("model_line", model)}
                                            className="w-4 h-4 accent-green-500 cursor-pointer"
                                        />
                                        <span className={`text-sm transition-colors ${isActive ? "text-green-600 font-medium" : "text-gray-600 group-hover:text-gray-900"}`}>
                                            {model}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </FilterSection>
            )}

            {filterOptions.tractions.length > 0 && (
                <FilterSection title="Surface">
                    <div className="flex flex-wrap gap-2">
                        {filterOptions.tractions.map((traction) => {
                            const isActive = getActiveValues("traction").includes(traction);
                            return (
                                <button
                                    key={traction}
                                    onClick={() => toggleFilter("traction", traction)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${isActive ? "bg-green-500 border-green-500 text-white" : "border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-500"}`}
                                >
                                    {traction}
                                </button>
                            );
                        })}
                    </div>
                </FilterSection>
            )}

            {filterOptions.sizes.length > 0 && (
                <FilterSection title="Size" defaultOpen={false}>
                    <div className="grid grid-cols-3 gap-1.5">
                        {filterOptions.sizes.map((size) => {
                            const isActive = getActiveValues("size").includes(size);
                            return (
                                <button
                                    key={size}
                                    onClick={() => toggleFilter("size", size)}
                                    className={`py-1.5 text-xs rounded border transition-colors ${isActive ? "bg-green-500 border-green-500 text-white font-bold" : "border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-500"}`}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </FilterSection>
            )}

            {filterOptions.colors.length > 0 && (
                <FilterSection title="Color" defaultOpen={false}>
                    <div className="flex flex-wrap gap-2">
                        {filterOptions.colors.map((color) => {
                            const isActive = getActiveValues("color").includes(color);
                            return (
                                <button
                                    key={color}
                                    onClick={() => toggleFilter("color", color)}
                                    className={`px-2 py-1 text-xs rounded border transition-colors ${isActive ? "bg-green-500 border-green-500 text-white font-bold" : "border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-500"}`}
                                >
                                    {color}
                                </button>
                            );
                        })}
                    </div>
                </FilterSection>
            )}

            <FilterSection title="Price Range" defaultOpen={false}>
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Min</label>
                        <input
                            type="number"
                            placeholder={filterOptions.min_price.toString()}
                            value={minPrice}
                            onChange={(e) => handlePriceChange("min", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-green-500"
                        />
                    </div>
                    <span className="text-gray-400 mt-4">—</span>
                    <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Max</label>
                        <input
                            type="number"
                            placeholder={filterOptions.max_price.toString()}
                            value={maxPrice}
                            onChange={(e) => handlePriceChange("max", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-green-500"
                        />
                    </div>
                </div>
            </FilterSection>
        </div>
    );

    return (
        <>
            <div className="hidden lg:block w-56 flex-shrink-0">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Filters
                </h2>
                {sidebarContent}
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
            )}
            <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 lg:hidden flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex items-center justify-between px-4 py-4 border-b">
                    <h2 className="font-bold text-gray-900">Filters</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100">
                        <span>x</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4">
                    {sidebarContent}
                </div>
            </div>
        </>
    );
}