// FM-02/FM-10: Product + Variant types. Single source of truth for the storefront + admin.

export interface Product {
  id: string;
  slug: string;
  name: string;
  status: 'draft' | 'active' | 'archived' | 'proposed' | 'rejected';
  gender?: string | null;
  color?: string | null;
  asin?: string | null;
  sku?: string | null;
  collection?: string | null;
  tagline?: string | null;
  subtitle?: string | null;
  intro?: string | null;
  key_benefits?: unknown;
  technical_details?: unknown;
  adjustment?: string | null;
  range?: string | null;
  sole_type?: string | null;
  upper_material?: string | null;
  traction?: string | null;
  price?: number | null;        // legacy DECIMAL; not displayed publicly
  price_cents?: number | null;  // integer cents; not displayed publicly
  main_image?: string | null;
  images?: string[];
  meta?: { seo?: { title?: string; description?: string } } | null;
  tags?: string[];
  box_contents?: string | null;
  sizes?: string[];
  sizes_detail?: string | null;
  deleted_at?: string | null;
  available_on?: string | null;
  discontinue_on?: string | null;
  default_marketplace?: string | null;
  availableForSale?: boolean;   // enriched from amazon_product_cache (FM-21)
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku?: string | null;
  price_cents?: number | null;
  attributes: Record<string, string>;
  status: 'draft' | 'active' | 'archived';
  deleted_at?: string | null;
}

export interface Category { id: string; slug: string; name: string; }
export interface Collection { id: string; slug: string; name: string; }
