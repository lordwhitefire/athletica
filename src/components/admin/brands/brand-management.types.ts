export type BrandStatus = "active" | "inactive";

export type Brand = {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  products: number;
  amazonClicks: number;
  ctr: number;
  status: BrandStatus;
  addedAt: string;

  /**
   * Optional fields used by the interaction/editor surface.
   * They do not change the existing presentation until edited.
   */
  description?: string;
  website?: string;
  slug?: string;
};

export type BrandSort =
  | "most-products"
  | "least-products"
  | "most-clicks"
  | "least-clicks"
  | "highest-ctr"
  | "lowest-ctr"
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc";

export type BrandProductFilter = "all" | "1000-plus" | "500-999" | "under-500";

export type BrandStatusFilter = "all" | BrandStatus;

export type BrandFilters = {
  search: string;
  status: BrandStatusFilter;
  products: BrandProductFilter;
  sort: BrandSort;
};

export type BrandDialog =
  | { type: "add" }
  | { type: "edit"; brandId: string }
  | { type: "view"; brandId: string }
  | null;

export type BrandActionMenu =
  | { brandId: string }
  | null;

export type ExportFormat = "csv" | "json";

export type ExportMenuState = {
  open: boolean;
};

export type FilterPanelState = {
  open: boolean;
};

export type MobileNavState = {
  open: boolean;
};

export type ToastState = {
  id: string;
  tone: "success" | "error" | "info";
  message: string;
} | null;

export type BrandFormValues = {
  name: string;
  tagline: string;
  description: string;
  website: string;
  slug: string;
  status: BrandStatus;
};

export type BrandManagementState = {
  brands: Brand[];
  filters: BrandFilters;
  page: number;
  rowsPerPage: number;

  dialog: BrandDialog;
  rowActionMenu: BrandActionMenu;

  exportMenu: ExportMenuState;
  filterPanel: FilterPanelState;
  mobileNav: MobileNavState;

  toast: ToastState;
  selectedBrandIds: string[];
  isSaving: boolean;
  isExporting: boolean;
  deleteTarget: string | null;
};
