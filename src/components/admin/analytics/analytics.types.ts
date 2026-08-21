export type AnalyticsPage = "overview" | "products" | "traffic";

export type TrafficTab = "traffic" | "searches";

export type SortDir = "asc" | "desc";

export interface ProductData {
    name: string;
    asin: string;
    category: string;
    brand: string;
    views: number;
    unique: number;
    cart: number;
    clicks: number;
    ctr: number;
    conversion: number;
    revenue: number;
    image: string;
}

export interface TrafficSource {
    source: string;
    sessions: number;
    share: number;
    pages: number;
    bounce: number;
    clicks: number;
    conversion: number;
}

export type SearchTermRow = [term: string, searches: number, clicks: number, category: string];

export interface ProductSort {
    key: string;
    dir: SortDir;
}

export interface AnalyticsState {
    page: AnalyticsPage;
    dateRange: string;
    productCategory: string;
    productBrand: string;
    productPeriod: string;
    trafficChannel: string;
    trafficDevice: string;
    trafficPeriod: string;
    trafficTab: TrafficTab;
    productSearch: string;
    searchTerm: string;
    productSort: ProductSort;
    productPage: number;
    trafficPage: number;
    selectedProducts: string[];
    calendarMonth: number;
    calendarYear: number;
}

export type ModalKind =
    | "export"
    | "stat"
    | "brands"
    | "compare"
    | "trafficCompare"
    | "editor";

export interface ToastItem {
    id: number;
    message: string;
    type: "success" | "error";
}

export interface StatCard {
    label: string;
    value: string;
    change: string;
    spark: string;
    blue?: boolean;
}
