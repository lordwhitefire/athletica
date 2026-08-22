import { unstable_cache } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";
import { sanityCdnUrl } from "@/lib/sanity-client";
import { slugify } from "@/lib/rebuild-nav-urls";
import { splitModel } from "@/lib/model";
import type {
  HomepageConfig,
  HomepageSection,
  ProductCarouselSection,
  CategoryCarouselSection,
  CategoryGridSection,
  HeroBanner,
  CategoryCard,
  CategoryGridItem,
} from "@/types/homepage";
import type { NavigationData, NavItem } from "@/types/navigation";

type HomepageSectionsRow = Database["public"]["Tables"]["homepage_sections"]["Row"];
type NavigationRow = Database["public"]["Tables"]["navigation"]["Row"];
type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];
type EditorialContentRow = Database["public"]["Tables"]["editorial_content"]["Row"];

export const CONTENT_TAG = "content";

function rowAttributes(row: HomepageSectionsRow): Record<string, unknown> {
  return (row.attributes ?? {}) as Record<string, unknown>;
}

export function toContentImageUrl(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  if (value.startsWith("image-")) return sanityCdnUrl(value);
  return value;
}

function extractImageRef(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const asset = (value as Record<string, unknown>).asset;
    if (asset && typeof asset === "object") {
      const ref = (asset as Record<string, unknown>)._ref;
      if (typeof ref === "string") return ref;
    }
  }
  return null;
}

function normalizeStoredImage(value: unknown): string | null {
  const ref = extractImageRef(value);
  if (!ref) return null;
  return toContentImageUrl(ref);
}

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

async function readHomepageSections(): Promise<HomepageSectionsRow[]> {
  const { data, error } = await adminSupabase
    .from("homepage_sections")
    .select("*")
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HomepageSectionsRow[];
}

function heroBannerFromRow(row: HomepageSectionsRow): HeroBanner {
  const attrs = rowAttributes(row);
  return {
    id: typeof attrs.original_id === "string" && attrs.original_id ? attrs.original_id : `hero-${row.order}`,
    title: row.title ?? "",
    subtitle: row.copy ?? "",
    button_text: typeof attrs.button_text === "string" ? attrs.button_text : "",
    link: typeof attrs.link === "string" && attrs.link ? attrs.link : "/",
    gradient: typeof attrs.gradient === "string" ? attrs.gradient : "",
    accent_color: typeof attrs.accent_color === "string" ? attrs.accent_color : "",
    image: normalizeStoredImage(row.image_links?.[0] ?? null),
  };
}

function gridItemsFromRow(row: HomepageSectionsRow): CategoryGridItem[] {
  const attrs = rowAttributes(row);
  const items = Array.isArray(attrs.items) ? (attrs.items as Record<string, unknown>[]) : [];
  const fallbackImages = row.image_links ?? [];
  return items.map((item, i) => ({
    _key: typeof item._key === "string" ? item._key : `${row.id}-${i}`,
    label: typeof item.title === "string" ? item.title : typeof item.label === "string" ? item.label : "",
    link: typeof item.link === "string" && item.link ? item.link : "/",
    bg: typeof item.bg === "string" ? item.bg : "bg-surface",
    textColor: typeof item.textColor === "string" ? item.textColor : "text-on-surface",
    accent: typeof item.accent === "string" ? item.accent : "",
    image: normalizeStoredImage(item.image) || toContentImageUrl(fallbackImages[i]) || "",
  }));
}

function carouselCardsFromRow(row: HomepageSectionsRow): CategoryCard[] {
  const attrs = rowAttributes(row);
  const cards = Array.isArray(attrs.cards) ? (attrs.cards as Record<string, unknown>[]) : [];
  const fallbackImages = row.image_links ?? [];
  return cards.map((card, i) => ({
    _key: typeof card._key === "string" ? card._key : card.id,
    id: typeof card.id === "string" && card.id ? card.id : `${row.id}-card-${i}`,
    title: typeof card.title === "string" ? card.title : "",
    subtitle: typeof card.subtitle === "string" ? card.subtitle : "",
    link: typeof card.link === "string" && card.link ? card.link : "/",
    gradient: typeof card.gradient === "string" ? card.gradient : "",
    emoji: typeof card.emoji === "string" ? card.emoji : "",
    image: normalizeStoredImage(card.image) || toContentImageUrl(fallbackImages[i]) || "",
  }));
}

function sectionFromRow(row: HomepageSectionsRow): HomepageSection | null {
  const attrs = rowAttributes(row);
  const originalType =
    typeof attrs.original_type === "string"
      ? attrs.original_type
      : row.type === "grid"
        ? "category_grid"
        : "product_carousel";
  const baseId = typeof attrs.original_id === "string" && attrs.original_id ? attrs.original_id : row.id;

  if (originalType === "category_grid") {
    const section: CategoryGridSection = {
      id: baseId,
      type: "category_grid",
      title: row.title ?? "",
      variant:
        ((typeof attrs.variant === "string" ? attrs.variant : "") ||
          "grid-4-equal") as CategoryGridSection["variant"],
      bg: typeof attrs.bg === "string" && attrs.bg ? attrs.bg : "bg-surface",
      items: gridItemsFromRow(row),
    };
    if (typeof attrs.link === "string" && attrs.link) section.viewAllLink = attrs.link;
    if (typeof attrs.link_label === "string" && attrs.link_label) section.viewAllLabel = attrs.link_label;
    return section;
  }

  if (originalType === "category_carousel") {
    const section: CategoryCarouselSection = {
      id: baseId,
      type: "category_carousel",
      title: row.title ?? "",
      variant: ((typeof attrs.variant === "string" ? attrs.variant : "") ||
        "default") as CategoryCarouselSection["variant"],
      autoSwitchMs: typeof attrs.autoSwitchMs === "number" ? attrs.autoSwitchMs : 4000,
      cards: carouselCardsFromRow(row),
    };
    return section;
  }

  const filter =
    attrs.filter && typeof attrs.filter === "object"
      ? (attrs.filter as ProductCarouselSection["filter"])
      : ({} as ProductCarouselSection["filter"]);
  const section: ProductCarouselSection = {
    id: baseId,
    type: "product_carousel",
    title: row.title ?? "",
    variant: ((typeof attrs.variant === "string" ? attrs.variant : "") ||
      "default") as ProductCarouselSection["variant"],
    subtitle: row.copy ?? undefined,
    filter,
    sort:
      (typeof attrs.sort === "string" ? (attrs.sort as ProductCarouselSection["sort"]) : "") ||
      "newest",
    limit: row.limit ?? 10,
    link: typeof attrs.link === "string" ? attrs.link : "",
    link_label: typeof attrs.link_label === "string" ? attrs.link_label : "",
  };
  return section;
}

async function buildHomepageConfig(): Promise<HomepageConfig> {
  const rows = await readHomepageSections();
  const heroRows = rows.filter((r) => r.type === "hero");
  const sectionRows = rows.filter((r) => r.type !== "hero");

  return {
    hero_carousel: {
      id: "hero-carousel",
      auto_switch_ms: 4000,
      banners: heroRows.map(heroBannerFromRow),
    },
    sections: sectionRows
      .map(sectionFromRow)
      .filter((s): s is HomepageSection => s !== null),
  };
}

export const getCachedHomepageConfig = unstable_cache(buildHomepageConfig, ["content-homepage"], {
  revalidate: 60,
  tags: [CONTENT_TAG],
});

export async function getHomepageConfig(): Promise<ApiResult<HomepageConfig>> {
  try {
    return ok(await getCachedHomepageConfig());
  } catch (err) {
    return fromCaughtError(err, "homepage_fetch_failed");
  }
}

export async function getHomepageSections(): Promise<ApiResult<HomepageSection[]>> {
  const result = await getHomepageConfig();
  if (result.error) return result;
  return ok(result.data.sections);
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

async function readNavigationRows(): Promise<NavigationRow[]> {
  const { data, error } = await adminSupabase
    .from("navigation")
    .select("*")
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as NavigationRow[];
}

function navItemFromRow(row: NavigationRow, depth: number, childrenOf: Map<string | null, NavigationRow[]>): NavItem {
  const children = (childrenOf.get(row.id) ?? []).map((child) =>
    navItemFromRow(child, depth + 1, childrenOf),
  );
  return {
    id: row.id,
    level: depth,
    label: row.label,
    href: row.route ?? null,
    slug: row.id,
    children: children.length > 0 ? children : undefined,
  };
}

async function buildNavigationData(): Promise<NavigationData[]> {
  const rows = await readNavigationRows();
  const childrenOf = new Map<string | null, NavigationRow[]>();
  for (const row of rows) {
    const key = row.parent_id ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(row);
  }
  return (childrenOf.get(null) ?? []).map((root) => {
    const children = (childrenOf.get(root.id) ?? []).map((child) =>
      navItemFromRow(child, 1, childrenOf),
    );
    return {
      id: root.id,
      level: 0,
      slug: root.id,
      label: root.label,
      href: root.route ?? "",
      children,
    };
  });
}

export const getCachedNavigation = unstable_cache(buildNavigationData, ["content-navigation"], {
  revalidate: 60,
  tags: [CONTENT_TAG],
});

export async function getNavigation(): Promise<ApiResult<NavigationData[]>> {
  try {
    return ok(await getCachedNavigation());
  } catch (err) {
    return fromCaughtError(err, "navigation_fetch_failed");
  }
}

export function flattenNavigation(items: NavItem[]): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    acc.push(item);
    if (item.children && item.children.length > 0) {
      acc.push(...flattenNavigation(item.children));
    }
    return acc;
  }, []);
}

export async function findNavItemByHref(href: string): Promise<ApiResult<NavItem | undefined>> {
  const result = await getNavigation();
  if (result.error) return result;
  const allItems = result.data.flatMap((n) => flattenNavigation(n.children || []));
  return ok(allItems.find((item) => item.href === href));
}

export async function getBreadcrumbs(href: string): Promise<ApiResult<NavItem[]>> {
  const result = await getNavigation();
  if (result.error) return result;
  const nav = result.data;
  const breadcrumbs: NavItem[] = [];

  function searchTree(items: NavItem[], targetHref: string): boolean {
    for (const item of items) {
      if (item.href === targetHref) {
        breadcrumbs.push(item);
        return true;
      }
      if (item.children && item.children.length > 0) {
        if (searchTree(item.children, targetHref)) {
          breadcrumbs.unshift(item);
          return true;
        }
      }
    }
    return false;
  }

  nav.forEach((n) => {
    if (n.children) {
      searchTree(n.children, href);
    }
  });

  return ok(breadcrumbs);
}

export interface ModelNavNode {
  label: string;
  children: ModelNavNode[];
}

export async function getModelNavTree(): Promise<ApiResult<ModelNavNode[]>> {
  const result = await getNavigation();
  if (result.error) return result;
  const nav = result.data;

  function buildTree(items: NavItem[]): ModelNavNode[] {
    const nodes: ModelNavNode[] = [];
    for (const item of items) {
      if (item.level < 3) {
        if (item.children) {
          nodes.push(...buildTree(item.children));
        }
        continue;
      }
      const label = item.label;
      if (!label) continue;
      nodes.push({
        label,
        children: item.children ? buildTree(item.children) : [],
      });
    }
    return nodes;
  }

  const rawNodes: ModelNavNode[] = [];
  for (const group of nav) {
    if (group.children) {
      rawNodes.push(...buildTree(group.children));
    }
  }

  const merged = new Map<string, ModelNavNode>();
  for (const node of rawNodes) {
    if (merged.has(node.label)) {
      const existing = merged.get(node.label)!;
      for (const child of node.children) {
        if (!existing.children.find((c) => c.label === child.label)) {
          existing.children.push(child);
        }
      }
    } else {
      merged.set(node.label, { label: node.label, children: [...node.children] });
    }
  }

  return ok([...merged.values()]);
}

function findFirstL1(nav: NavigationData[]): NavItem | undefined {
  for (const group of nav) {
    for (const child of group.children ?? []) {
      if (child.level === 1 && !child.disabled) return child;
    }
  }
  return undefined;
}

function findDescendant(items: NavItem[], predicate: (item: NavItem) => boolean): NavItem | undefined {
  for (const item of items) {
    if (predicate(item)) return item;
    if (item.children) {
      const found = findDescendant(item.children, predicate);
      if (found) return found;
    }
  }
  return undefined;
}

export async function getMainCategoryHref(): Promise<string> {
  const result = await getNavigation();
  if (result.error) return "/";
  const l1 = findFirstL1(result.data);
  return l1?.href ?? "/";
}

export async function getMainCategoryLabel(): Promise<string> {
  const result = await getNavigation();
  if (result.error) return "Products";
  const l1 = findFirstL1(result.data);
  return l1?.label ?? "Products";
}

function extractBrand(label: string): string {
  const multiWordBrands = ["New Balance"];
  for (const brand of multiWordBrands) {
    if (label.toLowerCase().startsWith(brand.toLowerCase())) return brand;
  }
  return label.split(" ")[0];
}

export async function getBrandCategoryHref(brand: string): Promise<string | null> {
  const result = await getNavigation();
  if (result.error) return null;
  const l1 = findFirstL1(result.data);
  if (!l1?.children) return null;
  const found = findDescendant(l1.children, (item) =>
    item.level >= 2 && extractBrand(item.label).toLowerCase() === brand.toLowerCase(),
  );
  return found?.href ?? null;
}

export async function getProductCategoryHref(product: {
  category?: string | null;
  brand?: string | null;
  model?: string | null;
}): Promise<string> {
  const result = await getNavigation();
  if (result.error) return "/";

  const allL1Items = result.data.flatMap((group) => group.children ?? []);
  const categorySlug = slugify(product.category ?? "");

  const l1 = allL1Items.find(
    (item) => item.level === 1 && slugify(item.label) === categorySlug,
  );
  if (!l1) return "/";

  const ids: string[] = [l1.id];
  let currentItems = l1.children;

  if (currentItems && product.brand) {
    const brandSlug = slugify(product.brand);
    const l2 = currentItems.find(
      (item) => item.level >= 2 && slugify(extractBrand(item.label)) === brandSlug,
    );
    if (l2) {
      ids.push(l2.id);
      currentItems = l2.children;
    }
  }

  const modelSegments = splitModel(product.model ?? "").slice(0, -1);
  for (const seg of modelSegments) {
    if (!currentItems) break;
    const segSlug = slugify(seg);
    const match = currentItems.find(
      (item) => item.level >= 3 && slugify(item.label) === segSlug,
    );
    if (match) {
      ids.push(match.id);
      currentItems = match.children;
    } else {
      break;
    }
  }

  return `/en/${ids.join("/")}`;
}

export function getTractionCategoryHref(traction: string): string {
  return `/en/traction/${slugify(traction)}`;
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

export interface SocialLink {
  label: string;
  url: string;
  icon?: string;
}
export interface FooterLink {
  label: string;
  href: string;
}
export interface LinkColumn {
  title: string;
  links: FooterLink[];
}
export interface SiteSettingsFooter {
  brand_name?: string;
  brand_description?: string;
  social_links?: SocialLink[];
  link_columns?: LinkColumn[];
  copyright?: string;
  bottom_tags?: string[];
}
export interface SiteSettingsData {
  site_name: string | null;
  tagline: string | null;
  contact_email: string | null;
  footer: SiteSettingsFooter;
  site_logo: string | null;
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function settingsFromRow(row: SiteSettingsRow): SiteSettingsData {
  const social = (row.social_links ?? {}) as Record<string, unknown>;
  const logoRaw = social.site_logo;
  return {
    site_name: row.site_name,
    tagline: row.tagline,
    contact_email: row.contact_email,
    footer: {
      brand_name: row.site_name ?? undefined,
      brand_description: row.tagline ?? undefined,
      social_links: parseJsonArray<SocialLink>(social.social_links),
      link_columns: parseJsonArray<LinkColumn>(social.footer_links),
      bottom_tags: parseJsonArray<string>(social.bottom_tags),
      copyright: typeof social.copyright === "string" ? social.copyright : undefined,
    },
    site_logo: typeof logoRaw === "string" && logoRaw ? toContentImageUrl(logoRaw) : null,
  };
}

async function buildSiteSettings(): Promise<SiteSettingsData | null> {
  const { data, error } = await adminSupabase
    .from("site_settings")
    .select("*")
    .limit(1);
  if (error) throw error;
  const row = (data ?? [])[0] as SiteSettingsRow | undefined;
  return row ? settingsFromRow(row) : null;
}

export const getCachedSiteSettings = unstable_cache(buildSiteSettings, ["content-site-settings"], {
  revalidate: 60,
  tags: [CONTENT_TAG],
});

export async function getSiteSettings(): Promise<ApiResult<SiteSettingsData | null>> {
  try {
    return ok(await getCachedSiteSettings());
  } catch (err) {
    return fromCaughtError(err, "site_settings_fetch_failed");
  }
}

export async function getSiteLogoUrl(): Promise<ApiResult<string | null>> {
  const result = await getSiteSettings();
  if (result.error) return result;
  return ok(result.data?.site_logo ?? null);
}

// ---------------------------------------------------------------------------
// Editorial content (read path only — no consumers yet by design)
// ---------------------------------------------------------------------------

async function buildEditorialContent(key: string): Promise<EditorialContentRow | null> {
  const { data, error } = await adminSupabase
    .from("editorial_content")
    .select("*")
    .eq("key", key)
    .limit(1);
  if (error) throw error;
  return ((data ?? []) as EditorialContentRow[])[0] ?? null;
}

export const getCachedEditorialContent = (key: string) =>
  unstable_cache(() => buildEditorialContent(key), ["content-editorial", key], {
    revalidate: 60,
    tags: [CONTENT_TAG],
  })();

export async function getEditorialContent(
  key: string,
): Promise<ApiResult<{ key: string; title: string | null; body: string | null; image_links: string[] } | null>> {
  try {
    const row = await getCachedEditorialContent(key);
    if (!row) return ok(null);
    return ok({
      key: row.key,
      title: row.title,
      body: row.body,
      image_links: row.image_links ?? [],
    });
  } catch (err) {
    return fromCaughtError(err, "editorial_content_fetch_failed");
  }
}
