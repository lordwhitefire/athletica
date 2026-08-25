"use client";

import { useMemo } from "react";
import { useBrandManagementModel } from "./BrandManagementInteractionLayer";
import { BrandLogo } from "./brand-logos";
import { formatBrandDate } from "./brand-management.data";
import "./brand-management.css";
import type {
  Brand,
  BrandProductFilter,
  BrandSort,
  BrandStatusFilter,
} from "./brand-management.types";

const DONUT_COLORS = ["#b9ff00", "#3d9be8", "#5ca4d9", "#f4b22f", "#ff9d6c", "#9b7ae8"];

function sparkPoints(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  }

  const points: string[] = [];
  let y = 26 - (hash % 7);

  for (let i = 0; i < 16; i += 1) {
    hash = (hash * 31 + i * 17 + 7) % 9973;
    const drift = hash % 7 - 3;
    y = Math.min(30, Math.max(4, y + drift));
    const x = Math.round((i / 15) * 125);
    points.push(`${x},${y}`);
  }

  return points.join(" ");
}

function buildDonut(brands: Brand[]): {
  gradient: string;
  legend: { name: string; percent: string; products: number; color: string }[];
  total: number;
} {
  const sorted = [...brands].sort((a, b) => b.products - a.products);
  const top = sorted.slice(0, 5);
  const topProducts = top.reduce((sum, brand) => sum + brand.products, 0);

  const total = brands.reduce((sum, brand) => sum + brand.products, 0);
  if (!total) {
    return { gradient: `${DONUT_COLORS[5]} 0% 100%`, legend: [], total: 0 };
  }

  const shares = top.map((brand) => (brand.products / total) * 100);
  const others = 100 - shares.reduce((sum, share) => sum + share, 0);
  const allShares = [...shares, others];

  let cumulative = 0;
  const stops: string[] = [];
  const legend = allShares.map((share, index) => {
    const percent = Math.round(share * 10) / 10;
    const start = cumulative;
    cumulative += share;
    const end = Math.round(cumulative * 10) / 10;
    stops.push(`${DONUT_COLORS[index]} ${Math.round(start * 10) / 10}% ${end}%`);
    return {
      name: index < top.length ? top[index].name : "Others",
      percent: `${Math.round(share * 10) / 10}%`,
      products:
        index < top.length ? top[index].products : total - topProducts,
      color: DONUT_COLORS[index],
    };
  });

  stops[stops.length - 1] = `${DONUT_COLORS[5]} ${Math.round((100 - others) * 10) / 10}% 100%`;

  return { gradient: stops.join(", "), legend, total };
}

export function BrandManagementPresentation() {
  const { model, topExpanded, toggleTopExpanded, recentExpanded, toggleRecentExpanded } =
    useBrandManagementModel();

  const {
    state,
    metrics,
    visibleBrands,
    filteredBrands,
    safePage,
    totalPages,
    topPerformingBrands,
    recentlyAddedBrands,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    setProductFilter,
    setSort,
    resetFilters,
    openAddDialog,
    openEditDialog,
    openViewDialog,
    toggleRowActionMenu,
    toggleExportMenu,
    toggleFilterPanel,
    toggleSelection,
    selectAllVisible,
    loadBrands,
  } = model;

  const donut = useMemo(() => buildDonut(state.brands), [state.brands]);

  const startRow = filteredBrands.length === 0 ? 0 : (safePage - 1) * state.rowsPerPage + 1;
  const endRow = Math.min(safePage * state.rowsPerPage, filteredBrands.length);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let page = 1; page <= totalPages; page += 1) {
      if (
        page === 1 ||
        page === totalPages ||
        Math.abs(page - safePage) <= 1
      ) {
        pages.push(page);
      }
    }

    const compact: number[] = [];
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const previous = pages[index - 1];
      if (previous && page - previous > 1) compact.push(-1);
      compact.push(page);
    }

    return compact;
  }, [safePage, totalPages]);

  return (
    <main className="brand-page">
      <div className="content">
        <header className="topbar">
          <div className="title">
            <h1>Brand Management</h1>
            <p>Manage brands, logos, descriptions and track their performance.</p>
          </div>

          <div className="top-actions">
            <button className="btn" type="button" data-brand-export onClick={toggleExportMenu} aria-expanded={state.exportMenu.open}>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v11M8 10l4 4 4-4M5 18v2h14v-2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export
            </button>

            <button className="btn add" type="button" data-brand-add onClick={openAddDialog}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add Brand
            </button>
          </div>
        </header>

        <section className="stats">
          <div className="stat">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m12 3 7 4v10l-7 4-7-4V7zM5 7l7 4 7-4M12 11v10" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="stat-copy">
              <div className="stat-label">Total Brands</div>
              <div className="stat-value" data-brand-metric-total>
                {metrics.totalBrands.toLocaleString()}
              </div>
              <div className="stat-foot positive">+ 6 this month</div>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 9h14v11H5zM8 9V6a4 4 0 0 1 8 0v3" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="stat-copy">
              <div className="stat-label">Active Brands</div>
              <div className="stat-value" data-brand-metric-active>
                {metrics.activeBrands.toLocaleString()}
              </div>
              <div className="stat-foot">
                {((metrics.activeBrands / metrics.totalBrands) * 100).toFixed(1)}% of total
              </div>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m12 3 7 4v10l-7 4-7-4V7zM5 7l7 4 7-4M12 11v10" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="stat-copy">
              <div className="stat-label">Products</div>
              <div className="stat-value" data-brand-metric-products>
                {metrics.totalProducts.toLocaleString()}
              </div>
              <div className="stat-foot">Across all brands</div>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 18 9 12l4 3 7-9M15 6h5v5" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="stat-copy">
              <div className="stat-label">Amazon Clicks</div>
              <div className="stat-value" data-brand-metric-clicks>
                {metrics.totalClicks.toLocaleString()}
              </div>
              <div className="stat-foot positive">+18.6% vs last 7 days</div>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 17 9 12l3 3 8-9M15 6h5v5" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="stat-copy">
              <div className="stat-label">CTR</div>
              <div className="stat-value" data-brand-metric-ctr>
                {metrics.ctr.toFixed(2)}%
              </div>
              <div className="stat-foot positive">+ 1.2% vs last 7 days</div>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <section className="panel brands-panel">
            <div className="filters">
              <div className="section-heading">Brands</div>

              <div className="field">
                <label>&nbsp;</label>
                <svg className="search-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="10.5" cy="10.5" r="5.5" strokeWidth="1.7" />
                  <path d="m15 15 5 5" strokeWidth="1.7" />
                </svg>
                <input
                  className="input"
                  placeholder="Search brands..."
                  data-brand-search
                  value={state.filters.search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="field select-wrap">
                <label>Status</label>
                <select
                  className="select"
                  data-brand-status-filter
                  value={state.filters.status}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as BrandStatusFilter)
                  }
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="field select-wrap">
                <label>Products</label>
                <select
                  className="select"
                  data-brand-product-filter
                  value={state.filters.products}
                  onChange={(event) =>
                    setProductFilter(event.target.value as BrandProductFilter)
                  }
                >
                  <option value="all">All</option>
                  <option value="1000-plus">1,000+</option>
                  <option value="500-999">500–999</option>
                  <option value="under-500">Under 500</option>
                </select>
              </div>

              <div className="field select-wrap">
                <label>Sort by</label>
                <select
                  className="select"
                  data-brand-sort
                  value={state.filters.sort}
                  onChange={(event) => setSort(event.target.value as BrandSort)}
                >
                  <option value="most-products">Most Products</option>
                  <option value="least-products">Least Products</option>
                  <option value="most-clicks">Most Clicks</option>
                  <option value="least-clicks">Least Clicks</option>
                  <option value="highest-ctr">Highest CTR</option>
                  <option value="lowest-ctr">Lowest CTR</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                </select>
              </div>

              <button className="filter-btn" type="button" data-brand-filter onClick={toggleFilterPanel} aria-expanded={state.filterPanel.open}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                Filters
              </button>

              <button className="reset-btn" type="button" data-brand-reset onClick={resetFilters}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12a7 7 0 1 0 2-5M5 5v5h5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                Reset
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <colgroup>
                  <col style={{ width: "34px" }} />
                  <col style={{ width: "27%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "13%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        data-brand-select-all
                        checked={
                          visibleBrands.length > 0 &&
                          visibleBrands.every((brand) =>
                            state.selectedBrandIds.includes(brand.id),
                          )
                        }
                        onChange={selectAllVisible}
                        aria-label="Select all visible brands"
                      />
                    </th>
                    <th>Brand</th>
                    <th>Products</th>
                    <th>Amazon Clicks</th>
                    <th>CTR</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.loadError && (
                    <tr>
                      <td colSpan={8} data-testid="brands-load-error" role="alert">
                        <div className="mx-1 my-2 rounded-[6px] border border-[#5a2a1d] bg-[#241310] px-3 py-2">
                          <p className="text-[10px] text-[#e4612b]">{state.loadError}</p>
                          <button
                            type="button"
                            onClick={() => void loadBrands()}
                            className="mt-1.5 text-[10px] font-semibold text-[#b8e51f] underline hover:brightness-110"
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {visibleBrands.map((brand) => (
                    <tr key={brand.id}>
                      <td>
                        <input
                          type="checkbox"
                          data-brand-select={brand.id}
                          checked={state.selectedBrandIds.includes(brand.id)}
                          onChange={() => toggleSelection(brand.id)}
                          aria-label={`Select ${brand.name}`}
                        />
                      </td>
                      <td>
                        <div className="brand-cell">
                          <span className="drag">⋮⋮</span>
                          <div className="logo">
                            <BrandLogo brand={brand} />
                          </div>
                          <div className="brand-text">
                            <div className="brand-name">{brand.name}</div>
                            <div className="tagline">{brand.tagline}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num">{brand.products.toLocaleString()}</td>
                      <td className="num">{brand.amazonClicks.toLocaleString()}</td>
                      <td className="num">{brand.ctr.toFixed(2)}%</td>
                      <td>
                        <span className={`status ${brand.status === "inactive" ? "inactive" : ""}`}>
                          {brand.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="date">{formatBrandDate(brand.addedAt)}</td>
                      <td>
                        <div className="actions">
                          <button className="icon-btn" type="button" data-brand-edit={brand.id} onClick={() => openEditDialog(brand.id)} aria-label={`Edit ${brand.name}`}>
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="m15 5 4 4M5 19l1-4 9-9 4 4-9 9z" strokeWidth="1.5" />
                            </svg>
                          </button>
                          <button className="icon-btn" type="button" data-brand-view={brand.id} onClick={() => openViewDialog(brand.id)} aria-label={`View ${brand.name}`}>
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z" strokeWidth="1.5" />
                              <circle cx="12" cy="12" r="2.3" strokeWidth="1.5" />
                            </svg>
                          </button>
                          <button className="icon-btn more" type="button" data-brand-row-menu-toggle={brand.id} onClick={() => toggleRowActionMenu(brand.id)} aria-label={`Actions for ${brand.name}`} aria-expanded={state.rowActionMenu?.brandId === brand.id}>
                            <span className="material-symbols-outlined text-[15px] leading-none">more_horiz</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {visibleBrands.length === 0 && !state.loadError && (
                    <tr>
                      <td colSpan={8}>
                        <div className="brand-empty-state">
                          <strong>No brands found</strong>
                          <span>Try changing your search or filters.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="showing">
                Showing {startRow} to {endRow} of {filteredBrands.length} brands
              </div>

              <div className="pager">
                <div className="rows">
                  Rows per page
                  <select
                    className="rows-select"
                    data-brand-rows-per-page
                    value={state.rowsPerPage}
                    onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <button
                  className="page-btn"
                  type="button"
                  title="First"
                  disabled={safePage <= 1}
                  data-brand-page="1"
                  onClick={() => setPage(1)}
                >
                  «
                </button>

                <button
                  className="page-btn"
                  type="button"
                  title="Previous"
                  disabled={safePage <= 1}
                  data-brand-prev-page
                  onClick={() => setPage(safePage - 1)}
                >
                  ‹
                </button>

                {pageNumbers.map((page, index) =>
                  page === -1 ? (
                    <span key={`ellipsis-${index}`} style={{ color: "#777" }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      className={`page-btn ${page === safePage ? "active" : ""}`}
                      type="button"
                      data-brand-page={page}
                      onClick={() => setPage(page)}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  className="page-btn"
                  type="button"
                  title="Next"
                  disabled={safePage >= totalPages}
                  data-brand-next-page
                  onClick={() => setPage(safePage + 1)}
                >
                  ›
                </button>

                <button
                  className="page-btn"
                  type="button"
                  title="Last"
                  disabled={safePage >= totalPages}
                  data-brand-page={totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  »
                </button>
              </div>
            </div>
          </section>

          <aside className="right-col">
            <section className="panel right-panel">
              <div className="right-heading">
                <h2>Top Performing Brands</h2>
                <button
                  className="view-all"
                  type="button"
                  data-brand-top-performing-view-all
                  onClick={toggleTopExpanded}
                  aria-expanded={topExpanded}
                >
                  View all
                </button>
              </div>

              {topPerformingBrands.map((brand, index) => (
                <div className="performer" key={brand.id}>
                  <div className="rank">{index + 1}</div>
                  <div className="mini-logo">
                    <BrandLogo brand={brand} />
                  </div>
                  <div>
                    <div className="perf-name">{brand.name}</div>
                    <div className="perf-clicks">{brand.amazonClicks.toLocaleString()} clicks</div>
                  </div>
                  <div className="perf-ctr">{brand.ctr.toFixed(2)}% CTR</div>
                  <svg className="spark" viewBox="0 0 125 35" preserveAspectRatio="none">
                    <polyline points={sparkPoints(brand.id)} />
                  </svg>
                </div>
              ))}
            </section>

            <section className="panel right-panel distribution">
              <div className="right-heading">
                <h2>Brand Distribution</h2>
              </div>
              <div className="donut-row">
                <div className="donut" style={{ background: `conic-gradient(${donut.gradient})` }}>
                  <div className="donut-center">
                    <div className="donut-total">{donut.total.toLocaleString()}</div>
                    <div className="donut-label">Total Products</div>
                  </div>
                </div>
                <div className="legend">
                  {donut.legend.map((item) => (
                    <div className="legend-item" key={item.name}>
                      <span className="dot" style={{ background: item.color }} />
                      <span className="legend-name">{item.name}</span>
                      <span className="legend-value">
                        {item.percent} ({item.products.toLocaleString()})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel right-panel">
              <div className="right-heading">
                <h2>Recently Added Brands</h2>
                <button
                  className="view-all"
                  type="button"
                  data-brand-recent-view-all
                  onClick={toggleRecentExpanded}
                  aria-expanded={recentExpanded}
                >
                  View all
                </button>
              </div>
              <div className="recent-list">
                {recentlyAddedBrands.map((brand) => (
                  <div className="recent" key={brand.id}>
                    <div className="recent-logo">
                      <BrandLogo brand={brand} />
                    </div>
                    <div className="recent-copy">
                      <div className="recent-name">{brand.name}</div>
                      <div className="recent-date">Added on {formatBrandDate(brand.addedAt)}</div>
                    </div>
                    <span className={`status ${brand.status === "inactive" ? "inactive" : ""}`}>
                      {brand.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
