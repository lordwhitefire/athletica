import { getCachedProducts, getFeaturedProducts } from './product-service';
import { toPageProductSummary } from './product-adapter';
import type { ProductFilters } from './types';
import type { ProductCarouselSection } from '@/types/homepage';
import type { Product } from '@/types/product';

const TRACTION_CODES = ['FG', 'AG', 'MG', 'SG', 'TF', 'IC', 'HG'];

const KNOWN_BRANDS: Record<string, string> = {
  adidas: 'Adidas',
  nike: 'Nike',
  puma: 'Puma',
  mizuno: 'Mizuno',
  joma: 'Joma',
  diadora: 'Diadora',
  lotto: 'Lotto',
  munich: 'Munich',
  kelme: 'Kelme',
};

const CATEGORY_ALIASES: Record<string, string> = {
  boots: 'Boots',
  'football-boots': 'Boots',
  'multi-stud-boots': 'Multi-Stud Boots',
  'indoor-shoes': 'Indoor Shoes',
  'shin-guards': 'Shin Guards',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function deriveProductFiltersFromLink(link: string | undefined): ProductFilters | null {
  const slug = (link || '/').replace(/^\//, '').toLowerCase().trim();
  if (!slug) return null;

  if (slug.includes('/')) {
    const segments = slug.split('/').filter(Boolean);
    const filters: ProductFilters = {};

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      if (TRACTION_CODES.some(c => c.toLowerCase() === seg)) {
        filters.traction = seg.toUpperCase();
        continue;
      }

      if (KNOWN_BRANDS[seg]) {
        filters.brand = slugify(KNOWN_BRANDS[seg]);
        continue;
      }

      if (!filters.category && !filters.brand) {
        const alias = CATEGORY_ALIASES[seg];
        filters.category = slugify(alias || capitalize(seg));
        continue;
      }

      // Remaining segments → model path (e.g. "Predator" or "Predator/Elite-FG")
      const modelParts = filters.model
        ? [...filters.model.split('/'), capitalize(seg)]
        : [capitalize(seg)];
      filters.model = modelParts.join('/');
    }

    return Object.keys(filters).length > 0 ? filters : null;
  }

  const parts = slug.split('-');

  if (parts[0] === 'new' && parts[1] === 'balance') {
    return { brand: 'new-balance' };
  }

  const firstTraction = TRACTION_CODES.find(c => c.toLowerCase() === parts[0]);
  if (firstTraction) {
    const rest = parts.slice(1)
      .map(w => capitalize(w))
      .join(' ');
    const result: ProductFilters = { traction: firstTraction.toUpperCase() };
    if (rest) {
      const alias = CATEGORY_ALIASES[rest.toLowerCase()];
      result.category = slugify(alias || rest);
    }
    return result;
  }

  const first = parts[0];
  if (first && KNOWN_BRANDS[first]) {
    const rest = parts.slice(1)
      .filter(w => !KNOWN_BRANDS[w])
      .map(w => capitalize(w))
      .join(' ');
    const result: ProductFilters = { brand: slugify(KNOWN_BRANDS[first]) };
    if (rest) {
      const cleaned = rest
        .replace(/\b(Football Boots?|Boots?|Shoes?)\b/gi, '')
        .trim();
      if (cleaned) result.model = cleaned;
    }
    return result;
  }

  const catSlug = parts.join(' ');
  const alias = CATEGORY_ALIASES[catSlug.toLowerCase()];
  return { category: slugify(alias || parts.map(w => capitalize(w)).join(' ')) };
}

export async function getProductsForCarouselSection(
  section: ProductCarouselSection
): Promise<Product[]> {
  const filters = deriveProductFiltersFromLink(section.link);
  const limit = section.limit ?? 10;

  if (!filters) {
    const featured = await getFeaturedProducts({ limit });
    return featured.map(toPageProductSummary);
  }

  const result = await getCachedProducts({
    ...filters,
    page: 1,
    pageSize: limit,
    sort: section.sort === 'biggest_discount' ? 'newest' : section.sort,
  });
  return result.items.map(toPageProductSummary);
}
