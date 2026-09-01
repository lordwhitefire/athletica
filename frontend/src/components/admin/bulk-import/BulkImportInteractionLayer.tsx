"use client";

import React from "react";
import type { CatalogProduct } from "../product-catalog/product-catalog.interactions";
import type { ImportValidationData, ImportErrorRow } from "@/lib/actions/products";
import {
    IMPORT_COLUMNS,
    PRODUCT_FIELDS,
    buildSampleCsv,
    triggerDownload,
    formatDateForImport,
    formatBytes,
    type ImportStep,
    type ImportStatus,
    type ModalType,
    type DrawerType,
    type Toast,
    type RecentImport,
} from "./bulk-import.interactions";
import { getImportValidationData, getCatalogProducts } from "@/lib/actions/products";
import { batchCreateProducts } from "@/lib/actions/batch-upload";
import type { BatchUploadCreateResult, BatchUploadParseResult } from "@/lib/schemas/batch-upload";

const ACCEPTED_EXTENSIONS = ["csv", "xlsx", "zip"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const STEPS: { key: ImportStep; number: string; title: string; subtitle: string }[] = [
    { key: "upload", number: "1", title: "Upload File", subtitle: "Choose your file" },
    { key: "mapping", number: "2", title: "Map Fields", subtitle: "Match columns" },
    { key: "validation", number: "3", title: "Validate Data", subtitle: "Review & fix issues" },
    { key: "preview", number: "4", title: "Preview", subtitle: "Review products" },
    { key: "import", number: "5", title: "Import", subtitle: "Import to catalog" },
];

type Props = {
    products: CatalogProduct[];
    validation: ImportValidationData;
    title?: string;
    subtitle?: string;
};

function pct(n: number, total: number): string {
    if (total <= 0) return "0.0%";
    return `${Math.round((n / total) * 1000) / 10}%`;
}

function formatCurrency(n: number): string {
    return `$${n.toFixed(2)}`;
}

function ModalSurface({
    children,
    onClose,
    labelledBy,
    wide = false,
}: {
    children: React.ReactNode;
    onClose: () => void;
    labelledBy?: string;
    wide?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[70] flex items-end min-[560px]:items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                className={[
                    "relative z-10 w-[calc(100vw-24px)] max-h-[calc(100vh-24px)] overflow-y-auto rounded-[8px] border border-[#252525] bg-[#0c0c0c] p-5 shadow-2xl",
                    wide ? "max-w-[720px]" : "max-w-[560px]",
                ].join(" ")}
            >
                {children}
            </div>
        </div>
    );
}

function DrawerSurface({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-[70]">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="absolute right-0 top-0 h-full w-full min-[560px]:w-[560px] flex flex-col bg-[#0c0c0c] border-l border-[#252525] shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-[#1d1d1d] px-5 py-4">
                    <h2 className="text-[13px] font-semibold text-[#ededed]">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-[#a4a4a4] hover:text-white"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">{children}</div>
            </div>
        </div>
    );
}

function ToastView({ toast, onDismiss }: { toast: NonNullable<Toast>; onDismiss: () => void }) {
    const tones: Record<NonNullable<Toast>["type"], string> = {
        success: "#a7eb28",
        error: "#ef4d40",
        warning: "#e5a11d",
        info: "#3c94e5",
    };
    const icons: Record<NonNullable<Toast>["type"], string> = {
        success: "check_circle",
        error: "error",
        warning: "warning",
        info: "info",
    };
    return (
        <div
            role="status"
            className="fixed z-[90] bottom-4 inset-x-4 sm:left-auto sm:right-4 sm:w-96 flex items-start gap-3 rounded-[8px] border border-[#252525] bg-[#111111] p-4 shadow-2xl"
        >
            <span
                className="material-symbols-outlined text-[16px] mt-[1px]"
                style={{ color: tones[toast.type] }}
            >
                {icons[toast.type]}
            </span>
            <p className="flex-1 text-[11px] text-[#ededed] leading-snug">{toast.message}</p>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss notification"
                className="text-[#8a8a8a] hover:text-white"
            >
                <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
        </div>
    );
}

function StatusBadge({ type, children }: { type: "blue" | "green" | "red"; children: React.ReactNode }) {
    const styles: Record<"blue" | "green" | "red", string> = {
        blue: "bg-[#12344b] text-[#52b7f5]",
        green: "bg-[#244400] text-[#a7eb28]",
        red: "bg-[#4b1d19] text-[#ed5346]",
    };
    return (
        <span className={`inline-flex whitespace-nowrap rounded-[5px] px-2 py-[4px] text-[9px] font-medium ${styles[type]}`}>
            {children}
        </span>
    );
}

function SummaryCard({
    icon,
    iconColor,
    value,
    label,
    note,
    onClick,
    disabled = false,
}: {
    icon: string;
    iconColor: string;
    value: string;
    label: string;
    note: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="rounded-[7px] border border-[#1d1d1d] bg-[#111111] p-4 text-left transition hover:border-[#343434] disabled:cursor-default disabled:opacity-90 disabled:hover:border-[#1d1d1d]"
        >
            <div className="flex items-center gap-2">
                <span style={{ color: iconColor }}>
                    <span className="material-symbols-outlined text-[19px]">{icon}</span>
                </span>
                <span className="text-[17px] font-medium tracking-[-0.5px] text-[#e4e4e4]">{value}</span>
            </div>
            <div className="mt-3 text-[9px] text-[#bdbdbd]">{label}</div>
            <div className="mt-1 text-[8px]" style={{ color: iconColor }}>
                {note}
            </div>
        </button>
    );
}

export default function BulkImportInteractionLayer({
    products,
    validation,
    title = "Bulk Import Center",
    subtitle = "Import products in bulk and validate your data before adding to the catalog.",
}: Props) {
    const [step, setStep] = React.useState<ImportStep>("upload");
    const [status, setStatus] = React.useState<ImportStatus>("idle");
    const [file, setFile] = React.useState<File | null>(null);
    const [fileError, setFileError] = React.useState<string | null>(null);
    const [dragging, setDragging] = React.useState(false);
    const [skipCriticalErrors, setSkipCriticalErrors] = React.useState(true);
    const [settings, setSettings] = React.useState({
        encoding: "UTF-8",
        duplicateHandling: "Update existing products",
        uncategorizedCategory: "Uncategorized",
        defaultStatus: "Draft",
    });
    const [mapping, setMapping] = React.useState<Record<string, string>>(() =>
        Object.fromEntries(PRODUCT_FIELDS.map((f) => [f.key, f.key])),
    );
    const [stats, setStats] = React.useState<ImportValidationData | null>(validation);
    const [visited, setVisited] = React.useState({ mapping: false, validation: false, preview: false });
    const [realValidation, setRealValidation] = React.useState<ImportValidationData>(validation);
    const [realProducts, setRealProducts] = React.useState<CatalogProduct[]>(products);
    const [modal, setModal] = React.useState<ModalType>(null);
    const [drawer, setDrawer] = React.useState<DrawerType>(null);
    const [toast, setToast] = React.useState<Toast>(null);
    const [issueKey, setIssueKey] = React.useState("missingAsin");
    const [errorRow, setErrorRow] = React.useState<ImportErrorRow | null>(null);
    const [errorsSearch, setErrorsSearch] = React.useState("");
    const [errorsPage, setErrorsPage] = React.useState(1);
    const [imports, setImports] = React.useState<RecentImport[]>([]);
    const [history] = React.useState<RecentImport[]>([]);
    const [importsPage, setImportsPage] = React.useState(1);
    const [historySearch, setHistorySearch] = React.useState("");
    const [historyStatus, setHistoryStatus] = React.useState("all");
    const [historyDate, setHistoryDate] = React.useState("all");
    const [historyPage, setHistoryPage] = React.useState(1);
    const [selectedImportId, setSelectedImportId] = React.useState<string | null>(null);
    const [progress, setProgress] = React.useState(0);
    const [importFailed, setImportFailed] = React.useState(false);
    const [importError, setImportError] = React.useState<string | null>(null);
    const [importResult, setImportResult] = React.useState<BatchUploadCreateResult | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const importTimerRef = React.useRef<number | null>(null);
    // FR3-F: synchronous double-click guard — React state updates are async,
    // so two rapid clicks could both pass a state-only check. A ref flips
    // immediately within the first invocation.
    const importInFlightRef = React.useRef(false);

    React.useEffect(() => {
        return () => {
            if (importTimerRef.current) window.clearInterval(importTimerRef.current);
        };
    }, []);

    const showToast = (type: NonNullable<Toast>["type"], message: string) =>
        setToast({ type, message });

    React.useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 3000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    React.useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setModal(null);
                setDrawer(null);
            }
        };
        document.addEventListener("keydown", onKey);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("keydown", onKey);
        };
    }, []);

    React.useEffect(() => {
        const locked = modal !== null || drawer !== null;
        const previous = document.body.style.overflow;
        if (locked) document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [modal, drawer]);

    const allErrorRows = React.useMemo(
        () => (stats ? stats.issues.flatMap((issue) => issue.rows) : []),
        [stats],
    );

    const issueByKey = React.useMemo(() => {
        const map = new Map<string, NonNullable<ImportValidationData["issues"]>[number]>();
        if (stats) stats.issues.forEach((issue) => map.set(issue.key, issue));
        return map;
    }, [stats]);

    const selectedIssue = stats ? issueByKey.get(issueKey) : undefined;
    const selectedImport =
        imports.find((item) => item.id === selectedImportId) ??
        history.find((item) => item.id === selectedImportId) ??
        null;

    const currentValidation = realValidation;

    const previewItems = realProducts.map((product, index) => ({
        row: index + 1,
        name: product.name,
        sku: product.sku,
        price: product.price,
        category: product.category,
        brand: product.brand,
        status: product.status,
    }));

    const previewTotal = realProducts.length;

    async function refreshData() {
        const [validationResult, productsResult] = await Promise.all([
            getImportValidationData(),
            getCatalogProducts({}),
        ]);
        if (validationResult.error || productsResult.error) return;
        setRealValidation(validationResult.data);
        setRealProducts(productsResult.data.items);
        setStats(validationResult.data);
    }

    function acceptFile(next: File | null) {
        if (!next) return;
        const ext = next.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
            setFileError("Unsupported file type. Please upload a CSV, XLSX, or ZIP file.");
            showToast("error", "Unsupported file type. Please upload a CSV, XLSX, or ZIP file.");
            return;
        }
        if (next.size > MAX_FILE_SIZE) {
            setFileError("File is too large. Maximum file size is 50MB.");
            showToast("error", "File is too large. Maximum file size is 50MB.");
            return;
        }
        setFileError(null);
        setFile(next);
        setStatus("uploaded");
        setImportsPage(1);
        showToast("success", "File uploaded successfully.");
    }

    function removeFile() {
        setFile(null);
        setFileError(null);
        setStatus("idle");
        setStep("upload");
        setModal(null);
        showToast("info", "File removed.");
    }

    function downloadSample() {
        const csv = buildSampleCsv(realProducts);
        triggerDownload(`athletica_products_sample_${new Date().toISOString().slice(0, 10)}.csv`, csv);
        showToast("success", "Sample CSV downloaded.");
    }

    function toggleSkip() {
        setSkipCriticalErrors((value) => {
            const next = !value;
            showToast("info", next ? "Critical-error rows will be skipped." : "Critical errors will block import.");
            return next;
        });
    }

    function goToStep(target: ImportStep) {
        if (status === "importing") return;
        switch (target) {
            case "upload":
                setStep("upload");
                break;
            case "mapping":
                if (!file) return showToast("warning", "Complete the previous step first.");
                setStep("mapping");
                break;
            case "validation":
                if (!file || !visited.mapping) return showToast("warning", "Complete the previous step first.");
                if (!stats) return runValidation();
                setStep("validation");
                break;
            case "preview":
                if (!stats) return showToast("warning", "Complete the previous step first.");
                setStep("preview");
                break;
            case "import":
                if (!visited.preview) return showToast("warning", "Complete the previous step first.");
                setModal("import-confirm");
                break;
        }
    }

    function continueToMapping() {
        if (!file) return showToast("warning", "Please upload a file first.");
        setStep("mapping");
        setStatus("mapping");
        setVisited((v) => ({ ...v, mapping: true }));
    }

    function runValidation() {
        if (status === "validating") return;
        setStatus("validating");
        setVisited((v) => ({ ...v, mapping: true, validation: true }));
        window.setTimeout(() => {
            setStats(currentValidation);
            setStatus("validated");
            setStep("validation");
            showToast("success", "Validation completed.");
        }, 700);
    }

    function finishImport(result: BatchUploadCreateResult) {
        setStatus("completed");
        setStep("import");
        const failed = result.failed;
        const record: RecentImport = {
            id: `imp-${Date.now()}`,
            file: file?.name ?? "athletica_products_export.zip",
            by: "Admin",
            date: formatDateForImport(new Date()),
            total: result.created + failed,
            valid: result.created,
            issues: failed,
            errors: failed,
            status: failed > 0 ? "Partial" : "Imported",
            statusType: failed > 0 ? "blue" : "green",
        };
        setImports((list) => [record, ...list]);
        setImportsPage(1);
        setSelectedImportId(record.id);
        showToast(
            failed > 0 ? "warning" : "success",
            failed > 0
                ? `Import finished with ${failed} failed row${failed === 1 ? "" : "s"}.`
                : "Import completed successfully.",
        );
        refreshData();
    }

    async function runImport() {
        if (importInFlightRef.current || status === "importing") return;
        if (!file) {
            showToast("error", "Choose a file to import first.");
            return;
        }
        importInFlightRef.current = true;
        try {
            await runImportInner(file);
        } finally {
            importInFlightRef.current = false;
        }
    }

    async function runImportInner(file: File) {
        setStatus("importing");
        setImportFailed(false);
        setImportError(null);
        setProgress(0);
        let current = 0;
        if (importTimerRef.current) window.clearInterval(importTimerRef.current);
        importTimerRef.current = window.setInterval(() => {
            current = Math.min(90, current + 4 + Math.floor(Math.random() * 6));
            setProgress(current);
        }, 150);

        const stopProgress = () => {
            if (importTimerRef.current) window.clearInterval(importTimerRef.current);
            importTimerRef.current = null;
        };

        try {
            if (/\.(zip|csv|xlsx)$/i.test(file.name ?? "") === false) {
                throw new Error("Only .zip, .csv, or .xlsx files are supported by the import pipeline.");
            }
            const formData = new FormData();
            formData.set("file", file);
            const parseRes = await fetch("/api/admin/batch-upload/parse", { method: "POST", body: formData });
            const parseJson = (await parseRes.json()) as {
                data: BatchUploadParseResult | null;
                error: { message?: string } | null;
            };
            if (!parseRes.ok || !parseJson.data) {
                throw new Error(parseJson.error?.message || "Failed to parse the uploaded file.");
            }
            const createResult = await batchCreateProducts(parseJson.data.productData);
            if (!createResult.data) {
                throw new Error(createResult.error.message || "Import failed while saving products.");
            }
            stopProgress();
            setProgress(100);
            setImportResult(createResult.data);
            finishImport(createResult.data);
        } catch (err) {
            stopProgress();
            setProgress(0);
            const message = err instanceof Error ? err.message : "The import could not be completed.";
            setImportError(message);
            setImportFailed(true);
            setStatus("failed");
            showToast("error", message);
        }
    }

    function markFixed(row: ImportErrorRow, key: string) {
        setStats((current) => {
            if (!current) return current;
            const issues = current.issues.map((issue) =>
                issue.key === key
                    ? {
                          ...issue,
                          rows: issue.rows.filter(
                              (r) => !(r.row === row.row && r.issue === row.issue),
                          ),
                          count: Math.max(0, issue.count - 1),
                      }
                    : issue,
            );
            const affected = new Set<number>();
            let critical = 0;
            issues.forEach((issue) => {
                issue.rows.forEach((r) => affected.add(r.row));
                if (issue.critical) critical += issue.rows.length;
            });
            return {
                ...current,
                issues,
                issueRows: affected.size,
                criticalErrors: critical,
                validRows: current.totalRows - affected.size,
            };
        });
        setDrawer(null);
        setErrorRow(null);
        showToast("success", "Error marked as fixed.");
    }

    function downloadReport(record: RecentImport) {
        const csv = [
            "field,value",
            `file,${record.file}`,
            `total,${record.total}`,
            `valid,${record.valid}`,
            `issues,${record.issues}`,
            `errors,${record.errors}`,
            `status,${record.status}`,
        ].join("\n");
        triggerDownload(`${record.file.replace(/\.csv$/, "")}_report.csv`, csv);
        showToast("success", "Import report downloaded.");
    }

    function confirmDeleteImport() {
        setImports((list) => {
            const next = list.filter((item) => item.id !== selectedImportId);
            setImportsPage((page) => Math.min(Math.max(1, page), Math.max(1, Math.ceil(next.length / 10))));
            return next;
        });
        setModal(null);
        setSelectedImportId(null);
        showToast("success", "Import record deleted.");
    }

    const stepIndex = STEPS.findIndex((s) => s.key === step);
    const stepAllowed = (index: number): boolean => {
        if (index === 0) return true;
        if (index === 1) return Boolean(file);
        if (index === 2) return visited.mapping;
        if (index === 3) return Boolean(stats);
        return visited.preview;
    };

    const validItems = React.useMemo(() => {
        const invalidRows = new Set(allErrorRows.map((r) => r.row));
        return previewItems.filter((item) => !invalidRows.has(item.row));
    }, [previewItems, allErrorRows]);

    const totalRows = stats?.totalRows ?? currentValidation.totalRows;
    const validCount = stats?.validRows ?? 0;
    const issueCount = stats?.issueRows ?? 0;
    const criticalCount = stats?.criticalErrors ?? 0;
    const failedImportRows = React.useMemo(
        () => (importResult ? importResult.results.filter((r) => !r.success) : []),
        [importResult],
    );
    const validated = Boolean(stats);

    const filteredErrors = React.useMemo(() => {
        const query = errorsSearch.trim().toLowerCase();
        const filtered = query
            ? allErrorRows.filter(
                  (row) =>
                      String(row.row).includes(query) ||
                      row.issue.toLowerCase().includes(query) ||
                      row.value.toLowerCase().includes(query),
              )
            : allErrorRows;
        return filtered.sort((a, b) => a.row - b.row);
    }, [allErrorRows, errorsSearch]);

    const errorsPageCount = Math.max(1, Math.ceil(filteredErrors.length / 10));
    const errorsPageRows = filteredErrors.slice((errorsPage - 1) * 10, errorsPage * 10);

    const importsPageCount = Math.max(1, Math.ceil(imports.length / 10));
    const importsPageRows = imports.slice((importsPage - 1) * 10, importsPage * 10);

    const filteredHistory = React.useMemo(() => {
        const query = historySearch.trim().toLowerCase();
        return history.filter((item) => {
            const matchesSearch =
                !query ||
                item.file.toLowerCase().includes(query) ||
                item.by.toLowerCase().includes(query) ||
                item.status.toLowerCase().includes(query);
            const matchesStatus =
                historyStatus === "all" || item.status === historyStatus;
            const matchesDate =
                historyDate === "all" ||
                (historyDate === "may2025" && item.date.startsWith("May"));
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [history, historySearch, historyStatus, historyDate]);

    const historyPageCount = Math.max(1, Math.ceil(filteredHistory.length / 10));
    const historyPageRows = filteredHistory.slice((historyPage - 1) * 10, historyPage * 10);

    function PageButtons({
        page,
        count,
        onChange,
    }: {
        page: number;
        count: number;
        onChange: (page: number) => void;
    }) {
        const numbers = Array.from({ length: Math.min(5, count) }, (_, i) =>
            count <= 5 ? i + 1 : Math.min(count, Math.max(1, page - 2) + i),
        );
        return (
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] border border-[#242424] text-[#8a8a8a] disabled:opacity-30"
                >
                    <span className="material-symbols-outlined text-[13px]">chevron_left</span>
                </button>
                {numbers.map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        aria-label={`Page ${n}`}
                        aria-current={page === n ? "page" : undefined}
                        className={[
                            "flex h-[28px] w-[28px] items-center justify-center rounded-[5px] border text-[9px]",
                            page === n
                                ? "border-[#aaf11d] bg-[#aaf11d] font-semibold text-black"
                                : "border-[#242424] text-[#9c9c9c] hover:bg-[#171717]",
                        ].join(" ")}
                    >
                        {n}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => onChange(Math.min(count, page + 1))}
                    disabled={page === count}
                    aria-label="Next page"
                    className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] border border-[#242424] text-[#8a8a8a] disabled:opacity-30"
                >
                    <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                </button>
            </div>
        );
    }

    function Field({
        label,
        value,
        onChange,
        options,
    }: {
        label: string;
        value: string;
        onChange: (value: string) => void;
        options: string[];
    }) {
        return (
            <label className="block min-w-0">
                <span className="mb-2 block text-[11px] font-medium tracking-[0.01em] text-[#c6c6c6]">
                    {label}
                </span>
                <span className="relative block">
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-[36px] w-full appearance-none rounded-[6px] border border-[#303030] bg-[#111111] px-3 pr-9 text-[12px] text-[#e8e8e8] outline-none transition focus:border-[#a8ed20]"
                    >
                        {options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8a8a]">
                        <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </span>
                </span>
            </label>
        );
    }

    return (
        <>
            <div data-bulk-import-layer>
                <div data-import-state hidden>
                    {JSON.stringify({
                        step,
                        status,
                        file: file?.name ?? null,
                        modal,
                        drawer,
                        progress,
                    })}
                </div>

                {/* PAGE HEAD */}
                <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-[22px] font-semibold leading-none tracking-[-0.7px] text-[#f5f5f5] sm:text-[23px]">
                            {title}
                        </h1>
                        <p className="mt-2 text-[11px] text-[#9a9a9a] sm:text-[12px]">{subtitle}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={downloadSample}
                            data-existing-control="download-sample"
                            className="inline-flex h-[36px] items-center gap-2 rounded-[6px] border border-[#252525] bg-[#0c0c0c] px-3 text-[10px] font-medium text-[#efefef] transition hover:border-[#444] hover:bg-[#141414]"
                        >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            <span>Download Sample CSV</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setModal("new-import")}
                            data-existing-control="new-import"
                            className="inline-flex h-[36px] items-center gap-2 rounded-[6px] bg-[#b1f218] px-4 text-[10px] font-semibold text-[#0a0a0a] shadow-[0_0_22px_rgba(177,242,24,.08)] transition hover:bg-[#c0ff35]"
                        >
                            <span className="material-symbols-outlined text-[15px]">add</span>
                            <span>New Import</span>
                        </button>
                    </div>
                </header>

                {/* STEPPER */}
                <section className="overflow-hidden rounded-[8px] border border-[#181818] bg-[#0d0d0d]">
                    <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
                        {STEPS.map((item, index) => {
                            const active = index === stepIndex;
                            const done = index < stepIndex;
                            const allowed = stepAllowed(index);
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => goToStep(item.key)}
                                    data-existing-control={`stepper-${index + 1}`}
                                    className={[
                                        "relative flex min-h-[68px] items-center gap-3 px-5 py-3 text-left transition",
                                        index < 4 ? "sm:after:absolute sm:after:bottom-1/2 sm:after:right-[-2px] sm:after:hidden sm:after:h-px sm:after:w-[48%] sm:after:bg-[#363636] sm:after:block" : "",
                                        allowed ? "hover:bg-[#131313]" : "cursor-default",
                                    ].join(" ")}
                                >
                                    <span
                                        className={[
                                            "relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                                            active
                                                ? "bg-[#b3f51d] text-[#101010]"
                                                : done
                                                  ? "bg-[#2c3d0e] text-[#aaf11d]"
                                                  : "bg-[#454545] text-[#d7d7d7]",
                                        ].join(" ")}
                                    >
                                        {done ? (
                                            <span className="material-symbols-outlined text-[14px]">check</span>
                                        ) : (
                                            item.number
                                        )}
                                    </span>
                                    <span className="min-w-0">
                                        <span
                                            className={[
                                                "block text-[11px] font-semibold",
                                                active || done ? "text-[#f4f4f4]" : "text-[#a9a9a9]",
                                            ].join(" ")}
                                        >
                                            {item.title}
                                        </span>
                                        <span className="mt-0.5 block text-[9px] text-[#808080]">
                                            {item.subtitle}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* STEP: MAPPING */}
                {step === "mapping" && (
                    <section className="mt-2 rounded-[8px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
                        <h2 className="text-[13px] font-semibold text-[#ededed]">Map Fields</h2>
                        <p className="mt-1 text-[9px] text-[#747474]">
                            Match your imported columns to product fields.
                        </p>

                        <div className="mt-4 overflow-hidden rounded-[6px] border border-[#1d1d1d]">
                            <div className="hidden grid-cols-[1fr_1fr_auto] items-center gap-3 bg-[#141414] px-4 py-2 text-[8px] font-medium uppercase tracking-wider text-[#999] sm:grid">
                                <span>Imported Column</span>
                                <span>Product Field</span>
                                <span className="text-right">Status</span>
                            </div>
                            {PRODUCT_FIELDS.map((field) => {
                                const value = mapping[field.key] ?? field.key;
                                const mapped = value === field.key;
                                return (
                                    <div
                                        key={field.key}
                                        className="grid grid-cols-1 gap-2 border-t border-[#1d1d1d] px-4 py-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:gap-3"
                                    >
                                        <span className="text-[10px] font-medium text-[#e5e5e5] sm:block hidden">
                                            {value}
                                        </span>
                                        <label className="block sm:hidden">
                                            <span className="mb-1 block text-[8px] uppercase tracking-wider text-[#777]">
                                                Imported column
                                            </span>
                                            <span className="rounded-[4px] bg-[#161616] px-2 py-1 text-[10px] text-[#e5e5e5]">
                                                {value}
                                            </span>
                                        </label>
                                        <select
                                            value={value}
                                            onChange={(e) =>
                                                setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                                            }
                                            aria-label={`Product field mapping for ${field.label}`}
                                            className="h-[34px] w-full appearance-none rounded-[6px] border border-[#303030] bg-[#111111] px-3 pr-8 text-[10px] text-[#e8e8e8] outline-none transition focus:border-[#a8ed20]"
                                        >
                                            {[...IMPORT_COLUMNS, "none"].map((column) => (
                                                <option key={column} value={column}>
                                                    {column}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="text-right">
                                            <span
                                                className={[
                                                    "inline-flex whitespace-nowrap rounded-[5px] px-2 py-[4px] text-[9px] font-medium",
                                                    mapped
                                                        ? "bg-[#244400] text-[#a7eb28]"
                                                        : "bg-[#12344b] text-[#52b7f5]",
                                                ].join(" ")}
                                            >
                                                {mapped ? "Mapped" : "Custom"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setStep("upload")}
                                className="inline-flex h-[38px] items-center gap-2 rounded-[6px] border border-[#252525] px-4 text-[11px] font-medium text-[#ddd] hover:bg-[#151515]"
                            >
                                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={runValidation}
                                data-existing-control="continue-validation"
                                disabled={status === "validating"}
                                className="ml-auto inline-flex h-[38px] items-center gap-5 rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] transition hover:bg-[#c2ff35] disabled:opacity-60"
                            >
                                {status === "validating" ? "Validating…" : "Continue to Validation"}
                                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                            </button>
                        </div>
                    </section>
                )}

                {/* STEP: PREVIEW */}
                {step === "preview" && (
                    <section className="mt-2 rounded-[8px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
                        <h2 className="text-[13px] font-semibold text-[#ededed]">Import Preview</h2>
                        <p className="mt-1 text-[9px] text-[#747474]">
                            Review products before adding them to the catalog.
                        </p>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[720px] border-collapse">
                                <thead>
                                    <tr className="border-b border-[#1d1d1d] bg-[#141414] text-left text-[8px] uppercase tracking-wider text-[#999]">
                                        <th className="px-4 py-2.5 font-medium">Product</th>
                                        <th className="px-3 py-2.5 font-medium">SKU</th>
                                        <th className="px-3 py-2.5 font-medium">Price</th>
                                        <th className="px-3 py-2.5 font-medium">Category</th>
                                        <th className="px-3 py-2.5 font-medium">Brand</th>
                                        <th className="px-3 py-2.5 font-medium">Status</th>
                                        <th className="px-3 py-2.5 text-right font-medium">Validation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewItems.map((item) => {
                                        const rowIssues = allErrorRows.filter((r) => r.row === item.row);
                                        const hasCritical = rowIssues.some((r) =>
                                            issueByKey.get(
                                                stats?.issues.find((i) => i.label === r.issue)?.key ?? "",
                                            )?.critical,
                                        );
                                        return (
                                            <tr key={`${item.row}-${item.sku}`} className="border-b border-[#1b1b1b] text-[9px] hover:bg-[#111111]">
                                                <td className="max-w-[240px] px-4 py-3 font-medium text-[#e2e2e2]">
                                                    <div className="truncate">{item.name}</div>
                                                </td>
                                                <td className="px-3 py-3 text-[#cfcfcf]">{item.sku}</td>
                                                <td className="px-3 py-3 text-[#ddd]">{formatCurrency(item.price)}</td>
                                                <td className="px-3 py-3 text-[#cfcfcf]">{item.category || "—"}</td>
                                                <td className="px-3 py-3 text-[#cfcfcf]">{item.brand || "—"}</td>
                                                <td className="px-3 py-3 text-[#cfcfcf]">{item.status}</td>
                                                <td className="px-3 py-3 text-right">
                                                    {rowIssues.length === 0 ? (
                                                        <span className="rounded-[4px] bg-[#244400] px-1.5 py-1 text-[#a7eb28]">Valid</span>
                                                    ) : hasCritical ? (
                                                        <span className="rounded-[4px] bg-[#4b1d19] px-1.5 py-1 text-[#ed5346]">Critical</span>
                                                    ) : (
                                                        <span className="rounded-[4px] bg-[#4d3408] px-1.5 py-1 text-[#e5a11d]">Issue</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-4 text-[8px] text-[#777]">
                            Showing first {previewItems.length} of {previewTotal.toLocaleString()} products
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setStep("validation")}
                                className="inline-flex h-[38px] items-center gap-2 rounded-[6px] border border-[#252525] px-4 text-[11px] font-medium text-[#ddd] hover:bg-[#151515]"
                            >
                                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                                Back to Validation
                            </button>
                            <button
                                type="button"
                                onClick={() => setModal("import-confirm")}
                                data-existing-control="continue-import"
                                className="ml-auto inline-flex h-[38px] items-center gap-5 rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] transition hover:bg-[#c2ff35]"
                            >
                                Continue to Import
                                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                            </button>
                        </div>
                    </section>
                )}

                {/* STEP: UPLOAD / VALIDATION — main two-column area */}
                {(step === "upload" || step === "validation" || step === "import") && (
                    <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-[minmax(430px,1fr)_minmax(560px,1.08fr)]">
                        {/* LEFT */}
                        <div className="min-w-0">
                            <section className="rounded-[8px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
                                <div
                                    data-existing-control="upload-zone"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragging(true);
                                    }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragging(false);
                                        acceptFile(e.dataTransfer.files?.[0] ?? null);
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={[
                                        "flex min-h-[174px] cursor-pointer flex-col items-center justify-center rounded-[6px] border border-dashed transition",
                                        dragging
                                            ? "border-[#b5f21d] bg-[#131a08]"
                                            : "border-[#363636] bg-[#101010] hover:border-[#606060] hover:bg-[#121212]",
                                    ].join(" ")}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.xlsx,.zip"
                                        className="hidden"
                                        onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
                                    />
                                    <span className="mb-4 text-[#b2f219]">
                                        <span className="material-symbols-outlined text-[44px] font-extralight">upload_file</span>
                                    </span>
                                    <div className="text-center text-[12px] font-medium text-[#f0f0f0]">
                                        Drop your file here or{" "}
                                        <span className="text-[#b4f31d]">click to browse</span>
                                    </div>
                                    <div className="mt-2 text-[9px] text-[#767676]">
                                        CSV, XLSX, JSON or ZIP files are supported
                                    </div>
                                    <div className="mt-1 text-[9px] text-[#767676]">Max file size: 50MB</div>
                                </div>

                                {fileError && (
                                    <div
                                        role="alert"
                                        className="mt-2 rounded-[6px] border border-[#4b1d19] bg-[#2a0d0b] px-3 py-2 text-[9px] text-[#ed5346]"
                                    >
                                        {fileError}
                                    </div>
                                )}

                                {file ? (
                                    <div className="mt-2 flex min-w-0 items-center gap-3 rounded-[6px] border border-[#242424] bg-[#111111] px-3 py-3">
                                        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[5px] bg-[#b0ef20] text-[#111]">
                                            <span className="material-symbols-outlined text-[18px]">description</span>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[10px] font-medium text-[#ddd]">{file.name}</div>
                                            <div className="mt-1 text-[9px] text-[#777]">
                                                {formatBytes(file.size)} • {currentValidation.totalRows.toLocaleString()} rows detected
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setModal("remove-file")}
                                            aria-label="Remove file"
                                            className="shrink-0 text-[#a4a4a4] hover:text-white"
                                        >
                                            <span className="material-symbols-outlined text-[15px]">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-2 flex min-w-0 items-center gap-3 rounded-[6px] border border-[#242424] bg-[#111111] px-3 py-3">
                                        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[5px] bg-[#242424] text-[#8a8a8a]">
                                            <span className="material-symbols-outlined text-[18px]">description</span>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] font-medium text-[#777]">No file selected</div>
                                            <div className="mt-1 text-[9px] text-[#555]">Upload a CSV, XLSX or ZIP file to begin. XLSX reads the first sheet; column names must match the CSV headers.</div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section className="mt-2 rounded-[8px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
                                <h2 className="mb-5 text-[12px] font-semibold text-[#f0f0f0]">Import settings</h2>

                                <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
                                    <Field
                                        label="Character encoding"
                                        value={settings.encoding}
                                        onChange={(value) => setSettings((s) => ({ ...s, encoding: value }))}
                                        options={["UTF-8", "UTF-16", "ISO-8859-1"]}
                                    />
                                    <Field
                                        label="Duplicate handling"
                                        value={settings.duplicateHandling}
                                        onChange={(value) => setSettings((s) => ({ ...s, duplicateHandling: value }))}
                                        options={["Update existing products", "Skip duplicates", "Create new entries"]}
                                    />
                                    <Field
                                        label="Category for uncategorized products"
                                        value={settings.uncategorizedCategory}
                                        onChange={(value) => setSettings((s) => ({ ...s, uncategorizedCategory: value }))}
                                        options={["Uncategorized", "General", "Create new category"]}
                                    />
                                    <Field
                                        label="Default status for new products"
                                        value={settings.defaultStatus}
                                        onChange={(value) => setSettings((s) => ({ ...s, defaultStatus: value }))}
                                        options={["Draft", "Published"]}
                                    />
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[10px] font-medium text-[#d8d8d8]">
                                            Skip rows with critical errors
                                        </div>
                                        <div className="mt-1 text-[8px] text-[#777]">
                                            {skipCriticalErrors
                                                ? "Continue import even if some rows have errors"
                                                : "Rows containing critical errors will block import."}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={toggleSkip}
                                        data-existing-control="toggle-skip"
                                        aria-label="Toggle skip critical errors"
                                        aria-pressed={skipCriticalErrors}
                                        className={[
                                            "relative h-[20px] w-[40px] shrink-0 rounded-full transition",
                                            skipCriticalErrors ? "bg-[#6e9f15]" : "bg-[#343434]",
                                        ].join(" ")}
                                    >
                                        <span
                                            className={[
                                                "absolute top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow transition",
                                                skipCriticalErrors ? "right-[3px]" : "left-[3px]",
                                            ].join(" ")}
                                        />
                                    </button>
                                </div>

                                {step === "upload" && (
                                    <button
                                        type="button"
                                        onClick={continueToMapping}
                                        data-existing-control="continue-mapping"
                                        className="mt-7 inline-flex h-[38px] items-center gap-5 rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] transition hover:bg-[#c2ff35]"
                                    >
                                        Continue to Mapping
                                        <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                    </button>
                                )}
                                {step === "validation" && (
                                    <div className="mt-7 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setStep("mapping")}
                                            className="inline-flex h-[38px] items-center gap-2 rounded-[6px] border border-[#252525] px-4 text-[11px] font-medium text-[#ddd] hover:bg-[#151515]"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                                            Back to Mapping
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep("preview")}
                                            data-existing-control="continue-preview"
                                            className="ml-auto inline-flex h-[38px] items-center gap-5 rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] transition hover:bg-[#c2ff35]"
                                        >
                                            Continue to Preview
                                            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* RIGHT */}
                        <div className="min-w-0">
                            <section className="rounded-[8px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-[13px] font-semibold text-[#ededed]">
                                                Import Validation Summary
                                            </h2>
                                            {status === "validating" ? (
                                                <span className="rounded-[5px] bg-[#263e08] px-2 py-[3px] text-[8px] font-semibold text-[#a9ef24]">
                                                    Validating…
                                                </span>
                                            ) : validated ? (
                                                <span className="rounded-[5px] bg-[#263e08] px-2 py-[3px] text-[8px] font-semibold text-[#a9ef24]">
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="rounded-[5px] bg-[#242424] px-2 py-[3px] text-[8px] font-semibold text-[#8a8a8a]">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-[9px] text-[#747474]">
                                            {file ? file.name : "No file selected yet"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                                    <SummaryCard
                                        icon="check_circle"
                                        iconColor="#a9ef22"
                                        value={validated ? validCount.toLocaleString() : "—"}
                                        label="Valid Rows"
                                        note={validated ? pct(validCount, totalRows) : "0%"}
                                        onClick={() => {
                                            if (!validated) return;
                                            setDrawer("summary");
                                            setIssueKey("valid");
                                        }}
                                        disabled={!validated}
                                    />
                                    <SummaryCard
                                        icon="warning"
                                        iconColor="#d28d00"
                                        value={validated ? issueCount.toLocaleString() : "—"}
                                        label="Rows with Issues"
                                        note={validated ? pct(issueCount, totalRows) : "0%"}
                                        onClick={() => {
                                            if (!validated) return;
                                            setDrawer("summary");
                                            setIssueKey("issues");
                                        }}
                                        disabled={!validated}
                                    />
                                    <SummaryCard
                                        icon="error"
                                        iconColor="#e23e31"
                                        value={validated ? criticalCount.toLocaleString() : "—"}
                                        label="Critical Errors"
                                        note={validated ? pct(criticalCount, totalRows) : "0%"}
                                        onClick={() => {
                                            if (!validated) return;
                                            setDrawer("summary");
                                            setIssueKey("critical");
                                        }}
                                        disabled={!validated}
                                    />
                                    <SummaryCard
                                        icon="info"
                                        iconColor="#bcbcbc"
                                        value={validated ? totalRows.toLocaleString() : "—"}
                                        label="Total Rows"
                                        note="100%"
                                        onClick={() => {
                                            if (!validated) return;
                                            setDrawer("summary");
                                            setIssueKey("total");
                                        }}
                                        disabled={!validated}
                                    />
                                </div>

                                <div className="mt-4 flex h-[11px] overflow-hidden rounded-full bg-[#202020]">
                                    <span
                                        className="bg-[#aaf11d] transition-all duration-500"
                                        style={{ width: validated ? pct(validCount, totalRows) : "0%" }}
                                    />
                                    <span
                                        className="bg-[#f1a400] transition-all duration-500"
                                        style={{ width: validated ? pct(issueCount, totalRows) : "0%" }}
                                    />
                                    <span
                                        className="bg-[#ef3f3f] transition-all duration-500"
                                        style={{ width: validated ? pct(criticalCount, totalRows) : "0%" }}
                                    />
                                </div>
                            </section>

                            <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_1fr]">
                                <section className="min-w-0 rounded-[8px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
                                    <h2 className="text-[12px] font-semibold text-[#ededed]">Validation Details</h2>

                                    <div className="mt-4 space-y-2">
                                        {(stats?.issues ?? []).map((issue) => (
                                            <button
                                                key={issue.key}
                                                type="button"
                                                disabled={!validated}
                                                onClick={() => {
                                                    setIssueKey(issue.key);
                                                    setDrawer("issue-detail");
                                                }}
                                                className="flex h-[36px] w-full items-center gap-2 rounded-[6px] border border-[#1d1d1d] bg-[#111111] px-3 text-left transition hover:border-[#343434] disabled:cursor-default disabled:opacity-60"
                                            >
                                                <span className="text-[#e9a300]">
                                                    <span className="material-symbols-outlined text-[13px]">warning</span>
                                                </span>
                                                <span className="min-w-0 flex-1 truncate text-[9px] text-[#ddd]">
                                                    {issue.label}
                                                </span>
                                                <span className="rounded-[5px] bg-[#562b04] px-2 py-[3px] text-[8px] font-semibold text-[#f07b00]">
                                                    {issue.count}
                                                </span>
                                                <span className="material-symbols-outlined text-[12px] text-[#777]">
                                                    chevron_right
                                                </span>
                                            </button>
                                        ))}
                                        {!stats && (
                                            <p className="px-1 text-[9px] text-[#666]">
                                                Validation results will appear here after the data is validated.
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <section className="min-w-0 rounded-[8px] border border-[#1a1a1a] bg-[#0c0c0c] p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="text-[12px] font-semibold text-[#ededed]">Error Preview</h2>
                                        <button
                                            type="button"
                                            data-existing-control="view-all-errors"
                                            disabled={!validated}
                                            onClick={() => {
                                                setErrorsSearch("");
                                                setErrorsPage(1);
                                                setDrawer("errors-list");
                                            }}
                                            className="rounded-[5px] border border-[#252525] px-2.5 py-1.5 text-[8px] font-medium text-[#d7d7d7] hover:bg-[#151515] disabled:cursor-default disabled:opacity-50"
                                        >
                                            View all
                                        </button>
                                    </div>

                                    <div className="mt-4 overflow-hidden rounded-[5px] border border-[#1d1d1d]">
                                        <div className="grid grid-cols-[38px_1fr_1.35fr] bg-[#141414] px-3 py-2 text-[8px] font-medium text-[#999]">
                                            <span>Row</span>
                                            <span>Issue</span>
                                            <span>Value</span>
                                        </div>
                                        {allErrorRows.slice(0, 5).map((row) => (
                                            <button
                                                key={`${row.row}-${row.issue}`}
                                                type="button"
                                                onClick={() => {
                                                    setErrorRow(row);
                                                    setIssueKey(
                                                        stats?.issues.find((i) => i.label === row.issue)?.key ?? "",
                                                    );
                                                    setDrawer("error-detail");
                                                }}
                                                className="grid min-w-0 w-full grid-cols-[38px_1fr_1.35fr] border-t border-[#1d1d1d] px-3 py-[9px] text-[8px] text-left hover:bg-[#151515]"
                                            >
                                                <span className="text-[#ddd]">{row.row}</span>
                                                <span className="truncate text-[#e5e5e5]">{row.issue}</span>
                                                <span className="truncate text-[#bfbfbf]">{row.value}</span>
                                            </button>
                                        ))}
                                        {allErrorRows.length === 0 && (
                                            <div className="border-t border-[#1d1d1d] px-3 py-3 text-[9px] text-[#666]">
                                                No errors found.
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-4 text-[8px] text-[#777]">
                                        {validated
                                            ? `Showing first ${Math.min(5, allErrorRows.length)} of ${allErrorRows.length} errors`
                                            : "No validation run yet"}
                                    </p>
                                </section>
                            </div>

                            <section className="mt-2 flex min-h-[70px] items-center justify-between gap-4 rounded-[8px] border border-[#1a1a1a] bg-[#0c0c0c] px-5 py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#3c94e5] text-white">
                                        <span className="material-symbols-outlined text-[16px]">info</span>
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-semibold text-[#ededed]">
                                            Need help with the import?
                                        </div>
                                        <div className="mt-1 text-[8px] text-[#777]">
                                            Check our import guide or contact our support if you're having issues.
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                                    <button
                                        type="button"
                                        data-existing-control="import-guide"
                                        onClick={() => setModal("import-guide")}
                                        className="inline-flex h-[34px] items-center gap-2 rounded-[6px] border border-[#252525] px-3 text-[9px] text-[#ddd] hover:bg-[#151515]"
                                    >
                                        View Import Guide
                                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                    </button>
                                    <button
                                        type="button"
                                        data-existing-control="contact-support"
                                        onClick={() => setModal("support")}
                                        className="h-[34px] rounded-[6px] bg-[#b1f218] px-4 text-[9px] font-semibold text-[#090909] hover:bg-[#c1ff36]"
                                    >
                                        Contact Support
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* RECENT IMPORTS */}
                <section className="mt-2 overflow-hidden rounded-[8px] border border-[#1a1a1a] bg-[#0c0c0c]">
                    <div className="flex items-center justify-between gap-3 px-5 py-5">
                        <h2 className="text-[13px] font-semibold text-[#ededed]">Recent Imports</h2>
                        <button
                            type="button"
                            data-existing-control="view-all-imports"
                            onClick={() => {
                                setHistorySearch("");
                                setHistoryStatus("all");
                                setHistoryDate("all");
                                setHistoryPage(1);
                                setDrawer("import-history");
                            }}
                            className="rounded-[6px] border border-[#252525] px-3 py-2 text-[9px] text-[#ddd] hover:bg-[#151515]"
                        >
                            View all imports
                        </button>
                    </div>

                    {imports.length === 0 ? (
                        <div className="border-t border-[#1c1c1c] px-5 py-8 text-center text-[10px] text-[#777]">
                            No imports yet. Start one from the top of the page.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[930px] border-collapse">
                                    <thead>
                                        <tr className="border-t border-[#1c1c1c] bg-[#101010] text-left text-[8px] text-[#929292]">
                                            <th className="px-5 py-3 font-medium">File Name</th>
                                            <th className="px-3 py-3 font-medium">Imported By</th>
                                            <th className="px-3 py-3 font-medium">Date</th>
                                            <th className="px-3 py-3 font-medium">Total Rows</th>
                                            <th className="px-3 py-3 font-medium">Valid</th>
                                            <th className="px-3 py-3 font-medium">Issues</th>
                                            <th className="px-3 py-3 font-medium">Errors</th>
                                            <th className="px-3 py-3 font-medium">Status</th>
                                            <th className="px-5 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importsPageRows.map((item) => (
                                            <tr
                                                key={item.id}
                                                onClick={() => {
                                                    setSelectedImportId(item.id);
                                                    setDrawer("import-details");
                                                }}
                                                className="border-t border-[#1b1b1b] text-[9px] hover:bg-[#111111] cursor-pointer"
                                            >
                                                <td className="max-w-[260px] px-5 py-4 font-medium text-[#e2e2e2]">
                                                    <div className="truncate">{item.file}</div>
                                                </td>
                                                <td className="px-3 py-4 text-[#cfcfcf]">{item.by}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-[#cfcfcf]">{item.date}</td>
                                                <td className="px-3 py-4 text-[#ddd]">{item.total.toLocaleString()}</td>
                                                <td className="px-3 py-4">
                                                    <span className="rounded-[4px] bg-[#273e09] px-1.5 py-1 text-[#aaf12a]">
                                                        {item.valid.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <span className="rounded-[4px] bg-[#4d3408] px-1.5 py-1 text-[#e5a11d]">
                                                        {item.issues.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <span className="rounded-[4px] bg-[#4b1d19] px-1.5 py-1 text-[#ed5346]">
                                                        {item.errors.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <StatusBadge type={item.statusType}>{item.status}</StatusBadge>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div
                                                        className="flex justify-end gap-2"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadReport(item)}
                                                            aria-label={`Download ${item.file}`}
                                                            className="flex h-[27px] w-[27px] items-center justify-center rounded-[5px] border border-[#252525] text-[#bdbdbd] hover:bg-[#181818] hover:text-white"
                                                        >
                                                            <span className="material-symbols-outlined text-[13px]">download</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedImportId(item.id);
                                                                setModal("delete-import");
                                                            }}
                                                            aria-label={`Delete ${item.file}`}
                                                            className="flex h-[27px] w-[27px] items-center justify-center rounded-[5px] border border-[#252525] text-[#bdbdbd] hover:bg-[#181818] hover:text-white"
                                                        >
                                                            <span className="material-symbols-outlined text-[13px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-[#1b1b1b] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-[9px] text-[#737373]">
                                    Showing {(importsPage - 1) * 10 + 1}–
                                    {Math.min(importsPage * 10, imports.length)} of {imports.length} imports
                                </div>
                                <PageButtons page={importsPage} count={importsPageCount} onChange={setImportsPage} />
                            </div>
                        </>
                    )}
                </section>
            </div>

            {/* MODALS */}
            {modal === "new-import" && (
                <ModalSurface onClose={() => setModal(null)} labelledBy="new-import-title">
                    <h2 id="new-import-title" className="text-[15px] font-semibold text-[#ededed]">
                        New Import
                    </h2>
                    <p className="mt-1 text-[10px] text-[#9a9a9a]">Start a new product import.</p>
                    <p className="mt-3 text-[9px] text-[#777]">
                        Upload a CSV, XLSX, JSON, or ZIP file to begin.
                    </p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex h-[36px] items-center justify-center gap-2 rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] transition hover:bg-[#c2ff35]"
                        >
                            <span className="material-symbols-outlined text-[15px]">upload_file</span>
                            Upload File
                        </button>
                        <button
                            type="button"
                            onClick={() => setModal(null)}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                        >
                            Cancel
                        </button>
                    </div>
                </ModalSurface>
            )}

            {modal === "remove-file" && file && (
                <ModalSurface onClose={() => setModal(null)} labelledBy="remove-file-title">
                    <h2 id="remove-file-title" className="text-[15px] font-semibold text-[#ededed]">
                        Remove file?
                    </h2>
                    <p className="mt-2 text-[10px] text-[#9a9a9a]">
                        Are you sure you want to remove <span className="text-[#ddd]">{file.name}</span>?
                    </p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setModal(null)}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={removeFile}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] bg-[#ef4d40] px-4 text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#f56a5e]"
                        >
                            Remove file
                        </button>
                    </div>
                </ModalSurface>
            )}

            {modal === "delete-import" && (
                <ModalSurface onClose={() => setModal(null)} labelledBy="delete-import-title">
                    <h2 id="delete-import-title" className="text-[15px] font-semibold text-[#ededed]">
                        Delete Import?
                    </h2>
                    <p className="mt-2 text-[10px] text-[#9a9a9a]">
                        This removes the import record from Recent Imports.
                    </p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setModal(null)}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteImport}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] bg-[#ef4d40] px-4 text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#f56a5e]"
                        >
                            Delete
                        </button>
                    </div>
                </ModalSurface>
            )}

            {modal === "import-confirm" && (
                <ModalSurface onClose={() => setModal(null)} labelledBy="import-confirm-title">
                    {status === "importing" ? (
                        <>
                            <h2 id="import-confirm-title" className="text-[15px] font-semibold text-[#ededed]">
                                Importing Products
                            </h2>
                            <p className="mt-2 text-[10px] text-[#9a9a9a]">
                                Processing your file… {progress}%
                            </p>
                            <div className="mt-4 h-[10px] overflow-hidden rounded-full bg-[#202020]">
                                <div
                                    className="h-full bg-[#b1f218] transition-all duration-150"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="mt-3 text-[9px] text-[#777]">Please keep this window open.</p>
                        </>
                    ) : status === "completed" && importResult ? (
                        <>
                            <h2 id="import-confirm-title" className="text-[15px] font-semibold text-[#ededed]">
                                Import Complete
                            </h2>
                            <p className="mt-2 text-[10px] text-[#9a9a9a]">
                                {importResult.created.toLocaleString()} products were successfully imported.
                            </p>
                            {failedImportRows.length > 0 && (
                                <div className="mt-3 space-y-1 text-[9px] text-[#777]">
                                    <p>{failedImportRows.length.toLocaleString()} rows failed:</p>
                                    <div className="max-h-[120px] space-y-1 overflow-y-auto rounded-[6px] border border-[#4b1d19] bg-[#2a0d0b] p-2">
                                        {failedImportRows.map((row) => (
                                            <p key={row.index} className="text-[#ed5346]">
                                                Row {(row.index ?? 0) + 1}: {row.error || "Unknown error"}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModal(null);
                                        setDrawer("import-details");
                                    }}
                                    className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                                >
                                    View Import
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="inline-flex h-[36px] items-center justify-center rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#c2ff35]"
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    ) : importFailed ? (
                        <>
                            <h2 id="import-confirm-title" className="text-[15px] font-semibold text-[#ef4d40]">
                                Import Failed
                            </h2>
                            <p className="mt-2 text-[10px] text-[#9a9a9a]">
                                We could not complete this import.
                            </p>
                            <p className="mt-1 text-[9px] text-[#777]">
                                Your original file has not been modified.
                            </p>
                            {importError && (
                                <p className="mt-2 rounded-[6px] border border-[#4b1d19] bg-[#2a0d0b] p-2 text-[9px] text-[#ed5346]">
                                    {importError}
                                </p>
                            )}
                            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={runImport}
                                    className="inline-flex h-[36px] items-center justify-center rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#c2ff35]"
                                >
                                    Try Again
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 id="import-confirm-title" className="text-[15px] font-semibold text-[#ededed]">
                                Ready to Import
                            </h2>
                            <p className="mt-2 text-[10px] text-[#9a9a9a]">
                                {totalRows.toLocaleString()} rows are ready for import.
                            </p>
                            <div className="mt-3 space-y-1 text-[9px] text-[#777]">
                                <p>Valid rows: {validCount.toLocaleString()}</p>
                                <p>Rows with issues: {issueCount.toLocaleString()}</p>
                                <p>Critical errors: {criticalCount.toLocaleString()}</p>
                            </div>
                            {!skipCriticalErrors && criticalCount > 0 && (
                                <p
                                    role="alert"
                                    className="mt-3 rounded-[6px] border border-[#4b1d19] bg-[#2a0d0b] px-3 py-2 text-[9px] text-[#ed5346]"
                                >
                                    Critical errors must be resolved before importing.
                                </p>
                            )}
                            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={runImport}
                                    disabled={!skipCriticalErrors && criticalCount > 0}
                                    className="inline-flex h-[36px] items-center justify-center rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#c2ff35] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Import Products
                                </button>
                            </div>
                        </>
                    )}
                </ModalSurface>
            )}

            {modal === "import-guide" && (
                <ModalSurface onClose={() => setModal(null)} labelledBy="import-guide-title" wide>
                    <h2 id="import-guide-title" className="text-[15px] font-semibold text-[#ededed]">
                        Import Guide
                    </h2>
                    <ol className="mt-4 space-y-2">
                        {[
                            "Prepare your file",
                            "Upload CSV, XLSX, JSON, or ZIP",
                            "Map product fields",
                            "Validate data",
                            "Review the preview",
                            "Import products",
                        ].map((item, index) => (
                            <li key={item} className="flex items-center gap-3 text-[10px] text-[#ddd]">
                                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#454545] text-[10px] font-semibold text-[#d7d7d7]">
                                    {index + 1}
                                </span>
                                {item}
                            </li>
                        ))}
                    </ol>
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-[6px] border border-[#1d1d1d] bg-[#111111] p-3">
                            <div className="text-[10px] font-semibold text-[#ededed]">Supported formats</div>
                            <p className="mt-1 text-[9px] text-[#777]">CSV, XLSX, JSON, ZIP</p>
                        </div>
                        <div className="rounded-[6px] border border-[#1d1d1d] bg-[#111111] p-3">
                            <div className="text-[10px] font-semibold text-[#ededed]">Maximum file size</div>
                            <p className="mt-1 text-[9px] text-[#777]">50MB per file</p>
                        </div>
                        <div className="rounded-[6px] border border-[#1d1d1d] bg-[#111111] p-3">
                            <div className="text-[10px] font-semibold text-[#ededed]">Required fields</div>
                            <p className="mt-1 text-[9px] text-[#777]">name, sku, price, category, brand, amazon_asin</p>
                        </div>
                        <div className="rounded-[6px] border border-[#1d1d1d] bg-[#111111] p-3">
                            <div className="text-[10px] font-semibold text-[#ededed]">Common validation errors</div>
                            <p className="mt-1 text-[9px] text-[#777]">
                                Missing ASIN, missing images, missing categories, invalid price, duplicates
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setModal(null)}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                        >
                            Close
                        </button>
                    </div>
                </ModalSurface>
            )}

            {modal === "support" && <SupportModal onClose={() => setModal(null)} />}

            {/* DRAWERS */}
            {drawer === "summary" && (
                <DrawerSurface
                    title={
                        issueKey === "valid"
                            ? "Valid Rows"
                            : issueKey === "issues"
                              ? "Rows with Issues"
                              : issueKey === "critical"
                                ? "Critical Errors"
                                : "Import Statistics"
                    }
                    onClose={() => setDrawer(null)}
                >
                    {issueKey === "valid" && (
                        <>
                            <p className="text-[10px] text-[#9a9a9a]">
                                {validCount.toLocaleString()} products passed validation.
                            </p>
                            <div className="mt-4 space-y-1">
                                {validItems.slice(0, 30).map((item) => (
                                    <div
                                        key={`${item.row}-${item.sku}`}
                                        className="flex items-center justify-between gap-3 rounded-[6px] border border-[#1d1d1d] bg-[#111111] px-3 py-2"
                                    >
                                        <span className="truncate text-[10px] text-[#ddd]">{item.name}</span>
                                        <span className="shrink-0 rounded-[4px] bg-[#244400] px-1.5 py-1 text-[8px] text-[#a7eb28]">
                                            Valid
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {issueKey === "issues" && (
                        <IssueList
                            rows={allErrorRows.filter((r) => !(issueByKey.get(stats?.issues.find((i) => i.label === r.issue)?.key ?? "")?.critical))}
                            onRowClick={(row) => {
                                setErrorRow(row);
                                setIssueKey(stats?.issues.find((i) => i.label === row.issue)?.key ?? "");
                                setDrawer("error-detail");
                            }}
                            emptyText="No rows with issues."
                        />
                    )}
                    {issueKey === "critical" && (
                        <IssueList
                            rows={allErrorRows.filter((r) => issueByKey.get(stats?.issues.find((i) => i.label === r.issue)?.key ?? "")?.critical)}
                            onRowClick={(row) => {
                                setErrorRow(row);
                                setIssueKey(stats?.issues.find((i) => i.label === row.issue)?.key ?? "");
                                setDrawer("error-detail");
                            }}
                            emptyText="No critical errors."
                        />
                    )}
                    {issueKey === "total" && (
                        <div className="space-y-3">
                            {[
                                ["File", file?.name ?? "—"],
                                ["Total Rows", totalRows.toLocaleString()],
                                ["Valid Rows", validCount.toLocaleString()],
                                ["Rows with Issues", issueCount.toLocaleString()],
                                ["Critical Errors", criticalCount.toLocaleString()],
                                ["Character encoding", settings.encoding],
                                ["Duplicate handling", settings.duplicateHandling],
                                ["Default status", settings.defaultStatus],
                                ["Skip critical errors", skipCriticalErrors ? "Yes" : "No"],
                            ].map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between gap-3 border-b border-[#1d1d1d] pb-2">
                                    <span className="text-[9px] uppercase tracking-wider text-[#777]">{label}</span>
                                    <span className="max-w-[60%] truncate text-[10px] text-[#ddd]">{value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </DrawerSurface>
            )}

            {drawer === "issue-detail" && selectedIssue && (
                <DrawerSurface title={selectedIssue.label} onClose={() => setDrawer(null)}>
                    <p className="text-[10px] text-[#9a9a9a]">
                        {selectedIssue.count.toLocaleString()} rows are affected by {selectedIssue.label.toLowerCase()}.
                    </p>
                    <div className="mt-4 rounded-[6px] border border-[#1d1d1d] bg-[#111111] p-3">
                        <div className="text-[9px] uppercase tracking-wider text-[#777]">Affected rows</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {selectedIssue.rows.slice(0, 12).map((row) => (
                                <span
                                    key={row.row}
                                    className="rounded-[4px] bg-[#1d1d1d] px-2 py-1 text-[9px] text-[#ddd]"
                                >
                                    {row.row}
                                </span>
                            ))}
                            {selectedIssue.rows.length > 12 && (
                                <span className="rounded-[4px] bg-[#1d1d1d] px-2 py-1 text-[9px] text-[#777]">
                                    +{selectedIssue.rows.length - 12} more
                                </span>
                            )}
                            {selectedIssue.rows.length === 0 && (
                                <span className="text-[9px] text-[#777]">No affected rows remaining.</span>
                            )}
                        </div>
                    </div>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setDrawer(null)}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setErrorsSearch(selectedIssue.label);
                                setErrorsPage(1);
                                setDrawer("errors-list");
                            }}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#c2ff35]"
                        >
                            View affected rows
                        </button>
                    </div>
                </DrawerSurface>
            )}

            {drawer === "error-detail" && errorRow && (
                <DrawerSurface title={`Row ${errorRow.row}`} onClose={() => setDrawer(null)}>
                    <dl className="space-y-3">
                        {[
                            ["Issue", errorRow.issue],
                            ["Value", errorRow.value],
                            ["Product", errorRow.product],
                            ["Problem", errorRow.problem],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-[6px] border border-[#1d1d1d] bg-[#111111] p-3">
                                <dt className="text-[8px] uppercase tracking-wider text-[#777]">{label}</dt>
                                <dd className="mt-1 text-[11px] text-[#e5e5e5]">{value}</dd>
                            </div>
                        ))}
                    </dl>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setDrawer("errors-list");
                            }}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                        >
                            Back to Errors
                        </button>
                        <button
                            type="button"
                            data-existing-control="mark-fixed"
                            onClick={() => markFixed(errorRow, issueKey)}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#c2ff35]"
                        >
                            Mark as Fixed
                        </button>
                    </div>
                </DrawerSurface>
            )}

            {drawer === "errors-list" && (
                <DrawerSurface title="Error Preview" onClose={() => setDrawer(null)}>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#8a8a8a]">
                            search
                        </span>
                        <input
                            type="search"
                            placeholder="Search errors..."
                            aria-label="Search errors"
                            value={errorsSearch}
                            onChange={(e) => {
                                setErrorsSearch(e.target.value);
                                setErrorsPage(1);
                            }}
                            className="h-[36px] w-full rounded-[6px] border border-[#303030] bg-[#111111] pl-9 pr-3 text-[11px] text-[#e8e8e8] outline-none transition focus:border-[#a8ed20]"
                        />
                    </div>
                    <div className="mt-4 overflow-hidden rounded-[5px] border border-[#1d1d1d]">
                        <div className="grid grid-cols-[44px_1fr_1.35fr] bg-[#141414] px-3 py-2 text-[8px] font-medium text-[#999]">
                            <span>Row</span>
                            <span>Issue</span>
                            <span>Value</span>
                        </div>
                        {errorsPageRows.map((row) => (
                            <button
                                key={`${row.row}-${row.issue}`}
                                type="button"
                                onClick={() => {
                                    setErrorRow(row);
                                    setIssueKey(stats?.issues.find((i) => i.label === row.issue)?.key ?? "");
                                    setDrawer("error-detail");
                                }}
                                className="grid min-w-0 w-full grid-cols-[44px_1fr_1.35fr] border-t border-[#1d1d1d] px-3 py-[9px] text-[8px] text-left hover:bg-[#151515]"
                            >
                                <span className="text-[#ddd]">{row.row}</span>
                                <span className="truncate text-[#e5e5e5]">{row.issue}</span>
                                <span className="truncate text-[#bfbfbf]">{row.value}</span>
                            </button>
                        ))}
                        {errorsPageRows.length === 0 && (
                            <div className="border-t border-[#1d1d1d] px-3 py-4 text-center text-[9px] text-[#666]">
                                No errors match your search.
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-[9px] text-[#737373]">
                            Showing {(errorsPage - 1) * 10 + 1}–
                            {Math.min(errorsPage * 10, filteredErrors.length)} of {filteredErrors.length} errors
                        </div>
                        <PageButtons page={errorsPage} count={errorsPageCount} onChange={setErrorsPage} />
                    </div>
                </DrawerSurface>
            )}

            {drawer === "import-details" && selectedImport && (
                <DrawerSurface title="Import Details" onClose={() => setDrawer(null)}>
                    <dl className="space-y-3">
                        {[
                            ["File", selectedImport.file],
                            ["Imported by", selectedImport.by],
                            ["Date", selectedImport.date],
                            ["Total Rows", selectedImport.total.toLocaleString()],
                            ["Valid", selectedImport.valid.toLocaleString()],
                            ["Issues", selectedImport.issues.toLocaleString()],
                            ["Critical Errors", selectedImport.errors.toLocaleString()],
                            ["Status", selectedImport.status],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between gap-3 border-b border-[#1d1d1d] pb-2">
                                <span className="text-[9px] uppercase tracking-wider text-[#777]">{label}</span>
                                <span className="max-w-[60%] truncate text-[10px] text-[#ddd]">{value}</span>
                            </div>
                        ))}
                    </dl>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setDrawer(null);
                                downloadReport(selectedImport);
                            }}
                            className="inline-flex h-[36px] items-center justify-center gap-2 rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#c2ff35]"
                        >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            Download Report
                        </button>
                        <button
                            type="button"
                            onClick={() => setDrawer(null)}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                        >
                            Close
                        </button>
                    </div>
                </DrawerSurface>
            )}

            {drawer === "import-history" && (
                <DrawerSurface title="Import History" onClose={() => setDrawer(null)}>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#8a8a8a]">
                                search
                            </span>
                            <input
                                type="search"
                                placeholder="Search imports..."
                                aria-label="Search imports"
                                value={historySearch}
                                onChange={(e) => {
                                    setHistorySearch(e.target.value);
                                    setHistoryPage(1);
                                }}
                                className="h-[36px] w-full rounded-[6px] border border-[#303030] bg-[#111111] pl-9 pr-3 text-[11px] text-[#e8e8e8] outline-none transition focus:border-[#a8ed20]"
                            />
                        </div>
                        <select
                            value={historyStatus}
                            onChange={(e) => {
                                setHistoryStatus(e.target.value);
                                setHistoryPage(1);
                            }}
                            aria-label="Filter by status"
                            className="h-[36px] rounded-[6px] border border-[#303030] bg-[#111111] px-3 text-[10px] text-[#e8e8e8] outline-none focus:border-[#a8ed20]"
                        >
                            <option value="all">All statuses</option>
                            <option value="Imported">Imported</option>
                            <option value="Validation Completed">Validation Completed</option>
                            <option value="Failed">Failed</option>
                        </select>
                        <select
                            value={historyDate}
                            onChange={(e) => {
                                setHistoryDate(e.target.value);
                                setHistoryPage(1);
                            }}
                            aria-label="Filter by date"
                            className="h-[36px] rounded-[6px] border border-[#303030] bg-[#111111] px-3 text-[10px] text-[#e8e8e8] outline-none focus:border-[#a8ed20]"
                        >
                            <option value="all">All dates</option>
                            <option value="may2025">May 2025</option>
                        </select>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#1d1d1d] bg-[#141414] text-left text-[8px] uppercase tracking-wider text-[#999]">
                                    <th className="px-3 py-2.5 font-medium">File</th>
                                    <th className="px-3 py-2.5 font-medium">By</th>
                                    <th className="px-3 py-2.5 font-medium">Total</th>
                                    <th className="px-3 py-2.5 font-medium">Valid</th>
                                    <th className="px-3 py-2.5 font-medium">Status</th>
                                    <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyPageRows.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedImportId(item.id);
                                            setDrawer("import-details");
                                        }}
                                        className="cursor-pointer border-b border-[#1b1b1b] text-[9px] hover:bg-[#111111]"
                                    >
                                        <td className="max-w-[200px] px-3 py-3 font-medium text-[#e2e2e2]">
                                            <div className="truncate">{item.file}</div>
                                        </td>
                                        <td className="px-3 py-3 text-[#cfcfcf]">{item.by}</td>
                                        <td className="px-3 py-3 text-[#ddd]">{item.total.toLocaleString()}</td>
                                        <td className="px-3 py-3">
                                            <span className="rounded-[4px] bg-[#273e09] px-1.5 py-1 text-[#aaf12a]">
                                                {item.valid.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusBadge type={item.statusType}>{item.status}</StatusBadge>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div
                                                className="flex justify-end gap-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => downloadReport(item)}
                                                    aria-label={`Download ${item.file}`}
                                                    className="flex h-[27px] w-[27px] items-center justify-center rounded-[5px] border border-[#252525] text-[#bdbdbd] hover:bg-[#181818] hover:text-white"
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">download</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {historyPageRows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-6 text-center text-[9px] text-[#666]">
                                            No imports match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-[9px] text-[#737373]">
                            Showing {(historyPage - 1) * 10 + 1}–
                            {Math.min(historyPage * 10, filteredHistory.length)} of {filteredHistory.length} imports
                        </div>
                        <PageButtons page={historyPage} count={historyPageCount} onChange={setHistoryPage} />
                    </div>
                </DrawerSurface>
            )}

            {toast && <ToastView toast={toast} onDismiss={() => setToast(null)} />}
        </>
    );
}

function IssueList({
    rows,
    onRowClick,
    emptyText,
}: {
    rows: ImportErrorRow[];
    onRowClick: (row: ImportErrorRow) => void;
    emptyText: string;
}) {
    if (rows.length === 0) {
        return <p className="text-[9px] text-[#666]">{emptyText}</p>;
    }
    return (
        <div className="mt-4 overflow-hidden rounded-[5px] border border-[#1d1d1d]">
            {rows.slice(0, 25).map((row) => (
                <button
                    key={`${row.row}-${row.issue}`}
                    type="button"
                    onClick={() => onRowClick(row)}
                    className="grid min-w-0 w-full grid-cols-[44px_1fr_1.35fr] border-t border-[#1d1d1d] px-3 py-[9px] text-[8px] text-left hover:bg-[#151515] first:border-t-0"
                >
                    <span className="text-[#ddd]">{row.row}</span>
                    <span className="truncate text-[#e5e5e5]">{row.issue}</span>
                    <span className="truncate text-[#bfbfbf]">{row.value}</span>
                </button>
            ))}
        </div>
    );
}

function SupportModal({ onClose }: { onClose: () => void }) {
    const [subject, setSubject] = React.useState("");
    const [issueType, setIssueType] = React.useState("Import issue");
    const [message, setMessage] = React.useState("");
    const [errors, setErrors] = React.useState<{ subject?: string; issueType?: string; message?: string }>({});
    const [sent, setSent] = React.useState(false);

    function submit() {
        const next: typeof errors = {};
        if (!subject.trim()) next.subject = "Subject is required.";
        if (!issueType.trim()) next.issueType = "Issue type is required.";
        if (!message.trim()) next.message = "Message is required.";
        setErrors(next);
        if (Object.keys(next).length > 0) return;
        setSent(true);
        window.setTimeout(() => {
            onClose();
            setSubject("");
            setIssueType("Import issue");
            setMessage("");
            setErrors({});
            setSent(false);
        }, 900);
    }

    return (
        <ModalSurface onClose={onClose} labelledBy="support-title">
            <h2 id="support-title" className="text-[15px] font-semibold text-[#ededed]">
                Contact Support
            </h2>
            {sent ? (
                <div className="mt-6 flex flex-col items-center gap-2 py-6">
                    <span className="material-symbols-outlined text-[32px] text-[#a7eb28]">check_circle</span>
                    <p className="text-[11px] text-[#9a9a9a]">Support request sent.</p>
                </div>
            ) : (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                    }}
                    className="mt-4 space-y-4"
                >
                    <label className="block">
                        <span className="mb-2 block text-[11px] font-medium text-[#c6c6c6]">Subject</span>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief summary of the issue"
                            className="h-[36px] w-full rounded-[6px] border border-[#303030] bg-[#111111] px-3 text-[12px] text-[#e8e8e8] outline-none transition focus:border-[#a8ed20]"
                        />
                        {errors.subject && (
                            <span className="mt-1 block text-[9px] text-[#ed5346]">{errors.subject}</span>
                        )}
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-[11px] font-medium text-[#c6c6c6]">Issue type</span>
                        <select
                            value={issueType}
                            onChange={(e) => setIssueType(e.target.value)}
                            className="h-[36px] w-full rounded-[6px] border border-[#303030] bg-[#111111] px-3 text-[12px] text-[#e8e8e8] outline-none transition focus:border-[#a8ed20]"
                        >
                            {["Import issue", "Billing", "Bug report", "Feature request", "Other"].map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        {errors.issueType && (
                            <span className="mt-1 block text-[9px] text-[#ed5346]">{errors.issueType}</span>
                        )}
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-[11px] font-medium text-[#c6c6c6]">Message</span>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Describe the problem you are facing"
                            className="w-full rounded-[6px] border border-[#303030] bg-[#111111] px-3 py-2 text-[12px] text-[#e8e8e8] outline-none transition focus:border-[#a8ed20]"
                        />
                        {errors.message && (
                            <span className="mt-1 block text-[9px] text-[#ed5346]">{errors.message}</span>
                        )}
                    </label>
                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] border border-[#252525] px-4 text-[11px] text-[#ddd] hover:bg-[#151515]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            data-existing-control="send-request"
                            className="inline-flex h-[36px] items-center justify-center rounded-[6px] bg-[#b1f218] px-4 text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#c2ff35]"
                        >
                            Send Request
                        </button>
                    </div>
                </form>
            )}
        </ModalSurface>
    );
}
