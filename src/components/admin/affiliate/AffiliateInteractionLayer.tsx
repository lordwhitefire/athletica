"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAffiliate, type AffiliateModel, type Toast } from "./use-affiliate";
import "./affiliate-interactions.css";

const AffiliateModelContext = createContext<{ model: AffiliateModel } | null>(null);

export function useAffiliateModel() {
    const ctx = useContext(AffiliateModelContext);
    if (!ctx) throw new Error("useAffiliateModel must be used inside AffiliateInteractionLayer");
    return ctx;
}

function ToastItem({ toast }: { toast: Toast }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="interaction-toast" data-visible={visible} data-type={toast.type}>
            <span className="interaction-toast-icon material-symbols-outlined text-[16px]">
                {toast.type === "error" ? "error" : "check_circle"}
            </span>
            <div className="interaction-toast-copy">
                <p className="interaction-toast-title">{toast.title}</p>
                {toast.message && <p className="interaction-toast-message">{toast.message}</p>}
            </div>
        </div>
    );
}

export function AffiliateInteractionLayer({ children }: { children: React.ReactNode }) {
    const model = useAffiliate();
    const accountMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest(".aff-dropdown-anchor")) return;
            if (model.dropdown === "account" && accountMenuRef.current?.contains(e.target as Node)) return;
            model.closeDropdowns();
        };
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, [model]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                model.closeDropdowns();
                model.closeModal();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [model]);

    useEffect(() => {
        const btn = document.getElementById("admin-profile-button");
        if (!btn) return;
        const handler = (e: MouseEvent) => {
            e.stopPropagation();
            model.openDropdown("account");
        };
        btn.addEventListener("click", handler);
        return () => btn.removeEventListener("click", handler);
    }, [model]);

    useEffect(() => {
        const pop = accountMenuRef.current;
        if (model.dropdown !== "account" || !pop) return;
        const anchor = document.getElementById("admin-profile-button");
        if (!anchor) return;
        const frame = requestAnimationFrame(() => {
            const r = anchor.getBoundingClientRect();
            pop.style.left = `${Math.min(Math.max(8, r.left), window.innerWidth - pop.offsetWidth - 8)}px`;
            pop.style.top = `${r.bottom + 7}px`;
            pop.style.display = "block";
        });
        return () => cancelAnimationFrame(frame);
    }, [model.dropdown]);

    return (
        <AffiliateModelContext.Provider value={{ model }}>
            <div className="affiliate-interaction-layer">
                {children}

                <div
                    ref={accountMenuRef}
                    className="interaction-dropdown"
                    data-placement="left"
                    role="menu"
                    aria-label="Account menu"
                    style={{ position: "fixed", display: model.dropdown === "account" ? "block" : "none" }}
                >
                    <button type="button" className="interaction-dropdown-item" onClick={() => model.accountAction("Account profile")}>
                        Account profile
                    </button>
                    <button type="button" className="interaction-dropdown-item" onClick={() => model.accountAction("Preferences")}>
                        Preferences
                    </button>
                    <div className="interaction-dropdown-divider" />
                    <button type="button" className="interaction-dropdown-item" data-danger="true" onClick={() => model.accountAction("Sign out")}>
                        Sign out
                    </button>
                </div>

                <div className="interaction-toast-stack">
                    {model.toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} />
                    ))}
                </div>

                {model.modal && (
                    <div
                        className="interaction-modal-backdrop"
                        data-open="true"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) model.closeModal();
                        }}
                    >
                        <div className="interaction-modal" role="dialog" aria-modal="true" aria-labelledby="affiliate-modal-title">
                            <h2 className="interaction-modal-title" id="affiliate-modal-title">
                                {model.modal.kind === "save" ? "Save changes?" : "Open Amazon link?"}
                            </h2>
                            <p className="interaction-modal-copy">
                                {model.modal.kind === "save"
                                    ? "Your Amazon affiliate configuration will be applied across the platform."
                                    : "The generated affiliate link will open in a new browser tab."}
                            </p>
                            <div className="interaction-modal-actions">
                                <button type="button" className="interaction-modal-button" onClick={model.closeModal}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="interaction-modal-button primary"
                                    onClick={
                                        model.modal.kind === "save"
                                            ? model.confirmSave
                                            : () => {
                                                  window.open(model.modal?.url, "_blank", "noopener,noreferrer");
                                                  model.closeModal();
                                              }
                                    }
                                >
                                    {model.modal.kind === "save" ? "Save Changes" : "Open Link"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AffiliateModelContext.Provider>
    );
}