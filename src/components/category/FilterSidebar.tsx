"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FilterOptions, BrandOption } from "@/types/product";

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
        <section className="space-y-6">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest border-b-2 border-surface-container-highest pb-4 flex items-center justify-between">
                <span>{title}</span>
                <button onClick={() => setIsOpen(!isOpen)}>
                    <span className="material-symbols-outlined text-on-surface/40">
                        {isOpen ? "expand_less" : "expand_more"}
                    </span>
                </button>
            </h3>
            {isOpen && <div>{children}</div>}
        </section>
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
        <div className="space-y-10">

            {/* Brand */}
            {filterOptions.brands.length > 0 && (
                <FilterSection title="Brand">
                    <div className="space-y-3">
                        {filterOptions.brands.map((brand: BrandOption) => {
                            const isActive = getActiveValues("brand").includes(brand.name);
                            return (
                                <label key={brand.name} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => toggleFilter("brand", brand.name)}
                                        className="w-4 h-4 border-2 border-surface-container-highest accent-primary-container focus:ring-0 focus:ring-offset-0 rounded-none cursor-pointer"
                                    />
                                    {brand.logo && (
                                        <Image src={brand.logo} alt="" width={20} height={20} className="object-contain flex-shrink-0" />
                                    )}
                                    <span className={`text-sm font-medium uppercase transition-colors group-hover:text-primary-container ${isActive ? "text-primary-container" : "text-on-surface"}`}>
                                        {brand.name}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>
            )}

            {/* Model */}
            {filterOptions.models.length > 0 && (
                <FilterSection title="Model" defaultOpen={false}>
                    <div className="space-y-3">
                        {filterOptions.models.map((model) => {
                            const isActive = getActiveValues("model").includes(model);
                            return (
                                <label key={model} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => toggleFilter("model", model)}
                                        className="w-4 h-4 border-2 border-surface-container-highest accent-primary-container focus:ring-0 focus:ring-offset-0 rounded-none cursor-pointer"
                                    />
                                    <span className={`text-sm font-medium uppercase transition-colors group-hover:text-primary-container ${isActive ? "text-primary-container" : "text-on-surface"}`}>
                                        {model}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>
            )}

            {/* Surface / Traction — checkboxes like brand, not pills */}
            {filterOptions.tractions.length > 0 && (
                <FilterSection title="Surface">
                    <div className="space-y-3">
                        {filterOptions.tractions.map((traction) => {
                            const isActive = getActiveValues("traction").includes(traction);
                            return (
                                <label key={traction} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => toggleFilter("traction", traction)}
                                        className="w-4 h-4 border-2 border-surface-container-highest accent-primary-container focus:ring-0 focus:ring-offset-0 rounded-none cursor-pointer"
                                    />
                                    <span className={`text-sm font-medium uppercase transition-colors group-hover:text-primary-container ${isActive ? "text-primary-container" : "text-on-surface"}`}>
                                        {traction}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>
            )}

            {/* Size — square aspect-ratio grid */}
            {filterOptions.sizes.length > 0 && (
                <FilterSection title="Size (EU)">
                    <div className="grid grid-cols-4 gap-2">
                        {filterOptions.sizes.map((size) => {
                            const isActive = getActiveValues("size").includes(size);
                            return (
                                <button
                                    key={size}
                                    onClick={() => toggleFilter("size", size)}
                                    className={`aspect-square flex items-center justify-center text-xs font-bold border transition-colors ${isActive
                                        ? "border-primary bg-primary text-on-primary"
                                        : "border-surface-container-highest hover:border-primary-container hover:text-primary-container"
                                        }`}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </FilterSection>
            )}

            {/* Color */}
            {filterOptions.colors.length > 0 && (
                <FilterSection title="Color" defaultOpen={false}>
                    <div className="space-y-3">
                        {filterOptions.colors.map((color) => {
                            const isActive = getActiveValues("color").includes(color);
                            return (
                                <label key={color} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => toggleFilter("color", color)}
                                        className="w-4 h-4 border-2 border-surface-container-highest accent-primary-container focus:ring-0 focus:ring-offset-0 rounded-none cursor-pointer"
                                    />
                                    <span className={`text-sm font-medium uppercase transition-colors group-hover:text-primary-container ${isActive ? "text-primary-container" : "text-on-surface"}`}>
                                        {color}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>
            )}

            {/* Price range */}
            <FilterSection title="Price" defaultOpen={false}>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-secondary mb-1 block uppercase tracking-widest">Min</label>
                        <input
                            type="number"
                            placeholder={filterOptions.min_price.toString()}
                            value={minPrice}
                            onChange={(e) => handlePriceChange("min", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-surface-container-highest bg-surface focus:outline-none focus:border-primary-container transition-colors"
                        />
                    </div>
                    <span className="text-secondary mt-5">—</span>
                    <div className="flex-1">
                        <label className="text-xs text-secondary mb-1 block uppercase tracking-widest">Max</label>
                        <input
                            type="number"
                            placeholder={filterOptions.max_price.toString()}
                            value={maxPrice}
                            onChange={(e) => handlePriceChange("max", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-surface-container-highest bg-surface focus:outline-none focus:border-primary-container transition-colors"
                        />
                    </div>
                </div>
            </FilterSection>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
                {sidebarContent}
            </aside>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Mobile drawer */}
            <div className={`fixed top-0 left-0 h-full w-[85vw] max-w-[320px] bg-surface z-50 shadow-2xl transition-transform duration-300 lg:hidden flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-surface-container-highest">
                    <h2 className="font-headline font-bold uppercase tracking-widest text-sm">Filters</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-container-low transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {sidebarContent}
                </div>
            </div>
        </>
    );
}