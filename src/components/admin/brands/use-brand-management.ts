"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  Brand,
  BrandFilters,
  BrandFormValues,
  BrandManagementState,
  BrandSort,
  BrandStatus,
  BrandStatusFilter,
  BrandProductFilter,
} from "./brand-management.types";

const DEFAULT_FILTERS: BrandFilters = {
  search: "",
  status: "all",
  products: "all",
  sort: "most-products",
};

const DEFAULT_ROWS_PER_PAGE = 10;

function sortBrands(brands: Brand[], sort: BrandSort) {
  const next = [...brands];

  switch (sort) {
    case "least-products":
      return next.sort((a, b) => a.products - b.products);
    case "most-clicks":
      return next.sort((a, b) => b.amazonClicks - a.amazonClicks);
    case "least-clicks":
      return next.sort((a, b) => a.amazonClicks - b.amazonClicks);
    case "highest-ctr":
      return next.sort((a, b) => b.ctr - a.ctr);
    case "lowest-ctr":
      return next.sort((a, b) => a.ctr - b.ctr);
    case "newest":
      return next.sort(
        (a, b) =>
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
      );
    case "oldest":
      return next.sort(
        (a, b) =>
          new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime(),
      );
    case "name-asc":
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return next.sort((a, b) => b.name.localeCompare(a.name));
    case "most-products":
    default:
      return next.sort((a, b) => b.products - a.products);
  }
}

function matchesProductFilter(
  brand: Brand,
  filter: BrandProductFilter,
): boolean {
  switch (filter) {
    case "1000-plus":
      return brand.products >= 1000;
    case "500-999":
      return brand.products >= 500 && brand.products <= 999;
    case "under-500":
      return brand.products < 500;
    case "all":
    default:
      return true;
  }
}

export function useBrandManagement() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hydrated = useRef(false);

  const [state, setState] = useState<BrandManagementState>({
    brands: [],
    loadError: null,
    filters: DEFAULT_FILTERS,
    page: 1,
    rowsPerPage: DEFAULT_ROWS_PER_PAGE,
    dialog: null,
    rowActionMenu: null,
    exportMenu: { open: false },
    filterPanel: { open: false },
    mobileNav: { open: false },
    toast: null,
    selectedBrandIds: [],
    isSaving: false,
    isExporting: false,
    deleteTarget: null,
  });

  const loadBrands = useCallback(async (): Promise<boolean> => {
    // FR3-C: never bail silently — a transient failure must surface as a
    // visible, retryable error instead of an empty list that only a hard
    // refresh could fix. One automatic retry absorbs navigation blips.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { getAllBrandsAdmin } = await import("@/lib/actions/brands");
        const result = await getAllBrandsAdmin();
        if (!result.data) {
          if (attempt === 0) continue;
          setState((current) => ({
            ...current,
            loadError: result.error?.message ?? "Could not load brands.",
          }));
          return false;
        }
        const brands: Brand[] = (result.data as Array<Record<string, unknown>>).map((b) => {
          const logo = b.logo as { asset?: { _ref?: string } } | null;
          return {
            id: String(b._id ?? ""),
            name: String(b.name ?? ""),
            tagline: "",
            logo: logo?.asset?._ref ?? "",
            products: Number(b.product_count ?? 0),
            amazonClicks: 0,
            ctr: 0,
            status: "active",
            addedAt: String(b.created_at ?? new Date().toISOString()).slice(0, 10),
            website: "",
            slug: String(b.slug ?? ""),
          };
        });
        setState((current) => ({ ...current, brands, loadError: null }));
        return true;
      } catch (err) {
        if (attempt === 0) continue;
        setState((current) => ({
          ...current,
          brands: [],
          loadError: err instanceof Error ? err.message : "Could not load brands.",
        }));
        return false;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    const q = searchParams.get("search");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort");
    const page = searchParams.get("page");
    if (q || status || sort || page) {
      setState((current) => ({
        ...current,
        filters: {
          ...current.filters,
          search: q ?? "",
          status: (status as BrandStatusFilter | null) ?? "all",
          sort: (sort as BrandSort | null) ?? "most-products",
        },
        page: page ? Math.max(1, Number(page) || 1) : 1,
      }));
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBrands = useMemo(() => {
    const normalizedSearch = state.filters.search.trim().toLowerCase();

    const filtered = state.brands.filter((brand) => {
      const matchesSearch =
        !normalizedSearch ||
        brand.name.toLowerCase().includes(normalizedSearch) ||
        brand.tagline.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        state.filters.status === "all" ||
        brand.status === state.filters.status;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProductFilter(brand, state.filters.products)
      );
    });

    return sortBrands(filtered, state.filters.sort);
  }, [state.brands, state.filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBrands.length / state.rowsPerPage),
  );

  const safePage = Math.min(state.page, totalPages);

  const visibleBrands = useMemo(() => {
    const start = (safePage - 1) * state.rowsPerPage;
    return filteredBrands.slice(start, start + state.rowsPerPage);
  }, [filteredBrands, safePage, state.rowsPerPage]);

  const activeBrands = useMemo(
    () => state.brands.filter((brand) => brand.status === "active").length,
    [state.brands],
  );

  const totalProducts = useMemo(
    () => state.brands.reduce((sum, brand) => sum + brand.products, 0),
    [state.brands],
  );

  const totalClicks = useMemo(
    () => state.brands.reduce((sum, brand) => sum + brand.amazonClicks, 0),
    [state.brands],
  );

  const weightedCtr = useMemo(() => {
    if (!totalClicks) return 0;

    const weighted = state.brands.reduce(
      (sum, brand) => sum + brand.ctr * brand.amazonClicks,
      0,
    );

    return weighted / totalClicks;
  }, [state.brands, totalClicks]);

  const metrics = useMemo(
    () => ({
      totalBrands: state.brands.length,
      activeBrands,
      totalProducts,
      totalClicks,
      ctr: weightedCtr,
    }),
    [activeBrands, state.brands.length, totalClicks, totalProducts, weightedCtr],
  );

  const topPerformingBrands = useMemo(
    () =>
      [...state.brands]
        .sort((a, b) => b.amazonClicks - a.amazonClicks)
        .slice(0, 5),
    [state.brands],
  );

  const recentlyAddedBrands = useMemo(
    () =>
      [...state.brands]
        .sort(
          (a, b) =>
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
        )
        .slice(0, 3),
    [state.brands],
  );

  const updateFilters = useCallback(
    (patch: Partial<BrandFilters>) => {
      setState((current) => ({
        ...current,
        filters: { ...current.filters, ...patch },
        page: 1,
      }));
    },
    [],
  );

  const setSearch = useCallback(
    (search: string) => updateFilters({ search }),
    [updateFilters],
  );

  const setStatusFilter = useCallback(
    (status: BrandStatusFilter) => updateFilters({ status }),
    [updateFilters],
  );

  const setProductFilter = useCallback(
    (products: BrandProductFilter) => updateFilters({ products }),
    [updateFilters],
  );

  const setSort = useCallback(
    (sort: BrandSort) => updateFilters({ sort }),
    [updateFilters],
  );

  const resetFilters = useCallback(() => {
    setState((current) => ({
      ...current,
      filters: DEFAULT_FILTERS,
      page: 1,
    }));
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const params = new URLSearchParams();
    if (state.filters.search) params.set("search", state.filters.search);
    if (state.filters.status !== "all") params.set("status", state.filters.status);
    if (state.filters.sort !== "most-products") params.set("sort", state.filters.sort);
    if (safePage > 1) params.set("page", String(safePage));
    const query = params.size > 0 ? `?${params.toString()}` : "";
    router.replace(`/admin/brands${query}`, { scroll: false });
  }, [router, safePage, state.filters.search, state.filters.sort, state.filters.status]);

  const setPage = useCallback((page: number) => {
    setState((current) => ({
      ...current,
      page: Math.max(1, page),
    }));
  }, []);

  const setRowsPerPage = useCallback((rowsPerPage: number) => {
    setState((current) => ({
      ...current,
      rowsPerPage,
      page: 1,
    }));
  }, []);

  const openAddDialog = useCallback(() => {
    setState((current) => ({
      ...current,
      dialog: { type: "add" },
      rowActionMenu: null,
    }));
  }, []);

  const openEditDialog = useCallback((brandId: string) => {
    setState((current) => ({
      ...current,
      dialog: { type: "edit", brandId },
      rowActionMenu: null,
    }));
  }, []);

  const openViewDialog = useCallback((brandId: string) => {
    setState((current) => ({
      ...current,
      dialog: { type: "view", brandId },
      rowActionMenu: null,
    }));
  }, []);

  const closeDialog = useCallback(() => {
    setState((current) => ({
      ...current,
      dialog: null,
    }));
  }, []);

  const toggleRowActionMenu = useCallback((brandId: string) => {
    setState((current) => ({
      ...current,
      rowActionMenu:
        current.rowActionMenu?.brandId === brandId ? null : { brandId },
    }));
  }, []);

  const closeRowActionMenu = useCallback(() => {
    setState((current) => ({
      ...current,
      rowActionMenu: null,
    }));
  }, []);

  const toggleExportMenu = useCallback(() => {
    setState((current) => ({
      ...current,
      exportMenu: { open: !current.exportMenu.open },
      filterPanel: { open: false },
      rowActionMenu: null,
    }));
  }, []);

  const closeExportMenu = useCallback(() => {
    setState((current) => ({
      ...current,
      exportMenu: { open: false },
    }));
  }, []);

  const toggleFilterPanel = useCallback(() => {
    setState((current) => ({
      ...current,
      filterPanel: { open: !current.filterPanel.open },
      exportMenu: { open: false },
      rowActionMenu: null,
    }));
  }, []);

  const closeFilterPanel = useCallback(() => {
    setState((current) => ({
      ...current,
      filterPanel: { open: false },
    }));
  }, []);

  const toggleMobileNav = useCallback(() => {
    setState((current) => ({
      ...current,
      mobileNav: { open: !current.mobileNav.open },
    }));
  }, []);

  const closeMobileNav = useCallback(() => {
    setState((current) => ({
      ...current,
      mobileNav: { open: false },
    }));
  }, []);

  const setToast = useCallback(
    (
      message: string,
      tone: "success" | "error" | "info" = "success",
    ) => {
      const id = `${Date.now()}-${Math.random()}`;

      setState((current) => ({
        ...current,
        toast: { id, tone, message },
      }));

      window.setTimeout(() => {
        setState((current) =>
          current.toast?.id === id
            ? { ...current, toast: null }
            : current,
        );
      }, 3200);
    },
    [],
  );

  const toggleSelection = useCallback((brandId: string) => {
    setState((current) => {
      const exists = current.selectedBrandIds.includes(brandId);

      return {
        ...current,
        selectedBrandIds: exists
          ? current.selectedBrandIds.filter((id) => id !== brandId)
          : [...current.selectedBrandIds, brandId],
      };
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setState((current) => {
      const visibleIds = visibleBrands.map((brand) => brand.id);
      const allSelected = visibleIds.every((id) =>
        current.selectedBrandIds.includes(id),
      );

      return {
        ...current,
        selectedBrandIds: allSelected
          ? current.selectedBrandIds.filter(
              (id) => !visibleIds.includes(id),
            )
          : Array.from(
              new Set([...current.selectedBrandIds, ...visibleIds]),
            ),
      };
    });
  }, [visibleBrands]);

  const saveBrand = useCallback(
    async (
      values: BrandFormValues,
      existingBrandId?: string,
    ): Promise<boolean> => {
      setState((current) => ({ ...current, isSaving: true }));

      try {
        const { createBrand, updateBrand } = await import("@/lib/actions/brands");
        const formData = new FormData();
        formData.set("name", values.name.trim());
        formData.set("logo_asset", "");
        const result = existingBrandId
          ? await updateBrand(existingBrandId, formData)
          : await createBrand(formData);
        if (result.error) {
          setState((current) => ({ ...current, isSaving: false }));
          setToast(result.error.message, "error");
          return false;
        }
        await loadBrands();
        setState((current) => ({
          ...current,
          dialog: null,
          isSaving: false,
          rowActionMenu: null,
        }));
        setToast(existingBrandId ? "Brand updated successfully." : "Brand added successfully.");
        return true;
      } catch {
        setState((current) => ({ ...current, isSaving: false }));
        setToast("Unable to save this brand.", "error");
        return false;
      }
    },
    [loadBrands, setToast],
  );

  const toggleBrandStatus = useCallback(
    (brandId: string) => {
      const brand = state.brands.find((item) => item.id === brandId);
      if (!brand) return;

      const nextStatus: BrandStatus =
        brand.status === "active" ? "inactive" : "active";

      setState((current) => ({
        ...current,
        brands: current.brands.map((item) =>
          item.id === brandId ? { ...item, status: nextStatus } : item,
        ),
        rowActionMenu: null,
      }));

      setToast(
        nextStatus === "active"
          ? `${brand.name} activated.`
          : `${brand.name} deactivated.`,
      );
    },
    [setToast, state.brands],
  );

  const requestDelete = useCallback((brandId: string) => {
    setState((current) => ({
      ...current,
      deleteTarget: brandId,
      rowActionMenu: null,
    }));
  }, []);

  const cancelDelete = useCallback(() => {
    setState((current) => ({
      ...current,
      deleteTarget: null,
    }));
  }, []);

  const confirmDelete = useCallback(async () => {
    const brand = state.brands.find((item) => item.id === state.deleteTarget);
    if (!brand) return;

    try {
      const { deleteBrand } = await import("@/lib/actions/brands");
      const result = await deleteBrand(brand.id);
      if (result.error) {
        setState((current) => ({ ...current, deleteTarget: null }));
        setToast(result.error.message, "error");
        return;
      }
      await loadBrands();
      setState((current) => ({
        ...current,
        selectedBrandIds: current.selectedBrandIds.filter(
          (id) => id !== brand.id,
        ),
        rowActionMenu: null,
        dialog: null,
        deleteTarget: null,
      }));
      setToast(`${brand.name} deleted.`, "info");
    } catch {
      setState((current) => ({ ...current, deleteTarget: null }));
      setToast(`Unable to delete ${brand.name}.`, "error");
    }
  }, [loadBrands, setToast, state.brands, state.deleteTarget]);

  const exportBrands = useCallback(
    async (format: "csv" | "json") => {
      setState((current) => ({
        ...current,
        isExporting: true,
        exportMenu: { open: false },
      }));

      await new Promise((resolve) => window.setTimeout(resolve, 250));

      const source =
        state.selectedBrandIds.length > 0
          ? state.brands.filter((brand) =>
              state.selectedBrandIds.includes(brand.id),
            )
          : filteredBrands;

      if (format === "json") {
        const blob = new Blob([JSON.stringify(source, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "athletica-brands.json";
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        const headers = [
          "Brand",
          "Tagline",
          "Products",
          "Amazon Clicks",
          "CTR",
          "Status",
          "Added",
        ];

        const rows = source.map((brand) =>
          [
            brand.name,
            brand.tagline,
            brand.products,
            brand.amazonClicks,
            `${brand.ctr}%`,
            brand.status,
            brand.addedAt,
          ]
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(","),
        );

        const blob = new Blob(
          [[headers.join(","), ...rows].join("\n")],
          { type: "text/csv;charset=utf-8" },
        );

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "athletica-brands.csv";
        anchor.click();
        URL.revokeObjectURL(url);
      }

      setState((current) => ({
        ...current,
        isExporting: false,
      }));

      setToast(
        `${source.length} brand${source.length === 1 ? "" : "s"} exported.`,
      );
    },
    [filteredBrands, setToast, state.brands, state.selectedBrandIds],
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement;

      if (!target.closest("[data-brand-export-menu]")) {
        closeExportMenu();
      }

      if (!target.closest("[data-brand-row-menu]")) {
        closeRowActionMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeExportMenu();
        closeRowActionMenu();
        closeFilterPanel();
        closeDialog();
        closeMobileNav();
        cancelDelete();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    cancelDelete,
    closeDialog,
    closeExportMenu,
    closeFilterPanel,
    closeMobileNav,
    closeRowActionMenu,
  ]);

  useEffect(() => {
    setState((current) =>
      current.page > totalPages
        ? { ...current, page: totalPages }
        : current,
    );
  }, [totalPages]);

  return {
    state,
    filteredBrands,
    visibleBrands,
    totalPages,
    safePage,

    metrics,

    topPerformingBrands,
    recentlyAddedBrands,

    setSearch,
    setStatusFilter,
    setProductFilter,
    setSort,
    resetFilters,

    setPage,
    setRowsPerPage,

    openAddDialog,
    openEditDialog,
    openViewDialog,
    closeDialog,

    toggleRowActionMenu,
    closeRowActionMenu,

    toggleExportMenu,
    closeExportMenu,

    toggleFilterPanel,
    closeFilterPanel,

    toggleMobileNav,
    closeMobileNav,

    toggleSelection,
    selectAllVisible,

    saveBrand,
    toggleBrandStatus,
    requestDelete,
    cancelDelete,
    confirmDelete,
    exportBrands,

    loadBrands,
  };
}
