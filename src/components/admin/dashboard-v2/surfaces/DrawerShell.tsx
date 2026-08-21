"use client";

import { useEffect, useRef, ReactNode } from "react";

export default function DrawerShell({
    title,
    description,
    onClose,
    children,
}: {
    title: string;
    description?: string;
    onClose: () => void;
    children: ReactNode;
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
        <div className="fixed inset-0 z-[70]">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="absolute right-0 top-0 h-full w-full min-[560px]:w-[600px] flex flex-col bg-neutral-900 border-l border-neutral-800 shadow-2xl"
            >
                <header className="flex items-start justify-between px-5 py-4 border-b border-neutral-800">
                    <div>
                        <h2 className="text-sm font-black text-white">{title}</h2>
                        {description && (
                            <p className="text-[10px] text-zinc-500 mt-0.5">{description}</p>
                        )}
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
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}