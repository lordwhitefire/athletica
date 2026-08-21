"use client";

import * as React from "react";
import { urlFor } from "@/lib/sanity-client";
import type { SanityImageSource } from "@sanity/image-url";
import {
  CatalogProduct,
  INITIAL_CATALOG_STATE,
  ProductCatalogState,
  ProductStatus,
  catalogReducer,
  filterProducts,
  formatCurrency,
} from "./product-catalog.interactions";

function assetThumbUrl(assetId: string): string {
  try {
    return urlFor({ _ref: assetId } as SanityImageSource).width(200).url();
  } catch {
    return "";
  }
}

type Props = {
  products: CatalogProduct[];
  categories: string[];
  brands: string[];
  title?: string;
  subtitle?: string;
  kpis?: React.ReactNode;
  onSearch?: (query: string) => void;
  onFilter?: (filters: ProductCatalogState["filters"]) => void;
  onCreateProduct?: (payload: Record<string, unknown>) => Promise<void>;
  onUpdateProduct?: (
    id: string,
    payload: Record<string, unknown>,
  ) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onBulkAction?: (
    action: NonNullable<ProductCatalogState["bulkAction"]>,
    ids: string[],
    payload?: Record<string, unknown>,
  ) => Promise<void>;
  onExport?: (ids: string[]) => Promise<void>;
};

function relativeTime(iso: string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusMarkup(product: CatalogProduct) {
  const warn = product.status === "unpublished" || product.missingData !== "none";
  const label =
    product.status === "unpublished"
      ? "Unpublished"
      : product.missingData !== "none"
        ? product.missingData === "asin"
          ? "Missing ASIN"
          : product.missingData === "image"
            ? "Missing Image"
            : "Missing Category"
        : "Published";
  return (
    <span className={`status${warn ? " warn" : ""}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}

function SurfaceShell({
  children,
  onClose,
  labelledBy,
}: {
  children: React.ReactNode;
  onClose: () => void;
  labelledBy: string;
}) {
  return (
    <div
      role="presentation"
      data-surface-backdrop
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        data-surface-panel
      >
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        {children}
      </section>
    </div>
  );
}

function ProductEditorSurface({
  mode,
  product,
  categories,
  brands,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  product?: CatalogProduct;
  categories: string[];
  brands: string[];
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = React.useState(product?.name ?? "");
  const [sku, setSku] = React.useState(product?.sku ?? "");
  const [price, setPrice] = React.useState(String(product?.price ?? ""));
  const [brand, setBrand] = React.useState(product?.brand ?? "");
  const [category, setCategory] = React.useState(product?.category ?? "");
  const [asin, setAsin] = React.useState(product?.asin ?? "");
  const [model, setModel] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const imageFileRef = React.useRef<HTMLInputElement>(null);
  const [status, setStatus] = React.useState<ProductStatus>(
    product?.status ?? "unpublished",
  );
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || "Upload failed");
      }
      setImages((prev) => [...prev, json.data._id]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
      if (imageFileRef.current) imageFileRef.current.value = "";
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSubmitError(null);

    try {
      await onSubmit({
        name,
        sku,
        price: Number(price),
        brand,
        category,
        asin: asin || null,
        model,
        images,
        status,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SurfaceShell
      onClose={onClose}
      labelledBy="product-editor-title"
    >
      <form onSubmit={submit} data-product-editor>
        <header>
          <p>{mode === "create" ? "Catalog" : "Product"}</p>
          <h2 id="product-editor-title">
            {mode === "create" ? "Add Product" : "Edit Product"}
          </h2>
        </header>

        <label>
          Product name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          SKU
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Auto-generated from name when empty"
          />
        </label>

        <label>
          Model
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Football Boots/FG/Mercurial Vapor"
          />
        </label>

        <div>
          <span>Images</span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs opacity-60">
              {images.length === 0 ? "No images yet." : `${images.length} image(s) added.`}
            </span>
            <label
              className={`cursor-pointer text-xs px-2 py-1 rounded border border-current ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}
            >
              {uploadingImage ? "Uploading…" : "Add Image"}
              <input
                ref={imageFileRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {images.map((assetId, i) => (
                <div
                  key={`${assetId}-${i}`}
                  className="relative aspect-square overflow-hidden rounded bg-black/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetThumbUrl(assetId)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-red-600 text-[10px] text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <label>
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>

        <label>
          Brand
          <select value={brand} onChange={(e) => setBrand(e.target.value)} required>
            <option value="">Select brand</option>
            {brands.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select category</option>
            {categories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Amazon ASIN
          <input
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            placeholder="Optional"
          />
        </label>

        <label>
          Status
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as ProductStatus)
            }
          >
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </label>

        {submitError && (
          <p role="alert" className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            {submitError}
          </p>
        )}

        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Add Product" : "Save Changes"}
          </button>
        </footer>
      </form>
    </SurfaceShell>
  );
}

function ConfirmSurface({
  title,
  description,
  confirmLabel,
  destructive = false,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);

  return (
    <SurfaceShell onClose={onClose} labelledBy="confirm-title">
      <div data-confirm-surface>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>

        {confirmError && (
          <p role="alert" className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            {confirmError}
          </p>
        )}

        <footer>
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            data-destructive={destructive}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setConfirmError(null);
              try {
                await onConfirm();
              } catch (err) {
                setConfirmError(err instanceof Error ? err.message : "Action failed. Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </footer>
      </div>
    </SurfaceShell>
  );
}

function BulkActionSurface({
  action,
  selectedCount,
  categories,
  brands,
  onClose,
  onConfirm,
}: {
  action: NonNullable<ProductCatalogState["bulkAction"]>;
  selectedCount: number;
  categories: string[];
  brands: string[];
  onClose: () => void;
  onConfirm: (payload?: Record<string, unknown>) => Promise<void>;
}) {
  const [value, setValue] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);

  async function handleConfirm(payload?: Record<string, unknown>) {
    setConfirming(true);
    setConfirmError(null);
    try {
      await onConfirm(payload);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Action failed. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  const labels: Record<string, string> = {
    publish: "Publish Products",
    unpublish: "Unpublish Products",
    delete: "Delete Products",
    "assign-category": "Assign Category",
    "assign-brand": "Assign Brand",
  };

  const requiresValue = action === "assign-category" || action === "assign-brand";

  return (
    <SurfaceShell onClose={onClose} labelledBy="bulk-title">
      <div data-bulk-action-surface>
        <h2 id="bulk-title">{labels[action]}</h2>
        <p>
          This action applies to {selectedCount} selected product
          {selectedCount === 1 ? "" : "s"}.
        </p>

        {action === "assign-category" && (
          <label>
            Category
            <select value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        )}

        {action === "assign-brand" && (
          <label>
            Brand
            <select value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option value={brand} key={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>
        )}

        {confirmError && (
          <p role="alert" className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            {confirmError}
          </p>
        )}

        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={(requiresValue && !value) || confirming}
            onClick={() => handleConfirm(requiresValue ? { value } : undefined)}
          >
            {confirming ? "Working…" : "Confirm"}
          </button>
        </footer>
      </div>
    </SurfaceShell>
  );
}

function MoreFiltersSurface({
  filters,
  categories,
  brands,
  onClose,
  onChange,
}: {
  filters: ProductCatalogState["filters"];
  categories: string[];
  brands: string[];
  onClose: () => void;
  onChange: (filters: ProductCatalogState["filters"]) => void;
}) {
  const [draft, setDraft] = React.useState(filters);

  return (
    <SurfaceShell onClose={onClose} labelledBy="more-filters-title">
      <div data-more-filters-surface>
        <h2 id="more-filters-title">More Filters</h2>

        <label>
          Category
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft({ ...draft, category: e.target.value })
            }
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Brand
          <select
            value={draft.brand}
            onChange={(e) =>
              setDraft({ ...draft, brand: e.target.value })
            }
          >
            <option value="all">All Brands</option>
            {brands.map((brand) => (
              <option value={brand} key={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft({ ...draft, status: e.target.value })
            }
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </label>

        <label>
          Missing Data
          <select
            value={draft.missingData}
            onChange={(e) =>
              setDraft({ ...draft, missingData: e.target.value })
            }
          >
            <option value="all">All</option>
            <option value="asin">Missing ASIN</option>
            <option value="image">Missing Image</option>
            <option value="category">Missing Category</option>
            <option value="none">No Missing Data</option>
          </select>
        </label>

        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(draft);
              onClose();
            }}
          >
            Apply Filters
          </button>
        </footer>
      </div>
    </SurfaceShell>
  );
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1, 2, 3, 4, 5];
  if (current > 5) {
    const start = Math.min(Math.max(current - 2, 1), total - 4);
    return [
      ...(start > 1 ? [1, "…" as const] : []),
      ...Array.from({ length: 5 }, (_, i) => start + i),
      ...(start + 4 < total ? ["…" as const, total] : []),
    ];
  }
  return [...pages, "…", total];
}

export default function ProductCatalogInteractionLayer({
  products,
  categories,
  brands,
  title = "Product Catalog",
  subtitle = "Manage, edit and organize all products in your store.",
  kpis,
  onSearch,
  onFilter,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkAction,
  onExport,
}: Props) {
  const [state, dispatch] = React.useReducer(
    catalogReducer,
    INITIAL_CATALOG_STATE,
  );

  const filteredProducts = React.useMemo(
    () => filterProducts(products, state.filters),
    [products, state.filters],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(filteredProducts.length / state.pageSize),
  );

  const visibleProducts = React.useMemo(() => {
    const start = (state.currentPage - 1) * state.pageSize;
    return filteredProducts.slice(start, start + state.pageSize);
  }, [filteredProducts, state.currentPage, state.pageSize]);

  const visibleIds = visibleProducts.map((product) => product.id);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => state.selectedIds.includes(id));

  const activeFilterCount = [
    state.filters.category !== "all",
    state.filters.brand !== "all",
    state.filters.status !== "all",
    state.filters.missingData !== "all",
  ].filter(Boolean).length;

  const runFilter = (
    action:
      | Parameters<typeof dispatch>[0]
      | null,
  ) => {
    if (!action) return;
    const nextFilters = (() => {
      switch (action.type) {
        case "SET_CATEGORY":
          return { ...state.filters, category: action.value };
        case "SET_BRAND":
          return { ...state.filters, brand: action.value };
        case "SET_STATUS":
          return { ...state.filters, status: action.value };
        case "SET_MISSING_DATA":
          return { ...state.filters, missingData: action.value };
        case "SET_SORT":
          return { ...state.filters, sort: action.value };
        default:
          return state.filters;
      }
    })();
    dispatch(action);
    requestAnimationFrame(() => {
      onFilter?.(nextFilters);
    });
  };

  const submitBulkAction = async (
    action: NonNullable<ProductCatalogState["bulkAction"]>,
  ) => {
    const ids = state.selectedIds;
    if (!ids.length) return;

    await onBulkAction?.(action, ids);

    dispatch({
      type: "SET_TOAST",
      toast: {
        message: `${ids.length} product${ids.length === 1 ? "" : "s"} updated`,
        tone: "success",
      },
    });

    dispatch({ type: "CLEAR_SELECTION" });
    dispatch({ type: "CLOSE_DIALOG" });
  };

  const exportSelection = async () => {
    await onExport?.(state.selectedIds);
    dispatch({
      type: "SET_TOAST",
      toast: {
        message:
          state.selectedIds.length > 0
            ? "Selected products exported"
            : "Current catalog exported",
        tone: "success",
      },
    });
    dispatch({ type: "CLOSE_DIALOG" });
  };

  React.useEffect(() => {
    if (!state.toast) return;
    const timeout = window.setTimeout(() => {
      dispatch({ type: "SET_TOAST", toast: null });
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [state.toast]);

  React.useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("[data-row-actions], [role=\"menu\"]")) return;
      dispatch({ type: "CLOSE_MENU" });
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dispatch({ type: "CLOSE_MENU" });
        dispatch({ type: "CLOSE_DIALOG" });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const from = filteredProducts.length === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1;
  const to = Math.min(state.currentPage * state.pageSize, filteredProducts.length);
  const numbers = pageNumbers(state.currentPage, pageCount);

  return (
    <>
      <div data-catalog-interaction-layer>
        <div data-catalog-state hidden>
          {JSON.stringify({
            selectedIds: state.selectedIds,
            currentPage: state.currentPage,
            pageCount,
            filters: state.filters,
          })}
        </div>

        {/* PAGE HEAD */}
        <header className="page-head">
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>

          <div className="head-actions">
            <button
              type="button"
              className="btn"
              data-existing-control="export"
              onClick={() =>
                dispatch({
                  type: "OPEN_DIALOG",
                  dialog: "export",
                })
              }
            >
              <span className="material-symbols-outlined btn-icon">ios_share</span>
              Export
              <span className="material-symbols-outlined chevron">expand_more</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              data-existing-control="add-product"
              onClick={() =>
                dispatch({
                  type: "OPEN_DIALOG",
                  dialog: "add-product",
                })
              }
            >
              <span className="material-symbols-outlined btn-icon">add</span>
              Add Product
            </button>
          </div>
        </header>

        {kpis}

        {/* FILTER / RESULTS TOOLBAR */}
        <section className="toolbar">
          <div className="filters">
            <div className="field">
              <label className="field-label" style={{ visibility: "hidden" }}>Search</label>
              <div className="control">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  placeholder="Search products..."
                  aria-label="Search products"
                  value={state.filters.search}
                  onChange={(event) => {
                    const value = event.target.value;
                    dispatch({ type: "SET_SEARCH", value });
                    onSearch?.(value);
                  }}
                  data-existing-control="product-search"
                />
                <span className="search-hint">/</span>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Category</label>
              <select
                className="control select"
                aria-label="Category"
                value={state.filters.category}
                onChange={(event) =>
                  runFilter({
                    type: "SET_CATEGORY",
                    value: event.target.value,
                  })
                }
                data-existing-control="category-filter"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Brand</label>
              <select
                className="control select"
                aria-label="Brand"
                value={state.filters.brand}
                onChange={(event) =>
                  runFilter({
                    type: "SET_BRAND",
                    value: event.target.value,
                  })
                }
                data-existing-control="brand-filter"
              >
                <option value="all">All Brands</option>
                {brands.map((brand) => (
                  <option value={brand} key={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Status</label>
              <select
                className="control select"
                aria-label="Status"
                value={state.filters.status}
                onChange={(event) =>
                  runFilter({
                    type: "SET_STATUS",
                    value: event.target.value,
                  })
                }
                data-existing-control="status-filter"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label">Missing Data</label>
              <select
                className="control select"
                aria-label="Missing Data"
                value={state.filters.missingData}
                onChange={(event) =>
                  runFilter({
                    type: "SET_MISSING_DATA",
                    value: event.target.value,
                  })
                }
                data-existing-control="missing-data-filter"
              >
                <option value="all">All</option>
                <option value="asin">Missing ASIN</option>
                <option value="image">Missing Image</option>
                <option value="category">Missing Category</option>
                <option value="none">No Missing Data</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-sm filter-more"
              data-existing-control="more-filters"
              onClick={() =>
                dispatch({
                  type: "OPEN_DIALOG",
                  dialog: "more-filters",
                })
              }
            >
              <span className="material-symbols-outlined">tune</span>
              More Filters
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>

            <button
              type="button"
              className="btn btn-sm filter-reset"
              data-existing-control="reset"
              onClick={() => {
                dispatch({ type: "RESET_FILTERS" });
                onFilter?.(INITIAL_CATALOG_STATE.filters);
              }}
            >
              <span className="material-symbols-outlined">refresh</span>
              Reset
            </button>
          </div>

          <div className="results-row">
            <div className="results-left">
              Showing {from} – {to} of {filteredProducts.length.toLocaleString()} products
            </div>

            <div className="view-sort">
              <span className="view-label">View</span>
              <div className="view-toggle">
                <button type="button" className="view-button active" aria-label="List view" aria-pressed="true">
                  <span className="material-symbols-outlined">list</span>
                </button>
                <button type="button" className="view-button" aria-label="Grid view" aria-pressed="false">
                  <span className="material-symbols-outlined">grid_view</span>
                </button>
              </div>

              <span className="sort-label">Sort by</span>
              <select
                className="control select sort"
                aria-label="Sort products"
                value={state.filters.sort}
                onChange={(event) =>
                  runFilter({
                    type: "SET_SORT",
                    value: event.target.value as ProductCatalogState["filters"]["sort"],
                  })
                }
                data-existing-control="sort-control"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </section>

        {/* PRODUCT TABLE */}
        <section className="table-card">
          <div className="bulk-bar">
            <input
              className="check"
              type="checkbox"
              aria-label="Select all visible products"
              checked={allVisibleSelected}
              onChange={() =>
                dispatch({
                  type: "TOGGLE_SELECT_ALL",
                  ids: visibleIds,
                })
              }
              data-existing-control="select-all"
            />
            <span className="selected">{state.selectedIds.length} selected</span>

            <div data-bulk-actions>
              <button
                type="button"
                disabled={!state.selectedIds.length}
                onClick={() =>
                  dispatch({
                    type: "OPEN_DIALOG",
                    dialog: "bulk-action",
                    bulkAction: "publish",
                  })
                }
              >
                Publish
              </button>

              <button
                type="button"
                disabled={!state.selectedIds.length}
                onClick={() =>
                  dispatch({
                    type: "OPEN_DIALOG",
                    dialog: "bulk-action",
                    bulkAction: "unpublish",
                  })
                }
              >
                Unpublish
              </button>

              <button
                type="button"
                disabled={!state.selectedIds.length}
                onClick={() =>
                  dispatch({
                    type: "OPEN_DIALOG",
                    dialog: "bulk-action",
                    bulkAction: "assign-category",
                  })
                }
              >
                Assign Category
              </button>

              <button
                type="button"
                disabled={!state.selectedIds.length}
                onClick={() =>
                  dispatch({
                    type: "OPEN_DIALOG",
                    dialog: "bulk-action",
                    bulkAction: "assign-brand",
                  })
                }
              >
                Assign Brand
              </button>

              <button
                type="button"
                disabled={!state.selectedIds.length}
                onClick={() =>
                  dispatch({
                    type: "OPEN_DIALOG",
                    dialog: "bulk-action",
                    bulkAction: "delete",
                  })
                }
              >
                Delete
              </button>

              <button
                type="button"
                disabled={!state.selectedIds.length}
                onClick={() =>
                  dispatch({
                    type: "OPEN_DIALOG",
                    dialog: "export",
                  })
                }
              >
                Export Selected
              </button>

              <button
                type="button"
                onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      className="check row-check"
                      type="checkbox"
                      aria-label="Select all visible products"
                      checked={allVisibleSelected}
                      onChange={() =>
                        dispatch({
                          type: "TOGGLE_SELECT_ALL",
                          ids: visibleIds,
                        })
                      }
                    />
                  </th>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Amazon ASIN</th>
                  <th>
                    Clicks <span className="click-hint">ⓘ</span>
                  </th>
                  <th>Added ↓</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id} data-product-row={product.id}>
                    <td>
                      <input
                        className="check row-check"
                        type="checkbox"
                        checked={state.selectedIds.includes(product.id)}
                        onChange={() =>
                          dispatch({
                            type: "TOGGLE_SELECTED",
                            id: product.id,
                          })
                        }
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td>
                      <div className="product-cell">
                        <div className={`product-thumb${product.imageUrl ? "" : " missing"}`}>
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.imageUrl} alt="" />
                          ) : (
                            <span className="material-symbols-outlined thumb-icon">image_not_supported</span>
                          )}
                        </div>
                        <div className="product-copy">
                          <a
                            href={`/admin/products/${product.id}/edit`}
                            className="product-name"
                            style={{ color: "inherit", textDecoration: "none" }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                          >
                            {product.name}
                          </a>
                          <div className="product-sku">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td>{product.brand || "—"}</td>
                    <td>
                      <div className="category-main">{product.category || "—"}</div>
                      {product.categoryDetail && (
                        <div className="category-sub">{product.categoryDetail}</div>
                      )}
                    </td>
                    <td className="price">
                      {product.price ? formatCurrency(product.price) : "—"}
                    </td>
                    <td>{statusMarkup(product)}</td>
                    <td>{product.asin ?? "—"}</td>
                    <td className="numeric">{(product.clicks ?? 0).toLocaleString()}</td>
                    <td>{relativeTime(product.addedAt)}</td>
                    <td>
                      <div className="actions" data-row-actions={product.id} style={{ position: "relative" }}>
                        <button
                          type="button"
                          className="action"
                          title="Edit"
                          aria-label={`Edit ${product.name}`}
                          onClick={() =>
                            dispatch({
                              type: "OPEN_DIALOG",
                              dialog: "edit-product",
                              product,
                            })
                          }
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>

                        <button
                          type="button"
                          className="action"
                          aria-label={`Actions for ${product.name}`}
                          aria-expanded={state.openMenu === product.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            dispatch({
                              type: "OPEN_MENU",
                              id: product.id,
                            });
                          }}
                        >
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>

                        {state.openMenu === product.id && (
                          <div
                            role="menu"
                            data-surface="product-row-actions"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              role="menuitem"
                              onClick={() =>
                                dispatch({
                                  type: "OPEN_DIALOG",
                                  dialog: "edit-product",
                                  product,
                                })
                              }
                            >
                              Edit Product
                            </button>

                            <button
                              role="menuitem"
                              onClick={async () => {
                                await onUpdateProduct?.(product.id, {
                                  status:
                                    product.status === "published"
                                      ? "unpublished"
                                      : "published",
                                });

                                dispatch({
                                  type: "SET_TOAST",
                                  toast: {
                                    message:
                                      product.status === "published"
                                        ? "Product unpublished"
                                        : "Product published",
                                    tone: "success",
                                  },
                                });

                                dispatch({ type: "CLOSE_MENU" });
                              }}
                            >
                              {product.status === "published"
                                ? "Unpublish"
                                : "Publish"}
                            </button>

                            <button
                              role="menuitem"
                              onClick={() =>
                                dispatch({
                                  type: "OPEN_DIALOG",
                                  dialog: "delete-product",
                                  product,
                                })
                              }
                            >
                              Delete Product
                            </button>

                            <button
                              role="menuitem"
                              onClick={async () => {
                                await onExport?.([product.id]);
                                dispatch({
                                  type: "SET_TOAST",
                                  toast: {
                                    message: "Product exported",
                                    tone: "success",
                                  },
                                });
                                dispatch({ type: "CLOSE_MENU" });
                              }}
                            >
                              Export Metadata
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleProducts.length === 0 && (
                  <tr>
                    <td colSpan={10} className="empty-row">
                      No products match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="rows-control">
              <span>Rows per page</span>
              <select
                className="control select rows-select"
                aria-label="Rows per page"
                value={state.pageSize}
                onChange={(event) =>
                  dispatch({
                    type: "SET_PAGE_SIZE",
                    value: Number(event.target.value),
                  })
                }
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="pagination">
              <button
                type="button"
                className="page-btn muted"
                aria-label="Previous page"
                disabled={state.currentPage <= 1}
                onClick={() =>
                  dispatch({
                    type: "SET_PAGE",
                    value: Math.max(1, state.currentPage - 1),
                  })
                }
              >
                ‹
              </button>
              {numbers.map((page, index) =>
                page === "…" ? (
                  <span key={`ellipsis-${index}`} className="page-ellipsis">…</span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    className={`page-btn${page === state.currentPage ? " active" : ""}`}
                    aria-current={page === state.currentPage ? "page" : undefined}
                    onClick={() =>
                      dispatch({
                        type: "SET_PAGE",
                        value: page,
                      })
                    }
                  >
                    {page}
                  </button>
                ),
              )}
              <div className="page-total">{pageCount}</div>
              <button
                type="button"
                className="page-btn"
                aria-label="Next page"
                disabled={state.currentPage >= pageCount}
                onClick={() =>
                  dispatch({
                    type: "SET_PAGE",
                    value: Math.min(pageCount, state.currentPage + 1),
                  })
                }
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================
          INTERACTION SURFACES
          ============================================================ */}

      {state.openDialog === "add-product" && (
        <ProductEditorSurface
          mode="create"
          categories={categories}
          brands={brands}
          onClose={() => dispatch({ type: "CLOSE_DIALOG" })}
          onSubmit={async (payload) => {
            await onCreateProduct?.(payload);
            dispatch({
              type: "SET_TOAST",
              toast: {
                message: "Product created",
                tone: "success",
              },
            });
            dispatch({ type: "CLOSE_DIALOG" });
          }}
        />
      )}

      {state.openDialog === "edit-product" && state.editingProduct && (
        <ProductEditorSurface
          mode="edit"
          product={state.editingProduct}
          categories={categories}
          brands={brands}
          onClose={() => dispatch({ type: "CLOSE_DIALOG" })}
          onSubmit={async (payload) => {
            await onUpdateProduct?.(state.editingProduct!.id, payload);
            dispatch({
              type: "SET_TOAST",
              toast: {
                message: "Product saved",
                tone: "success",
              },
            });
            dispatch({ type: "CLOSE_DIALOG" });
          }}
        />
      )}

      {state.openDialog === "delete-product" &&
        state.editingProduct && (
          <ConfirmSurface
            title="Delete product?"
            description={`Delete "${state.editingProduct.name}" from the catalog? This action cannot be undone.`}
            confirmLabel="Delete Product"
            destructive
            onClose={() => dispatch({ type: "CLOSE_DIALOG" })}
            onConfirm={async () => {
              await onDeleteProduct?.(state.editingProduct!.id);
              dispatch({
                type: "SET_TOAST",
                toast: {
                  message: "Product deleted",
                  tone: "success",
                },
              });
              dispatch({ type: "CLOSE_DIALOG" });
            }}
          />
        )}

      {state.openDialog === "bulk-action" && state.bulkAction && (
        <BulkActionSurface
          action={state.bulkAction}
          selectedCount={state.selectedIds.length}
          categories={categories}
          brands={brands}
          onClose={() => dispatch({ type: "CLOSE_DIALOG" })}
          onConfirm={async (payload) => {
            await onBulkAction?.(
              state.bulkAction!,
              state.selectedIds,
              payload,
            );
            dispatch({
              type: "SET_TOAST",
              toast: {
                message: "Bulk action completed",
                tone: "success",
              },
            });
            dispatch({ type: "CLEAR_SELECTION" });
            dispatch({ type: "CLOSE_DIALOG" });
          }}
        />
      )}

      {state.openDialog === "export" && (
        <ConfirmSurface
          title={
            state.selectedIds.length
              ? "Export selected products?"
              : "Export product catalog?"
          }
          description={
            state.selectedIds.length
              ? `Export metadata for ${state.selectedIds.length} selected product${state.selectedIds.length === 1 ? "" : "s"}.`
              : "Export the currently filtered product catalog."
          }
          confirmLabel="Export"
          onClose={() => dispatch({ type: "CLOSE_DIALOG" })}
          onConfirm={exportSelection}
        />
      )}

      {state.openDialog === "more-filters" && (
        <MoreFiltersSurface
          filters={state.filters}
          categories={categories}
          brands={brands}
          onClose={() => dispatch({ type: "CLOSE_DIALOG" })}
          onChange={(nextFilters) => {
            dispatch({
              type: "SET_CATEGORY",
              value: nextFilters.category,
            });
            dispatch({
              type: "SET_BRAND",
              value: nextFilters.brand,
            });
            dispatch({
              type: "SET_STATUS",
              value: nextFilters.status,
            });
            dispatch({
              type: "SET_MISSING_DATA",
              value: nextFilters.missingData,
            });
            onFilter?.(nextFilters);
          }}
        />
      )}

      {state.toast && (
        <div
          role="status"
          aria-live="polite"
          data-toast-tone={state.toast.tone}
        >
          {state.toast.message}
        </div>
      )}
    </>
  );
}
