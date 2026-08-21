"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    PRESET_LABELS,
    STORAGE_KEY,
    defaultState,
    productData as seedProducts,
    searchData as seedSearchData,
    trafficData as seedTrafficData,
} from "./analytics.data";
import type {
    AnalyticsPage,
    AnalyticsState,
    ModalKind,
    ProductData,
    ToastItem,
    TrafficTab,
} from "./analytics.types";

function loadState(): AnalyticsState {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        return { ...defaultState, ...(saved || {}) };
    } catch {
        return { ...defaultState };
    }
}

function saveState(state: AnalyticsState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* ignore */
    }
}

export function money(n: number) {
    return "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function num(n: number) {
    return Number(n).toLocaleString();
}

export function pct(n: number) {
    return Number(n).toFixed(1) + "%";
}

function csvCell(value: unknown) {
    const v = value == null ? "" : String(value);
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function downloadFile(content: string, name: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function useAnalytics() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [state, setStateInternal] = useState<AnalyticsState>(() => {
        const loaded = loadState();
        const param = searchParams.get("page");
        if (param === "products" || param === "traffic") loaded.page = param;
        return loaded;
    });

    useEffect(() => {
        const param = searchParams.get("page");
        if (param === "overview" || param === "products" || param === "traffic") {
            setStateInternal((cur) => ({ ...cur, page: param }));
        }
    }, [searchParams]);
    const [products, setProducts] = useState<ProductData[]>(() => [...seedProducts]);
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [modal, setModal] = useState<{ kind: ModalKind; product?: ProductData; statIndex?: number } | null>(null);
    const [activeDrawerAsin, setActiveDrawerAsin] = useState<string | null>(null);
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [editorDraft, setEditorDraft] = useState<{ name: string; asin: string; brand: string; category: string; image: string }>({
        name: "",
        asin: "",
        brand: "Nike",
        category: "Football Boots",
        image: "",
    });

    const stateRef = useRef(state);
    stateRef.current = state;
    const toastId = useRef(0);

    const setState = useCallback(
        (patch: Partial<AnalyticsState> | ((cur: AnalyticsState) => Partial<AnalyticsState>)) => {
            setStateInternal((cur) => {
                const next = { ...cur, ...(typeof patch === "function" ? patch(cur) : patch) };
                saveState(next);
                return next;
            });
        },
        [],
    );

    /* ============ TOASTS ============ */

    const notify = useCallback((message: string, type: "success" | "error" = "success") => {
        const id = ++toastId.current;
        setToasts((cur) => [...cur, { id, message, type }]);
        setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 3400);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((cur) => cur.filter((t) => t.id !== id));
    }, []);

    /* ============ PAGE / OVERLAYS ============ */

    const setPage = useCallback(
        (page: AnalyticsPage) => {
            setState({ page });
            router.replace(page === "overview" ? "/admin/analytics" : `/admin/analytics?page=${page}`, { scroll: false });
        },
        [router, setState],
    );

    const setTrafficTab = useCallback(
        (tab: TrafficTab) => {
            setState({ trafficTab: tab });
        },
        [setState],
    );

    const closeOverlays = useCallback(() => {
        setModal(null);
        setActiveDrawerAsin(null);
        setDatePopoverOpen(false);
    }, []);

    const closeModal = useCallback(() => setModal(null), []);
    const closeDrawer = useCallback(() => setActiveDrawerAsin(null), []);

    /* ============ DATE PICKER ============ */

    const openDatePicker = useCallback(() => {
        setDatePopoverOpen((cur) => !cur);
    }, []);

    const closeDatePicker = useCallback(() => setDatePopoverOpen(false), []);

    const moveCalendar = useCallback((dir: 1 | -1) => {
        setStateInternal((cur) => {
            let month = cur.calendarMonth + dir;
            let year = cur.calendarYear;
            if (month < 0) {
                month = 11;
                year -= 1;
            }
            if (month > 11) {
                month = 0;
                year += 1;
            }
            const next = { ...cur, calendarMonth: month, calendarYear: year };
            saveState(next);
            return next;
        });
    }, []);

    const pickDay = useCallback(
        (day: number, year: number, month: number) => {
            const label = `${new Date(year, month, 1).toLocaleString("en-US", { month: "short" })} ${day}, ${year}`;
            setState({ dateRange: label });
            setDatePopoverOpen(false);
            notify(`Date range changed to ${label}`);
        },
        [notify, setState],
    );

    const applyPreset = useCallback(
        (value: string) => {
            const label = PRESET_LABELS[value] ?? "Last 7 days";
            setState({ dateRange: label });
            setDatePopoverOpen(false);
            notify(`Date range changed to ${label}`);
        },
        [notify, setState],
    );

    /* ============ PRODUCT DATA ============ */

    const filteredProducts = useMemo(() => {
        let rows = [...products];
        const q = state.productSearch.trim().toLowerCase();
        if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.asin.toLowerCase().includes(q));
        if (state.productCategory !== "All Categories") rows = rows.filter((p) => p.category === state.productCategory);
        if (state.productBrand !== "All Brands") rows = rows.filter((p) => p.brand === state.productBrand);

        const { key, dir } = state.productSort;
        rows.sort((a, b) => {
            const av = typeof a[key as keyof ProductData] === "string" ? String(a[key as keyof ProductData]).toLowerCase() : (a[key as keyof ProductData] as number);
            const bv = typeof b[key as keyof ProductData] === "string" ? String(b[key as keyof ProductData]).toLowerCase() : (b[key as keyof ProductData] as number);
            if (av < bv) return dir === "asc" ? -1 : 1;
            if (av > bv) return dir === "asc" ? 1 : -1;
            return 0;
        });
        return rows;
    }, [products, state.productSearch, state.productCategory, state.productBrand, state.productSort]);

    const overviewRows = useMemo(() => {
        const { key, dir } = state.productSort;
        return [...products]
            .sort((a, b) => {
                const av = a[key as keyof ProductData] as number;
                const bv = b[key as keyof ProductData] as number;
                if (av < bv) return dir === "asc" ? -1 : 1;
                if (av > bv) return dir === "asc" ? 1 : -1;
                return 0;
            })
            .slice(0, 5);
    }, [products, state.productSort]);

    const productPageCount = Math.max(1, Math.ceil(filteredProducts.length / 8));
    const clampedProductPage = Math.min(state.productPage, productPageCount);
    const pageProducts = filteredProducts.slice((clampedProductPage - 1) * 8, clampedProductPage * 8);

    const setProductFilter = useCallback(
        (key: "productSearch" | "productCategory" | "productBrand" | "productPeriod", value: string) => {
            setState({ [key]: value, productPage: 1 } as Partial<AnalyticsState>);
        },
        [setState],
    );

    const clearProductFilter = useCallback(
        (key: "productSearch" | "productCategory" | "productBrand" | "productPeriod") => {
            const defaults = {
                productSearch: "",
                productCategory: "All Categories",
                productBrand: "All Brands",
                productPeriod: "Last 7 days",
            } as const;
            setState({ [key]: defaults[key], productPage: 1 } as Partial<AnalyticsState>);
            notify(`${key.replace("product", "")} filter cleared`);
        },
        [notify, setState],
    );

    const productChips: { label: string; value: string; key: "productSearch" | "productCategory" | "productBrand" | "productPeriod" }[] = [];
    if (state.productSearch) productChips.push({ label: "Search", value: state.productSearch, key: "productSearch" });
    if (state.productCategory !== "All Categories") productChips.push({ label: "Category", value: state.productCategory, key: "productCategory" });
    if (state.productBrand !== "All Brands") productChips.push({ label: "Brand", value: state.productBrand, key: "productBrand" });
    if (state.productPeriod !== "Last 7 days") productChips.push({ label: "Period", value: state.productPeriod, key: "productPeriod" });

    const sortProducts = useCallback(
        (key: string) => {
            setState((cur) => {
                const dir = cur.productSort.key === key && cur.productSort.dir === "desc" ? "asc" : "desc";
                return { productSort: { key, dir } };
            });
        },
        [setState],
    );

    const activeDrawerProduct = activeDrawerAsin ? products.find((p) => p.asin === activeDrawerAsin) ?? null : null;

    const openProductDrawer = useCallback((asin: string) => {
        setActiveDrawerAsin(asin);
    }, []);

    const drawerEdit = useCallback(() => {
        if (!activeDrawerAsin) return;
        const p = products.find((x) => x.asin === activeDrawerAsin);
        if (!p) return;
        setActiveDrawerAsin(null);
        setEditorDraft({ name: p.name, asin: p.asin, brand: p.brand, category: p.category, image: p.image });
        setModal({ kind: "editor", product: p });
    }, [activeDrawerAsin, products]);

    const drawerAmazon = useCallback(() => {
        if (!activeDrawerAsin) return;
        const p = products.find((x) => x.asin === activeDrawerAsin);
        if (!p) return;
        notify(`Amazon destination opened for ${p.name}`);
        window.open("https://www.amazon.com/s?k=" + encodeURIComponent(p.name), "_blank", "noopener,noreferrer");
    }, [activeDrawerAsin, products, notify]);

    const openEditor = useCallback((product: ProductData | null) => {
        setEditorDraft(
            product
                ? { name: product.name, asin: product.asin, brand: product.brand, category: product.category, image: product.image }
                : { name: "", asin: "", brand: "Nike", category: "Football Boots", image: "" },
        );
        setModal({ kind: "editor", product: product ?? undefined });
    }, []);

    const updateEditorDraft = useCallback((patch: Partial<{ name: string; asin: string; brand: string; category: string; image: string }>) => {
        setEditorDraft((cur) => ({ ...cur, ...patch }));
    }, []);

    const saveEditor = useCallback(() => {
        const name = editorDraft.name.trim();
        const asin = editorDraft.asin.trim();
        if (!name || !asin) {
            notify("Product name and ASIN are required", "error");
            return;
        }
        const editing = modal?.kind === "editor" && modal.product ? modal.product : null;
        if (editing) {
            setProducts((cur) =>
                cur.map((p) =>
                    p.asin === editing.asin
                        ? { ...p, name, asin, brand: editorDraft.brand, category: editorDraft.category, image: editorDraft.image || p.image }
                        : p,
                ),
            );
            notify("Product changes saved");
        } else {
            setProducts((cur) => [
                {
                    name,
                    asin,
                    brand: editorDraft.brand,
                    category: editorDraft.category,
                    image: editorDraft.image,
                    views: 0,
                    unique: 0,
                    cart: 0,
                    clicks: 0,
                    ctr: 0,
                    conversion: 0,
                    revenue: 0,
                },
                ...cur,
            ]);
            notify("Product created");
        }
        setModal(null);
    }, [editorDraft, modal, notify]);

    /* ============ COMPARE ============ */

    const toggleCompare = useCallback(
        (asin: string, checked: boolean) => {
            setState((cur) => {
                let selected = [...cur.selectedProducts];
                if (checked) {
                    if (selected.length >= 4) {
                        notify("You can compare up to 4 products", "error");
                        return cur;
                    }
                    if (!selected.includes(asin)) selected.push(asin);
                } else {
                    selected = selected.filter((x) => x !== asin);
                }
                return { selectedProducts: selected };
            });
        },
        [notify, setState],
    );

    const clearCompare = useCallback(() => {
        setState({ selectedProducts: [] });
        notify("Product comparison cleared");
    }, [notify, setState]);

    const openCompare = useCallback(() => {
        const selected = stateRef.current.selectedProducts
            .map((asin) => products.find((p) => p.asin === asin))
            .filter(Boolean) as ProductData[];
        if (selected.length < 2) {
            notify("Select at least 2 products to compare", "error");
            return;
        }
        setModal({ kind: "compare" });
    }, [products, notify]);

    /* ============ TRAFFIC / SEARCHES ============ */

    const filteredTraffic = useMemo(() => {
        if (state.trafficChannel === "All Channels") return [...seedTrafficData];
        return seedTrafficData.filter((x) => x.source === state.trafficChannel);
    }, [state.trafficChannel]);

    const filteredSearches = useMemo(() => {
        const q = state.searchTerm.trim().toLowerCase();
        if (!q) return [...seedSearchData];
        return seedSearchData.filter((x) => x[0].includes(q));
    }, [state.searchTerm]);

    const setTrafficFilter = useCallback(
        (key: "trafficChannel" | "trafficDevice" | "trafficPeriod", value: string) => {
            setState({ [key]: value, trafficPage: 1 } as Partial<AnalyticsState>);
        },
        [setState],
    );

    /* ============ EXPORT ============ */

    const openExportModal = useCallback(() => setModal({ kind: "export" }), []);

    const performExport = useCallback(
        (type: "csv" | "json" | "print") => {
            if (type === "print") {
                setModal(null);
                window.print();
                return;
            }

            const rows =
                stateRef.current.page === "traffic"
                    ? seedTrafficData.map((x) => ({
                          source: x.source,
                          sessions: x.sessions,
                          share: x.share,
                          pagesPerSession: x.pages,
                          bounceRate: x.bounce,
                          amazonClicks: x.clicks,
                          conversion: x.conversion,
                      }))
                    : products.map((x) => ({ name: x.name, asin: x.asin, category: x.category, brand: x.brand, views: x.views, unique: x.unique, cart: x.cart, clicks: x.clicks, ctr: x.ctr, conversion: x.conversion, revenue: x.revenue }));

            if (type === "json") {
                downloadFile(
                    JSON.stringify({ generatedAt: new Date().toISOString(), state: stateRef.current, rows }, null, 2),
                    "athletica-report.json",
                    "application/json",
                );
            } else {
                const headers = Object.keys(rows[0] || {});
                const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => csvCell(row[h as keyof typeof row])).join(","))].join("\n");
                downloadFile(csv, "athletica-report.csv", "text/csv;charset=utf-8");
            }
            setModal(null);
            notify(`Report exported as ${type.toUpperCase()}`);
        },
        [notify, products],
    );

    /* ============ STAT / BRANDS MODALS ============ */

    const openStatModal = useCallback((index: number) => {
        setModal({ kind: "stat", statIndex: index });
    }, []);

    const openBrandsModal = useCallback(() => setModal({ kind: "brands" }), []);

    const openTrafficCompare = useCallback(() => setModal({ kind: "trafficCompare" }), []);

    /* ============ GLOBAL EFFECTS ============ */

    const overlayOpen = modal !== null || activeDrawerAsin !== null;

    useEffect(() => {
        document.body.style.overflow = overlayOpen || datePopoverOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [overlayOpen, datePopoverOpen]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeOverlays();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [closeOverlays]);

    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === "hidden") saveState(stateRef.current);
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, []);

    return {
        state,
        products,
        toasts,
        modal,
        activeDrawerProduct,
        datePopoverOpen,
        editorDraft,
        pageProducts,
        productPageCount,
        filteredProducts,
        filteredTraffic,
        filteredSearches,
        overviewRows,
        productChips,
        notify,
        dismissToast,
        setPage,
        setTrafficTab,
        closeOverlays,
        closeModal,
        closeDrawer,
        openDatePicker,
        closeDatePicker,
        moveCalendar,
        pickDay,
        applyPreset,
        setProductFilter,
        clearProductFilter,
        sortProducts,
        openProductDrawer,
        drawerEdit,
        drawerAmazon,
        openEditor,
        updateEditorDraft,
        saveEditor,
        toggleCompare,
        clearCompare,
        openCompare,
        setTrafficFilter,
        openExportModal,
        performExport,
        openStatModal,
        openBrandsModal,
        openTrafficCompare,
        setState,
    };
}

export type AnalyticsModel = ReturnType<typeof useAnalytics>;
