"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer,
    ReactNode,
} from "react";

export type PopoverType = "date" | "chart-range";
export type DrawerType =
    | "product"
    | "products"
    | "activity"
    | "task"
    | "tasks"
    | "categories"
    | "manage-categories"
    | "route";

export interface DrawerPayload {
    type: DrawerType;
    productId?: string;
    issue?: string;
    route?: string;
}

export interface ToastPayload {
    tone: "success" | "error";
    title: string;
    message?: string;
}

interface InteractionState {
    route: string;
    sidebar: { mobileOpen: boolean; collapsed: boolean };
    popover: PopoverType | null;
    drawer: DrawerPayload | null;
    toast: ToastPayload | null;
    chart: { range: "Daily" | "Weekly" | "Monthly" };
    dateRange: { start: Date; end: Date };
}

function lastNDays(n: number): Date[] {
    const days: Date[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        days.push(d);
    }
    return days;
}

const days7 = lastNDays(7);

function startOfWeek(d: Date): Date {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

const today = new Date();
const thisWeekStart = startOfWeek(today);
const thisWeekEnd = new Date(today);
thisWeekEnd.setHours(0, 0, 0, 0);

const initialState: InteractionState = {
    route: "dashboard",
    sidebar: { mobileOpen: false, collapsed: false },
    popover: null,
    drawer: null,
    toast: null,
    chart: { range: "Daily" },
    dateRange: { start: thisWeekStart, end: thisWeekEnd },
};

type Action =
    | { type: "NAVIGATE"; route: string }
    | { type: "TOGGLE_SIDEBAR" }
    | { type: "OPEN_MOBILE_SIDEBAR" }
    | { type: "CLOSE_MOBILE_SIDEBAR" }
    | { type: "OPEN_POPOVER"; popover: PopoverType }
    | { type: "CLOSE_POPOVER" }
    | { type: "SET_CHART_RANGE"; range: "Daily" | "Weekly" | "Monthly" }
    | { type: "SET_DATE_RANGE"; start: Date; end: Date }
    | { type: "OPEN_DRAWER"; drawer: DrawerPayload }
    | { type: "CLOSE_DRAWER" }
    | { type: "SHOW_TOAST"; toast: ToastPayload }
    | { type: "CLEAR_TOAST" };

function reducer(state: InteractionState, action: Action): InteractionState {
    switch (action.type) {
        case "NAVIGATE":
            return { ...state, route: action.route, sidebar: { ...state.sidebar, mobileOpen: false }, popover: null, drawer: null };
        case "TOGGLE_SIDEBAR":
            return { ...state, sidebar: { ...state.sidebar, collapsed: !state.sidebar.collapsed } };
        case "OPEN_MOBILE_SIDEBAR":
            return { ...state, sidebar: { ...state.sidebar, mobileOpen: true } };
        case "CLOSE_MOBILE_SIDEBAR":
            return { ...state, sidebar: { ...state.sidebar, mobileOpen: false } };
        case "OPEN_POPOVER":
            return { ...state, popover: action.popover, drawer: null };
        case "CLOSE_POPOVER":
            return { ...state, popover: null };
        case "SET_CHART_RANGE":
            return { ...state, chart: { range: action.range } };
        case "SET_DATE_RANGE":
            return { ...state, dateRange: { start: action.start, end: action.end } };
        case "OPEN_DRAWER":
            return { ...state, drawer: action.drawer, popover: null };
        case "CLOSE_DRAWER":
            return { ...state, drawer: null };
        case "SHOW_TOAST":
            return { ...state, toast: action.toast };
        case "CLEAR_TOAST":
            return { ...state, toast: null };
        default:
            return state;
    }
}

interface InteractionContextValue {
    state: InteractionState;
    navigate: (route: string) => void;
    toggleSidebar: () => void;
    openMobileSidebar: () => void;
    closeMobileSidebar: () => void;
    openPopover: (popover: PopoverType) => void;
    closePopover: () => void;
    setChartRange: (range: "Daily" | "Weekly" | "Monthly") => void;
    setDateRange: (start: Date, end: Date) => void;
    openDrawer: (drawer: DrawerPayload) => void;
    closeDrawer: () => void;
    showToast: (toast: ToastPayload) => void;
    clearToast: () => void;
}

const InteractionContext = createContext<InteractionContextValue | undefined>(undefined);

export function InteractionProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const navigate = useCallback((route: string) => dispatch({ type: "NAVIGATE", route }), []);
    const toggleSidebar = useCallback(() => dispatch({ type: "TOGGLE_SIDEBAR" }), []);
    const openMobileSidebar = useCallback(() => dispatch({ type: "OPEN_MOBILE_SIDEBAR" }), []);
    const closeMobileSidebar = useCallback(() => dispatch({ type: "CLOSE_MOBILE_SIDEBAR" }), []);
    const openPopover = useCallback((popover: PopoverType) => dispatch({ type: "OPEN_POPOVER", popover }), []);
    const closePopover = useCallback(() => dispatch({ type: "CLOSE_POPOVER" }), []);
    const setChartRange = useCallback(
        (range: "Daily" | "Weekly" | "Monthly") => dispatch({ type: "SET_CHART_RANGE", range }),
        []
    );
    const setDateRange = useCallback(
        (start: Date, end: Date) => dispatch({ type: "SET_DATE_RANGE", start, end }),
        []
    );
    const openDrawer = useCallback((drawer: DrawerPayload) => dispatch({ type: "OPEN_DRAWER", drawer }), []);
    const closeDrawer = useCallback(() => dispatch({ type: "CLOSE_DRAWER" }), []);
    const showToast = useCallback((toast: ToastPayload) => dispatch({ type: "SHOW_TOAST", toast }), []);
    const clearToast = useCallback(() => dispatch({ type: "CLEAR_TOAST" }), []);

    const value = useMemo<InteractionContextValue>(
        () => ({
            state,
            navigate,
            toggleSidebar,
            openMobileSidebar,
            closeMobileSidebar,
            openPopover,
            closePopover,
            setChartRange,
            setDateRange,
            openDrawer,
            closeDrawer,
            showToast,
            clearToast,
        }),
        [
            state,
            navigate,
            toggleSidebar,
            openMobileSidebar,
            closeMobileSidebar,
            openPopover,
            closePopover,
            setChartRange,
            setDateRange,
            openDrawer,
            closeDrawer,
            showToast,
            clearToast,
        ]
    );

    return <InteractionContext.Provider value={value}>{children}</InteractionContext.Provider>;
}

export function useDashboardInteraction(): InteractionContextValue {
    const context = useContext(InteractionContext);
    if (!context) {
        throw new Error("useDashboardInteraction must be used inside InteractionProvider");
    }
    return context;
}