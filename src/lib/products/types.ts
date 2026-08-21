import { Database } from '@/lib/supabase/types';

export type ModelsRow = Database['public']['Tables']['models']['Row'];
export type ProductsRow = Database['public']['Tables']['products']['Row'];
export type BrandsRow = Database['public']['Tables']['brands']['Row'];
export type CategoriesRow = Database['public']['Tables']['categories']['Row'];

// Use a simple generic query type to avoid complex PostgREST type issues
export type ProductsQuery = ReturnType<typeof import('@supabase/supabase-js').createClient>['from'];

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  model: string | null;
  brand: { id: string; slug: string; name: string; logo_link: string | null };
  category: { id: string; slug: string; name: string } | null;
  leaf_model: {
    id: string;
    slug: string;
    name: string;
    parent: { id: string; slug: string; name: string } | null;
  } | null;
  price: number | null;
  color: string | null;
  gender: string | null;
  image_links: string[] | null;
  status: 'published' | 'unpublished';
  asin: string | null;
  attributes: Record<string, unknown>;
  created_at: string;
};

export type ProductWithRelations = ProductSummary & {
  description: Database['public']['Tables']['products']['Row']['description'];
  attributes: Database['public']['Tables']['products']['Row']['attributes'];
  sizes: string[] | null;
  asin: string | null;
  model_ancestry: ModelsRow[];
  color_variants: ProductSummary[];
};

export type ProductFilters = {
  search?: string;
  category?: string;
  brand?: string;
  leafModel?: string;
  rootModel?: string;
  subModel?: string;
  model?: string;
  gender?: string;
  color?: string;
  traction?: string;
  sizes?: string[];
  priceMin?: number;
  priceMax?: number;
  status?: 'published' | 'unpublished' | 'all';
  missingData?: 'asin' | 'image' | 'category' | 'model' | 'none';
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'popular' | 'biggest_discount';
  page?: number;
  pageSize?: number;
};

export type CatalogStats = {
  total: number;
  active: number;
  unpublished: number;
  missingAsin: number;
  missingImages: number;
  missingCategories: number;
  createdThisMonth: number;
};

export type CategoryCount = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  count: number;
};

export type FacetOptions = {
  brands: { name: string; slug: string; logo_link: string | null }[];
  models: string[];
  tractions: string[];
  colors: string[];
  categories: string[];
  genders: string[];
  sizes: string[];
  min_price: number;
  max_price: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type RelatedProductsOptions = {
  productId: string;
  limit?: number;
};

export type FeaturedProductsOptions = {
  categoryId?: string;
  rootModelId?: string;
  limit: number;
};