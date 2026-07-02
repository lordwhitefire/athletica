import { cache } from "react";
import * as fs from "fs";
import * as path from "path";
import type { HomepageConfig, HomepageSection, ProductCarouselSection } from "@/types/homepage";
import type { Product, ActiveFilters } from "@/types/product";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";
import { filterProducts } from "@/lib/filterProducts";

// Helper function to resolve CDN URLs
function resolveCdnUrl(url: string): string {
  if (!url) return url;
  return url;
}

function resolveHomepageImages(config: Record<string, unknown>): Record<string, unknown> {
  const resolved = { ...config };

  if (resolved.hero_carousel) {
    const hero = { ...(resolved.hero_carousel as Record<string, unknown>) };
    if (Array.isArray(hero.banners)) {
      hero.banners = (hero.banners as Record<string, unknown>[]).map((banner) => {
        const b = { ...banner };
        b.image = resolveCdnUrl(b.image as string);
        return b;
      });
    }
    resolved.hero_carousel = hero;
  }

  if (Array.isArray(resolved.sections)) {
    resolved.sections = (resolved.sections as Record<string, unknown>[]).map((section) => {
      const s = { ...section };
      if (s.type === "category_carousel" && !s.variant) {
        s.variant = "default";
      }
      if (s.type === "product_carousel" && !s.variant) {
        s.variant = "default";
      }
      if (s.type === "category_grid" && Array.isArray(s.items)) {
        s.items = (s.items as Record<string, unknown>[]).map((item) => {
          const it = { ...item };
          it.image = resolveCdnUrl(it.image as string);
          return it;
        });
      }
      if (s.type === "category_carousel" && Array.isArray(s.cards)) {
        s.cards = (s.cards as Record<string, unknown>[]).map((card) => {
          const c = { ...card };
          c.image = resolveCdnUrl(c.image as string);
          return c;
        });
      }
      return s;
    });
  }

  return resolved;
}

const getCachedHomepage = cache(async (): Promise<ApiResult<HomepageConfig>> => {
  try {
    const jsonPath = path.join(process.cwd(), "data", "homepage.json");
    console.log("📁 Reading homepage JSON from:", jsonPath);
    
    const rawData = JSON.parse(await fs.promises.readFile(jsonPath, "utf-8"));
    
    // Transform Sanity data into the frontend shape
    const transformed = {
      hero_carousel: {
        banners: ((rawData.hero_carousel || {}).banners as Record<string, unknown>[] | undefined)?.map((banner: Record<string, unknown>) => ({
          _key: banner._key,
          id: banner.id || banner._key || "",
          title: banner.title || "",
          subtitle: banner.subtitle || "",
          button_text: banner.button_text || "",
          link: banner.link || "/",
          gradient: banner.gradient || "",
          accent_color: banner.accent_color || "",
          image: banner.image || "",
        })) || [],
        auto_switch_ms: 4000,
      },
      sections: (rawData.sections || []).map((section: Record<string, unknown>) => ({
        id: section.id || section._key || "",
        type: section.type || section._type || "category_grid",
        variant: section.variant || section.type || section._type || "grid-4-equal",
        title: section.title || "",
        subtitle: section.subtitle || "",
        bg: section.bg || "bg-surface",
        items: ((section.items || []) as Record<string, unknown>[]).map((item: Record<string, unknown>) => ({
          _key: item._key,
          label: item.title || item.label || "",
          link: item.link || "/",
          bg: item.bg || "bg-surface",
          textColor: item.textColor || "text-on-surface",
          accent: item.accent || "",
          image: item.image || item.image_asset || "",
        })),
        filter: section.filter || null,
        link: section.link || "",
        link_label: section.link_label || "",
        sort: section.sort || "newest",
        limit: section.limit ?? 10,
        viewAllLink: section.link || "",
        viewAllLabel: section.link_label || "",
        cards: ((section.cards || []) as Record<string, unknown>[]).map((card: Record<string, unknown>) => ({
          _key: card._key,
          id: card.id || card._key || "",
          title: card.title || "",
          subtitle: card.subtitle || "",
          link: card.link || "/",
          gradient: card.gradient || "",
          emoji: card.emoji || "",
          image: card.image || "",
        })),
        autoSwitchMs: section.autoSwitchMs ?? section.auto_switch_ms ?? 4000,
      })),
    };
    
    const resolved = resolveHomepageImages(transformed);
    console.log("✅ Successfully loaded homepage JSON with", transformed.sections?.length || 0, "sections");
    return ok(resolved as unknown as HomepageConfig);
  } catch (err) {
    console.error("❌ Error reading homepage JSON:", err instanceof Error ? err.message : err);
    return fromCaughtError(err, "homepage_json_fetch_failed");
  }
});

export async function getHomepageConfig(): Promise<ApiResult<HomepageConfig>> {
  return getCachedHomepage();
}

export async function getHomepageSections(): Promise<ApiResult<HomepageSection[]>> {
  const result = await getHomepageConfig();
  if (result.error) return result;
  return ok(result.data.sections);
}

function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    ...raw,
    brand: typeof raw.brand === "object" && raw.brand ? (raw.brand as Record<string, unknown>).name as string : raw.brand as string,
  } as Product;
}

const getCachedProductsFromJson = cache(async (): Promise<Product[]> => {
  const productsDir = path.join(process.cwd(), "data", "products");
  const files = await fs.promises.readdir(productsDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const products: Product[] = [];
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(productsDir, file);
      const raw = JSON.parse(await fs.promises.readFile(filePath, "utf-8"));
      products.push(normalizeProduct(raw));
    } catch {
      // skip malformed files
    }
  }
  return products;
});

const TRACTION_CODES = ["FG", "AG", "MG", "SG", "TF", "IC", "HG"];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const KNOWN_BRANDS: Record<string, string> = {
  adidas: "Adidas",
  nike: "Nike",
  puma: "Puma",
  mizuno: "Mizuno",
  joma: "Joma",
  diadora: "Diadora",
  lotto: "Lotto",
  munich: "Munich",
  kelme: "Kelme",
};

const CATEGORY_ALIASES: Record<string, string> = {
  boots: "Boots",
  "football-boots": "Boots",
  "multi-stud-boots": "Multi-Stud Boots",
  "indoor-shoes": "Indoor Shoes",
  "shin-guards": "Shin Guards",
};

function deriveFilterFromLink(link: string): ActiveFilters {
  const slug = link.replace(/^\//, "").toLowerCase().trim();
  if (!slug) return {};

  // Path-based links: /boots/adidas/predator
  if (slug.includes("/")) {
    const segments = slug.split("/").filter(Boolean);
    const filters: ActiveFilters = {};

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      const tractionCode = TRACTION_CODES.find(
        (c) => c.toLowerCase() === seg
      );
      if (tractionCode) {
        filters.traction = [tractionCode];
        continue;
      }

      const brand = KNOWN_BRANDS[seg];
      if (brand) {
        filters.brand = [brand];
        continue;
      }

      // First non-brand, non-traction segment → category
      if (!filters.category && !filters.brand) {
        const alias = CATEGORY_ALIASES[seg];
        filters.category = [alias || capitalize(seg)];
        continue;
      }

      // Remaining segments → model
      const modelParts = filters.model
        ? [...filters.model[0].split(" "), capitalize(seg)]
        : [capitalize(seg)];
      filters.model = [modelParts.join(" ")];
    }

    return filters;
  }

  // Dash-based fallback: /adidas-x-crazyfast-football-boots
  const parts = slug.split("-");

  // Multi-word brand: "new balance"
  if (parts[0] === "new" && parts[1] === "balance") {
    return { brand: ["New Balance"] };
  }

  // Traction at start
  const firstTraction = TRACTION_CODES.find(
    (c) => c.toLowerCase() === parts[0]
  );
  if (firstTraction) {
    const rest = parts.slice(1)
      .map((w) => capitalize(w))
      .join(" ");
    const result: ActiveFilters = { traction: [firstTraction] };
    if (rest) {
      const alias = CATEGORY_ALIASES[rest.toLowerCase()];
      result.category = [alias || rest];
    }
    return result;
  }

  // Known brand at start
  const first = parts[0];
  if (first && KNOWN_BRANDS[first]) {
    const brand = KNOWN_BRANDS[first];
    const rest = parts.slice(1)
      .filter((w) => !KNOWN_BRANDS[w])
      .map((w) => capitalize(w))
      .join(" ");
    const result: ActiveFilters = { brand: [brand] };
    if (rest) {
      const cleaned = rest
        .replace(/\b(Football Boots?|Boots?|Shoes?)\b/gi, "")
        .trim();
      if (cleaned) result.model = [cleaned];
    }
    return result;
  }

  // Default: category
  const catSlug = parts.join(" ");
  const alias = CATEGORY_ALIASES[catSlug.toLowerCase()];
  const category = alias || parts.map((w) => capitalize(w)).join(" ");
  return { category: [category] };
}

const getCachedProductsForCarousel = cache(
  async (section: ProductCarouselSection): Promise<ApiResult<Product[]>> => {
    try {
      const allProducts = await getCachedProductsFromJson();

      const filters = deriveFilterFromLink(section.link || "/");
      filters.sort = section.sort || "newest";

      const filtered = filterProducts(allProducts, filters);

      const limit = section.limit ?? 10;
      return ok(filtered.slice(0, limit));
    } catch (err) {
      console.error(`🛒 Carousel "${section.title}": ERROR`, err);
      return fromCaughtError(err, "product_carousel_fetch_failed");
    }
  }
);

export async function getProductsForCarousel(section: ProductCarouselSection): Promise<ApiResult<Product[]>> {
  return getCachedProductsForCarousel(section);
}