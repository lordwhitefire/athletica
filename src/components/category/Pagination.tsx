"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface PaginationProps {
    totalProducts: number;
    productsPerPage: number;
    currentPage: number;
}

export default function Pagination({
    totalProducts,
    productsPerPage,
    currentPage,
}: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    if (totalPages <= 1) return null;

    function goToPage(page: number) {
        const params = new URLSearchParams(searchParams.toString());
        if (page === 1) {
            params.delete("page");
        } else {
            params.set("page", page.toString());
        }
        const query = params.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function getPageNumbers(): (number | string)[] {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    }

    const pageNumbers = getPageNumbers();

    return (
        <div className="mt-20 flex justify-center items-center gap-2">

            {/* Prev */}
            <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-12 h-12 flex items-center justify-center border border-surface-container-highest hover:bg-surface-container-low transition-colors group disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
                    chevron_left
                </span>
            </button>

            {/* Page numbers */}
            {pageNumbers.map((page, index) => {
                if (page === "...") {
                    return (
                        <span
                            key={`dots-${index}`}
                            className="px-4 text-neutral-400 text-sm"
                        >
                            ...
                        </span>
                    );
                }
                const pageNum = page as number;
                const isActive = pageNum === currentPage;
                return (
                    <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-12 h-12 flex items-center justify-center border text-sm font-bold transition-colors ${isActive
                                ? "border-primary bg-primary text-white font-black"
                                : "border-surface-container-highest hover:bg-surface-container-low"
                            }`}
                    >
                        {pageNum}
                    </button>
                );
            })}

            {/* Next */}
            <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-12 h-12 flex items-center justify-center border border-surface-container-highest hover:bg-surface-container-low transition-colors group disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    chevron_right
                </span>
            </button>
        </div>
    );
}