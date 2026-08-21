"use client";

import {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { ShIcon } from "./sh-icons";
import {
    useSystemHealth,
    type AdminProfile,
    type SystemHealthModel,
} from "./use-system-health";
import {
    AFFECTED_PRODUCTS,
    ALERTS,
    ISSUES,
    ISSUE_ORDER,
    SYNCS,
    SCORE,
    formatHumanDate,
} from "./system-health-data";
import "./system-health-interactions.css";

const SystemHealthModelContext = createContext<{ model: SystemHealthModel } | null>(null);

export function useSystemHealthModel() {
    const ctx = useContext(SystemHealthModelContext);
    if (!ctx) throw new Error("useSystemHealthModel must be used inside SystemHealthInteractionLayer");
    return ctx;
}

const TOAST_ICON: Record<string, string> = {
    success: "check",
    warning: "warning",
    error: "error",
    info: "info",
};

function formatDateKey(year: number, month: number, day: number): string {
    return [year, String(month + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
}

/* ------------------------------------------------------------------ */
/*  Toasts                                                             */
/* ------------------------------------------------------------------ */

function ToastItem({ toast, onDismiss }: { toast: SystemHealthModel["toasts"][number]; onDismiss: (id: number) => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="sh-toast" data-visible={visible} data-type={toast.type}>
            <span className="sh-toast__icon">
                <ShIcon name={TOAST_ICON[toast.type] ?? "check"} />
            </span>
            <span className="sh-toast__message">
                {toast.title}
                {toast.message ? ` — ${toast.message}` : ""}
            </span>
            <button type="button" className="sh-toast__close" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}>
                <ShIcon name="close" />
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

function DetailStat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="sh-detail-stat">
            <div className="sh-detail-stat__label">{label}</div>
            <div className="sh-detail-stat__value">{value}</div>
        </div>
    );
}

function DetailList({
    items,
}: {
    items: { label: string; value: string | number }[];
}) {
    return (
        <ul className="sh-detail-list">
            {items.map((item) => (
                <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                </li>
            ))}
        </ul>
    );
}

function CalendarSurface({ model }: { model: SystemHealthModel }) {
    const year = model.dateCursor.getFullYear();
    const month = model.dateCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(formatDateKey(year, month, d));

    return (
        <>
            <div className="sh-date-controls">
                <div className="sh-date-month">
                    {firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                <div className="sh-date-nav">
                    <button type="button" aria-label="Previous month" onClick={model.calendarPrev}>
                        ‹
                    </button>
                    <button type="button" aria-label="Next month" onClick={model.calendarNext}>
                        ›
                    </button>
                </div>
            </div>

            <div className="sh-date-grid">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div className="sh-date-weekday" key={day}>
                        {day}
                    </div>
                ))}
                {cells.map((dateKey, i) => {
                    if (!dateKey) return <span key={i} />;
                    const isFrom = dateKey === model.selectedRange.from;
                    const isTo = dateKey === model.selectedRange.to;
                    const inRange =
                        dateKey >= model.selectedRange.from && dateKey <= model.selectedRange.to;
                    const className = [
                        "sh-date-day",
                        isFrom || isTo ? "is-selected" : "",
                        inRange && !isFrom && !isTo ? "is-in-range" : "",
                    ]
                        .filter(Boolean)
                        .join(" ");
                    return (
                        <button
                            key={i}
                            type="button"
                            className={className}
                            data-date={dateKey}
                            onClick={() => model.pickDate(dateKey)}
                        >
                            {Number(dateKey.slice(8))}
                        </button>
                    );
                })}
            </div>

            <div className="sh-date-range">
                <div className="sh-detail-stat">
                    <div className="sh-detail-stat__label">From</div>
                    <div className="sh-detail-stat__value">{formatHumanDate(model.selectedRange.from)}</div>
                </div>
                <div className="sh-detail-stat">
                    <div className="sh-detail-stat__label">To</div>
                    <div className="sh-detail-stat__value">{formatHumanDate(model.selectedRange.to)}</div>
                </div>
            </div>
        </>
    );
}

function ModalSurface() {
    const { model } = useSystemHealthModel();

    if (!model.modal) return null;

    const chrome: Record<string, { title: string; subtitle: string }> = {
        date: {
            title: "Select date range",
            subtitle: "Choose the period used for the System Health dashboard.",
        },
        issue: {
            title: model.issueKey ? ISSUES[model.issueKey].title : "Data quality issue",
            subtitle: "Data quality issue details",
        },
        products: {
            title: model.productsTitle ?? "Affected products",
            subtitle: "Filtered product records",
        },
        syncHistory: {
            title: "Full sync history",
            subtitle: "Recent data synchronization operations.",
        },
        syncDetail: {
            title: SYNCS.find((s) => s.id === model.syncId)?.title ?? "Synchronization",
            subtitle: "Synchronization operation",
        },
        alerts: {
            title: "Recent Data Quality Alerts",
            subtitle: "Latest issues detected by the system.",
        },
        issuesReport: {
            title: "Data issues report",
            subtitle: "Current data-quality findings.",
        },
        improvements: {
            title: "Improvement suggestions",
            subtitle: "Recommended actions based on the current data quality score.",
        },
        preferences: {
            title: "Preferences",
            subtitle: "Administrative preference surface",
        },
    };

    const meta = chrome[model.modal];
    let body: ReactNode = null;
    let footer: ReactNode = null;

    if (model.modal === "date") {
        body = <CalendarSurface model={model} />;
        footer = (
            <>
                <button type="button" className="sh-interaction-btn" onClick={model.closeModal}>
                    Cancel
                </button>
                <button type="button" className="sh-interaction-btn primary" onClick={model.applyDateRange}>
                    Apply range
                </button>
            </>
        );
    }

    if (model.modal === "issue") {
        const issue = model.issueKey ? ISSUES[model.issueKey] : null;
        body = issue ? (
            <>
                <div className="sh-detail-summary">
                    <DetailStat label="Products affected" value={issue.count} />
                    <DetailStat label="Percentage" value={issue.percentage} />
                    <DetailStat label="Trend" value={issue.trend} />
                </div>
                <div className="sh-detail-section">
                    <h4>Issue summary</h4>
                    <DetailList
                        items={[
                            { label: "Description", value: issue.description },
                            { label: "Severity", value: issue.severity },
                            { label: "Recommended action", value: issue.action },
                        ]}
                    />
                </div>
                <div className="sh-detail-section">
                    <h4>Example affected records</h4>
                    <ul className="sh-detail-list">
                        {[1, 2, 3, 4].map((n) => (
                            <li key={n}>
                                <span>Product #ATH-{issue.count}0{n}</span>
                                <strong>Needs review</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            </>
        ) : null;
        footer = (
            <>
                <button type="button" className="sh-interaction-btn" onClick={model.closeModal}>
                    Close
                </button>
                <button type="button" className="sh-interaction-btn primary" onClick={model.markIssueReviewed}>
                    Mark reviewed
                </button>
            </>
        );
    }

    if (model.modal === "products") {
        body = (
            <>
                <div className="sh-detail-summary">
                    <DetailStat label="Matching products" value={67} />
                    <DetailStat label="Current status" value="Open" />
                    <DetailStat label="Last checked" value="2h ago" />
                </div>
                <div className="sh-detail-section">
                    <h4>Product records</h4>
                    <ul className="sh-detail-list">
                        {AFFECTED_PRODUCTS.map((product) => (
                            <li key={product.id}>
                                <span>{product.name}</span>
                                <strong>{product.id}</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            </>
        );
        footer = (
            <>
                <button type="button" className="sh-interaction-btn" onClick={model.closeModal}>
                    Close
                </button>
                <button
                    type="button"
                    className="sh-interaction-btn primary"
                    onClick={() => {
                        model.exportProducts();
                        model.closeModal();
                    }}
                >
                    <ShIcon name="download" /> Export
                </button>
            </>
        );
    }

    if (model.modal === "syncHistory") {
        body = (
            <ul className="sh-detail-list">
                {SYNCS.map((sync) => (
                    <li key={sync.id}>
                        <span>
                            <strong className="sh-detail-list-title">{sync.title}</strong>
                            {sync.date}
                        </span>
                        <strong>{sync.status}</strong>
                    </li>
                ))}
            </ul>
        );
        footer = (
            <button type="button" className="sh-interaction-btn" onClick={model.closeModal}>
                Close
            </button>
        );
    }

    if (model.modal === "syncDetail") {
        const sync = SYNCS.find((s) => s.id === model.syncId);
        body = sync ? (
            <>
                <div className="sh-detail-summary">
                    <DetailStat label="Status" value={sync.status} />
                    <DetailStat label="Duration" value={sync.duration} />
                    <DetailStat label="Result" value={sync.result} />
                </div>
                <div className="sh-detail-section">
                    <h4>Operation details</h4>
                    <DetailList
                        items={[
                            { label: "Operation type", value: sync.type },
                            { label: "Started", value: sync.date },
                            { label: "Result", value: sync.result },
                            { label: "Health", value: "Healthy" },
                        ]}
                    />
                </div>
            </>
        ) : null;
        footer = (
            <button type="button" className="sh-interaction-btn" onClick={model.closeModal}>
                Close
            </button>
        );
    }

    if (model.modal === "alerts") {
        body = (
            <ul className="sh-detail-list">
                {ALERTS.map((alert, i) => (
                    <li key={i}>
                        <span>{alert.title}</span>
                        <strong>{alert.severity}</strong>
                    </li>
                ))}
            </ul>
        );
        footer = (
            <>
                <button type="button" className="sh-interaction-btn" onClick={model.closeModal}>
                    Close
                </button>
                <button type="button" className="sh-interaction-btn primary" onClick={model.markAlertsReviewed}>
                    Mark all reviewed
                </button>
            </>
        );
    }

    if (model.modal === "issuesReport") {
        body = (
            <>
                <div className="sh-detail-summary">
                    <DetailStat label="Issue types" value={ISSUE_ORDER.length} />
                    <DetailStat label="Products affected" value={310} />
                    <DetailStat label="Quality score" value={SCORE.number} />
                </div>
                <ul className="sh-detail-list">
                    {ISSUE_ORDER.map((key) => {
                        const issue = ISSUES[key];
                        return (
                            <li key={key}>
                                <span>{issue.title}</span>
                                <strong>
                                    {issue.count} • {issue.percentage}
                                </strong>
                            </li>
                        );
                    })}
                </ul>
            </>
        );
        footer = (
            <>
                <button type="button" className="sh-interaction-btn" onClick={model.closeModal}>
                    Close
                </button>
                <button
                    type="button"
                    className="sh-interaction-btn primary"
                    onClick={() => {
                        model.exportIssuesReport();
                        model.closeModal();
                    }}
                >
                    <ShIcon name="download" /> Export CSV
                </button>
            </>
        );
    }

    if (model.modal === "improvements") {
        body = (
            <>
                <ul className="sh-detail-list">
                    {ISSUE_ORDER.map((key) => {
                        const issue = ISSUES[key];
                        return (
                            <li key={key}>
                                <span>{issue.title}</span>
                                <strong>{issue.count} products</strong>
                            </li>
                        );
                    })}
                </ul>
                <div className="sh-detail-section">
                    <h4>Projected result</h4>
                    <div className="sh-detail-stat">
                        <div className="sh-detail-stat__label">Potential data quality score</div>
                        <div className="sh-detail-stat__value">93–96</div>
                    </div>
                </div>
            </>
        );
        footer = (
            <>
                <button type="button" className="sh-interaction-btn" onClick={model.closeModal}>
                    Close
                </button>
                <button type="button" className="sh-interaction-btn primary" onClick={model.startImprovements}>
                    Start review
                </button>
            </>
        );
    }

    if (model.modal === "preferences") {
        body = (
            <>
                <div className="sh-detail-section">
                    <h4>Display</h4>
                    <DetailList
                        items={[
                            { label: "Dashboard density", value: "Comfortable" },
                            { label: "Default data range", value: "Last 7 days" },
                            { label: "Alert notifications", value: "Enabled" },
                        ]}
                    />
                </div>
                <div className="sh-detail-section">
                    <h4>Account</h4>
                    <DetailList
                        items={[
                            { label: "Role", value: model.profile.role },
                            { label: "Email", value: model.profile.email },
                        ]}
                    />
                </div>
            </>
        );
        footer = (
            <>
                <button type="button" className="sh-interaction-btn" onClick={model.closeModal}>
                    Close
                </button>
                <button type="button" className="sh-interaction-btn primary" onClick={model.savePreferences}>
                    Save preferences
                </button>
            </>
        );
    }

    return (
        <div
            className="sh-overlay"
            data-open="true"
            onClick={(e) => {
                if (e.target === e.currentTarget) model.closeModal();
            }}
        >
            <section
                className={`sh-modal${model.modal === "date" ? " date-panel" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label={meta.title}
            >
                <header className="sh-modal__header">
                    <div className="sh-modal__title">
                        <h3>{meta.title}</h3>
                        <p>{meta.subtitle}</p>
                    </div>
                    <button type="button" className="sh-modal__close" aria-label="Close" onClick={model.closeModal}>
                        <ShIcon name="close" />
                    </button>
                </header>
                <div className="sh-modal__body">{body}</div>
                {footer && <footer className="sh-modal__footer">{footer}</footer>}
            </section>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Profile menu                                                       */
/* ------------------------------------------------------------------ */

function ProfileMenu() {
    const { model } = useSystemHealthModel();
    const menuRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const menu = menuRef.current;
        const button = document.getElementById("admin-profile-button");
        if (!menu || !button) return;
        if (window.matchMedia("(max-width: 767px)").matches) {
            menu.style.left = "10px";
            menu.style.right = "10px";
            menu.style.bottom = "10px";
            menu.style.top = "auto";
            return;
        }
        const rect = button.getBoundingClientRect();
        menu.style.left = `${rect.left + 6}px`;
        menu.style.top = `${Math.max(10, rect.top - menu.offsetHeight - 8)}px`;
    }, []);

    return (
        <div className="sh-profile-menu" ref={menuRef} role="menu" aria-label="Admin profile">
            <button
                type="button"
                className="sh-profile-menu__item"
                role="menuitem"
                onClick={() => model.runProfileAction("account")}
            >
                <span>Account settings</span>
            </button>
            <button
                type="button"
                className="sh-profile-menu__item"
                role="menuitem"
                onClick={() => model.runProfileAction("preferences")}
            >
                <span>Preferences</span>
            </button>
            <div className="sh-profile-menu__separator" />
            <button
                type="button"
                className="sh-profile-menu__item danger"
                role="menuitem"
                onClick={() => model.runProfileAction("signout")}
            >
                <span>Sign out</span>
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Layer                                                              */
/* ------------------------------------------------------------------ */

export function SystemHealthInteractionLayer({
    profile,
    onNavigate,
    onSignOut,
    children,
}: {
    profile: AdminProfile;
    onNavigate: (path: string) => void;
    onSignOut: () => void;
    children: ReactNode;
}) {
    const model = useSystemHealth(profile, onNavigate, onSignOut);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const button = document.getElementById("admin-profile-button");
        if (!button) return;
        const onClick = (event: Event) => {
            event.stopPropagation();
            model.toggleProfileMenu();
        };
        button.addEventListener("click", onClick);
        return () => button.removeEventListener("click", onClick);
    }, [model]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (model.modal) {
                    model.closeModal();
                    return;
                }
                if (model.profileOpen) model.closeProfileMenu();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [model]);

    useEffect(() => {
        if (!model.profileOpen) return;
        const onDocClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest(".sh-profile-menu") || target.closest("#admin-profile-button")) return;
            model.closeProfileMenu();
        };
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
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
        <SystemHealthModelContext.Provider value={{ model }}>
            <div className="sh-interaction-layer">{children}</div>

            {model.profileOpen && <ProfileMenu />}

            <div className="sh-toast-stack" aria-live="polite">
                {model.toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={model.dismissToast} />
                ))}
            </div>

            <div ref={modalRef}>
                <ModalSurface />
            </div>
        </SystemHealthModelContext.Provider>
    );
}