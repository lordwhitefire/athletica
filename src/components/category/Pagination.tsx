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
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    }

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex items-center justify-center gap-1 py-8">
            <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-200 rounded hover:border-green-500 hover:text-green-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                Prev
            </button>

            {pageNumbers.map((page, index) => {
                if (page === "...") {
                    return (
                        <span key={`dots-${index}`} className="px-2 py-2 text-sm text-gray-400">
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
                        className={`w-9 h-9 text-sm rounded border transition-colors ${isActive ? "bg-green-500 border-green-500 text-white font-bold" : "border-gray-200 hover:border-green-500 hover:text-green-500"}`}
                    >
                        {pageNum}
                    </button>
                );
            })}

            <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-200 rounded hover:border-green-500 hover:text-green-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
    );
}