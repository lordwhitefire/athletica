"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { BatchUploadParseResult, BatchUploadCreateResult } from "@/lib/schemas/batch-upload";
import { batchCreateProducts } from "@/lib/actions/batch-upload";

const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB

type Step = "upload" | "preview" | "result";

export default function BatchUploadForm() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<Step>("upload");
    const [preview, setPreview] = useState<BatchUploadParseResult | null>(null);
    const [createResult, setCreateResult] = useState<BatchUploadCreateResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_ZIP_SIZE) {
                setError(`File is too large. Maximum ZIP file size is 50MB (your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setFileName("");
                return;
            }
            setFileName(file.name);
            setError(null);
        }
    }, []);

    const handleUpload = useCallback(async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            setError("Please select a ZIP file.");
            return;
        }

        if (file.size > MAX_ZIP_SIZE) {
            setError(`File is too large. Maximum ZIP file size is 50MB (your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/admin/batch-upload/parse", {
                method: "POST",
                body: formData,
            });

            const json = await res.json();

            if (!res.ok || json.error) {
                setError(json.error?.message || "Failed to process the ZIP file.");
                setLoading(false);
                return;
            }

            setPreview(json.data);
            setStep("preview");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleImport = useCallback(async () => {
        if (!preview || preview.productData.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const result = await batchCreateProducts(preview.productData);

            if (result.error) {
                setError(result.error.message || "Import failed.");
                setLoading(false);
                return;
            }

            setCreateResult(result.data!);
            setStep("result");
            router.refresh();
        } catch {
            setError("Import failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [preview, router]);

    const handleReset = useCallback(() => {
        setStep("upload");
        setPreview(null);
        setCreateResult(null);
        setError(null);
        setFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-900/50 border border-red-700 rounded px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            {/* Step 1: Upload */}
            {step === "upload" && (
                <div className="bg-neutral-900 border border-neutral-800 rounded p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <span className="material-symbols-outlined text-5xl text-zinc-600">folder_zip</span>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">
                                Select a ZIP file containing a <strong>products.csv</strong> and product images.
                            </p>
                            <a
                                href="/templates/admin-batch-products.csv"
                                download
                                className="text-xs text-primary hover:underline"
                            >
                                Download CSV template
                            </a>
                        </div>
                        <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-4 py-2 text-sm transition-colors">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".zip"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {fileName || "Choose ZIP file"}
                        </label>
                        <button
                            onClick={handleUpload}
                            disabled={loading || !fileName}
                            className="bg-primary hover:brightness-75 disabled:opacity-40 text-on-primary text-sm font-bold px-6 py-2.5 rounded transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">upload</span>
                                    Upload & Preview
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Preview */}
            {step === "preview" && preview && (
                <div className="space-y-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold">Preview</h2>
                            <button
                                onClick={handleReset}
                                className="text-xs text-zinc-500 hover:text-white transition-colors"
                            >
                                Choose different file
                            </button>
                        </div>
                        <div className="flex gap-4 text-sm text-zinc-400">
                            <span>Total rows: <strong className="text-white">{preview.totalRows}</strong></span>
                            <span>Valid: <strong className="text-green-400">{preview.validRows}</strong></span>
                            <span>Errors: <strong className={preview.errorRows > 0 ? "text-red-400" : "text-zinc-500"}>{preview.errorRows}</strong></span>
                            <span>Images uploaded: <strong className="text-white">{preview.imageSummary.uploaded}/{preview.imageSummary.total}</strong></span>
                        </div>
                    </div>

                    <div className="overflow-x-auto bg-neutral-900 border border-neutral-800 rounded">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-800">
                                <tr className="text-zinc-400 uppercase tracking-wider text-xs">
                                    <th className="text-left p-3">#</th>
                                    <th className="text-left p-3">Model</th>
                                    <th className="text-left p-3">Brand</th>
                                    <th className="text-left p-3">Price</th>
                                    <th className="text-left p-3">Currency</th>
                                    <th className="text-left p-3">Images</th>
                                    <th className="text-left p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {preview.rows.map((row) => (
                                    <tr
                                        key={row.index}
                                        className={row.valid ? "" : "bg-red-900/10"}
                                    >
                                        <td className="p-3 text-zinc-500 font-mono text-xs">{row.index + 1}</td>
                                        <td className="p-3 font-medium max-w-[200px] truncate" title={row.model}>
                                            {row.model || <span className="text-zinc-600 italic">empty</span>}
                                        </td>
                                        <td className="p-3">{row.brand || <span className="text-zinc-600 italic">empty</span>}</td>
                                        <td className="p-3">{row.priceCurrent || "-"}</td>
                                        <td className="p-3">{row.currency}</td>
                                        <td className="p-3">
                                            {row.imageStatus.length === 0 ? (
                                                <span className="text-zinc-600">—</span>
                                            ) : (
                                                <div className="flex gap-1">
                                                    {row.imageStatus.map((img, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`inline-block w-2 h-2 rounded-full ${
                                                                img.status === "uploaded" ? "bg-green-500" : "bg-red-500"
                                                            }`}
                                                            title={`${img.filename}: ${img.status}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {row.valid ? (
                                                <span className="text-green-400 text-xs font-bold uppercase">Valid</span>
                                            ) : (
                                                <div>
                                                    <span className="text-red-400 text-xs font-bold uppercase">Errors</span>
                                                    <div className="text-xs text-red-300 mt-1 space-y-0.5">
                                                        {row.errors.map((err, idx) => (
                                                            <div key={idx}>{err}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={loading || preview.validRows === 0}
                            className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-bold px-6 py-2.5 rounded transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">download</span>
                                    Import {preview.validRows} product{preview.validRows !== 1 ? "s" : ""}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Result */}
            {step === "result" && createResult && (
                <div className="bg-neutral-900 border border-neutral-800 rounded p-8 text-center space-y-4">
                    <span className={`material-symbols-outlined text-5xl ${createResult.failed > 0 ? "text-yellow-400" : "text-green-400"}`}>
                        {createResult.failed > 0 ? "warning" : "check_circle"}
                    </span>
                    <h2 className="text-xl font-bold">Import Complete</h2>
                    <div className="flex justify-center gap-6 text-sm">
                        <div>
                            <div className="text-2xl font-black text-green-400">{createResult.created}</div>
                            <div className="text-zinc-500">Created</div>
                        </div>
                        {createResult.failed > 0 && (
                            <div>
                                <div className="text-2xl font-black text-red-400">{createResult.failed}</div>
                                <div className="text-zinc-500">Failed</div>
                            </div>
                        )}
                    </div>

                    {createResult.results.filter((r) => !r.success).length > 0 && (
                        <div className="text-left bg-neutral-800 rounded p-3 max-h-40 overflow-y-auto">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Errors</h3>
                            {createResult.results
                                .filter((r) => !r.success)
                                .map((r) => (
                                    <div key={r.index} className="text-xs text-red-300 mb-1">
                                        Row {r.index + 1} (ID: {r.id}): {r.error}
                                    </div>
                                ))}
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            onClick={handleReset}
                            className="bg-neutral-800 hover:bg-neutral-700 text-sm px-4 py-2 rounded transition-colors"
                        >
                            Upload Another Batch
                        </button>
                        <a
                            href="/admin/products"
                            className="bg-primary hover:brightness-75 text-on-primary text-sm font-bold px-4 py-2 rounded transition-colors"
                        >
                            View Products
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
