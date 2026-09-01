"use client";

import { useToastStore } from "@/store/toast";

export function ToastContainer() {
    const toasts = useToastStore((state) => state.toasts);
    const removeToast = useToastStore((state) => state.removeToast);

    if (toasts.length === 0) return null;

    return (
        <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded shadow-lg border animate-slide-up ${
                        toast.type === "success"
                            ? "bg-primary text-on-primary border-primary-container"
                            : toast.type === "error"
                            ? "bg-error text-on-error border-error-container"
                            : "bg-surface-container text-on-surface border-surface-container-highest"
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}
                    </span>
                    <p className="text-sm font-medium flex-1">{toast.message}</p>
                    <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            ))}
        </div>
    );
}
