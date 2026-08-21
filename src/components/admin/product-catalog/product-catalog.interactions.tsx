"use client";

import * as React from "react";

export type ProductStatus = "published" | "unpublished";
export type MissingData = "none" | "asin" | "image" | "category";

export type CatalogProduct = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  categoryDetail: string;
  price: number;
  status: ProductStatus;
  asin: string | null;
  imageUrl: string | null;
  clicks: number;
  addedAt: string;
  missingData: MissingData;
};

export type CatalogFilters = {
  search: string;
  category: string;
  brand: string;
  status: string;
  missingData: string;
  sort: "newest" | "oldest" | "price-high" | "price-low" | "name";
};

export type ProductCatalogState = {
  filters: CatalogFilters;
  selectedIds: string[];
  currentPage: number;
  pageSize: number;
  openMenu: string | null;
  openDialog:
    | "add-product"
    | "edit-product"
    | "delete-product"
    | "bulk-action"
    | "export"
    | "more-filters"
    | "mobile-filters"
    | null;
  editingProduct: CatalogProduct | null;
  bulkAction:
    | "publish"
    | "unpublish"
    | "delete"
    | "assign-category"
    | "assign-brand"
    | "add-asin"
    | "export"
    | null;
  toast: { message: string; tone: "success" | "error" | "info" } | null;
};

export const INITIAL_CATALOG_STATE: ProductCatalogState = {
  filters: {
    search: "",
    category: "all",
    brand: "all",
    status: "all",
    missingData: "all",
    sort: "newest",
  },
  selectedIds: [],
  currentPage: 1,
  pageSize: 25,
  openMenu: null,
  openDialog: null,
  editingProduct: null,
  bulkAction: null,
  toast: null,
};

export type CatalogAction =
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_CATEGORY"; value: string }
  | { type: "SET_BRAND"; value: string }
  | { type: "SET_STATUS"; value: string }
  | { type: "SET_MISSING_DATA"; value: string }
  | { type: "SET_SORT"; value: CatalogFilters["sort"] }
  | { type: "SET_PAGE"; value: number }
  | { type: "SET_PAGE_SIZE"; value: number }
  | { type: "TOGGLE_SELECTED"; id: string }
  | { type: "TOGGLE_SELECT_ALL"; ids: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "OPEN_MENU"; id: string }
  | { type: "CLOSE_MENU" }
  | {
      type: "OPEN_DIALOG";
      dialog: NonNullable<ProductCatalogState["openDialog"]>;
      product?: CatalogProduct | null;
      bulkAction?: ProductCatalogState["bulkAction"];
    }
  | { type: "CLOSE_DIALOG" }
  | { type: "SET_TOAST"; toast: ProductCatalogState["toast"] }
  | { type: "RESET_FILTERS" };

export function catalogReducer(
  state: ProductCatalogState,
  action: CatalogAction,
): ProductCatalogState {
  switch (action.type) {
    case "SET_SEARCH":
      return {
        ...state,
        filters: { ...state.filters, search: action.value },
        currentPage: 1,
      };

    case "SET_CATEGORY":
      return {
        ...state,
        filters: { ...state.filters, category: action.value },
        currentPage: 1,
      };

    case "SET_BRAND":
      return {
        ...state,
        filters: { ...state.filters, brand: action.value },
        currentPage: 1,
      };

    case "SET_STATUS":
      return {
        ...state,
        filters: { ...state.filters, status: action.value },
        currentPage: 1,
      };

    case "SET_MISSING_DATA":
      return {
        ...state,
        filters: { ...state.filters, missingData: action.value },
        currentPage: 1,
      };

    case "SET_SORT":
      return {
        ...state,
        filters: { ...state.filters, sort: action.value },
        currentPage: 1,
      };

    case "SET_PAGE":
      return { ...state, currentPage: action.value };

    case "SET_PAGE_SIZE":
      return {
        ...state,
        pageSize: action.value,
        currentPage: 1,
      };

    case "TOGGLE_SELECTED": {
      const selected = state.selectedIds.includes(action.id)
        ? state.selectedIds.filter((id) => id !== action.id)
        : [...state.selectedIds, action.id];

      return { ...state, selectedIds: selected };
    }

    case "TOGGLE_SELECT_ALL": {
      const everyVisibleSelected =
        action.ids.length > 0 &&
        action.ids.every((id) => state.selectedIds.includes(id));

      return {
        ...state,
        selectedIds: everyVisibleSelected
          ? state.selectedIds.filter((id) => !action.ids.includes(id))
          : Array.from(new Set([...state.selectedIds, ...action.ids])),
      };
    }

    case "CLEAR_SELECTION":
      return { ...state, selectedIds: [] };

    case "OPEN_MENU":
      return {
        ...state,
        openMenu: state.openMenu === action.id ? null : action.id,
        openDialog: null,
      };

    case "CLOSE_MENU":
      return { ...state, openMenu: null };

    case "OPEN_DIALOG":
      return {
        ...state,
        openMenu: null,
        openDialog: action.dialog,
        editingProduct: action.product ?? null,
        bulkAction: action.bulkAction ?? null,
      };

    case "CLOSE_DIALOG":
      return {
        ...state,
        openDialog: null,
        editingProduct: null,
        bulkAction: null,
      };

    case "SET_TOAST":
      return { ...state, toast: action.toast };

    case "RESET_FILTERS":
      return {
        ...state,
        filters: INITIAL_CATALOG_STATE.filters,
        currentPage: 1,
      };

    default:
      return state;
  }
}

export function useProductCatalogInteractions() {
  return React.useReducer(catalogReducer, INITIAL_CATALOG_STATE);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function filterProducts(
  products: CatalogProduct[],
  filters: CatalogFilters,
) {
  const query = filters.search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      (product.asin ?? "").toLowerCase().includes(query);

    const matchesCategory =
      filters.category === "all" || product.category === filters.category;

    const matchesBrand =
      filters.brand === "all" || product.brand === filters.brand;

    const matchesStatus =
      filters.status === "all" || product.status === filters.status;

    const matchesMissing =
      filters.missingData === "all" ||
      (filters.missingData === "none"
        ? product.missingData === "none"
        : product.missingData === filters.missingData);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesBrand &&
      matchesStatus &&
      matchesMissing
    );
  });

  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return Date.parse(a.addedAt) - Date.parse(b.addedAt);
      case "price-high":
        return b.price - a.price;
      case "price-low":
        return a.price - b.price;
      case "name":
        return a.name.localeCompare(b.name);
      case "newest":
      default:
        return Date.parse(b.addedAt) - Date.parse(a.addedAt);
    }
  });
}
