export interface HomepageSection {
  id: string;
  name: string;
  desc: string;
  type: string;
  active: boolean;
  views: string;
  ctr: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  linkType?: string;
  linkValue?: string;
  spark: number[];
  lazyLoad?: boolean;
  align?: "left" | "center" | "right";
  desktopLayout?: string;
  mobileLayout?: string;
  visibleDesktop?: boolean;
  visibleTablet?: boolean;
  visibleMobile?: boolean;
  scheduled?: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
}

export type EditorTab = "content" | "settings" | "visibility";

export type TopTab = "sections" | "settings";

export interface ToastState {
  title: string;
  message: string;
  type: "success" | "error";
}

export interface ContextMenuState {
  x: number;
  y: number;
  sectionId: string;
}

export interface HomepageManagementState {
  sections: HomepageSection[];
  selectedId: string;
  editorTab: EditorTab;
  topTab: TopTab;
  editorOpen: boolean;
  isMobile: boolean;
  reorder: boolean;
  dirty: boolean;
  pendingDelete: string | null;
  addType: string;
  imageIndex: string;
  selectedImage: string;
  heroRemoved: boolean;
  previewOpen: boolean;
  addOpen: boolean;
  imageOpen: boolean;
  contextMenu: ContextMenuState | null;
  toast: ToastState | null;
  confirmCloseOpen: boolean;
}
