"use client";

import {
  FOLDER_OPTIONS,
  SORT_OPTIONS,
  STATS,
  STORAGE_TOTAL_GB,
  STORAGE_USED_GB,
  TYPE_OPTIONS,
  USAGE_OPTIONS,
  USED_PRODUCT_NAMES,
} from "./media-library.data";
import { useMediaLibraryModel } from "./MediaLibraryInteractionLayer";
import type { MediaLibraryModel } from "./use-media-library";
import "./media-library.css";

export function MediaLibraryPresentation() {
  const { model } = useMediaLibraryModel();
  const {
    state,
    filtered,
    totalPages,
    page,
    start,
    pageItems,
    drawerAsset,
    setQuery,
    openSelect,
    openPerPageSelect,
    setView,
    openFilters,
    openDetails,
    handleCardAction,
    openContext,
    openUpload,
    selectAllFiltered,
    bulkFavorite,
    clearSelection,
    requestBulkDelete,
    goToPage,
    slugifyProduct,
  } = model;

  const usagePct = (STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100;
  const hasActiveFilters =
    Object.values(state.filters).some(Boolean) ||
    state.sizeFilter !== "0" ||
    state.dateFilter !== "all";

  return (
    <div className="media-page">
      <header className="topbar">
        <div className="title">
          <h1>Media Library</h1>
          <p>Manage your media assets. Upload, organize and optimize images.</p>
        </div>
        <div className="top-actions">
          <div className="storage">
            <div className="storage-head">
              <span>Storage Used</span>
              <strong>
                {STORAGE_USED_GB} GB <em>/ {STORAGE_TOTAL_GB} GB</em>
              </strong>
            </div>
            <div className="storage-bar">
              <i style={{ width: `${usagePct}%` }} />
            </div>
          </div>
          <button type="button" className="upload" onClick={openUpload}>
            <span className="material-symbols-outlined text-[15px]">upload</span>
            Upload Images
          </button>
        </div>
      </header>

      <section className="toolbar">
        <label className="control search">
          <span className="material-symbols-outlined text-[16px]">search</span>
          <input
            placeholder="Search images..."
            defaultValue=""
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div
          className="control select"
          onClick={(e) => openSelect(e.currentTarget, "type", TYPE_OPTIONS)}
        >
          {state.type}
          <span className="material-symbols-outlined text-[13px]">expand_more</span>
        </div>

        <div
          className="control select"
          onClick={(e) => openSelect(e.currentTarget, "usage", USAGE_OPTIONS)}
        >
          {state.usage}
          <span className="material-symbols-outlined text-[13px]">expand_more</span>
        </div>

        <div
          className="control select"
          onClick={(e) => openSelect(e.currentTarget, "folder", FOLDER_OPTIONS)}
        >
          {state.folder}
          <span className="material-symbols-outlined text-[13px]">expand_more</span>
        </div>

        <div
          className={`control filter${hasActiveFilters ? " ml-has-filter" : ""}`}
          onClick={openFilters}
        >
          <span className="material-symbols-outlined text-[14px]">filter_alt</span>
          Filters
        </div>

        <div className="view-sort">
          <span className="view-label">View</span>
          <button
            type="button"
            className={`view-btn${state.view === "grid" ? " active" : ""}`}
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <span className="material-symbols-outlined text-[15px]">grid_view</span>
          </button>
          <button
            type="button"
            className={`view-btn${state.view === "list" ? " active" : ""}`}
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <span className="material-symbols-outlined text-[15px]">view_list</span>
          </button>
          <span className="sort-label">Sort</span>
          <div
            className="control sort"
            onClick={(e) => openSelect(e.currentTarget, "sort", SORT_OPTIONS)}
          >
            {state.sort}
            <span className="material-symbols-outlined text-[13px]">expand_more</span>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <div className="stat-icon">
            <span className="material-symbols-outlined text-[17px]">image</span>
          </div>
          <div>
            <div className="stat-label">Total Images</div>
            <div className="stat-value">{STATS.total}</div>
            <div className="stat-sub">All media assets</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <span className="material-symbols-outlined text-[17px]">check_circle</span>
          </div>
          <div>
            <div className="stat-label">Used Images</div>
            <div className="stat-value">{STATS.used}</div>
            <div className="stat-sub">{STATS.usedPct} of total</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <span className="material-symbols-outlined text-[17px]">schedule</span>
          </div>
          <div>
            <div className="stat-label">Unused Images</div>
            <div className="stat-value">{STATS.unused}</div>
            <div className="stat-sub">{STATS.unusedPct} of total</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <span className="material-symbols-outlined text-[17px]">storage</span>
          </div>
          <div>
            <div className="stat-label">Total Size</div>
            <div className="stat-value">{STATS.totalSize}</div>
            <div className="stat-sub">of {STORAGE_TOTAL_GB} GB used</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <span className="material-symbols-outlined text-[17px]">add_circle</span>
          </div>
          <div>
            <div className="stat-label">Recently Added</div>
            <div className="stat-value">{STATS.recent}</div>
            <div className="stat-sub">in last 7 days</div>
          </div>
        </div>
      </section>

      <section className="content-layout">
        <div>
          <div className={`ml-bulk-bar${state.selected.size ? " open" : ""}`} id="mlBulkBar">
            <span className="ml-bulk-count" id="mlBulkCount">
              {state.selected.size} selected
            </span>
            <button type="button" data-bulk="select-all" onClick={selectAllFiltered}>
              Select all
            </button>
            <button type="button" data-bulk="favorite" onClick={bulkFavorite}>
              Favorite
            </button>
            <button type="button" data-bulk="clear" onClick={clearSelection}>
              Clear
            </button>
            <button type="button" className="danger" data-bulk="delete" onClick={requestBulkDelete}>
              Delete
            </button>
          </div>

          <div
            className={`media-grid${state.view === "list" ? " ml-list-view" : ""}`}
            id="mediaGrid"
          >
            {pageItems.map(({ asset, index }) => {
              const selected = state.selected.has(index);
              const starred = state.starred.has(asset.id);
              return (
                <article
                  key={asset.id}
                  className={`card${index === state.activeIndex ? " selected" : ""}`}
                  data-index={index}
                  onClick={() => openDetails(index)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openContext(index, e.clientX, e.clientY);
                  }}
                >
                  <div
                    className="thumb"
                    data-action="preview"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardAction("preview", index, e.currentTarget);
                    }}
                  >
                    <img src={asset.url} alt={asset.filename} loading="lazy" />
                    <button
                      type="button"
                      className={`check${selected ? " checked" : ""}`}
                      data-action="select"
                      aria-label={`Select ${asset.filename}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardAction("select", index, e.currentTarget);
                      }}
                    />
                    <button
                      type="button"
                      className="star"
                      data-action="star"
                      aria-label={`Favorite ${asset.filename}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardAction("star", index, e.currentTarget);
                      }}
                    >
                      <span
                        className={`material-symbols-outlined text-[15px]${starred ? " filled" : ""}`}
                        style={{ color: starred ? "#b7ff00" : undefined }}
                      >
                        {starred ? "star" : "star_border"}
                      </span>
                    </button>
                    <span className="meta-pill">
                      {asset.type}  {asset.dims}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="filename">{asset.filename}</div>
                    <div className="usage">
                      <span className={`dot${asset.used ? "" : " red"}`} />
                      {asset.usageText}
                    </div>
                    <button
                      type="button"
                      className="more"
                      data-action="menu"
                      aria-label="More actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardAction("menu", index, e.currentTarget);
                      }}
                    >
                      <span />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="pagination">
            <div className="results">
              {filtered.length
                ? `Showing ${start + 1} to ${start + pageItems.length} of ${filtered.length} results`
                : "No results"}
            </div>
            <div className="pages">
              <button
                type="button"
                className="page page-arrow"
                data-page-action="prev"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                ‹
              </button>
              {renderPageButtons(totalPages, page, goToPage)}
              <button
                type="button"
                className="page page-arrow"
                data-page-action="next"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                ›
              </button>
            </div>
            <div
              className="per-page"
              onClick={(e) => openPerPageSelect(e.currentTarget)}
            >
              {state.perPage} per page <span className="material-symbols-outlined text-[12px]">expand_more</span>
            </div>
          </div>
        </div>

        <aside className="drawer" id="drawer">
          {drawerAsset && (
            <DrawerContent
              asset={drawerAsset}
              index={state.activeIndex ?? 0}
              model={model}
            />
          )}
        </aside>
      </section>

      <div
        className={`mobile-detail${state.mobileDetailOpen ? " open" : ""}`}
        id="mobileDetail"
      >
        {drawerAsset && state.mobileDetailOpen && (
          <DrawerContent
            asset={drawerAsset}
            index={state.activeIndex ?? 0}
            model={model}
          />
        )}
      </div>
    </div>
  );
}

function renderPageButtons(
  totalPages: number,
  page: number,
  goToPage: (p: number) => void,
) {
  const items: React.ReactNode[] = [];
  const add = (p: number) => (
    <button
      key={p}
      type="button"
      className={`page${p === page ? " active" : ""}`}
      data-page={p}
      onClick={() => goToPage(p)}
    >
      {p}
    </button>
  );

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) items.push(add(i));
  } else {
    items.push(add(1));
    if (page > 4) {
      items.push(
        <button key="ellipsis-l" type="button" className="page" disabled>
          …
        </button>,
      );
    }
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) items.push(add(i));
    if (page < totalPages - 3) {
      items.push(
        <button key="ellipsis-r" type="button" className="page" disabled>
          …
        </button>,
      );
    }
    items.push(add(totalPages));
  }

  return items;
}

function DrawerContent({
  asset,
  index,
  model,
}: {
  asset: { filename: string; type: string; dims: string; sizeMb: number; addedAt: string; usageText: string; used: boolean; url: string };
  index: number;
  model: MediaLibraryModel;
}) {
  const { state, closeDrawer, openLightbox, showUsages, requestDelete, openReplace, toggleStar, slugifyProduct } = model;
  const starred = state.starred.has(asset.id);

  return (
    <>
      <div className="drawer-head">
        <div className="drawer-title">{asset.filename}</div>
        <button
          type="button"
          className="close"
          data-action="close-drawer"
          aria-label="Close"
          onClick={closeDrawer}
        >
          <span className="material-symbols-outlined text-[15px]">close</span>
        </button>
      </div>

      <div className="detail-image" style={{ cursor: "zoom-in" }} onClick={() => openLightbox(index)}>
        <img src={asset.url} alt={asset.filename} />
      </div>

      <div className="details">
        <div className="detail-row">
          <span className="label">File Name</span>
          <span className="value">{asset.filename}</span>
        </div>
        <div className="detail-row">
          <span className="label">File Type</span>
          <span className="value">{asset.type}</span>
        </div>
        <div className="detail-row">
          <span className="label">Dimensions</span>
          <span className="value">{asset.dims}</span>
        </div>
        <div className="detail-row">
          <span className="label">File Size</span>
          <span className="value">{asset.sizeMb.toFixed(2)} MB</span>
        </div>
        <div className="detail-row">
          <span className="label">Added</span>
          <span className="value">
            {new Date(asset.addedAt).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="detail-row">
          <span className="label">Uploaded By</span>
          <span className="value">Admin</span>
        </div>

        <div className="detail-row">
          <span className="label">Usage</span>
          <span className="usage-ok">
            <span className={`dot${asset.used ? "" : " red"}`} />
            {asset.usageText}
          </span>
        </div>

        <div className="divider" />

        <div className="used-title">
          Used In <span>{asset.used ? USED_PRODUCT_NAMES.length : 0}</span>
        </div>

        {asset.used ? (
          <>
            {USED_PRODUCT_NAMES.slice(0, 3).map((name) => (
              <div className="product-use" key={name}>
                <img src={asset.url} alt="" />
                <div>
                  <div className="product-name">{name}</div>
                  <div className="product-url">{slugifyProduct(name)}</div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="show-all"
              data-action="show-usages"
              onClick={() => showUsages(index)}
            >
              Show all {USED_PRODUCT_NAMES.length} usages
            </button>
          </>
        ) : (
          <div className="unused-note">This image is currently unused.</div>
        )}
      </div>

      <div className="drawer-actions">
        <button
          type="button"
          className="action replace"
          data-action="replace"
          onClick={() => openReplace(index)}
        >
          <span className="material-symbols-outlined text-[14px]">upload</span>
          Replace Image
        </button>

        <button
          type="button"
          className="action delete"
          data-action="delete"
          onClick={() => requestDelete(index)}
        >
          <span className="material-symbols-outlined text-[14px]">delete</span>
          Delete Image
        </button>

        <button
          type="button"
          className={`action favorite${starred ? " starred" : ""}`}
          data-action="favorite"
          onClick={() => toggleStar(index)}
        >
          <span className={`material-symbols-outlined text-[14px]${starred ? " filled" : ""}`}>
            {starred ? "star" : "star_border"}
          </span>
          {starred ? "Remove from Favorites" : "Add to Favorites"}
        </button>

        <div className="warning">
          {asset.used
            ? "This image is used in 12 products. Deleting it will remove it from all locations."
            : "This image is unused and can be safely removed."}
        </div>
      </div>
    </>
  );
}