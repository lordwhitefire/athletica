export interface MediaAsset {
  id: string;
  filename: string;
  type: string;
  dims: string;
  url: string;
  usageText: string;
  used: boolean;
  sizeMb: number;
  addedAt: string;
}

export type MediaView = "grid" | "list";

export interface FilterState {
  used: boolean;
  unused: boolean;
  jpg: boolean;
  png: boolean;
  webp: boolean;
}

export interface PendingFile {
  name: string;
  size: number;
  url: string;
}

export type PopoverKey = "type" | "usage" | "folder" | "sort" | "perPage" | "profile";

export interface PopoverOption {
  value: string;
  label: string;
  active?: boolean;
  danger?: boolean;
  dividerBefore?: boolean;
}

export interface PopoverState {
  x: number;
  y: number;
  width: number;
  key: PopoverKey;
  options: PopoverOption[];
}

export interface ContextMenuState {
  x: number;
  y: number;
  index: number;
}

export interface ToastState {
  id: number;
  message: string;
  type: "success" | "error";
}

export type ConfirmKind = "delete" | "bulk" | "usage";

export interface ConfirmState {
  kind: ConfirmKind;
  title: string;
  text?: string;
  items?: string[];
}

export interface PersistedMediaState {
  starred: string[];
  view: MediaView;
  sort: string;
  perPage: number;
}

export interface MediaLibraryState {
  assets: MediaAsset[];
  query: string;
  type: string;
  usage: string;
  folder: string;
  sort: string;
  view: MediaView;
  page: number;
  perPage: number;
  selected: Set<number>;
  starred: Set<number>;
  activeIndex: number | null;
  mobileDetailOpen: boolean;
  filterOpen: boolean;
  filters: FilterState;
  sizeFilter: string;
  dateFilter: string;
  popover: PopoverState | null;
  context: ContextMenuState | null;
  uploadOpen: boolean;
  replaceIndex: number | null;
  pendingFiles: PendingFile[];
  confirm: ConfirmState | null;
  deleteIndex: number | null;
  lightboxIndex: number | null;
  toasts: ToastState[];
}