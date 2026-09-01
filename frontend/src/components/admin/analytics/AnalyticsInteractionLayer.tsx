"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { DATE_PRESETS, statCards, topBrands } from "./analytics.data";
import { money, num, pct, useAnalytics, type AnalyticsModel } from "./use-analytics";
import "./analytics-interactions.css";

const AnalyticsModelContext = createContext<{ model: AnalyticsModel } | null>(null);

export function useAnalyticsModel() {
    const ctx = useContext(AnalyticsModelContext);
    if (!ctx) throw new Error("useAnalyticsModel must be used inside AnalyticsInteractionProvider");
    return ctx;
}

export function AnalyticsInteractionLayer({ children }: { children: React.ReactNode }) {
    const model = useAnalytics();
    const {
        state,
        toasts,
        modal,
        activeDrawerProduct,
        datePopoverOpen,
        dismissToast,
        closeOverlays,
        closeModal,
        closeDrawer,
        moveCalendar,
        pickDay,
        applyPreset,
    } = model;

    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!datePopoverOpen) return;
        const anchor = document.querySelector<HTMLElement>(".analytics-page .date-picker");
        const pop = popoverRef.current;
        if (!anchor || !pop) return;
        const r = anchor.getBoundingClientRect();
        pop.style.left = `${Math.min(Math.max(12, r.right - pop.offsetWidth), window.innerWidth - pop.offsetWidth - 12)}px`;
        pop.style.top = `${r.bottom + 7}px`;
        pop.style.display = "block";

        const outside = (e: MouseEvent) => {
            if (pop.contains(e.target as Node)) return;
            if ((e.target as HTMLElement).closest(".date-picker")) return;
            closeOverlays();
            document.removeEventListener("click", outside);
        };
        setTimeout(() => document.addEventListener("click", outside), 0);
        return () => document.removeEventListener("click", outside);
    }, [datePopoverOpen, closeOverlays]);

    const overlayOpen = modal !== null || activeDrawerProduct !== null;
    const calendar = useMemo(() => buildCalendar(state.calendarYear, state.calendarMonth), [state.calendarYear, state.calendarMonth]);

    return (
        <AnalyticsModelContext.Provider value={{ model }}>
            <div className="analytics-interaction-layer">
                {children}

                <div id="uiToastStack" className="ui-toast-stack">
                    {toasts.map((t) => (
                        <div key={t.id} className={`ui-toast ${t.type === "error" ? "error" : "success"}`}>
                            <span className="toast-mark">{t.type === "success" ? "✓" : "!"}</span>
                            <span>{t.message}</span>
                            <button type="button" className="toast-close" onClick={() => dismissToast(t.id)}>
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                {overlayOpen && <div id="uiOverlay" className="ui-overlay open" onClick={closeOverlays} />}

                {modal && (
                    <div className="ui-modal open" role="dialog" aria-modal="true" aria-hidden="false" onClick={(e) => e.stopPropagation()}>
                        <div className="ui-modal-head">
                            <div className="ui-modal-title">{modalTitle(modal)}</div>
                            <button type="button" className="ui-modal-close" onClick={closeModal}>
                                ×
                            </button>
                        </div>
                        <div className="ui-modal-body">{renderModalBody(model)}</div>
                        <div className="ui-modal-foot">
                            {modal.kind === "editor" ? (
                                <>
                                    <button type="button" className="ui-btn" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="button" className="ui-btn primary" onClick={model.saveEditor}>
                                        {modal.product ? "Save Changes" : "Create Product"}
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="ui-btn" onClick={closeModal}>
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeDrawerProduct && (
                    <aside className="ui-drawer open" aria-hidden="false">
                        <div className="ui-drawer-head">
                            <div className="ui-modal-title">Product Details</div>
                            <button type="button" className="ui-modal-close" onClick={closeDrawer}>
                                ×
                            </button>
                        </div>
                        <div className="ui-drawer-body">
                            <img className="ui-detail-image" src={activeDrawerProduct.image} alt={activeDrawerProduct.name} />
                            <div className="ui-detail-title">{activeDrawerProduct.name}</div>
                            <div className="ui-detail-sub">
                                ASIN: {activeDrawerProduct.asin} · {activeDrawerProduct.brand} · {activeDrawerProduct.category}
                            </div>
                            <div className="ui-detail-stats">
                                <div className="ui-detail-stat">
                                    <span>Views</span>
                                    <strong>{num(activeDrawerProduct.views)}</strong>
                                </div>
                                <div className="ui-detail-stat">
                                    <span>Unique Views</span>
                                    <strong>{num(activeDrawerProduct.unique)}</strong>
                                </div>
                                <div className="ui-detail-stat">
                                    <span>Amazon Clicks</span>
                                    <strong>{num(activeDrawerProduct.clicks)}</strong>
                                </div>
                                <div className="ui-detail-stat">
                                    <span>Revenue (Est.)</span>
                                    <strong>{money(activeDrawerProduct.revenue)}</strong>
                                </div>
                            </div>
                            <div className="ui-detail-section">
                                <h4>Conversion Funnel</h4>
                                <div className="ui-detail-row">
                                    <span>Add to Cart</span>
                                    <strong>{num(activeDrawerProduct.cart)}</strong>
                                </div>
                                <div className="ui-detail-row">
                                    <span>Click Through Rate</span>
                                    <strong>{pct(activeDrawerProduct.ctr)}</strong>
                                </div>
                                <div className="ui-detail-row">
                                    <span>Conversion Rate</span>
                                    <strong>{pct(activeDrawerProduct.conversion)}</strong>
                                </div>
                            </div>
                            <div className="ui-detail-section">
                                <h4>Affiliate</h4>
                                <div className="ui-detail-row">
                                    <span>Estimated Revenue</span>
                                    <strong>{money(activeDrawerProduct.revenue)}</strong>
                                </div>
                                <div className="ui-detail-row">
                                    <span>Period</span>
                                    <strong>{state.productPeriod}</strong>
                                </div>
                                <div className="ui-detail-row">
                                    <span>Status</span>
                                    <strong style={{ color: "var(--lime)" }}>Active</strong>
                                </div>
                            </div>
                        </div>
                        <div className="ui-drawer-foot">
                            <button type="button" className="ui-btn" onClick={model.drawerEdit}>
                                Edit Product
                            </button>
                            <button type="button" className="ui-btn primary" onClick={model.drawerAmazon}>
                                Open Amazon Link
                            </button>
                        </div>
                    </aside>
                )}

                {datePopoverOpen && (
                    <div ref={popoverRef} className="ui-popover ui-date-calendar open" id="datePopover" onClick={(e) => e.stopPropagation()}>
                        <div className="ui-date-head">
                            <strong>
                                {new Date(state.calendarYear, state.calendarMonth, 1).toLocaleString("en-US", { month: "long" })} {state.calendarYear}
                            </strong>
                            <div className="ui-date-nav">
                                <button type="button" onClick={() => moveCalendar(-1)} aria-label="Previous month">
                                    ‹
                                </button>
                                <button type="button" onClick={() => moveCalendar(1)} aria-label="Next month">
                                    ›
                                </button>
                            </div>
                        </div>
                        <div className="ui-date-week">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                <span key={d}>{d}</span>
                            ))}
                        </div>
                        <div className="ui-date-days">
                            {calendar.leading.map((d) => (
                                <button key={`l-${d}`} type="button" className="ui-day muted" data-day={d} data-outside="1">
                                    {d}
                                </button>
                            ))}
                            {calendar.days.map((d) => {
                                const selected = state.calendarYear === 2025 && state.calendarMonth === 4 && d >= 13 && d <= 19;
                                return (
                                    <button key={d} type="button" className={`ui-day${selected ? " selected" : ""}`} data-day={d} onClick={() => pickDay(d, state.calendarYear, state.calendarMonth)}>
                                        {d}
                                    </button>
                                );
                            })}
                            {calendar.trailing.map((d) => (
                                <button key={`t-${d}`} type="button" className="ui-day muted" data-day={d} data-outside="1">
                                    {d}
                                </button>
                            ))}
                        </div>
                        <div className="ui-date-presets">
                            {DATE_PRESETS.map((p) => (
                                <button key={p.value} type="button" data-range={p.value} onClick={() => applyPreset(p.value)}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div id="compareBar" className={`ui-compare-bar${state.selectedProducts.length ? " open" : ""}`}>
                    <span className="ui-compare-count">
                        <strong>{state.selectedProducts.length}</strong> products selected
                    </span>
                    <button type="button" className="ui-btn" id="clearCompare" onClick={model.clearCompare}>
                        Clear
                    </button>
                    <button type="button" className="ui-btn primary" id="openCompare" onClick={model.openCompare}>
                        Compare
                    </button>
                </div>
            </div>
        </AnalyticsModelContext.Provider>
    );
}

function buildCalendar(year: number, month: number) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const prevLast = new Date(year, month, 0).getDate();
    const startDay = first.getDay();
    const leading: number[] = [];
    for (let i = startDay - 1; i >= 0; i--) leading.push(prevLast - i);
    const days: number[] = [];
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    const total = Math.ceil((startDay + last.getDate()) / 7) * 7;
    const used = leading.length + days.length;
    const trailing: number[] = [];
    for (let d = 1; used + trailing.length < total; d++) trailing.push(d);
    return { leading, days, trailing };
}

function modalTitle(modal: { kind: string; product?: { asin: string } }) {
    switch (modal.kind) {
        case "export":
            return "Export Report";
        case "stat":
            return "Statistic Detail";
        case "brands":
            return "Top Brands";
        case "compare":
            return "Product Comparison";
        case "trafficCompare":
            return "Traffic Comparison";
        case "editor":
            return modal.product ? "Edit Product" : "Add Product";
        default:
            return "Details";
    }
}

function renderModalBody(model: AnalyticsModel) {
    const { modal, products, state, editorDraft, updateEditorDraft, performExport } = model;
    if (!modal) return null;

    switch (modal.kind) {
        case "export":
            return (
                <div className="ui-export-options">
                    <button type="button" className="ui-export-option" onClick={() => performExport("csv")}>
                        <strong>CSV Data Export</strong>
                        <span>Download the current analytics dataset as a CSV file.</span>
                    </button>
                    <button type="button" className="ui-export-option" onClick={() => performExport("json")}>
                        <strong>JSON State Export</strong>
                        <span>Export current filters, page state and selected products.</span>
                    </button>
                    <button type="button" className="ui-export-option" onClick={() => performExport("print")}>
                        <strong>Print / PDF</strong>
                        <span>Open a print-ready version of the current dashboard.</span>
                    </button>
                </div>
            );
        case "stat": {
            const card = statCards[modal.statIndex ?? 0];
            if (!card) return null;
            return (
                <>
                    <div className="ui-detail-stats">
                        <div className="ui-detail-stat">
                            <span>Current</span>
                            <strong>{card.value}</strong>
                        </div>
                        <div className="ui-detail-stat">
                            <span>Period</span>
                            <strong>{state.dateRange}</strong>
                        </div>
                    </div>
                    <div className="ui-detail-section">
                        <h4>Trend</h4>
                        <div className="ui-detail-row">
                            <span>Compared with previous period</span>
                            <strong style={{ color: "var(--lime)" }}>↑ Positive</strong>
                        </div>
                        <div className="ui-detail-row">
                            <span>Reporting status</span>
                            <strong style={{ color: "var(--lime)" }}>Live</strong>
                        </div>
                    </div>
                </>
            );
        }
        case "brands":
            return (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Brand</th>
                            <th>Clicks</th>
                            <th>Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topBrands.map((row) => (
                            <tr key={row[0]}>
                                <td>{row[0]}</td>
                                <td>{row[1]}</td>
                                <td>{row[2]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        case "compare": {
            const selected = state.selectedProducts
                .map((asin) => products.find((p) => p.asin === asin))
                .filter(Boolean) as typeof products;
            return (
                <div className="ui-compare-grid">
                    {selected.map((p) => (
                        <div className="ui-compare-card" key={p.asin}>
                            <img src={p.image} alt="" />
                            <h4>{p.name}</h4>
                            <div className="ui-compare-row">
                                <span>Views</span>
                                <strong>{num(p.views)}</strong>
                            </div>
                            <div className="ui-compare-row">
                                <span>Clicks</span>
                                <strong>{num(p.clicks)}</strong>
                            </div>
                            <div className="ui-compare-row">
                                <span>CTR</span>
                                <strong>{pct(p.ctr)}</strong>
                            </div>
                            <div className="ui-compare-row">
                                <span>Conversion</span>
                                <strong>{pct(p.conversion)}</strong>
                            </div>
                            <div className="ui-compare-row">
                                <span>Revenue</span>
                                <strong>{money(p.revenue)}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        case "trafficCompare":
            return (
                <>
                    <div className="ui-field">
                        <label>Compare against</label>
                        <select id="trafficComparePeriod">
                            <option>Previous 7 days</option>
                            <option>Previous 30 days</option>
                            <option>Same period last year</option>
                        </select>
                    </div>
                    <div className="ui-detail-section">
                        <h4>Current period</h4>
                        <div className="ui-detail-row">
                            <span>Sessions</span>
                            <strong>156,231</strong>
                        </div>
                        <div className="ui-detail-row">
                            <span>Amazon Clicks</span>
                            <strong>25,842</strong>
                        </div>
                        <div className="ui-detail-row">
                            <span>Conversion Rate</span>
                            <strong>6.72%</strong>
                        </div>
                    </div>
                    <div className="ui-detail-section">
                        <h4>Comparison</h4>
                        <div className="ui-detail-row">
                            <span>Sessions</span>
                            <strong style={{ color: "var(--lime)" }}>+15.7%</strong>
                        </div>
                        <div className="ui-detail-row">
                            <span>Amazon Clicks</span>
                            <strong style={{ color: "var(--lime)" }}>+18.6%</strong>
                        </div>
                        <div className="ui-detail-row">
                            <span>Conversion Rate</span>
                            <strong style={{ color: "var(--lime)" }}>+0.8%</strong>
                        </div>
                    </div>
                </>
            );
        case "editor":
            return (
                <>
                    <div className="ui-field">
                        <label>Product Name</label>
                        <input id="editorName" value={editorDraft.name} onChange={(e) => updateEditorDraft({ name: e.target.value })} />
                    </div>
                    <div className="ui-field-row">
                        <div className="ui-field">
                            <label>ASIN</label>
                            <input id="editorAsin" value={editorDraft.asin} onChange={(e) => updateEditorDraft({ asin: e.target.value })} />
                        </div>
                        <div className="ui-field">
                            <label>Brand</label>
                            <select id="editorBrand" value={editorDraft.brand} onChange={(e) => updateEditorDraft({ brand: e.target.value })}>
                                {["Nike", "Adidas", "Puma", "Under Armour", "New Balance"].map((b) => (
                                    <option key={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="ui-field">
                        <label>Category</label>
                        <select id="editorCategory" value={editorDraft.category} onChange={(e) => updateEditorDraft({ category: e.target.value })}>
                            {["Football Boots", "Athletic Apparel", "Training Equipment", "Footwear", "Accessories"].map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ui-field">
                        <label>Amazon Product Image URL</label>
                        <input id="editorImage" value={editorDraft.image} onChange={(e) => updateEditorDraft({ image: e.target.value })} />
                    </div>
                </>
            );
        default:
            return null;
    }
}
