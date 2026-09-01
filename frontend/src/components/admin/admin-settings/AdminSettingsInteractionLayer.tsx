"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAdminSettings, type AdminProfile, type AdminSettingsModel, AVATAR_LETTERS } from "./use-admin-settings";
import "./admin-settings-interactions.css";

const AdminSettingsModelContext = createContext<{ model: AdminSettingsModel } | null>(null);

export function useAdminSettingsModel() {
    const ctx = useContext(AdminSettingsModelContext);
    if (!ctx) throw new Error("useAdminSettingsModel must be used inside AdminSettingsInteractionLayer");
    return ctx;
}

const TOAST_ICONS = { success: "check_circle", warning: "warning", error: "error" } as const;

const MODAL_CHROME: Record<string, { title: string; subtitle: string; icon: string; size: string }> = {
    avatar: { title: "Profile Avatar", subtitle: "Choose an avatar for your admin profile.", icon: "person", size: "small" },
    sessions: { title: "Active Sessions", subtitle: "Review devices currently signed in to your account.", icon: "desktop_windows", size: "wide" },
    twoFactor: { title: "Two-Factor Authentication", subtitle: "Manage the extra security layer on your account.", icon: "key", size: "small" },
    history: { title: "Login History", subtitle: "Recent account authentication activity.", icon: "history", size: "wide" },
    owner: { title: "Owner Access", subtitle: "Account ownership and system access.", icon: "verified_user", size: "small" },
    account: { title: "Admin Account", subtitle: "Quick account controls.", icon: "person", size: "small" },
    signout: { title: "Sign Out", subtitle: "Confirm that you want to end this session.", icon: "lock", size: "small" },
    docs: { title: "Documentation", subtitle: "Athletica administration reference.", icon: "menu_book", size: "small" },
    support: { title: "Contact Support", subtitle: "Get help with your Athletica admin account.", icon: "support_agent", size: "small" },
};

function ToastItem({ toast, onDismiss }: { toast: { id: number; title: string; message: string; type: string }; onDismiss: (id: number) => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="admin-settings-toast" data-visible={visible} data-type={toast.type}>
            <span className="admin-settings-toast-icon material-symbols-outlined text-[16px]">
                {TOAST_ICONS[toast.type as keyof typeof TOAST_ICONS] ?? "check_circle"}
            </span>
            <div className="admin-settings-toast-copy">
                <p className="admin-settings-toast-title">{toast.title}</p>
                {toast.message && <p className="admin-settings-toast-message">{toast.message}</p>}
            </div>
            <button type="button" className="admin-settings-toast-close" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}>
                <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
        </div>
    );
}

function ModalSurface() {
    const { model } = useAdminSettingsModel();
    if (!model.modal) return null;

    const chrome = MODAL_CHROME[model.modal];
    const is2faEnable = model.modal === "twoFactor" && !model.twoFactorEnabled;

    let body: React.ReactNode = null;
    let footer: React.ReactNode = null;

    if (model.modal === "avatar") {
        body = (
            <div className="admin-settings-avatar-options">
                {AVATAR_LETTERS.map((letter) => (
                    <button
                        key={letter}
                        type="button"
                        className="admin-settings-avatar-option"
                        data-selected={model.avatarChoice === letter}
                        aria-label={`Choose avatar ${letter}`}
                        onClick={() => model.chooseAvatar(letter)}
                    >
                        {letter}
                    </button>
                ))}
            </div>
        );
        footer = (
            <>
                <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                    Cancel
                </button>
                <button type="button" className="admin-settings-button primary" onClick={model.applyAvatar}>
                    Apply Avatar
                </button>
            </>
        );
    }

    if (model.modal === "sessions") {
        body = (
            <div className="admin-settings-list">
                {model.sessions.map((session, i) => (
                    <div key={i} className="admin-settings-list-row">
                        <span className="admin-settings-list-icon material-symbols-outlined text-[17px]">desktop_windows</span>
                        <div>
                            <div className="admin-settings-list-title">
                                {session.device}
                                {session.current ? " · Current" : ""}
                            </div>
                            <div className="admin-settings-list-meta">
                                {session.browser} · {session.location} · Last active {session.lastActive}
                            </div>
                        </div>
                        {session.current ? (
                            <span className="admin-settings-list-status">Active</span>
                        ) : (
                            <button type="button" className="admin-settings-list-action" onClick={() => model.closeModal()}>
                                Revoke
                            </button>
                        )}
                    </div>
                ))}
            </div>
        );
        footer = (
            <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                Close
            </button>
        );
    }

    if (model.modal === "twoFactor") {
        body = is2faEnable ? (
            <>
                <div className="admin-settings-qr" aria-label="Authenticator setup code" />
                <p className="admin-settings-qr-hint">Open your authenticator app and scan this setup code.</p>
                <input
                    className="admin-settings-code-input"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    aria-label="Six digit verification code"
                    value={model.twoFactorCode}
                    onChange={(e) => model.setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <p className="admin-settings-inline-status" data-tone={model.twoFactorError ? "bad" : "neutral"}>
                    {model.twoFactorError || "Enter the six-digit code generated by your authenticator."}
                </p>
            </>
        ) : (
            <div className="admin-settings-info-grid">
                <div className="admin-settings-info-card">
                    <div className="admin-settings-info-label">STATUS</div>
                    <div className="admin-settings-info-value" data-tone="good">
                        Enabled
                    </div>
                </div>
                <div className="admin-settings-info-card">
                    <div className="admin-settings-info-label">METHOD</div>
                    <div className="admin-settings-info-value">Authenticator app</div>
                </div>
            </div>
        );
        footer = is2faEnable ? (
            <>
                <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                    Cancel
                </button>
                <button type="button" className="admin-settings-button primary" onClick={model.confirmTwoFactor}>
                    Enable 2FA
                </button>
            </>
        ) : (
            <>
                <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                    Close
                </button>
                <button type="button" className="admin-settings-button primary" onClick={model.disableTwoFactor}>
                    Disable 2FA
                </button>
            </>
        );
    }

    if (model.modal === "history") {
        body = (
            <div className="admin-settings-list">
                {model.history.map((item, i) => (
                    <div key={i} className="admin-settings-list-row">
                        <span className="admin-settings-list-icon material-symbols-outlined text-[17px]">verified_user</span>
                        <div>
                            <div className="admin-settings-list-title">{item.event}</div>
                            <div className="admin-settings-list-meta">
                                {item.device} · {item.location}
                            </div>
                        </div>
                        <span className="admin-settings-list-time">{item.time}</span>
                    </div>
                ))}
            </div>
        );
        footer = (
            <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                Close
            </button>
        );
    }

    if (model.modal === "owner") {
        body = (
            <div className="admin-settings-info-grid">
                <div className="admin-settings-info-card">
                    <div className="admin-settings-info-label">ROLE</div>
                    <div className="admin-settings-info-value">{model.profile.role}</div>
                </div>
                <div className="admin-settings-info-card">
                    <div className="admin-settings-info-label">ACCESS</div>
                    <div className="admin-settings-info-value" data-tone="good">
                        Full access
                    </div>
                </div>
                <div className="admin-settings-info-card">
                    <div className="admin-settings-info-label">ACCOUNT</div>
                    <div className="admin-settings-info-value">{model.profile.email}</div>
                </div>
                <div className="admin-settings-info-card">
                    <div className="admin-settings-info-label">MEMBER SINCE</div>
                    <div className="admin-settings-info-value">{model.profile.memberSince}</div>
                </div>
            </div>
        );
        footer = (
            <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                Close
            </button>
        );
    }

    if (model.modal === "account") {
        const rows: { action: "profile" | "security" | "signout"; icon: string; title: string; meta: string }[] = [
            { action: "profile", icon: "person", title: "Profile settings", meta: "Manage your account profile and preferences." },
            { action: "security", icon: "security", title: "Security", meta: "Password, 2FA and sessions." },
            { action: "signout", icon: "logout", title: "Sign out", meta: "End the current admin session." },
        ];
        body = (
            <div className="admin-settings-list">
                {rows.map((row) => (
                    <button key={row.action} type="button" className="admin-settings-list-row" data-button="true" onClick={() => model.accountAction(row.action)}>
                        <span className="admin-settings-list-icon material-symbols-outlined text-[17px]">{row.icon}</span>
                        <div>
                            <div className="admin-settings-list-title">{row.title}</div>
                            <div className="admin-settings-list-meta">{row.meta}</div>
                        </div>
                        <span className="admin-settings-list-chevron material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                ))}
            </div>
        );
        footer = (
            <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                Close
            </button>
        );
    }

    if (model.modal === "signout") {
        body = (
            <p className="admin-settings-signout-copy">
                You are currently signed in as <strong>{model.profile.email}</strong>.
            </p>
        );
        footer = (
            <>
                <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                    Cancel
                </button>
                <button type="button" className="admin-settings-button primary" onClick={model.confirmSignOut}>
                    Sign Out
                </button>
            </>
        );
    }

    if (model.modal === "docs") {
        body = (
            <div className="admin-settings-list">
                <div className="admin-settings-list-row">
                    <span className="admin-settings-list-icon material-symbols-outlined text-[17px]">settings</span>
                    <div>
                        <div className="admin-settings-list-title">Admin Settings</div>
                        <div className="admin-settings-list-meta">Profile, password, security and access controls.</div>
                    </div>
                </div>
                <div className="admin-settings-list-row">
                    <span className="admin-settings-list-icon material-symbols-outlined text-[17px]">security</span>
                    <div>
                        <div className="admin-settings-list-title">Security</div>
                        <div className="admin-settings-list-meta">Sessions, 2FA and login activity.</div>
                    </div>
                </div>
            </div>
        );
        footer = (
            <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                Close
            </button>
        );
    }

    if (model.modal === "support") {
        body = (
            <>
                <div className="admin-settings-info-grid">
                    <div className="admin-settings-info-card">
                        <div className="admin-settings-info-label">SUPPORT</div>
                        <div className="admin-settings-info-value">Contact Support</div>
                    </div>
                    <div className="admin-settings-info-card">
                        <div className="admin-settings-info-label">RESPONSE</div>
                        <div className="admin-settings-info-value">Within 1 business day</div>
                    </div>
                </div>
                <input className="admin-settings-support-input" placeholder="Describe your issue" aria-label="Support issue" />
            </>
        );
        footer = (
            <button type="button" className="admin-settings-button secondary" onClick={model.closeModal}>
                Close
            </button>
        );
    }

    return (
        <div
            className="admin-settings-modal-backdrop"
            data-open="true"
            onClick={(e) => {
                if (e.target === e.currentTarget) model.closeModal();
            }}
        >
            <div className="admin-settings-modal" data-size={chrome.size} role="dialog" aria-modal="true" aria-labelledby="admin-settings-modal-title">
                <div className="admin-settings-modal-head">
                    <div className="admin-settings-modal-title-wrap">
                        <span className="admin-settings-modal-icon material-symbols-outlined text-[20px]">{chrome.icon}</span>
                        <div>
                            <h2 className="admin-settings-modal-title" id="admin-settings-modal-title">
                                {chrome.title}
                            </h2>
                            <p className="admin-settings-modal-subtitle">{chrome.subtitle}</p>
                        </div>
                    </div>
                    <button type="button" className="admin-settings-modal-close" aria-label="Close" onClick={model.closeModal}>
                        <span className="material-symbols-outlined text-[17px]">close</span>
                    </button>
                </div>
                <div className="admin-settings-modal-body">{body}</div>
                {footer && <div className="admin-settings-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function AdminSettingsInteractionLayer({ profile, children }: { profile: AdminProfile; children: React.ReactNode }) {
    const model = useAdminSettings(profile);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") model.closeModal();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [model]);

    useEffect(() => {
        if (model.modal) {
            document.body.style.overflow = "hidden";
            const focusable = modalRef.current?.querySelector<HTMLElement>("button, input, select, [tabindex]");
            const timer = window.setTimeout(() => focusable?.focus(), 50);
            return () => {
                window.clearTimeout(timer);
                document.body.style.overflow = "";
            };
        }
    }, [model.modal]);

    return (
        <AdminSettingsModelContext.Provider value={{ model }}>
            <div className="admin-settings-interaction-layer">{children}</div>

            <div className="admin-settings-toast-stack" aria-live="polite">
                {model.toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={model.dismissToast} />
                ))}
            </div>

            <div ref={modalRef}>
                <ModalSurface />
            </div>
        </AdminSettingsModelContext.Provider>
    );
}