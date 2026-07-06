"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toPng } from "html-to-image";

interface EditPopupProps {
    open: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    onSave?: () => void;
    saveLabel?: string;
    saving?: boolean;
    saveDisabled?: boolean;
    children: ReactNode;
    /**
     * Right panel — the live preview. Renders full-size (no scale-[0.6])
     * inside a scrollable container so editors can actually evaluate the
     * section. Bug #8 from issues/homepage-editor-bugs.md.
     */
    preview?: ReactNode;
    /**
     * When provided, shows a floating "Capture Snapshot" button over the
     * preview panel. The admin clicks it to manually capture the visible
     * preview as a PNG data URL for the overview thumbnail.
     */
    onCapture?: (dataUrl: string) => void;
}

/**
 * Reusable full-screen edit overlay. Two-panel layout on desktop:
 *   left  = form fields (scrollable)
 *   right = full-size live preview (scrollable)
 * Stacked on mobile. Dark backdrop, X close top-right, Save bottom-right.
 *
 * See prompts/homepage-editor-redesign.md Step 3.
 */
export default function EditPopup({
    open,
    title,
    subtitle,
    onClose,
    onSave,
    saveLabel = "Save",
    saving = false,
    saveDisabled = false,
    children,
    preview,
    onCapture,
}: EditPopupProps) {
    // Trap ESC to close, and lock body scroll while open.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) onClose();
        };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose, saving]);

    const previewRef = useRef<HTMLDivElement>(null);
    const [capturing, setCapturing] = useState(false);

    const handleCapture = async () => {
        if (!previewRef.current || !onCapture) return;
        setCapturing(true);
        try {
            const dataUrl = await toPng(previewRef.current, { quality: 0.3, pixelRatio: 0.4 });
            onCapture(dataUrl);
        } catch (err) {
            console.error("Snapshot capture failed", err);
        } finally {
            setCapturing(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex bg-black/70"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => {
                if (e.target === e.currentTarget && !saving) onClose();
            }}
        >
            <div className="m-auto w-full h-full md:w-[95vw] md:h-[92vh] bg-neutral-900 border border-neutral-700 rounded-none md:rounded-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white">{title}</h2>
                        {subtitle && (
                            <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close"
                        className="p-2 text-zinc-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body: two-panel layout on desktop, stacked on mobile */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    <div className="flex-1 overflow-y-auto p-6 min-w-0">
                        {children}
                    </div>
                    {preview && (
                        <div className="md:w-[55%] md:max-w-[820px] border-t md:border-t-0 md:border-l border-neutral-800 bg-neutral-950 overflow-y-auto p-4 relative">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                                    Live Preview (full size)
                                </p>
                                {onCapture && (
                                    <button
                                        type="button"
                                        onClick={handleCapture}
                                        disabled={capturing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary text-xs font-bold rounded hover:brightness-90 disabled:opacity-50 transition-colors"
                                        title="Capture snapshot for overview thumbnail"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">
                                            {capturing ? "hourglass_empty" : "photo_camera"}
                                        </span>
                                        {capturing ? "Capturing..." : "Snapshot"}
                                    </button>
                                )}
                            </div>
                            <div ref={previewRef}>
                                {preview}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {onSave && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-neutral-800 rounded transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={saveDisabled || saving}
                            className="px-5 py-2 text-sm font-bold bg-primary text-on-primary rounded hover:brightness-90 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {saving && (
                                <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                            )}
                            {saving ? "Saving…" : saveLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
