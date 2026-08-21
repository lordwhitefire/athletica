"use client";

import React from "react";
import type {
    ImportValidationData,
    ImportErrorRow,
    ImportIssueData,
} from "@/lib/actions/products";

export type ImportStep =
    | "upload"
    | "mapping"
    | "validation"
    | "preview"
    | "import";

export type ImportStatus =
    | "idle"
    | "uploading"
    | "uploaded"
    | "mapping"
    | "validating"
    | "validated"
    | "importing"
    | "completed"
    | "failed";

export type ModalType =
    | null
    | "new-import"
    | "remove-file"
    | "delete-import"
    | "import-confirm"
    | "import-guide"
    | "support";

export type DrawerType =
    | null
    | "summary"
    | "issue-detail"
    | "error-detail"
    | "errors-list"
    | "import-details"
    | "import-history";

export type Toast = { type: "success" | "error" | "warning" | "info"; message: string } | null;

export type RecentImport = {
    id: string;
    file: string;
    by: string;
    date: string;
    total: number;
    valid: number;
    issues: number;
    errors: number;
    status: string;
    statusType: "blue" | "green" | "red";
};

export const IMPORT_COLUMNS = [
    "name",
    "sku",
    "price",
    "category",
    "brand",
    "amazon_asin",
    "image_url",
    "status",
] as const;

export const PRODUCT_FIELDS: { key: string; label: string }[] = [
    { key: "name", label: "Product Name" },
    { key: "sku", label: "SKU" },
    { key: "price", label: "Price" },
    { key: "category", label: "Category" },
    { key: "brand", label: "Brand" },
    { key: "amazon_asin", label: "Amazon ASIN" },
    { key: "image_url", label: "Product Image" },
    { key: "status", label: "Status" },
];

export const MOCK_RECENT_IMPORTS: RecentImport[] = [
    {
        id: "imp-2025-05-19",
        file: "athletica_products_import_2025_05_19.csv",
        by: "Admin",
        date: "May 19, 2025 • 10:42 AM",
        total: 12842,
        valid: 10245,
        issues: 1842,
        errors: 755,
        status: "Validation Completed",
        statusType: "blue",
    },
    {
        id: "imp-2025-05-18",
        file: "athletica_products_import_2025_05_18.csv",
        by: "Admin",
        date: "May 18, 2025 • 03:21 PM",
        total: 8276,
        valid: 6981,
        issues: 912,
        errors: 383,
        status: "Imported",
        statusType: "green",
    },
    {
        id: "imp-2025-05-17",
        file: "athletica_products_import_2025_05_17.csv",
        by: "Admin",
        date: "May 17, 2025 • 09:15 AM",
        total: 6542,
        valid: 6120,
        issues: 312,
        errors: 110,
        status: "Imported",
        statusType: "green",
    },
];

export function generateImportHistory(): RecentImport[] {
    const statuses: { status: string; type: "blue" | "green" | "red" }[] = [
        { status: "Imported", type: "green" },
        { status: "Imported", type: "green" },
        { status: "Validation Completed", type: "blue" },
        { status: "Failed", type: "red" },
    ];
    const rows: RecentImport[] = [];
    for (let i = 1; i <= 105; i += 1) {
        const day = 19 - Math.floor((i - 1) / 3);
        const hour = (8 + ((i * 5) % 12)) % 12;
        const ampm = (8 + ((i * 5) % 12)) % 24 >= 12 ? "PM" : "AM";
        const total = 12842 - i * 137;
        const valid = Math.round(total * (0.72 + (i % 10) * 0.012));
        const errors = Math.round(total * (0.04 + (i % 6) * 0.004));
        const issues = Math.max(0, total - valid - errors);
        const choice = statuses[i % statuses.length];
        rows.push({
            id: `imp-mock-${i}`,
            file: `athletica_products_import_2025_05_${String(day).padStart(2, "0")}.csv`,
            by: i % 4 === 0 ? "Importer Bot" : "Admin",
            date: `May ${day}, 2025 • ${String(hour).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")} ${ampm}`,
            total,
            valid,
            issues,
            errors,
            status: choice.status,
            statusType: choice.type,
        });
    }
    return rows;
}

export function formatDateForImport(date: Date): string {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    let hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} • ${hours}:${minutes} ${ampm}`;
}

export function buildSampleCsv(
    products: { name: string; sku: string; price: number; category: string; brand: string; asin: string | null; imageUrl: string | null; status: string }[],
): string {
    const header = "name,sku,price,category,brand,amazon_asin,image_url,status";
    const rows = products.map((p) =>
        [
            p.name.replace(/"/g, '""'),
            p.sku.replace(/"/g, '""'),
            p.price.toFixed(2),
            (p.category || "Uncategorized").replace(/"/g, '""'),
            (p.brand || "").replace(/"/g, '""'),
            p.asin ?? "",
            p.imageUrl ?? "",
            p.status,
        ]
            .map((cell) => (/[",\n]/.test(cell) ? `"${cell}"` : cell))
            .join(","),
    );
    return [header, ...rows].join("\n");
}

export function triggerDownload(filename: string, content: string, mime = "text/csv") {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
    if (bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`;
}

export const MOCK_SAMPLE_CSV = [
    "name,sku,price,category,brand,amazon_asin,image_url,status",
    "Nike Mercurial Vapor 15,NMV15-001,149.99,Football Boots,Nike,B0EXAMPLE001,https://example.com/image.jpg,Draft",
    "Puma Future Ultimate FG,PUM-FG-001,129.99,Football Boots,Puma,B0EXAMPLE002,https://example.com/image.jpg,Draft",
    "Adidas Predator Elite,ADP-EL-001,179.99,Football Boots,Adidas,B0EXAMPLE003,https://example.com/image.jpg,Draft",
].join("\n");

const MOCK_PRODUCT_POOL = [
    "Nike Mercurial Vapor 15",
    "Puma Future Ultimate FG",
    "Adidas Predator Elite",
    "New Balance Furon V7",
    "Nike Phantom GT2",
    "Puma Ultra 1.4",
    "Adidas X Speedportal",
    "Mizuno Morelia Neo III",
    "Under Armour Magnetico",
    "Lotto Stadio 100",
];

export type MockPreviewProduct = {
    row: number;
    name: string;
    sku: string;
    price: number;
    category: string;
    brand: string;
    status: string;
};

export const MOCK_PREVIEW_PRODUCTS: MockPreviewProduct[] = [
    { row: 1, name: "Nike Mercurial Vapor 15", sku: "NMV15-001", price: 149.99, category: "Football Boots", brand: "Nike", status: "Draft" },
    { row: 2, name: "Puma Future Ultimate FG", sku: "PUM-FG-001", price: 129.99, category: "Football Boots", brand: "Puma", status: "Draft" },
    { row: 3, name: "Adidas Predator Elite", sku: "ADP-EL-001", price: 179.99, category: "Football Boots", brand: "Adidas", status: "Draft" },
    { row: 4, name: "New Balance Furon V7", sku: "NBF7-001", price: 119.99, category: "Football Boots", brand: "New Balance", status: "Draft" },
    { row: 5, name: "Nike Phantom GT2", sku: "NPG2-002", price: 199.99, category: "Football Boots", brand: "Nike", status: "Draft" },
    { row: 6, name: "Puma Ultra 1.4", sku: "PUL-14-003", price: 139.99, category: "Football Boots", brand: "Puma", status: "Draft" },
    { row: 7, name: "Mizuno Morelia Neo III", sku: "MZN-N3-004", price: 159.99, category: "Football Boots", brand: "Mizuno", status: "Draft" },
    { row: 8, name: "Lotto Stadio 100", sku: "LTS-100-005", price: 89.99, category: "Football Boots", brand: "Lotto", status: "Draft" },
    { row: 23, name: "Nike Mercurial Vapor 15", sku: "NMV15-002", price: 149.99, category: "Football Boots", brand: "Nike", status: "Draft" },
    { row: 45, name: "Puma Future Ultimate FG", sku: "PUM-FG-002", price: 129.99, category: "Football Boots", brand: "Puma", status: "Draft" },
    { row: 67, name: "Adidas Predator Elite", sku: "ADP-EL-002", price: -10.0, category: "Football Boots", brand: "Adidas", status: "Draft" },
    { row: 89, name: "New Balance Furon V7", sku: "NBF7-002", price: 119.99, category: "Football Boots", brand: "New Balance", status: "Draft" },
];

function buildMockValidation(): ImportValidationData {
    const defs = [
        { key: "missingAsin", label: "Missing Amazon ASIN", count: 623, critical: true, value: "—", problem: "Amazon ASIN is required for affiliate linking.", poolOffset: 0 },
        { key: "missingImages", label: "Missing Images", count: 487, critical: false, value: "—", problem: "A product image is required for the storefront.", poolOffset: 1 },
        { key: "missingCategories", label: "Missing Categories", count: 382, critical: false, value: "—", problem: "Every product must belong to a category.", poolOffset: 2 },
        { key: "invalidPrice", label: "Invalid Price", count: 198, critical: true, value: "-10.00", problem: "Price must be greater than 0.", poolOffset: 3 },
        { key: "duplicates", label: "Duplicate Products", count: 152, critical: false, value: "sku-dup-001", problem: "Products with the same name or SKU already exist.", poolOffset: 4 },
    ];

    const seeds: { row: number; issue: string; product: string }[] = [
        { row: 23, issue: "Missing Amazon ASIN", product: "Nike Mercurial Vapor 15" },
        { row: 45, issue: "Missing Images", product: "Puma Future Ultimate FG" },
        { row: 67, issue: "Invalid Price", product: "Adidas Predator Elite" },
        { row: 89, issue: "Missing Categories", product: "New Balance Furon V7" },
        { row: 102, issue: "Missing Amazon ASIN", product: "New Balance Furon V7" },
    ];

    const used = new Set<number>();
    const issues: ImportIssueData[] = [];

    defs.forEach((def) => {
        const seeded = seeds.filter((s) => s.issue === def.label);
        const rows: ImportErrorRow[] = seeded.map((s) => ({
            row: s.row,
            issue: def.label,
            value: def.value,
            product: s.product,
            problem: def.problem,
        }));
        seeded.forEach((s) => used.add(s.row));

        const remaining = def.count - seeded.length;
        let next = 1;
        for (let i = 0; i < remaining; i += 1) {
            while (used.has(next)) next += 1;
            used.add(next);
            rows.push({
                row: next,
                issue: def.label,
                value: def.value,
                product: MOCK_PRODUCT_POOL[(def.poolOffset + i) % MOCK_PRODUCT_POOL.length],
                problem: def.problem,
            });
        }
        rows.sort((a, b) => a.row - b.row);
        issues.push({ key: def.key, label: def.label, count: def.count, critical: def.critical, rows });
    });

    return {
        totalRows: 12842,
        validRows: 10245,
        issueRows: 1842,
        criticalErrors: 755,
        issues,
    };
}

export const MOCK_VALIDATION: ImportValidationData = buildMockValidation();
