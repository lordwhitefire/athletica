export type IssueKey = "images" | "asin" | "category" | "broken" | "duplicate" | "descriptions";

export interface Issue {
    key: IssueKey;
    title: string;
    count: number;
    percentage: string;
    trend: string;
    direction: "up" | "down";
    severity: "High" | "Medium" | "Low";
    description: string;
    action: string;
    icon: string;
    iconTone: string;
    spark: string;
}

export interface SyncItem {
    id: string;
    title: string;
    date: string;
    result: string;
    type: string;
    status: string;
    duration: string;
    icon: string;
    iconTone: string;
}

export interface AlertItem {
    icon: string;
    iconTone: string;
    title: string;
    desc: string;
    time: string;
    severity: "High" | "Medium";
}

export interface HealthRow {
    name: string;
    value: string;
}

export interface ProductRecord {
    name: string;
    id: string;
}

export const DEFAULT_RANGE = { from: "2025-05-13", to: "2025-05-19" };

export const ISSUES: Record<IssueKey, Issue> = {
    images: {
        key: "images",
        title: "Products without Images",
        count: 67,
        percentage: "0.5%",
        trend: "↓ 12.1%",
        direction: "down",
        severity: "High",
        description:
            "Products currently have no usable product image. Add imagery to improve product presentation, discovery, and conversions.",
        action: "Open the affected products and attach a primary image.",
        icon: "image",
        iconTone: "red",
        spark: "0,5 8,3 17,7 26,6 35,11 45,12 55,17 65,15 76,18 86,15",
    },
    asin: {
        key: "asin",
        title: "Products without ASIN",
        count: 128,
        percentage: "1.0%",
        trend: "↓ 8.4%",
        direction: "down",
        severity: "High",
        description:
            "Products are missing an Amazon Standard Identification Number.",
        action: "Add a valid ASIN to enable affiliate linking and tracking.",
        icon: "link",
        iconTone: "orange",
        spark: "0,9 10,6 19,9 27,14 37,13 46,16 56,18 66,13 77,17 86,16",
    },
    category: {
        key: "category",
        title: "Products without Category",
        count: 48,
        percentage: "0.4%",
        trend: "↑ 3.2%",
        direction: "up",
        severity: "Medium",
        description: "Products are not assigned to a catalog category.",
        action: "Assign categories to improve navigation, filtering, and SEO.",
        icon: "folder",
        iconTone: "yellow",
        spark: "0,13 10,10 20,12 30,8 40,5 50,7 60,12 70,8 80,10 86,9",
    },
    broken: {
        key: "broken",
        title: "Broken Amazon Links",
        count: 23,
        percentage: "0.2%",
        trend: "↓ 15.7%",
        direction: "down",
        severity: "High",
        description:
            "Amazon destination URLs failed validation during the latest link check.",
        action: "Review the affected links and replace invalid destinations.",
        icon: "link",
        iconTone: "pink",
        spark: "0,8 9,4 18,7 27,12 37,14 47,17 58,12 67,16 77,13 86,15",
    },
    duplicate: {
        key: "duplicate",
        title: "Duplicate Products",
        count: 10,
        percentage: "0.1%",
        trend: "↓ 5.0%",
        direction: "down",
        severity: "Low",
        description: "Potentially duplicated catalog records were detected.",
        action: "Review matching records before merging or removing duplicates.",
        icon: "rows",
        iconTone: "purple",
        spark: "0,8 10,5 20,7 28,12 38,10 49,15 59,14 69,16 77,12 86,14",
    },
    descriptions: {
        key: "descriptions",
        title: "Missing Product Descriptions",
        count: 34,
        percentage: "0.3%",
        trend: "↑ 7.3%",
        direction: "up",
        severity: "Medium",
        description: "Products are missing a meaningful description.",
        action:
            "Add descriptions to improve product comprehension and search quality.",
        icon: "rows",
        iconTone: "blue",
        spark: "0,14 10,12 19,9 28,12 38,6 47,8 56,5 66,11 76,13 86,10",
    },
};

export const ISSUE_ORDER: IssueKey[] = [
    "images",
    "asin",
    "category",
    "broken",
    "duplicate",
    "descriptions",
];

export const SYNCS: SyncItem[] = [
    {
        id: "product-import",
        title: "Last Product Import",
        date: "May 19, 2025 • 10:42 AM",
        result: "342 products",
        type: "Import",
        status: "Completed",
        duration: "2m 14s",
        icon: "upload",
        iconTone: "blue",
    },
    {
        id: "database-update",
        title: "Last Database Update",
        date: "May 19, 2025 • 10:43 AM",
        result: "Database updated",
        type: "Database",
        status: "Completed",
        duration: "34s",
        icon: "database",
        iconTone: "green",
    },
    {
        id: "amazon-check",
        title: "Last Amazon Link Check",
        date: "May 19, 2025 • 08:15 AM",
        result: "12,450 links",
        type: "Validation",
        status: "Completed",
        duration: "8m 31s",
        icon: "link",
        iconTone: "orange",
    },
    {
        id: "image-optimization",
        title: "Last Image Optimization",
        date: "May 18, 2025 • 11:30 PM",
        result: "1,247 images",
        type: "Optimization",
        status: "Completed",
        duration: "17m 05s",
        icon: "image",
        iconTone: "purple",
    },
    {
        id: "analytics-sync",
        title: "Last Analytics Sync",
        date: "May 19, 2025 • 09:05 AM",
        result: "Analytics synchronized",
        type: "Analytics",
        status: "Completed",
        duration: "1m 47s",
        icon: "bars",
        iconTone: "cyan",
    },
];

export const ALERTS: AlertItem[] = [
    {
        icon: "image",
        iconTone: "red",
        title: "67 products are missing images",
        desc: "Add images to improve user experience and conversions.",
        time: "2 hours ago",
        severity: "High",
    },
    {
        icon: "link",
        iconTone: "orange",
        title: "128 products are missing Amazon ASIN",
        desc: "Add ASIN to enable affiliate links and tracking.",
        time: "3 hours ago",
        severity: "High",
    },
    {
        icon: "folder",
        iconTone: "yellow",
        title: "48 products are missing categories",
        desc: "Assign categories to improve navigation and SEO.",
        time: "5 hours ago",
        severity: "Medium",
    },
    {
        icon: "link",
        iconTone: "red",
        title: "23 products have broken Amazon links",
        desc: "These links may not generate clicks or commissions.",
        time: "7 hours ago",
        severity: "High",
    },
];

export const HEALTH_ROWS: HealthRow[] = [
    { name: "Database", value: "Healthy" },
    { name: "API Services", value: "Healthy" },
    { name: "Amazon Affiliate Service", value: "Healthy" },
    { name: "Image Storage", value: "Healthy" },
    { name: "Email Service", value: "Healthy" },
    { name: "Analytics Service", value: "Healthy" },
];

export const AFFECTED_PRODUCTS: ProductRecord[] = [
    { name: "Alpine Performance Jacket", id: "ATH-4100" },
    { name: "Athletica Training Shorts", id: "ATH-4101" },
    { name: "Velocity Running Shoes", id: "ATH-4102" },
    { name: "Core Compression Tee", id: "ATH-4103" },
    { name: "Endurance Training Pack", id: "ATH-4104" },
    { name: "Aero Performance Cap", id: "ATH-4105" },
];

export const SCORE = {
    number: 87,
    label: "Good",
    message: "Your data quality is good!",
    hint: "Keep maintaining your data to improve performance.",
};

export function formatHumanDate(dateKey: string): string {
    const date = new Date(`${dateKey}T12:00:00`);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatRangeLabel(from: string, to: string): string {
    return `${formatHumanDate(from)} – ${formatHumanDate(to)}`;
}

export function csvEscape(value: unknown): string {
    const stringValue = String(value ?? "");
    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {
        return `"${stringValue.replaceAll('"', '""')}"`;
    }
    return stringValue;
}

export function downloadCSV(filename: string, rows: unknown[][]): void {
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}