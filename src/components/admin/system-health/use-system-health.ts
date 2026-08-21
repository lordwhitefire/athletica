"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    AFFECTED_PRODUCTS,
    DEFAULT_RANGE,
    ISSUES,
    ISSUE_ORDER,
    downloadCSV,
    formatHumanDate,
    formatRangeLabel,
    type IssueKey,
} from "./system-health-data";

export interface AdminProfile {
    name: string;
    email: string;
    role: string;
}

export interface Toast {
    id: number;
    title: string;
    message: string;
    type: "success" | "warning" | "error" | "info";
}

export type TabKey = "all" | "images" | "asin" | "category" | "broken";

export type ModalKind =
    | "date"
    | "issue"
    | "products"
    | "syncHistory"
    | "syncDetail"
    | "alerts"
    | "issuesReport"
    | "improvements"
    | "preferences";

export interface SystemHealthModel {
    activeTab: TabKey;
    searchQuery: string;
    selectedRange: { from: string; to: string };
    rangeLabel: string;
    dateCursor: Date;
    dateStep: "from" | "to";
    isRefreshing: boolean;
    profile: AdminProfile;
    modal: ModalKind | null;
    issueKey: IssueKey | null;
    productsTitle: string | null;
    syncId: string | null;
    profileOpen: boolean;
    toasts: Toast[];
    issues: typeof ISSUES;
    issueOrder: IssueKey[];
    setTab: (tab: TabKey) => void;
    setSearch: (query: string) => void;
    refresh: () => void;
    openModal: (kind: ModalKind) => void;
    closeModal: () => void;
    calendarPrev: () => void;
    calendarNext: () => void;
    pickDate: (dateKey: string) => void;
    applyDateRange: () => void;
    openIssueDetails: (key: IssueKey) => void;
    openProducts: (title: string) => void;
    openSyncHistory: () => void;
    openSyncDetail: (id: string) => void;
    markIssueReviewed: () => void;
    markAlertsReviewed: () => void;
    startImprovements: () => void;
    savePreferences: () => void;
    exportIssuesReport: () => void;
    exportProducts: () => void;
    toggleProfileMenu: () => void;
    closeProfileMenu: () => void;
    runProfileAction: (action: "account" | "preferences" | "signout") => void;
    dismissToast: (id: number) => void;
}

export function useSystemHealth(
    profile: AdminProfile,
    onNavigate: (path: string) => void,
    onSignOut: () => void
): SystemHealthModel {
    const [activeTab, setActiveTab] = useState<TabKey>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRange, setSelectedRange] = useState(DEFAULT_RANGE);
    const [dateCursor, setDateCursor] = useState(() => new Date(2025, 4, 1));
    const [dateStep, setDateStep] = useState<"from" | "to">("from");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [modal, setModal] = useState<ModalKind | null>(null);
    const [issueKey, setIssueKey] = useState<IssueKey | null>(null);
    const [productsTitle, setProductsTitle] = useState<string | null>(null);
    const [syncId, setSyncId] = useState<string | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastId = useRef(0);
    const refreshTimer = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        };
    }, []);

    const showToast = useCallback(
        (title: string, message = "", type: Toast["type"] = "success", duration = 3000) => {
            const id = ++toastId.current;
            setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
            window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
        },
        []
    );

    const dismissToast = useCallback(
        (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
        []
    );

    const setTab = useCallback((tab: TabKey) => setActiveTab(tab), []);
    const setSearch = useCallback((query: string) => setSearchQuery(query), []);

    const refresh = useCallback(() => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        showToast("Refreshing system health data…", "", "info", 1700);
        refreshTimer.current = window.setTimeout(() => {
            setIsRefreshing(false);
            showToast("System health data refreshed successfully.");
        }, 1050);
    }, [isRefreshing, showToast]);

    const openModal = useCallback((kind: ModalKind) => setModal(kind), []);
    const closeModal = useCallback(() => setModal(null), []);

    const calendarPrev = useCallback(
        () =>
            setDateCursor(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
            ),
        []
    );

    const calendarNext = useCallback(
        () =>
            setDateCursor(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
            ),
        []
    );

    const pickDate = useCallback(
        (dateKey: string) => {
            setSelectedRange((prev) => {
                if (dateStep === "from") {
                    setDateStep("to");
                    return { from: dateKey, to: dateKey };
                }
                setDateStep("from");
                if (dateKey < prev.from) {
                    return { from: dateKey, to: prev.from };
                }
                return { from: prev.from, to: dateKey };
            });
        },
        [dateStep]
    );

    const applyDateRange = useCallback(() => {
        const label = formatRangeLabel(selectedRange.from, selectedRange.to);
        setModal(null);
        showToast(`Date range changed to ${label}.`);
    }, [selectedRange, showToast]);

    const openIssueDetails = useCallback(
        (key: IssueKey) => {
            setIssueKey(key);
            setModal("issue");
        },
        []
    );

    const openProducts = useCallback(
        (title: string) => {
            setProductsTitle(title);
            setModal("products");
        },
        []
    );

    const openSyncHistory = useCallback(() => {
        setModal("syncHistory");
    }, []);

    const openSyncDetail = useCallback(
        (id: string) => {
            setSyncId(id);
            setModal("syncDetail");
        },
        []
    );

    const markIssueReviewed = useCallback(() => {
        const issue = issueKey ? ISSUES[issueKey] : null;
        setModal(null);
        showToast(`${issue?.title ?? "Issue"} marked as reviewed.`);
    }, [issueKey, showToast]);

    const markAlertsReviewed = useCallback(() => {
        setModal(null);
        showToast("All visible alerts marked as reviewed.");
    }, [showToast]);

    const startImprovements = useCallback(() => {
        setModal(null);
        showToast("Improvement review started.");
    }, [showToast]);

    const savePreferences = useCallback(() => {
        setModal(null);
        showToast("Preferences saved.");
    }, [showToast]);

    const exportIssuesReport = useCallback(() => {
        downloadCSV("athletica-data-quality-report.csv", [
            ["Issue Type", "Products Affected", "Percentage", "Trend", "Severity"],
            ...ISSUE_ORDER.map((key) => {
                const issue = ISSUES[key];
                return [issue.title, issue.count, issue.percentage, issue.trend, issue.severity];
            }),
        ]);
        showToast("Data issues CSV exported.");
    }, [showToast]);

    const exportProducts = useCallback(() => {
        downloadCSV("athletica-affected-products.csv", [
            ["Product", "ID", "Status"],
            ...AFFECTED_PRODUCTS.map((p) => [p.name, p.id, "Open"]),
        ]);
        showToast("Affected product CSV exported.");
    }, [showToast]);

    const toggleProfileMenu = useCallback(() => setProfileOpen((prev) => !prev), []);
    const closeProfileMenu = useCallback(() => setProfileOpen(false), []);

    const runProfileAction = useCallback(
        (action: "account" | "preferences" | "signout") => {
            setProfileOpen(false);
            if (action === "account") {
                onNavigate("/admin/settings");
                return;
            }
            if (action === "preferences") {
                setModal("preferences");
                return;
            }
            onSignOut();
        },
        [onNavigate, onSignOut]
    );

    return {
        activeTab,
        searchQuery,
        selectedRange,
        rangeLabel: formatRangeLabel(selectedRange.from, selectedRange.to),
        dateCursor,
        dateStep,
        isRefreshing,
        modal,
        issueKey,
        productsTitle,
        syncId,
        profileOpen,
        toasts,
        issues: ISSUES,
        issueOrder: ISSUE_ORDER,
        setTab,
        setSearch,
        refresh,
        openModal,
        closeModal,
        calendarPrev,
        calendarNext,
        pickDate,
        applyDateRange,
        openIssueDetails,
        openProducts,
        openSyncHistory,
        openSyncDetail,
        markIssueReviewed,
        markAlertsReviewed,
        startImprovements,
        savePreferences,
        exportIssuesReport,
        exportProducts,
        toggleProfileMenu,
        closeProfileMenu,
        runProfileAction,
        dismissToast,
        profile,
    };
}