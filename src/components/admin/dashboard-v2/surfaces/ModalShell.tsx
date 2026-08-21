"use client";

import { useEffect, useRef, ReactNode } from "react";

export default function ModalShell({
    title,
    eyebrow,
    subtitle,
    onClose,
    children,
    footer,
}: {
    title: string;
    eyebrow?: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const restoreRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        restoreRef.current = document.activeElement as HTMLElement | null;
        const focusable = panelRef.current?.querySelector<HTMLElement>(
            "input, select, textarea, button, [tabindex]:not([tabindex='-1'])"
        );
        focusable?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            restoreRef.current?.focus();
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[70] flex items-end min-[560px]:items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="relative w-full max-w-[540px] max-h-[90vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-t-2xl min-[560px]:rounded-xl shadow-2xl"
            >
                <header className="flex items-start justify-between px-5 py-4 border-b border-neutral-800">
                    <div>
                        {eyebrow && (
                            <span className="block text-[9px] uppercase tracking-wider text-zinc-500">
                                {eyebrow}
                            </span>
                        )}
                        <h2 className="text-sm font-black text-white">{title}</h2>
                        {subtitle && <p className="text-[10px] text-zinc-500 mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-zinc-500 hover:text-white p-1"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </header>
                <div className="px-5 py-4 overflow-y-auto">{children}</div>
                {footer && (
                    <footer className="px-5 py-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
}