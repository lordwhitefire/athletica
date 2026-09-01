"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useBrandManagement } from "./use-brand-management";
import type {
  Brand,
  BrandFormValues,
  BrandProductFilter,
  BrandSort,
  BrandStatusFilter,
} from "./brand-management.types";
import { BrandLogo } from "./brand-logos";
import "./brand-management-interactions.css";

type BrandManagementModel = ReturnType<typeof useBrandManagement>;

type BrandManagementContextValue = {
  model: BrandManagementModel;
  topExpanded: boolean;
  toggleTopExpanded: () => void;
  recentExpanded: boolean;
  toggleRecentExpanded: () => void;
};

const BrandManagementContext = createContext<BrandManagementContextValue | null>(null);

export function useBrandManagementModel() {
  const ctx = useContext(BrandManagementContext);
  if (!ctx) {
    throw new Error("useBrandManagementModel must be used inside BrandManagementInteractionLayer");
  }
  return ctx;
}

export function BrandManagementInteractionLayer({
  children,
  initialBrands,
}: { children: ReactNode; initialBrands: Brand[] }) {
  const model = useBrandManagement(initialBrands);
  const [topExpanded, setTopExpanded] = useState(false);
  const [recentExpanded, setRecentExpanded] = useState(false);
  const toggleTopExpanded = useCallback(() => setTopExpanded((value) => !value), []);
  const toggleRecentExpanded = useCallback(() => setRecentExpanded((value) => !value), []);

  return (
    <BrandManagementContext.Provider
      value={{ model, topExpanded, toggleTopExpanded, recentExpanded, toggleRecentExpanded }}
    >
      <div
        className="brand-management-interaction-layer"
        data-brand-management-root
        data-responsive="phone-tablet-desktop"
      >
        {children}
        <BrandResponsiveSurfaces model={model} />
        <BrandOverlaySurfaces model={model} />
      </div>
    </BrandManagementContext.Provider>
  );
}

function BrandResponsiveSurfaces({ model }: { model: BrandManagementModel }) {
  const {
    state,
    visibleBrands,
    filteredBrands,
    safePage,
    totalPages,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    setProductFilter,
    setSort,
    resetFilters,
    openEditDialog,
    openViewDialog,
    toggleRowActionMenu,
    toggleSelection,
    selectAllVisible,
  } = model;

  return (
    <div data-brand-mobile-surface>
      <div className="brand-mobile-filter-surface">
        <label>
          <span>Search brands</span>
          <input
            value={state.filters.search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search brands..."
          />
        </label>

        <div className="brand-mobile-filter-grid">
          <label>
            <span>Status</span>
            <select
              value={state.filters.status}
              onChange={(event) =>
                setStatusFilter(event.target.value as BrandStatusFilter)
              }
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label>
            <span>Products</span>
            <select
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
          </label>

          <label>
            <span>Sort</span>
            <select
              value={state.filters.sort}
              onChange={(event) => setSort(event.target.value as BrandSort)}
            >
              <option value="most-products">Most Products</option>
              <option value="least-products">Least Products</option>
              <option value="most-clicks">Most Clicks</option>
              <option value="highest-ctr">Highest CTR</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
          </label>
        </div>

        <button type="button" className="brand-mobile-reset" onClick={resetFilters}>
          Reset filters
        </button>
      </div>

      <div className="brand-mobile-list">
        <div className="brand-mobile-list-header">
          <label className="brand-check-control">
            <input
              type="checkbox"
              checked={
                visibleBrands.length > 0 &&
                visibleBrands.every((brand) =>
                  state.selectedBrandIds.includes(brand.id),
                )
              }
              onChange={selectAllVisible}
            />
            <span>Select visible</span>
          </label>

          <span>{filteredBrands.length.toLocaleString()} brands</span>
        </div>

        {visibleBrands.map((brand) => (
          <article className="brand-mobile-card" key={brand.id}>
            <div className="brand-mobile-card-top">
              <label className="brand-check-control">
                <input
                  type="checkbox"
                  checked={state.selectedBrandIds.includes(brand.id)}
                  onChange={() => toggleSelection(brand.id)}
                />
              </label>

              <BrandLogo brand={brand} className="brand-mobile-logo" />

              <div className="brand-mobile-card-title">
                <strong>{brand.name}</strong>
                <span>{brand.tagline}</span>
              </div>

              <button
                type="button"
                className="brand-icon-button"
                onClick={() => toggleRowActionMenu(brand.id)}
                aria-label={`Actions for ${brand.name}`}
                aria-expanded={state.rowActionMenu?.brandId === brand.id}
              >
                <span className="material-symbols-outlined text-[16px]">more_horiz</span>
              </button>
            </div>

            <div className="brand-mobile-card-metrics">
              <div>
                <span>Products</span>
                <strong>{brand.products.toLocaleString()}</strong>
              </div>
              <div>
                <span>Clicks</span>
                <strong>{brand.amazonClicks.toLocaleString()}</strong>
              </div>
              <div>
                <span>CTR</span>
                <strong>{brand.ctr.toFixed(2)}%</strong>
              </div>
            </div>

            <div className="brand-mobile-card-bottom">
              <span
                className={`brand-status-pill ${
                  brand.status === "active" ? "is-active" : "is-inactive"
                }`}
              >
                {brand.status === "active" ? "Active" : "Inactive"}
              </span>

              <div className="brand-mobile-card-actions">
                <button type="button" onClick={() => openEditDialog(brand.id)}>
                  Edit
                </button>
                <button type="button" onClick={() => openViewDialog(brand.id)}>
                  View
                </button>
              </div>
            </div>
          </article>
        ))}

        {visibleBrands.length === 0 && (
          <div className="brand-empty-state">
            <strong>No brands found</strong>
            <span>Try changing your search or filters.</span>
          </div>
        )}
      </div>

      <div className="brand-mobile-pagination">
        <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
          Previous
        </button>

        <span>
          Page {safePage} of {totalPages}
        </span>

        <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
          Next
        </button>

        <label>
          <span>Rows</span>
          <select
            value={state.rowsPerPage}
            onChange={(event) => setRowsPerPage(Number(event.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function BrandOverlaySurfaces({ model }: { model: BrandManagementModel }) {
  const {
    state,
    topPerformingBrands,
    recentlyAddedBrands,
    openEditDialog,
    openViewDialog,
    closeDialog,
    saveBrand,
    toggleBrandStatus,
    requestDelete,
    cancelDelete,
    confirmDelete,
    exportBrands,
    closeExportMenu,
    closeFilterPanel,
    setStatusFilter,
    setProductFilter,
    setSort,
    resetFilters,
  } = model;

  const { topExpanded, toggleTopExpanded, recentExpanded, toggleRecentExpanded } =
    useBrandManagementModel();

  const dialog = state.dialog;
  const activeDialogBrand =
    dialog &&
    "brandId" in dialog &&
    state.brands.find((brand) => brand.id === dialog.brandId);

  const deleteBrandItem = state.deleteTarget
    ? state.brands.find((brand) => brand.id === state.deleteTarget)
    : undefined;

  return (
    <>
      {state.exportMenu.open && (
        <div className="brand-export-menu" data-brand-export-menu role="menu">
          <button type="button" role="menuitem" disabled={state.isExporting} onClick={() => exportBrands("csv")}>
            Export CSV
          </button>
          <button type="button" role="menuitem" disabled={state.isExporting} onClick={() => exportBrands("json")}>
            Export JSON
          </button>
        </div>
      )}

      {state.filterPanel.open && (
        <aside className="brand-filter-panel" aria-label="Brand filters">
          <div className="brand-filter-panel-header">
            <div>
              <strong>Filters</strong>
              <span>Refine the brand list</span>
            </div>
            <button
              type="button"
              className="brand-icon-button"
              onClick={closeFilterPanel}
              aria-label="Close filters"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <label>
            <span>Status</span>
            <select
              value={state.filters.status}
              onChange={(event) => setStatusFilter(event.target.value as BrandStatusFilter)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label>
            <span>Products</span>
            <select
              value={state.filters.products}
              onChange={(event) => setProductFilter(event.target.value as BrandProductFilter)}
            >
              <option value="all">All</option>
              <option value="1000-plus">1,000+</option>
              <option value="500-999">500–999</option>
              <option value="under-500">Under 500</option>
            </select>
          </label>

          <label>
            <span>Sort</span>
            <select
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
          </label>

          <div className="brand-filter-panel-actions">
            <button type="button" onClick={resetFilters}>
              Reset
            </button>
            <button type="button" className="brand-interaction-primary" onClick={closeFilterPanel}>
              Apply
            </button>
          </div>
        </aside>
      )}

      {state.rowActionMenu && (
        <BrandRowActionSurface
          brand={state.brands.find((item) => item.id === state.rowActionMenu?.brandId)}
          onEdit={openEditDialog}
          onView={openViewDialog}
          onToggleStatus={toggleBrandStatus}
          onRequestDelete={requestDelete}
        />
      )}

      {state.dialog?.type === "add" && (
        <BrandDialog
          mode="add"
          brand={undefined}
          saving={state.isSaving}
          onClose={closeDialog}
          onSave={(values) => saveBrand(values)}
        />
      )}

      {state.dialog?.type === "edit" && activeDialogBrand && (
        <BrandDialog
          mode="edit"
          brand={activeDialogBrand}
          saving={state.isSaving}
          onClose={closeDialog}
          onSave={(values) => saveBrand(values, activeDialogBrand.id)}
        />
      )}

      {state.dialog?.type === "view" && activeDialogBrand && (
        <BrandDetailsDialog
          brand={activeDialogBrand}
          onClose={closeDialog}
          onEdit={() => openEditDialog(activeDialogBrand.id)}
        />
      )}

      {deleteBrandItem && (
        <DeleteBrandDialog
          brandName={deleteBrandItem.name}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      <BrandRightRailInteractionSurfaces
        topPerformingBrands={topPerformingBrands}
        recentlyAddedBrands={recentlyAddedBrands}
        onViewBrand={openViewDialog}
        topExpanded={topExpanded}
        recentExpanded={recentExpanded}
        onToggleTop={toggleTopExpanded}
        onToggleRecent={toggleRecentExpanded}
      />

      {state.toast && (
        <div className={`brand-toast is-${state.toast.tone}`} role="status" aria-live="polite">
          {state.toast.message}
        </div>
      )}
    </>
  );
}

function BrandRowActionSurface({
  brand,
  onEdit,
  onView,
  onToggleStatus,
  onRequestDelete,
}: {
  brand?: Brand;
  onEdit: (brandId: string) => void;
  onView: (brandId: string) => void;
  onToggleStatus: (brandId: string) => void;
  onRequestDelete: (brandId: string) => void;
}) {
  if (!brand) return null;

  return (
    <div className="brand-row-action-menu" data-brand-row-menu role="menu">
      <button type="button" role="menuitem" onClick={() => onView(brand.id)}>
        View brand
      </button>
      <button type="button" role="menuitem" onClick={() => onEdit(brand.id)}>
        Edit brand
      </button>
      <button type="button" role="menuitem" onClick={() => onToggleStatus(brand.id)}>
        {brand.status === "active" ? "Deactivate" : "Activate"}
      </button>
      <button
        type="button"
        role="menuitem"
        className="is-danger"
        onClick={() => onRequestDelete(brand.id)}
      >
        Delete brand
      </button>
    </div>
  );
}

function BrandDialog({
  mode,
  brand,
  saving,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  brand?: Brand;
  saving: boolean;
  onClose: () => void;
  onSave: (values: BrandFormValues) => Promise<boolean>;
}) {
  const [values, setValues] = useState<BrandFormValues>({
    name: brand?.name ?? "",
    tagline: brand?.tagline ?? "",
    description: brand?.description ?? "",
    website: brand?.website ?? "",
    slug: brand?.slug ?? "",
    status: brand?.status ?? "active",
  });

  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.name.trim()) {
      setError("Brand name is required.");
      return;
    }

    const success = await onSave(values);

    if (!success) {
      setError("Unable to save this brand.");
    }
  }

  return (
    <div
      className="brand-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="brand-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-dialog-title"
      >
        <header className="brand-dialog-header">
          <div>
            <strong id="brand-dialog-title">
              {mode === "add" ? "Add Brand" : "Edit Brand"}
            </strong>
            <span>
              {mode === "add"
                ? "Create a new catalog brand."
                : "Update brand details and status."}
            </span>
          </div>

          <button type="button" className="brand-icon-button" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="brand-dialog-body">
            <label>
              <span>Brand name</span>
              <input
                autoFocus
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label>
              <span>Tagline</span>
              <input
                value={values.tagline}
                onChange={(event) =>
                  setValues((current) => ({ ...current, tagline: event.target.value }))
                }
              />
            </label>

            <label>
              <span>Slug</span>
              <input
                value={values.slug}
                onChange={(event) =>
                  setValues((current) => ({ ...current, slug: event.target.value }))
                }
              />
            </label>

            <label>
              <span>Website</span>
              <input
                type="url"
                placeholder="https://example.com"
                value={values.website}
                onChange={(event) =>
                  setValues((current) => ({ ...current, website: event.target.value }))
                }
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                rows={4}
                value={values.description}
                onChange={(event) =>
                  setValues((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>

            <label>
              <span>Status</span>
              <select
                value={values.status}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    status: event.target.value as BrandFormValues["status"],
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            {error && (
              <div className="brand-form-error" role="alert">
                {error}
              </div>
            )}
          </div>

          <footer className="brand-dialog-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="brand-interaction-primary" disabled={saving}>
              {saving ? "Saving..." : mode === "add" ? "Add Brand" : "Save Changes"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function BrandDetailsDialog({
  brand,
  onClose,
  onEdit,
}: {
  brand: Brand;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="brand-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="brand-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-details-title"
      >
        <header className="brand-dialog-header">
          <div>
            <strong id="brand-details-title">{brand.name}</strong>
            <span>{brand.tagline}</span>
          </div>

          <button type="button" className="brand-icon-button" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </header>

        <div className="brand-details-body">
          <div className="brand-details-identity">
            <div className="brand-details-identity-logo">
              <BrandLogo brand={brand} />
            </div>
            <div>
              <strong>{brand.name}</strong>
              <span>{brand.slug ? `/${brand.slug}` : "No slug"}</span>
            </div>
          </div>

          <div className="brand-details-metric-grid">
            <div>
              <span>Products</span>
              <strong>{brand.products.toLocaleString()}</strong>
            </div>
            <div>
              <span>Amazon clicks</span>
              <strong>{brand.amazonClicks.toLocaleString()}</strong>
            </div>
            <div>
              <span>CTR</span>
              <strong>{brand.ctr.toFixed(2)}%</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{brand.status === "active" ? "Active" : "Inactive"}</strong>
            </div>
          </div>

          <div className="brand-details-section">
            <span>Description</span>
            <p>
              {brand.description ||
                "No description has been added for this brand yet."}
            </p>
          </div>

          <div className="brand-details-section">
            <span>Added</span>
            <p>{brand.addedAt}</p>
          </div>

          {brand.website && (
            <div className="brand-details-section">
              <span>Website</span>
              <a href={brand.website} target="_blank" rel="noreferrer">
                {brand.website}
              </a>
            </div>
          )}
        </div>

        <footer className="brand-dialog-footer">
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="brand-interaction-primary" onClick={onEdit}>
            Edit Brand
          </button>
        </footer>
      </section>
    </div>
  );
}

function DeleteBrandDialog({
  brandName,
  onCancel,
  onConfirm,
}: {
  brandName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="brand-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onCancel();
      }}
    >
      <section
        className="brand-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-delete-title"
      >
        <header className="brand-dialog-header">
          <div>
            <strong id="brand-delete-title">Delete {brandName}?</strong>
            <span>This action cannot be undone.</span>
          </div>

          <button type="button" className="brand-icon-button" onClick={onCancel} aria-label="Close">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </header>

        <div className="brand-dialog-body">
          <p className="brand-delete-copy">
            Removing <strong>{brandName}</strong> deletes it from the catalog brand list.
            Existing products keep their brand name but are no longer linked to a brand record.
          </p>
        </div>

        <footer className="brand-dialog-footer">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="brand-delete-confirm" onClick={onConfirm}>
            Delete Brand
          </button>
        </footer>
      </section>
    </div>
  );
}

function BrandRightRailInteractionSurfaces({
  topPerformingBrands,
  recentlyAddedBrands,
  onViewBrand,
  topExpanded,
  recentExpanded,
  onToggleTop,
  onToggleRecent,
}: {
  topPerformingBrands: Brand[];
  recentlyAddedBrands: Brand[];
  onViewBrand: (brandId: string) => void;
  topExpanded: boolean;
  recentExpanded: boolean;
  onToggleTop: () => void;
  onToggleRecent: () => void;
}) {
  const topBrands = topExpanded ? topPerformingBrands : topPerformingBrands.slice(0, 5);
  const recentBrands = recentExpanded ? recentlyAddedBrands : recentlyAddedBrands.slice(0, 3);

  return (
    <div className="brand-right-rail-interaction-surfaces">
      {topExpanded && (
        <section className="brand-revealed-list" aria-label="All top performing brands">
          <header>
            <strong>Top Performing Brands</strong>
            <button type="button" onClick={onToggleTop}>
              Close
            </button>
          </header>

          {topBrands.map((brand, index) => (
            <button type="button" className="brand-revealed-list-row" key={brand.id} onClick={() => onViewBrand(brand.id)}>
              <span>{index + 1}</span>
              <BrandLogo brand={brand} />
              <span>{brand.name}</span>
              <span>{brand.amazonClicks.toLocaleString()} clicks</span>
              <span>{brand.ctr.toFixed(2)}% CTR</span>
            </button>
          ))}
        </section>
      )}

      {recentExpanded && (
        <section className="brand-revealed-list" aria-label="All recently added brands">
          <header>
            <strong>Recently Added Brands</strong>
            <button type="button" onClick={onToggleRecent}>
              Close
            </button>
          </header>

          {recentBrands.map((brand) => (
            <button type="button" className="brand-revealed-list-row" key={brand.id} onClick={() => onViewBrand(brand.id)}>
              <BrandLogo brand={brand} />
              <span>{brand.name}</span>
              <span>{brand.addedAt}</span>
              <span className={`brand-status-pill ${brand.status === "active" ? "is-active" : "is-inactive"}`}>
                {brand.status === "active" ? "Active" : "Inactive"}
              </span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
