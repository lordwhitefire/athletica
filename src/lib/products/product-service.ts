import { adminSupabase } from '@/lib/supabase/admin';
import { unstable_cache } from 'next/cache';
import type {
  ProductSummary,
  ProductWithRelations,
  ProductFilters,
  PaginatedResult,
  ModelsRow,
  ProductsRow,
  FacetOptions,
  RelatedProductsOptions,
  FeaturedProductsOptions,
  CatalogStats,
  CategoryCount,
} from './types';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

function buildCacheKey(prefix: string, params: Record<string, unknown>): string {
  return `${prefix}:${JSON.stringify(params)}`;
}

async function getCategoryIdBySlug(slug: string): Promise<string | null> {
  const { data } = await adminSupabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id || null;
}

async function getBrandIdBySlug(slug: string): Promise<string | null> {
  const { data } = await adminSupabase
    .from('brands')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id || null;
}

async function getLeafModelIdsUnderRoot(rootModelId: string): Promise<string[]> {
  const { data, error } = await adminSupabase.rpc('get_leaf_model_ids_under_root', {
    root_model_id: rootModelId,
  });

  if (error) {
    console.error('Error fetching leaf models under root:', error);
    return [];
  }

  return (data as { id: string }[]).map(d => d.id);
}

async function getLeafModelIdsUnderSubModel(subModelId: string): Promise<string[]> {
  const { data, error } = await adminSupabase.rpc('get_leaf_model_ids_under_submodel', {
    sub_model_id: subModelId,
  });

  if (error) {
    console.error('Error fetching leaf models under submodel:', error);
    return [];
  }

  return (data as { id: string }[]).map(d => d.id);
}

// Use any for query type to avoid PostgREST generic complexity
type ProductsQuery = any;

function applyFilters(
  query: ProductsQuery,
  filters: ProductFilters
): ProductsQuery {
  let q = query;

  if (filters.status === 'published' || filters.status === 'unpublished') {
    q = q.eq('status', filters.status);
  } else if (filters.status !== 'all') {
    q = q.eq('status', 'published');
  }

  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      q = q.or(`name.ilike.%${term}%,model.ilike.%${term}%,color.ilike.%${term}%`);
    }
  }

  if (filters.gender) {
    q = q.ilike('gender', filters.gender);
  }

  if (filters.color) {
    q = q.ilike('color', filters.color);
  }

  if (filters.traction) {
    q = q.eq('attributes->>traction', filters.traction);
  }

  if (filters.sizes && filters.sizes.length > 0) {
    q = q.contains('attributes', {
      sizes_detail: filters.sizes.map(size => ({ size, available: true })),
    });
  }

  if (filters.priceMin !== undefined) {
    q = q.gte('price', filters.priceMin);
  }

  if (filters.priceMax !== undefined) {
    q = q.lte('price', filters.priceMax);
  }

  if (filters.missingData) {
    switch (filters.missingData) {
      case 'asin':
        q = q.is('asin', null);
        break;
      case 'image':
        q = q.or('image_links.is.null,image_links.eq.{}');
        break;
      case 'category':
        q = q.is('category_id', null);
        break;
      case 'model':
        q = q.is('leaf_model_id', null);
        break;
      case 'none':
        q = q
          .not('asin', 'is', null)
          .not('image_links', 'is', null)
          .not('category_id', 'is', null)
          .not('leaf_model_id', 'is', null);
        break;
    }
  }

  return q;
}

function applySort(
  query: ProductsQuery,
  sort?: ProductFilters['sort']
): ProductsQuery {
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    price_asc: { column: 'price', ascending: true },
    price_desc: { column: 'price', ascending: false },
    name_asc: { column: 'name', ascending: true },
    name_desc: { column: 'name', ascending: false },
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    popular: { column: 'created_at', ascending: false },
    biggest_discount: { column: 'created_at', ascending: false },
  };

  const sortConfig = sort ? sortMap[sort] : sortMap.newest;
  return query.order(sortConfig.column, { ascending: sortConfig.ascending });
}

async function applyPagination<T>(
  query: ProductsQuery,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<{ items: T[]; total: number }> {
  const safePageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
  const from = (page - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) throw error;

  return { items: data as T[], total: count || 0 };
}

async function enrichProductsWithRelations(
  products: ProductsRow[]
): Promise<ProductSummary[]> {
  if (products.length === 0) return [];

  const brandIds = [...new Set(products.map(p => p.brand_id).filter(Boolean))];
  const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
  const leafModelIds = [...new Set(products.map(p => p.leaf_model_id).filter(Boolean))];

  const [brandsRes, categoriesRes, leafModelsRes] = await Promise.all([
    brandIds.length > 0
      ? adminSupabase.from('brands').select('id, slug, name, logo_link').in('id', brandIds)
      : { data: [] },
    categoryIds.length > 0
      ? adminSupabase.from('categories').select('id, slug, name').in('id', categoryIds)
      : { data: [] },
    leafModelIds.length > 0
      ? adminSupabase.from('models').select('id, slug, name, parent_id').in('id', leafModelIds)
      : { data: [] },
  ]);

  const brandMap = new Map((brandsRes.data || []).map(b => [b.id, b]));
  const categoryMap = new Map((categoriesRes.data || []).map(c => [c.id, c]));
  const leafModelMap = new Map((leafModelsRes.data || []).map(m => [m.id, m]));

  const parentIds = [...new Set(
    (leafModelsRes.data || [])
      .map(m => m.parent_id)
      .filter(Boolean)
  )];

  const parentModelsRes = parentIds.length > 0
    ? await adminSupabase.from('models').select('id, slug, name').in('id', parentIds)
    : { data: [] };
  const parentModelMap = new Map((parentModelsRes.data || []).map(m => [m.id, m]));

  return products.map(p => {
    const leafModel = p.leaf_model_id ? leafModelMap.get(p.leaf_model_id) : null;
    const parentModel = leafModel?.parent_id ? parentModelMap.get(leafModel.parent_id) : null;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name || p.model || p.id,
      model: p.model,
      brand: p.brand_id ? brandMap.get(p.brand_id)! : null as any,
      category: p.category_id ? categoryMap.get(p.category_id)! : null,
      leaf_model: leafModel ? {
        id: leafModel.id,
        slug: leafModel.slug,
        name: leafModel.name,
        parent: parentModel ? { id: parentModel.id, slug: parentModel.slug, name: parentModel.name } : null,
      } : null,
      price: p.price,
      color: p.color,
      gender: p.gender,
      image_links: p.image_links,
      status: p.status,
      asin: p.asin,
      attributes: (p.attributes ?? {}) as Record<string, unknown>,
      created_at: p.created_at,
    };
  });
}

function slugifyName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function resolveBrandFilter(value: string): Promise<string | null> {
  const { data } = await adminSupabase
    .from('brands')
    .select('slug, name')
    .or(`slug.ilike.${value},name.ilike.${value}`)
    .limit(1);
  if (data && data.length > 0) return data[0].slug;
  const slug = slugifyName(value);
  if (slug) return slug;
  return null;
}

export async function resolveCategoryFilter(value: string): Promise<string | null> {
  const { data } = await adminSupabase
    .from('categories')
    .select('slug, name')
    .or(`slug.ilike.${value},name.ilike.${value}`)
    .limit(1);
  if (data && data.length > 0) return data[0].slug;
  const slug = slugifyName(value);
  if (slug) return slug;
  return null;
}

export async function resolveModelPath(
  path: string
): Promise<{ id: string; name: string; hasChildren: boolean } | null> {
  const segments = path.split('/').map(s => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;

  const roots = await getRootModels();
  const root = roots.find(
    r => r.name.toLowerCase() === segments[0].toLowerCase()
  );
  if (!root) return null;

  let node = root;

  for (let i = 1; i < segments.length; i++) {
    const children = await getSubModels(node.id);
    const next = children.find(
      c => c.name.toLowerCase() === segments[i].toLowerCase()
    );
    if (!next) {
      return { id: node.id, name: node.name, hasChildren: children.length > 0 };
    }
    node = next;
  }

  const hasChildren = (await getSubModels(node.id)).length > 0;
  return { id: node.id, name: node.name, hasChildren };
}

async function buildFilteredQuery(
  filters: ProductFilters
): Promise<{ query: ProductsQuery } | null> {
  let query = adminSupabase.from('products').select('*', { count: 'exact' });

  query = applyFilters(query, filters);

  if (filters.category) {
    const categoryId = await getCategoryIdBySlug(filters.category);
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    } else {
      return null;
    }
  }

  if (filters.brand) {
    const brandId = await getBrandIdBySlug(filters.brand);
    if (brandId) {
      query = query.eq('brand_id', brandId);
    } else {
      return null;
    }
  }

  if (filters.leafModel) {
    query = query.eq('leaf_model_id', filters.leafModel);
  }

  if (filters.rootModel) {
    const leafIds = await getLeafModelIdsUnderRoot(filters.rootModel);
    if (leafIds.length > 0) {
      query = query.in('leaf_model_id', leafIds);
    } else {
      return null;
    }
  }

  if (filters.subModel) {
    const leafIds = await getLeafModelIdsUnderSubModel(filters.subModel);
    if (leafIds.length > 0) {
      query = query.in('leaf_model_id', leafIds);
    } else {
      return null;
    }
  }

  if (filters.model) {
    const node = await resolveModelPath(filters.model);
    if (!node) return null;
    if (node.hasChildren) {
      const leafIds = await getLeafModelIdsUnderRoot(node.id);
      if (leafIds.length > 0) {
        query = query.in('leaf_model_id', leafIds);
      } else {
        return null;
      }
    } else {
      query = query.eq('leaf_model_id', node.id);
    }
  }

  return { query };
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<PaginatedResult<ProductSummary>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  const built = await buildFilteredQuery(filters);
  if (!built) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const sortedQuery = applySort(built.query, filters.sort);

  const { items, total } = await applyPagination<ProductsRow>(sortedQuery, page, pageSize);
  const enriched = await enrichProductsWithRelations(items);

  return {
    items: enriched,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getFacets(
  filters: ProductFilters = {}
): Promise<FacetOptions> {
  const empty: FacetOptions = {
    brands: [],
    models: [],
    tractions: [],
    colors: [],
    categories: [],
    genders: [],
    sizes: [],
    min_price: 0,
    max_price: 0,
  };

  const built = await buildFilteredQuery(filters);
  if (!built) return empty;
  const { query } = built;

  const { data, error } = await query.select(
    'id, price, color, gender, brand_id, category_id, leaf_model_id, attributes'
  );
  if (error || !data) {
    console.error('Error fetching facets:', error?.message);
    return empty;
  }

  type FacetRow = {
    id: string;
    price: number | null;
    color: string | null;
    gender: string | null;
    brand_id: string | null;
    category_id: string | null;
    leaf_model_id: string | null;
    attributes: Record<string, unknown>;
  };
  const rows = data as unknown as FacetRow[];

  const colors = [...new Set(rows.map(p => p.color).filter(Boolean))] as string[];
  const genders = [...new Set(rows.map(p => p.gender).filter(Boolean))] as string[];
  const tractions = [...new Set(
    rows
      .map(p => (p.attributes as { traction?: string })?.traction)
      .filter(Boolean)
  )] as string[];
  const sizes = [...new Set(
    rows.flatMap(p => {
      const detail = (p.attributes as { sizes_detail?: { size: string; available: boolean }[] })?.sizes_detail ?? [];
      return detail.filter(s => s.available).map(s => s.size);
    })
  )] as string[];
  const prices = rows.map(p => p.price).filter((n): n is number => typeof n === 'number');
  const min_price = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
  const max_price = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 0;

  const brandIds = [...new Set(rows.map(p => p.brand_id).filter(Boolean))];
  const categoryIds = [...new Set(rows.map(p => p.category_id).filter(Boolean))];
  const leafModelIds = [...new Set(rows.map(p => p.leaf_model_id).filter(Boolean))];

  const [brandsRes, categoriesRes, leafRes] = await Promise.all([
    brandIds.length > 0
      ? adminSupabase.from('brands').select('id, slug, name, logo_link').in('id', brandIds)
      : { data: [] },
    categoryIds.length > 0
      ? adminSupabase.from('categories').select('id, slug, name').in('id', categoryIds)
      : { data: [] },
    leafModelIds.length > 0
      ? adminSupabase.from('models').select('id, parent_id').in('id', leafModelIds)
      : { data: [] },
  ]);

  const parentIds = [...new Set(
    (leafRes.data ?? []).map(m => m.parent_id).filter(Boolean)
  )];
  const rootsRes = parentIds.length > 0
    ? await adminSupabase.from('models').select('name').in('id', parentIds)
    : { data: [] };
  const models = [...new Set(
    (rootsRes.data ?? []).map(m => m.name).filter(Boolean)
  )] as string[];

  return {
    brands: (brandsRes.data ?? []).map(b => ({ name: b.name, slug: b.slug, logo_link: b.logo_link })),
    models,
    tractions,
    colors,
    categories: (categoriesRes.data ?? []).map(c => c.name),
    genders,
    sizes,
    min_price,
    max_price,
  };
}

export const getCachedProducts = unstable_cache(
  getProducts,
  ['products'],
  {
    revalidate: 60,
    tags: ['products'],
  }
);

export const getCachedFacets = unstable_cache(
  getFacets,
  ['facets'],
  {
    revalidate: 60,
    tags: ['products'],
  }
);

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const { data: product, error } = await adminSupabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !product) return null;

  const [enriched] = await enrichProductsWithRelations([product]);

  const ancestry = enriched.leaf_model
    ? await getModelAncestry(enriched.leaf_model.id)
    : [];

  const colorVariants = enriched.leaf_model
    ? await getColorVariants(enriched.leaf_model.id)
    : [];

  return {
    ...enriched,
    description: product.description,
    attributes: product.attributes,
    sizes: product.sizes,
    asin: product.asin,
    model_ancestry: ancestry,
    color_variants: colorVariants,
  };
}

export const getCachedProductBySlug = unstable_cache(
  getProductBySlug,
  ['product-by-slug'],
  {
    revalidate: 300,
    tags: ['products', 'product'],
  }
);

export async function getProduct(id: string): Promise<ProductWithRelations | null> {
  const { data: product, error } = await adminSupabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) return null;

  const [enriched] = await enrichProductsWithRelations([product]);

  const ancestry = enriched.leaf_model
    ? await getModelAncestry(enriched.leaf_model.id)
    : [];

  const colorVariants = enriched.leaf_model
    ? await getColorVariants(enriched.leaf_model.id)
    : [];

  return {
    ...enriched,
    description: product.description,
    attributes: product.attributes,
    sizes: product.sizes,
    asin: product.asin,
    model_ancestry: ancestry,
    color_variants: colorVariants,
  };
}

export async function getModelAncestry(leafModelId: string): Promise<ModelsRow[]> {
  const { data, error } = await adminSupabase.rpc('get_model_ancestry', {
    leaf_model_id: leafModelId,
  });

  if (error) {
    console.error('Error fetching model ancestry:', error);
    return [];
  }

  return (data as ModelsRow[]) || [];
}

export const getCachedModelAncestry = unstable_cache(
  getModelAncestry,
  ['model-ancestry'],
  {
    revalidate: 600,
    tags: ['models'],
  }
);

export async function getColorVariants(leafModelId: string): Promise<ProductSummary[]> {
  const { data, error } = await adminSupabase
    .from('products')
    .select('*')
    .eq('leaf_model_id', leafModelId)
    .eq('status', 'published');

  if (error || !data || data.length === 0) return [];

  return enrichProductsWithRelations(data);
}

export const getCachedColorVariants = unstable_cache(
  getColorVariants,
  ['color-variants'],
  {
    revalidate: 60,
    tags: ['products'],
  }
);

export async function getLeafModelsByRoot(rootModelId: string): Promise<ModelsRow[]> {
  const { data, error } = await adminSupabase.rpc('get_leaf_models_by_root', {
    root_model_id: rootModelId,
  });

  if (error) {
    console.error('Error fetching leaf models by root:', error);
    return [];
  }

  return (data as ModelsRow[]) || [];
}

export const getCachedLeafModelsByRoot = unstable_cache(
  getLeafModelsByRoot,
  ['leaf-models-by-root'],
  {
    revalidate: 600,
    tags: ['models'],
  }
);

export async function getSubModels(parentModelId: string): Promise<ModelsRow[]> {
  const { data, error } = await adminSupabase
    .from('models')
    .select('*')
    .eq('parent_id', parentModelId);

  if (error) {
    console.error('Error fetching sub models:', error);
    return [];
  }

  return (data as ModelsRow[]) || [];
}

export const getCachedSubModels = unstable_cache(
  getSubModels,
  ['sub-models'],
  {
    revalidate: 600,
    tags: ['models'],
  }
);

export async function getRootModels(brandSlug?: string): Promise<ModelsRow[]> {
  let query = adminSupabase.from('models').select('*').eq('level', 0);

  if (brandSlug) {
    const brandId = await getBrandIdBySlug(brandSlug);
    if (brandId) {
      query = query.eq('brand_id', brandId);
    }
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching root models:', error);
    return [];
  }

  return (data as ModelsRow[]) || [];
}

export const getCachedRootModels = unstable_cache(
  getRootModels,
  ['root-models'],
  {
    revalidate: 600,
    tags: ['models'],
  }
);

export async function getProductsByCategory(
  categorySlug: string,
  filters: Omit<ProductFilters, 'category'> = {}
): Promise<PaginatedResult<ProductSummary>> {
  return getCachedProducts({ ...filters, category: categorySlug });
}

export async function getProductsByBrand(
  brandSlug: string,
  filters: Omit<ProductFilters, 'brand'> = {}
): Promise<PaginatedResult<ProductSummary>> {
  return getCachedProducts({ ...filters, brand: brandSlug });
}

export async function getProductsByLeafModel(
  leafModelId: string,
  filters: Omit<ProductFilters, 'leafModel'> = {}
): Promise<PaginatedResult<ProductSummary>> {
  return getCachedProducts({ ...filters, leafModel: leafModelId });
}

export async function getProductsByRootModel(
  rootModelId: string,
  filters: Omit<ProductFilters, 'rootModel'> = {}
): Promise<PaginatedResult<ProductSummary>> {
  return getCachedProducts({ ...filters, rootModel: rootModelId });
}

export async function searchProducts(
  query: string,
  filters: Partial<ProductFilters> = {}
): Promise<PaginatedResult<ProductSummary>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  let dbQuery = adminSupabase.from('products').select('*', { count: 'exact' }).eq('status', 'published');

  dbQuery = dbQuery.or(`name.ilike.%${query}%,model.ilike.%${query}%,color.ilike.%${query}%`);

  if (filters.brand) {
    const brandId = await getBrandIdBySlug(filters.brand);
    if (brandId) dbQuery = dbQuery.eq('brand_id', brandId);
  }
  if (filters.category) {
    const categoryId = await getCategoryIdBySlug(filters.category);
    if (categoryId) dbQuery = dbQuery.eq('category_id', categoryId);
  }

  dbQuery = applyFilters(dbQuery, filters as ProductFilters);
  dbQuery = applySort(dbQuery, filters.sort);

  const { items, total } = await applyPagination<ProductsRow>(dbQuery, page, pageSize);
  const enriched = await enrichProductsWithRelations(items);

  return {
    items: enriched,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getRelatedProducts(
  options: RelatedProductsOptions
): Promise<ProductSummary[]> {
  const product = await getProduct(options.productId);
  if (!product) return [];

  const candidateFilters: ProductFilters = {
    status: 'published',
    page: 1,
    pageSize: options.limit ?? 8,
  };

  if (product.leaf_model?.parent) {
    candidateFilters.rootModel = product.leaf_model.parent.id;
  }

  if (!candidateFilters.rootModel && product.brand.id) {
    candidateFilters.brand = product.brand.slug;
  }

  if (product.category) {
    candidateFilters.category = product.category.slug;
  }

  const result = await getProducts(candidateFilters);
  return result.items.filter(p => p.id !== options.productId).slice(0, options.limit ?? 8);
}

export async function getFeaturedProducts(
  options: FeaturedProductsOptions
): Promise<ProductSummary[]> {
  const filters: ProductFilters = {
    status: 'published',
    page: 1,
    pageSize: options.limit,
    sort: 'newest',
  };

  if (options.rootModelId) {
    filters.rootModel = options.rootModelId;
  }

  if (options.categoryId) {
    const { data: cat } = await adminSupabase
      .from('categories')
      .select('slug')
      .eq('id', options.categoryId)
      .single();
    if (cat) filters.category = cat.slug;
  }

  const result = await getProducts(filters);
  return result.items;
}

export async function getCatalogStats(): Promise<CatalogStats> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const count = async (
    filter: (q: ProductsQuery) => ProductsQuery
  ): Promise<number> => {
    let q = adminSupabase.from('products').select('id', { count: 'exact', head: true });
    q = filter(q);
    const { count: c } = await q;
    return c ?? 0;
  };

  const [total, active, unpublished, missingAsin, missingImages, missingCategories, createdThisMonth] =
    await Promise.all([
      count((q) => q),
      count((q) => q.eq('status', 'published')),
      count((q) => q.eq('status', 'unpublished')),
      count((q) => q.is('asin', null)),
      count((q) => q.or('image_links.is.null,image_links.eq.{}')),
      count((q) => q.is('category_id', null)),
      count((q) => q.gte('created_at', monthStart.toISOString())),
    ]);

  return {
    total,
    active,
    unpublished,
    missingAsin,
    missingImages,
    missingCategories,
    createdThisMonth,
  };
}

export const getCachedCatalogStats = unstable_cache(
  getCatalogStats,
  ['catalog-stats'],
  {
    revalidate: 60,
    tags: ['products'],
  }
);

export async function getCategoryCounts(): Promise<CategoryCount[]> {
  const { data: categories } = await adminSupabase
    .from('categories')
    .select('id, slug, name, parent_id')
    .order('name');

  if (!categories || categories.length === 0) return [];

  const { data: productRows } = await adminSupabase
    .from('products')
    .select('category_id');

  const counts = new Map<string, number>();
  for (const row of productRows ?? []) {
    if (!row.category_id) continue;
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }

  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    parentId: c.parent_id,
    count: counts.get(c.id) ?? 0,
  }));
}

export const getCachedCategoryCounts = unstable_cache(
  getCategoryCounts,
  ['category-counts'],
  {
    revalidate: 60,
    tags: ['products', 'categories'],
  }
);