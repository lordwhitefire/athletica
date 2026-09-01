"use client";

import { useEffect, useRef, ReactNode } from "react";

export default function PopoverShell({
    onClose,
    children,
    wide,
}: {
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const focusable = panelRef.current?.querySelector<HTMLElement>("button, input, select, [tabindex]");
        focusable?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <>
            <div className="fixed inset-0 z-[65]" onClick={onClose} aria-hidden="true" />
            <div
                ref={panelRef}
                role="dialog"
                aria-label="Popover"
                className={`absolute right-0 top-full mt-2 z-[66] bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden ${wide ? "w-72" : "w-48"}`}
            >
                {children}
            </div>
        </>
    );
}