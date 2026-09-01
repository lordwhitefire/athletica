"use client";

import {
    PRODUCT_BRANDS,
    PRODUCT_CATEGORIES,
    PRODUCT_PERIODS,
    TRAFFIC_CHANNELS,
    TRAFFIC_DEVICES,
    TRAFFIC_PERIODS,
    searchData,
    statCards,
    topBrands,
    trafficData,
} from "./analytics.data";
import { useAnalyticsModel } from "./AnalyticsInteractionLayer";
import { money, num, pct, type AnalyticsModel } from "./use-analytics";
import "./analytics.css";

const CHANNEL_DOT: Record<string, string> = {
    "Organic Search": "org",
    Direct: "direct",
    "Social Media": "social",
    Referral: "ref",
    Email: "email",
};

const searchTableHead = ["Search Term", "Searches", "Clicks", "CTR", "Top Category"];

export function AnalyticsPresentation({ page }: { page: "overview" | "products" | "traffic" }) {
    const { model } = useAnalyticsModel();
    const { state } = model;

    return (
        <div className="analytics-page">
            <header className="topbar">
                <div className="heading">
                    <h1>{PAGE_TITLES[page]}</h1>
                    <p>{PAGE_DESCRIPTIONS[page]}</p>
                </div>
                <div className="toolbar">
                    <button type="button" className="date-picker" onClick={model.openDatePicker}>
                        <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                        <span>{state.dateRange}</span>
                        <b className="material-symbols-outlined text-[11px]">expand_more</b>
                    </button>
                    <button type="button" className="export" onClick={model.openExportModal}>
                        <span className="material-symbols-outlined text-[13px]">download</span>
                        Export Report
                    </button>
                </div>
            </header>

            <section className="content">
                {page === "overview" && <OverviewShell model={model} />}
                {page === "products" && <ProductsShell model={model} />}
                {page === "traffic" && <TrafficShell model={model} />}
            </section>
        </div>
    );
}

const PAGE_TITLES: Record<string, string> = {
    overview: "Analytics Overview",
    products: "Product Analytics",
    traffic: "Traffic Analytics",
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
    overview: "Track your Amazon affiliate performance and website analytics.",
    products: "Track product views, Amazon clicks, conversion and estimated affiliate revenue.",
    traffic: "Understand where visitors come from and how each channel contributes to engagement.",
};

/* ================= OVERVIEW ================= */

function OverviewShell({ model }: { model: AnalyticsModel }) {
    const { state, overviewRows, openStatModal, openBrandsModal, setPage, setTrafficTab, sortProducts, openProductDrawer } = model;
    const sortKey = state.productSort.key;
    const sortDir = state.productSort.dir;

    return (
        <div className="page-shell active" id="page-overview">
            <div className="stat-grid">
                {statCards.map((card, i) => (
                    <div key={card.label} className="card stat interactive-clickable" onClick={() => openStatModal(i)}>
                        <div className="stat-label">
                            <span className="mini-icon" />
                            {card.label}
                        </div>
                        <div className="stat-value">{card.value}</div>
                        <div className="stat-change">{card.change}</div>
                        <div className="spark">
                            <svg viewBox="0 0 80 42">
                                <polyline points={card.spark} fill="none" stroke={card.blue ? "#4ca6ff" : "#b8ff00"} strokeWidth="1.5" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            <div className="overview-top">
                <div className="card chart-card">
                    <div className="card-head">
                        <div className="card-title">Amazon Clicks Over Time</div>
                        <select className="select" defaultValue="Daily">
                            <option>Daily</option>
                        </select>
                    </div>
                    <div className="legend">
                        <span>
                            <i className="dot" />
                            This Week
                        </span>
                        <span>
                            <i className="dot blue" />
                            Last Week
                        </span>
                    </div>
                    <div className="line-chart">
                        <svg viewBox="0 0 650 180" preserveAspectRatio="none">
                            <line className="gridline" x1="40" y1="20" x2="635" y2="20" />
                            <line className="gridline" x1="40" y1="55" x2="635" y2="55" />
                            <line className="gridline" x1="40" y1="90" x2="635" y2="90" />
                            <line className="gridline" x1="40" y1="125" x2="635" y2="125" />
                            <line className="gridline" x1="40" y1="160" x2="635" y2="160" />
                            <text className="axis-label" x="4" y="23">8K</text>
                            <text className="axis-label" x="4" y="58">6K</text>
                            <text className="axis-label" x="4" y="93">4K</text>
                            <text className="axis-label" x="4" y="128">2K</text>
                            <text className="axis-label" x="16" y="163">0</text>
                            <polyline className="line-prev" points="40,138 135,118 183,121 231,105 279,104 350,82 397,108 445,116 493,119 541,109 588,105" />
                            <polyline className="line-main" points="40,116 135,88 183,91 231,77 279,72 350,40 397,77 445,88 493,93 541,77 588,78" />
                            <g className="point-prev">
                                <circle cx="40" cy="138" r="2.5" />
                                <circle cx="135" cy="118" r="2.5" />
                                <circle cx="183" cy="121" r="2.5" />
                                <circle cx="231" cy="105" r="2.5" />
                                <circle cx="279" cy="104" r="2.5" />
                                <circle cx="350" cy="82" r="2.5" />
                                <circle cx="397" cy="108" r="2.5" />
                                <circle cx="445" cy="116" r="2.5" />
                                <circle cx="493" cy="119" r="2.5" />
                                <circle cx="541" cy="109" r="2.5" />
                                <circle cx="588" cy="105" r="2.5" />
                            </g>
                            <g className="point-main">
                                <circle cx="40" cy="116" r="2.5" />
                                <circle cx="135" cy="88" r="2.5" />
                                <circle cx="183" cy="91" r="2.5" />
                                <circle cx="231" cy="77" r="2.5" />
                                <circle cx="279" cy="72" r="2.5" />
                                <circle cx="350" cy="40" r="2.5" />
                                <circle cx="397" cy="77" r="2.5" />
                                <circle cx="445" cy="88" r="2.5" />
                                <circle cx="493" cy="93" r="2.5" />
                                <circle cx="541" cy="77" r="2.5" />
                                <circle cx="588" cy="78" r="2.5" />
                            </g>
                            <text className="axis-label" x="37" y="176">May 13</text>
                            <text className="axis-label" x="128" y="176">May 14</text>
                            <text className="axis-label" x="225" y="176">May 15</text>
                            <text className="axis-label" x="340" y="176">May 16</text>
                            <text className="axis-label" x="435" y="176">May 17</text>
                            <text className="axis-label" x="530" y="176">May 18</text>
                            <text className="axis-label" x="577" y="176">May 19</text>
                        </svg>
                    </div>
                </div>

                <div className="card donut-card">
                    <div className="card-head">
                        <div className="card-title">Clicks by Category</div>
                    </div>
                    <div className="donut-layout">
                        <div className="donut">
                            <div className="donut-center">
                                <strong>25,842</strong>
                                <span>Total Clicks</span>
                            </div>
                        </div>
                        <div className="legend-list">
                            <div className="legend-row">
                                <i className="swatch" style={{ background: "#b8ff00" }} />
                                <span className="name">Football Boots</span>
                                <span className="num">42.6% (10,998)</span>
                            </div>
                            <div className="legend-row">
                                <i className="swatch" style={{ background: "#2775d0" }} />
                                <span className="name">Athletic Apparel</span>
                                <span className="num">21.3% (5,501)</span>
                            </div>
                            <div className="legend-row">
                                <i className="swatch" style={{ background: "#9bd9a6" }} />
                                <span className="name">Training Equipment</span>
                                <span className="num">15.7% (4,055)</span>
                            </div>
                            <div className="legend-row">
                                <i className="swatch" style={{ background: "#f2c20d" }} />
                                <span className="name">Footwear</span>
                                <span className="num">11.8% (3,049)</span>
                            </div>
                            <div className="legend-row">
                                <i className="swatch" style={{ background: "#92914e" }} />
                                <span className="name">Accessories</span>
                                <span className="num">8.6% (2,248)</span>
                            </div>
                        </div>
                    </div>
                    <div className="card-action interactive-clickable" onClick={() => setPage("products")}>
                        View all categories →
                    </div>
                </div>

                <div className="card table-card top-brands">
                    <div className="card-head">
                        <div className="card-title">Top Brands</div>
                        <span className="card-action interactive-clickable" onClick={openBrandsModal}>
                            View all
                        </span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th>Clicks</th>
                                <th>% of Total</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {topBrands.map((row, i) => (
                                <tr key={row[0]}>
                                    <td className="brand-cell">{row[0]}</td>
                                    <td>{row[1]}</td>
                                    <td>{row[2]}</td>
                                    <td className="bar-cell">
                                        <span className="tiny-bar" style={{ width: `${52 - i * 8}px` }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="overview-bottom">
                <div className="card table-card">
                    <div className="card-head">
                        <div className="card-title">Traffic Sources</div>
                    </div>
                    <div className="traffic-layout">
                        <div className="traffic-donut">
                            <div className="donut-center">
                                <strong>156,231</strong>
                                <span>Total Sessions</span>
                            </div>
                        </div>
                        <div className="legend-list">
                            {trafficData.map((t) => (
                                <div className="legend-row" key={t.source}>
                                    <i className="swatch" style={{ background: swatchColor(t.source) }} />
                                    <span className="name">{t.source}</span>
                                    <span className="num">
                                        {t.share}% ({num(t.sessions)})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card-action interactive-clickable" onClick={() => setPage("traffic")}>
                        View full report →
                    </div>
                </div>

                <div className="card table-card">
                    <div className="card-head">
                        <div className="card-title">Popular Searches</div>
                    </div>
                    <table className="data-table search-table">
                        <thead>
                            <tr>
                                <th>Search Term</th>
                                <th>Searches</th>
                                <th>Clicks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchData.slice(0, 5).map((row) => (
                                <tr key={row[0]}>
                                    <td>{row[0]}</td>
                                    <td>{num(row[1])}</td>
                                    <td>{num(row[2])}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div
                        className="card-action interactive-clickable"
                        onClick={() => {
                            setPage("traffic");
                            setTrafficTab("searches");
                        }}
                    >
                        View all searches →
                    </div>
                </div>

                <div className="card table-card">
                    <div className="card-head">
                        <div className="card-title">Top Categories by Views</div>
                    </div>
                    <table className="data-table categories-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Views</th>
                                <th>Clicks</th>
                                <th>CTR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ["Football Boots", "58,231", "10,988", "18.9%"],
                                ["Athletic Apparel", "34,982", "5,501", "15.7%"],
                                ["Training Equipment", "22,451", "4,055", "18.1%"],
                                ["Footwear", "18,765", "3,049", "16.2%"],
                                ["Accessories", "13,802", "2,248", "16.3%"],
                            ].map((row) => (
                                <tr key={row[0]}>
                                    <td>{row[0]}</td>
                                    <td>{row[1]}</td>
                                    <td>{row[2]}</td>
                                    <td>{row[3]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="card-action interactive-clickable" onClick={() => setPage("products")}>
                        View all categories →
                    </div>
                </div>
            </div>

            <div className="card product-card">
                <div className="product-head">
                    <div className="title">Product Performance</div>
                    <div className="tools">
                        <span className="card-action interactive-clickable" onClick={() => setPage("products")}>
                            View full report
                        </span>
                        <select className="select" defaultValue="Last 7 days">
                            <option>Last 7 days</option>
                        </select>
                    </div>
                </div>
                <div style={{ overflow: "auto" }}>
                    <table className="data-table product-table">
                        <thead>
                            <tr>
                                {["Product", "Views", "Unique Views", "Add to Cart", "Amazon Clicks", "CTR", "Conversion Rate", "Revenue (Est.)"].map((label, i) => (
                                    <th
                                        key={label}
                                        className={i === 0 ? "" : "ui-sortable"}
                                        onClick={i === 0 ? undefined : () => sortProducts(SORT_KEYS[i])}
                                    >
                                        {label}
                                        {i > 0 && sortKey === SORT_KEYS[i] && (
                                            <span className="ui-sort-indicator">{sortDir === "asc" ? "↑" : "↓"}</span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {overviewRows.map((p) => (
                                <tr key={p.asin} className="interactive-clickable" onClick={() => openProductDrawer(p.asin)}>
                                    <td>
                                        <div className="product-name">
                                            <img className="product-thumb" src={p.image} alt="" />
                                            <span>
                                                <strong>{p.name}</strong>
                                                <small>ASIN: {p.asin}</small>
                                            </span>
                                        </div>
                                    </td>
                                    <td>{num(p.views)}</td>
                                    <td>{num(p.unique)}</td>
                                    <td>{num(p.cart)}</td>
                                    <td>{num(p.clicks)}</td>
                                    <td>{pct(p.ctr)}</td>
                                    <td>{pct(p.conversion)}</td>
                                    <td>{money(p.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="product-footer interactive-clickable" onClick={() => setPage("products")}>
                    View all products →
                </div>
            </div>
        </div>
    );
}

const SORT_KEYS = ["name", "views", "unique", "cart", "clicks", "ctr", "conversion", "revenue"];

const swatchColor = (source: string) =>
    source === "Organic Search" ? "#b8ff00" : source === "Direct" ? "#2b76ce" : source === "Social Media" ? "#5d99dd" : source === "Referral" ? "#f0c400" : "#d5b000";

/* ================= PRODUCTS ================= */

function ProductsShell({ model }: { model: AnalyticsModel }) {
    const {
        state,
        pageProducts,
        productChips,
        openProductDrawer,
        setProductFilter,
        clearProductFilter,
        openEditor,
        toggleCompare,
        performExport,
    } = model;

    return (
        <div className="page-shell active" id="page-products">
            <div className="page-header">
                <div>
                    <h2>Product Analytics</h2>
                    <p>Track product views, Amazon clicks, conversion and estimated affiliate revenue.</p>
                </div>
                <div className="page-actions">
                    <button type="button" className="btn" onClick={() => performExport("csv")}>
                        Export CSV
                    </button>
                    <button type="button" className="btn primary" onClick={() => openEditor(null)}>
                        Add Product
                    </button>
                </div>
            </div>

            <div className="filter-row">
                <input
                    className="searchbox"
                    placeholder="Search products..."
                    value={state.productSearch}
                    onChange={(e) => setProductFilter("productSearch", e.target.value)}
                />
                <select className="filter" value={state.productCategory} onChange={(e) => setProductFilter("productCategory", e.target.value)}>
                    {["All Categories", ...PRODUCT_CATEGORIES].map((c) => (
                        <option key={c}>{c}</option>
                    ))}
                </select>
                <select className="filter" value={state.productBrand} onChange={(e) => setProductFilter("productBrand", e.target.value)}>
                    {["All Brands", ...PRODUCT_BRANDS].map((b) => (
                        <option key={b}>{b}</option>
                    ))}
                </select>
                <select className="filter" value={state.productPeriod} onChange={(e) => setProductFilter("productPeriod", e.target.value)}>
                    {PRODUCT_PERIODS.map((p) => (
                        <option key={p}>{p}</option>
                    ))}
                </select>
            </div>

            {productChips.length > 0 && (
                <div className="ui-filter-summary">
                    {productChips.map((chip) => (
                        <span className="ui-filter-chip" key={chip.key}>
                            {chip.label}: {chip.value}
                            <button type="button" onClick={() => clearProductFilter(chip.key)}>
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="page-grid">
                <div className="card kpi">
                    <div className="kpi-label">Product Views</div>
                    <div className="kpi-value">156,231</div>
                    <div className="kpi-note">↑ 15.7% vs last 7 days</div>
                </div>
                <div className="card kpi">
                    <div className="kpi-label">Unique Product Views</div>
                    <div className="kpi-value">112,894</div>
                    <div className="kpi-note">↑ 11.3% vs last 7 days</div>
                </div>
                <div className="card kpi">
                    <div className="kpi-label">Amazon Clicks</div>
                    <div className="kpi-value">25,842</div>
                    <div className="kpi-note">↑ 18.6% vs last 7 days</div>
                </div>
                <div className="card kpi">
                    <div className="kpi-label">Estimated Revenue</div>
                    <div className="kpi-value">$8,742.18</div>
                    <div className="kpi-note">↑ 20.1% vs last 7 days</div>
                </div>
            </div>

            <div className="card big-panel">
                <div className="card-head">
                    <div>
                        <div className="panel-title">Product Performance Trend</div>
                        <div className="panel-sub">Views and Amazon clicks over the selected period</div>
                    </div>
                    <select className="select" defaultValue="Daily">
                        <option>Daily</option>
                    </select>
                </div>
                <div className="panel-chart">
                    <svg viewBox="0 0 1000 245" preserveAspectRatio="none">
                        <line className="gridline" x1="40" y1="20" x2="980" y2="20" />
                        <line className="gridline" x1="40" y1="70" x2="980" y2="70" />
                        <line className="gridline" x1="40" y1="120" x2="980" y2="120" />
                        <line className="gridline" x1="40" y1="170" x2="980" y2="170" />
                        <line className="gridline" x1="40" y1="220" x2="980" y2="220" />
                        <polyline points="40,150 180,124 320,138 460,84 600,102 740,59 880,72 980,44" fill="none" stroke="#b8ff00" strokeWidth="2.5" />
                        <polyline points="40,195 180,184 320,187 460,160 600,169 740,138 880,145 980,122" fill="none" stroke="#4199ee" strokeWidth="2" />
                        <text className="axis-label" x="40" y="240">May 13</text>
                        <text className="axis-label" x="180" y="240">May 14</text>
                        <text className="axis-label" x="320" y="240">May 15</text>
                        <text className="axis-label" x="460" y="240">May 16</text>
                        <text className="axis-label" x="600" y="240">May 17</text>
                        <text className="axis-label" x="740" y="240">May 18</text>
                        <text className="axis-label" x="880" y="240">May 19</text>
                    </svg>
                </div>
            </div>

            <div className="product-grid">
                {pageProducts.length === 0 ? (
                    <div className="ui-empty-state" style={{ gridColumn: "1/-1" }}>
                        <strong>No products found</strong>
                        Try changing the search or filters.
                    </div>
                ) : (
                    pageProducts.map((p) => (
                        <article key={p.asin} className="card product-tile interactive-clickable" data-product={p.asin} onClick={() => openProductDrawer(p.asin)}>
                            <div className="product-select-cell">
                                <input
                                    className="ui-checkbox"
                                    type="checkbox"
                                    checked={state.selectedProducts.includes(p.asin)}
                                    aria-label={`Select ${p.name} for comparison`}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => toggleCompare(p.asin, e.target.checked)}
                                />
                            </div>
                            <div className="image-wrap">
                                <img src={p.image} alt={p.name} />
                            </div>
                            <h3>{p.name}</h3>
                            <div className="asin">ASIN: {p.asin}</div>
                            <div className="product-meta">
                                <div>
                                    <span>Views</span>
                                    <strong>{num(p.views)}</strong>
                                </div>
                                <div>
                                    <span>Amazon Clicks</span>
                                    <strong>{num(p.clicks)}</strong>
                                </div>
                                <div>
                                    <span>CTR</span>
                                    <strong>{pct(p.ctr)}</strong>
                                </div>
                                <div>
                                    <span>Conversion</span>
                                    <strong>{pct(p.conversion)}</strong>
                                </div>
                            </div>
                            <div className="tile-footer">
                                <span>{num(p.cart)} add to cart</span>
                                <span className="revenue">{money(p.revenue)}</span>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}

/* ================= TRAFFIC ================= */

function TrafficShell({ model }: { model: AnalyticsModel }) {
    const { state, filteredTraffic, filteredSearches, setTrafficFilter, setTrafficTab, setState, performExport, openTrafficCompare } = model;

    return (
        <div className="page-shell active" id="page-traffic">
            <div className="page-header">
                <div>
                    <h2>Traffic Analytics</h2>
                    <p>Understand where visitors come from and how each channel contributes to engagement.</p>
                </div>
                <div className="page-actions">
                    <button type="button" className="btn" onClick={() => performExport("csv")}>
                        Export Report
                    </button>
                    <button type="button" className="btn primary" onClick={openTrafficCompare}>
                        Compare
                    </button>
                </div>
            </div>

            <div className="filter-row">
                <select className="filter" value={state.trafficPeriod} onChange={(e) => setTrafficFilter("trafficPeriod", e.target.value)}>
                    {TRAFFIC_PERIODS.map((p) => (
                        <option key={p}>{p}</option>
                    ))}
                </select>
                <select className="filter" value={state.trafficChannel} onChange={(e) => setTrafficFilter("trafficChannel", e.target.value)}>
                    {TRAFFIC_CHANNELS.map((c) => (
                        <option key={c}>{c}</option>
                    ))}
                </select>
                <select className="filter" value={state.trafficDevice} onChange={(e) => setTrafficFilter("trafficDevice", e.target.value)}>
                    {TRAFFIC_DEVICES.map((d) => (
                        <option key={d}>{d}</option>
                    ))}
                </select>
            </div>

            <div className="analytics-subtabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={state.trafficTab === "traffic"}
                    className={state.trafficTab === "traffic" ? "active" : ""}
                    onClick={() => setTrafficTab("traffic")}
                >
                    Traffic
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={state.trafficTab === "searches"}
                    className={state.trafficTab === "searches" ? "active" : ""}
                    onClick={() => setTrafficTab("searches")}
                >
                    Search Terms
                </button>
            </div>

            {state.trafficTab === "traffic" ? (
                <>
                    <div className="page-grid">
                        <div className="card kpi">
                            <div className="kpi-label">Total Sessions</div>
                            <div className="kpi-value">156,231</div>
                            <div className="kpi-note">↑ 15.7% vs last 7 days</div>
                        </div>
                        <div className="card kpi">
                            <div className="kpi-label">New Visitors</div>
                            <div className="kpi-value">104,982</div>
                            <div className="kpi-note">↑ 9.8% vs last 7 days</div>
                        </div>
                        <div className="card kpi">
                            <div className="kpi-label">Pages / Session</div>
                            <div className="kpi-value">3.84</div>
                            <div className="kpi-note">↑ 4.2% vs last 7 days</div>
                        </div>
                        <div className="card kpi">
                            <div className="kpi-label">Bounce Rate</div>
                            <div className="kpi-value">31.6%</div>
                            <div className="kpi-note">↓ 2.1% vs last 7 days</div>
                        </div>
                    </div>

                    <div className="traffic-summary">
                        <div className="card big-panel">
                            <div className="card-head">
                                <div>
                                    <div className="panel-title">Sessions Over Time</div>
                                    <div className="panel-sub">Traffic volume by day</div>
                                </div>
                                <select className="select" defaultValue="Daily">
                                    <option>Daily</option>
                                </select>
                            </div>
                            <div className="panel-chart">
                                <svg viewBox="0 0 800 245" preserveAspectRatio="none">
                                    <line className="gridline" x1="40" y1="20" x2="780" y2="20" />
                                    <line className="gridline" x1="40" y1="70" x2="780" y2="70" />
                                    <line className="gridline" x1="40" y1="120" x2="780" y2="120" />
                                    <line className="gridline" x1="40" y1="170" x2="780" y2="170" />
                                    <line className="gridline" x1="40" y1="220" x2="780" y2="220" />
                                    <polyline points="40,158 145,126 250,139 355,82 460,103 565,52 670,69 780,41" fill="none" stroke="#b8ff00" strokeWidth="2.5" />
                                    <polyline points="40,192 145,176 250,184 355,155 460,168 565,132 670,143 780,118" fill="none" stroke="#4199ee" strokeWidth="2" />
                                    <text className="axis-label" x="40" y="240">May 13</text>
                                    <text className="axis-label" x="145" y="240">May 14</text>
                                    <text className="axis-label" x="250" y="240">May 15</text>
                                    <text className="axis-label" x="355" y="240">May 16</text>
                                    <text className="axis-label" x="460" y="240">May 17</text>
                                    <text className="axis-label" x="565" y="240">May 18</text>
                                    <text className="axis-label" x="670" y="240">May 19</text>
                                </svg>
                            </div>
                        </div>
                        <div className="card source-panel">
                            <div className="panel-title">Traffic Sources</div>
                            <div className="panel-sub">{state.trafficDevice === "All Devices" ? "Share of total sessions" : `Share of sessions from ${state.trafficDevice.toLowerCase()} devices`}</div>
                            <div className="traffic-donut-large">
                                <div className="traffic-donut">
                                    <div className="donut-center">
                                        <strong>156,231</strong>
                                        <span>Total Sessions</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card source-panel" style={{ marginBottom: "14px" }}>
                        <div className="panel-title">Channel Distribution</div>
                        <div className="panel-sub">Performance by acquisition source</div>
                        <div className="source-rows">
                            {trafficData.map((t) => (
                                <div className="source-row" key={t.source}>
                                    <span>{t.source}</span>
                                    <div className="track">
                                        <div className="fill" style={{ width: `${t.share}%` }} />
                                    </div>
                                    <span className="pct">{t.share}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card source-panel">
                        <div className="panel-title">Traffic Source Details</div>
                        <div className="panel-sub">Sessions, engagement and conversion by channel</div>
                        <div className="traffic-table-wrap">
                            <table className="data-table traffic-table">
                                <thead>
                                    <tr>
                                        <th>Source</th>
                                        <th>Sessions</th>
                                        <th>Share</th>
                                        <th>Pages / Session</th>
                                        <th>Bounce Rate</th>
                                        <th>Amazon Clicks</th>
                                        <th>Conversion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTraffic.length === 0 ? (
                                        <tr>
                                            <td colSpan={7}>
                                                <div className="ui-empty-state">
                                                    <strong>No traffic source matches</strong>
                                                    Change the channel filter.
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTraffic.map((t) => (
                                            <tr key={t.source}>
                                                <td>
                                                    <i className={`channel-dot ${CHANNEL_DOT[t.source] ?? "org"}`} />
                                                    {t.source}
                                                </td>
                                                <td>{num(t.sessions)}</td>
                                                <td>{pct(t.share)}</td>
                                                <td>{t.pages.toFixed(2)}</td>
                                                <td>{pct(t.bounce)}</td>
                                                <td>{num(t.clicks)}</td>
                                                <td>{pct(t.conversion)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="pagination">
                            <span>Showing 1–{filteredTraffic.length} of {trafficData.length} sources</span>
                            <div className="pages">
                                <button type="button" className="active">
                                    1
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="card source-panel">
                    <div className="panel-title">Search Analytics</div>
                    <div className="panel-sub">Monitor the terms visitors use to discover products and content.</div>
                    <div className="filter-row" style={{ marginTop: "12px" }}>
                        <input
                            className="searchbox"
                            placeholder="Search terms..."
                            value={state.searchTerm}
                            onChange={(e) => setState({ searchTerm: e.target.value })}
                        />
                        <select className="filter" defaultValue="Last 7 days">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                        </select>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                {searchTableHead.map((h) => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSearches.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="ui-empty-state">
                                            <strong>No searches found</strong>
                                            Try another search term.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSearches.map((row) => (
                                    <tr key={row[0]}>
                                        <td>{row[0]}</td>
                                        <td>{num(row[1])}</td>
                                        <td>{num(row[2])}</td>
                                        <td>{((row[2] / row[1]) * 100).toFixed(1)}%</td>
                                        <td>{row[3]}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
