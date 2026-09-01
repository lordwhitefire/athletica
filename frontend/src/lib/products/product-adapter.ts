import type { ProductSummary, ProductWithRelations, ProductFilters, FacetOptions } from './types';
import type { Product, Price, Size, Description, ColorVariant, FilterOptions, ActiveFilters } from '@/types/product';

interface AttrsPrice {
  current?: number;
  original?: number;
  discount_percent?: number;
  member_price?: number;
  currency?: string;
}

interface AttrsSizeDetail {
  size: string;
  available: boolean;
  stock: number;
}

const EMPTY_TECHNICAL_DETAILS = { range: '', sole_type: '', upper_material: '', adjustment: '' };

function parseDescription(raw: string | null | undefined): Description {
  if (!raw) {
    return {
      subtitle: '',
      tagline: '',
      intro: '',
      collection: '',
      key_benefits: [],
      technical_details: { ...EMPTY_TECHNICAL_DETAILS },
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      subtitle: parsed.subtitle ?? '',
      tagline: parsed.tagline ?? '',
      intro: parsed.intro ?? '',
      collection: parsed.collection ?? '',
      key_benefits: Array.isArray(parsed.key_benefits) ? parsed.key_benefits : [],
      technical_details: {
        range: parsed.technical_details?.range ?? '',
        sole_type: parsed.technical_details?.sole_type ?? '',
        upper_material: parsed.technical_details?.upper_material ?? '',
        adjustment: parsed.technical_details?.adjustment ?? '',
      },
    };
  } catch {
    return {
      subtitle: raw.slice(0, 160),
      tagline: '',
      intro: '',
      collection: '',
      key_benefits: [],
      technical_details: { ...EMPTY_TECHNICAL_DETAILS },
    };
  }
}

function buildPrice(input: { price: number | null; attributes: Record<string, unknown> }): Price {
  const attrs = (input.attributes?.price ?? {}) as AttrsPrice;
  const current = input.price ?? attrs.current ?? 0;
  return {
    current,
    original: attrs.original ?? current,
    discount_percent: attrs.discount_percent ?? 0,
    member_price: attrs.member_price ?? current,
    currency: attrs.currency ?? '€',
  };
}

function buildSizes(input: {
  sizes?: string[] | null;
  attributes: Record<string, unknown>;
}): Size[] {
  const detail = (input.attributes?.sizes_detail ?? []) as AttrsSizeDetail[];
  if (detail.length > 0) {
    return detail.map(d => ({ size: d.size, available: Boolean(d.available), stock: d.stock ?? 0 }));
  }
  return (input.sizes ?? []).map(size => ({ size, available: true, stock: 0 }));
}

function buildImages(input: { image_links: string[] | null }) {
  const links = input.image_links ?? [];
  const main_image = links[0] ?? '';
  return {
    main_image,
    thumbnail: links[0] ?? '',
    image_gallery: links.length > 1 ? links.slice(1) : undefined,
  };
}

function buildColorVariants(variants: ProductSummary[]): ColorVariant[] {
  return (variants ?? []).map(v => ({
    color: v.color ?? '',
    product_id: v.slug,
    thumbnail: v.image_links?.[0] ?? '',
  }));
}

export function toPageProduct(p: ProductWithRelations): Product {
  const images = buildImages(p);
  const attributes = p.attributes ?? {};
  return {
    id: p.id,
    url_slug: p.slug,
    model: p.model ?? '',
    brand: p.brand?.name ?? '',
    category: p.category?.name ?? '',
    traction: (attributes as { traction?: string }).traction ?? null,
    name: p.name ?? null,
    gender: p.gender ?? '',
    ...images,
    color: p.color ?? '',
    color_variants: buildColorVariants(p.color_variants ?? []),
    price: buildPrice(p),
    sizes: buildSizes(p),
    description: parseDescription(p.description as string | null),
  };
}

export function toPageProductSummary(p: ProductSummary): Product {
  const images = buildImages(p);
  const attributes = p.attributes ?? {};
  return {
    id: p.id,
    url_slug: p.slug,
    model: p.model ?? '',
    brand: p.brand?.name ?? '',
    category: p.category?.name ?? '',
    traction: (attributes as { traction?: string }).traction ?? null,
    name: p.name ?? null,
    gender: p.gender ?? '',
    ...images,
    color: p.color ?? '',
    color_variants: [],
    price: buildPrice(p),
    sizes: buildSizes({ attributes }),
    description: parseDescription(null),
  };
}

export function toFilterOptions(facets: FacetOptions): FilterOptions {
  return {
    brands: facets.brands.map(b => ({ name: b.name, logo: b.logo_link })),
    models: facets.models,
    tractions: facets.tractions,
    colors: facets.colors,
    categories: facets.categories,
    genders: facets.genders,
    min_price: facets.min_price,
    max_price: facets.max_price,
    sizes: facets.sizes,
  };
}

export function activeFiltersToProductFilters(active: ActiveFilters): ProductFilters {
  const filters: ProductFilters = {
    category: active.category?.[0],
    brand: active.brand?.[0],
    model: active.model?.[0],
    color: active.color?.[0],
    gender: active.gender?.[0],
    traction: active.traction?.[0],
    sizes: active.size?.length ? [active.size[0]] : undefined,
    priceMin: active.min_price,
    priceMax: active.max_price,
    sort: active.sort === 'biggest_discount' ? 'newest' : active.sort,
  };
  return filters;
}
