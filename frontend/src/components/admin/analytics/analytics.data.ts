import type { AnalyticsState, ProductData, SearchTermRow, StatCard, TrafficSource } from "./analytics.types";

export const STORAGE_KEY = "athletica.analytics.interaction.v1";

export const PRODUCT_CATEGORIES = [
    "Football Boots",
    "Athletic Apparel",
    "Training Equipment",
    "Footwear",
    "Accessories",
];

export const PRODUCT_BRANDS = ["Nike", "Adidas", "Puma", "Under Armour", "New Balance"];

export const PRODUCT_PERIODS = ["Last 7 days", "Last 30 days", "This month"];

export const TRAFFIC_PERIODS = ["May 13 – May 19, 2025", "May 1 – May 19, 2025"];

export const TRAFFIC_CHANNELS = ["All Channels", "Organic Search", "Direct", "Social Media"];

export const TRAFFIC_DEVICES = ["All Devices", "Desktop", "Mobile", "Tablet"];

export const DATE_PRESETS: { value: string; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "month", label: "This month" },
];

export const PRESET_LABELS: Record<string, string> = {
    today: "Today",
    "7": "Last 7 days",
    "30": "Last 30 days",
    month: "This month",
};

export const PAGE_META: Record<string, [string, string]> = {
    overview: ["Analytics Overview", "Track your Amazon affiliate performance and website analytics."],
    products: ["Product Analytics", "Track product views, Amazon clicks, conversion and estimated affiliate revenue."],
    traffic: ["Traffic Analytics", "Understand where visitors come from and how each channel contributes to engagement."],
};

export const productData: ProductData[] = [
    { name: "Nike Mercurial Vapor 15 Elite FG", asin: "B0C2HSX1B2", category: "Football Boots", brand: "Nike", views: 12542, unique: 9231, cart: 1284, clicks: 1842, ctr: 14.7, conversion: 6.3, revenue: 642.31, image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=400&q=80" },
    { name: "Adidas Predator Accuracy.1 FG", asin: "B09X7P0KTM", category: "Football Boots", brand: "Adidas", views: 9843, unique: 7231, cart: 982, clicks: 1536, ctr: 15.6, conversion: 5.8, revenue: 534.12, image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=400&q=80" },
    { name: "Puma Ultra Ultimate FG", asin: "B0B3R9QJX9", category: "Football Boots", brand: "Puma", views: 8231, unique: 6124, cart: 732, clicks: 1341, ctr: 16.3, conversion: 6.1, revenue: 478.91, image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=400&q=80" },
    { name: "Nike Phantom GX II Elite FG", asin: "B0C2H5X126", category: "Football Boots", brand: "Nike", views: 7542, unique: 5642, cart: 612, clicks: 1123, ctr: 14.9, conversion: 5.4, revenue: 389.45, image: "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=400&q=80" },
    { name: "Adidas X Crazyfast.1 FG", asin: "B0B8R3QJX4", category: "Football Boots", brand: "Adidas", views: 6231, unique: 4521, cart: 512, clicks: 987, ctr: 15.9, conversion: 5.2, revenue: 341.25, image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=400&q=80" },
    { name: "Nike Tiempo Legend 10 Elite FG", asin: "B0C8T9L4M1", category: "Football Boots", brand: "Nike", views: 5821, unique: 4112, cart: 447, clicks: 812, ctr: 14.0, conversion: 4.9, revenue: 298.42, image: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=400&q=80" },
    { name: "Puma Future Ultimate FG", asin: "B0B8FTR912", category: "Football Boots", brand: "Puma", views: 5441, unique: 3984, cart: 411, clicks: 774, ctr: 14.2, conversion: 4.8, revenue: 276.31, image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=400&q=80" },
    { name: "Adidas Copa Pure.1 FG", asin: "B0C1COPA77", category: "Football Boots", brand: "Adidas", views: 4918, unique: 3604, cart: 381, clicks: 711, ctr: 14.5, conversion: 4.7, revenue: 251.08, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80" },
];

export const searchData: SearchTermRow[] = [
    ["nike mercurial vapor", 2451, 842, "Football Boots"],
    ["adidas predator", 1987, 612, "Football Boots"],
    ["football boots", 1543, 521, "Football Boots"],
    ["nike phantom gx", 1203, 432, "Football Boots"],
    ["puma ultra", 987, 341, "Football Boots"],
    ["nike tiempo legend", 842, 294, "Football Boots"],
    ["adidas crazyfast", 716, 251, "Football Boots"],
    ["running shoes", 664, 227, "Footwear"],
    ["training shorts", 603, 189, "Athletic Apparel"],
    ["gym equipment", 521, 168, "Training Equipment"],
];

export const trafficData: TrafficSource[] = [
    { source: "Organic Search", sessions: 81741, share: 52.3, pages: 4.21, bounce: 28.4, clicks: 13517, conversion: 7.8 },
    { source: "Direct", sessions: 36062, share: 23.1, pages: 3.72, bounce: 30.2, clicks: 5864, conversion: 6.9 },
    { source: "Social Media", sessions: 19874, share: 12.7, pages: 3.15, bounce: 37.8, clicks: 2901, conversion: 5.2 },
    { source: "Referral", sessions: 11856, share: 7.6, pages: 3.61, bounce: 32.5, clicks: 2019, conversion: 6.1 },
    { source: "Email", sessions: 6698, share: 4.3, pages: 4.48, bounce: 24.7, clicks: 1541, conversion: 8.4 },
];

export const statCards: StatCard[] = [
    { label: "Total Amazon Clicks", value: "25,842", change: "↑ 18.6% vs last 7 days", spark: "1,34 9,31 17,24 25,28 34,15 43,8 51,26 59,34 68,26 76,30" },
    { label: "Clicks Today", value: "3,691", change: "↑ 12.4% vs yesterday", spark: "1,25 9,31 17,20 25,28 34,11 43,22 51,37 59,14 68,32 76,7" },
    { label: "Clicks This Month", value: "78,903", change: "↑ 24.3% vs last month", spark: "1,28 8,35 17,17 26,25 35,11 44,28 53,19 62,31 70,20 78,24" },
    { label: "Total Page Views", value: "156,231", change: "↑ 15.7% vs last 7 days", spark: "1,35 9,31 17,34 25,22 34,26 43,10 51,17 59,2 68,17 76,9", blue: true },
    { label: "Conversion Rate", value: "6.72%", change: "↑ 0.8% vs last 7 days", spark: "1,20 9,29 17,22 25,35 34,20 43,28 51,10 59,17 68,2 76,13", blue: true },
    { label: "Revenue (Est.)", value: "$8,742.18", change: "↑ 20.1% vs last 7 days", spark: "1,32 9,27 17,34 25,25 34,18 43,29 51,9 59,17 68,1 76,9", blue: true },
];

export const topBrands = [
    ["Nike", "11,284", "43.6%"],
    ["Adidas", "6,842", "26.5%"],
    ["Puma", "3,245", "12.5%"],
    ["Under Armour", "2,134", "8.2%"],
    ["New Balance", "1,287", "5.0%"],
    ["Others", "1,050", "4.2%"],
];

export const productSortKeys = ["name", "views", "unique", "cart", "clicks", "ctr", "conversion", "revenue"];

export const defaultState: AnalyticsState = {
    page: "overview",
    dateRange: "May 13 – May 19, 2025",
    productCategory: "All Categories",
    productBrand: "All Brands",
    productPeriod: "Last 7 days",
    trafficChannel: "All Channels",
    trafficDevice: "All Devices",
    trafficPeriod: "May 13 – May 19, 2025",
    trafficTab: "traffic",
    productSearch: "",
    searchTerm: "",
    productSort: { key: "views", dir: "desc" },
    productPage: 1,
    trafficPage: 1,
    selectedProducts: [],
    calendarMonth: 4,
    calendarYear: 2025,
};
