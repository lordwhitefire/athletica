// Manually written types for the Rollout + affiliate schemas — no CLI used.
// Last updated: 2026-11-17 (FM-02 full-marketplace schema + non-UI fixes)
//
// FIX (audit 4.1): reflects the FM-02 five-state product model, variants,
// categories, collections, marketplaces, amazon_product_cache, affiliate.*,
// audit_log, analytics.tracker_id, admin_access_keys, and the dead-link columns.

export type ProductStatus = 'draft' | 'active' | 'archived' | 'proposed' | 'rejected';
export type VariantStatus = 'draft' | 'active' | 'archived';
export type PayoutStatus = 'requested' | 'scheduled' | 'paid' | 'rejected';
export type AffiliateAccountStatus = 'pending' | 'active' | 'suspended' | 'closed';
export type AnalyticsSource = 'instagram' | 'whatsapp';

export interface Database {
  rollout: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          status: ProductStatus;
          gender: string | null;
          color: string | null;
          asin: string | null;
          sku: string | null;
          collection: string | null;
          tagline: string | null;
          subtitle: string | null;
          intro: string | null;
          key_benefits: ProductBenefit[];
          technical_details: ProductDetail[];
          adjustment: string | null;
          range: string | null;
          sole_type: string | null;
          upper_material: string | null;
          traction: string | null;
          price: number | null;          // legacy DECIMAL (being phased out)
          price_cents: number | null;     // integer cents (admin-only, never public)
          main_image: string | null;
          images: string[];
          meta: Record<string, unknown>;
          tags: string[];
          box_contents: string[] | string | null;
          sizes: string[];
          sizes_detail: string | null;
          deleted_at: string | null;
          available_on: string | null;
          discontinue_on: string | null;
          default_marketplace: string | null;
          dead_link: boolean;
          dead_reason: string | null;
          last_probed_at: string | null;
          redirect_4xx_count: number | null;
          last_4xx_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['rollout']['Tables']['products']['Row']> & { id: string; slug: string; name: string };
        Update: Partial<Database['rollout']['Tables']['products']['Row']>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string; product_id: string; sku: string | null; price_cents: number | null;
          attributes: Record<string, unknown>; status: VariantStatus; deleted_at: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database['rollout']['Tables']['product_variants']['Row']> & { product_id: string };
        Update: Partial<Database['rollout']['Tables']['product_variants']['Row']>;
        Relationships: [{ foreignKeyName: 'product_variants_product_id_fkey'; columns: ['product_id']; isOneToOne: false; referencedRelation: 'products'; referencedColumns: ['id'] }];
      };
      categories: {
        Row: { id: string; slug: string; name: string; parent_id: string | null; created_at: string };
        Insert: Partial<Database['rollout']['Tables']['categories']['Row']> & { slug: string; name: string };
        Update: Partial<Database['rollout']['Tables']['categories']['Row']>;
        Relationships: [];
      };
      collections: {
        Row: { id: string; slug: string; name: string; created_at: string };
        Insert: Partial<Database['rollout']['Tables']['collections']['Row']> & { slug: string; name: string };
        Update: Partial<Database['rollout']['Tables']['collections']['Row']>;
        Relationships: [];
      };
      product_categories: {
        Row: { product_id: string; category_id: string };
        Insert: { product_id: string; category_id: string };
        Update: Partial<Database['rollout']['Tables']['product_categories']['Insert']>;
        Relationships: [];
      };
      product_collections: {
        Row: { product_id: string; collection_id: string };
        Insert: { product_id: string; collection_id: string };
        Update: Partial<Database['rollout']['Tables']['product_collections']['Insert']>;
        Relationships: [];
      };
      analytics: {
        Row: {
          id: string; product_id: string; event_type: 'view' | 'click'; created_at: string;
          source: AnalyticsSource | null; visitor_hash: string | null; tracker_id: string | null;
        };
        Insert: Partial<Database['rollout']['Tables']['analytics']['Row']> & { product_id: string; event_type: 'view' | 'click' };
        Update: Partial<Database['rollout']['Tables']['analytics']['Row']>;
        Relationships: [{ foreignKeyName: 'rollout_analytics_product_id_fkey'; columns: ['product_id']; isOneToOne: false; referencedRelation: 'products'; referencedColumns: ['id'] }];
      };
      admin_access_keys: {
        Row: {
          id: string; kind: 'invite' | 'door'; user_id: string | null; token_hash: string;
          browser_label: string | null; issued_at: string; expires_at: string; used_at: string | null; revoked_at: string | null;
        };
        Insert: Partial<Database['rollout']['Tables']['admin_access_keys']['Row']> & { kind: 'invite' | 'door'; token_hash: string; expires_at: string };
        Update: Partial<Database['rollout']['Tables']['admin_access_keys']['Row']>;
        Relationships: [];
      };
      marketplaces: {
        Row: { slug: string; locale_number: string | null; domain: string; associates_url: string | null; country_code: string; tag: string | null; is_default: boolean; created_at: string };
        Insert: Partial<Database['rollout']['Tables']['marketplaces']['Row']> & { slug: string; domain: string; country_code: string };
        Update: Partial<Database['rollout']['Tables']['marketplaces']['Row']>;
        Relationships: [];
      };
      amazon_product_cache: {
        Row: {
          product_id: string; asin: string; locale: string; modified_time: string; expiration_time: string;
          title: string | null; price_cents: number | null; price_formatted: string | null; currency: string | null;
          rating: number | null; review_count: number | null; review_samples: unknown; is_prime: boolean | null;
          is_adult: boolean | null; availability: string | null; error: string | null;
          delivery_free_shipping: boolean | null; delivery_fba: boolean | null; created_at: string;
        };
        Insert: Partial<Database['rollout']['Tables']['amazon_product_cache']['Row']> & { product_id: string; asin: string; locale: string; expiration_time: string };
        Update: Partial<Database['rollout']['Tables']['amazon_product_cache']['Row']>;
        Relationships: [];
      };
      audit_log: {
        Row: { id: string; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string };
        Insert: Partial<Database['rollout']['Tables']['audit_log']['Row']> & { action: string; entity_type: string };
        Update: Partial<Database['rollout']['Tables']['audit_log']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
  affiliate: {
    Tables: {
      accounts: {
        Row: {
          id: string; email: string; auth_user_id: string | null; commission_default: number | null;
          full_name: string | null; address: string | null; country: string | null;
          payout_method: string | null; payout_instructions: string | null; notify_balance: boolean;
          preferred_locale: string; status: AffiliateAccountStatus; created_at: string; updated_at: string;
        };
        Insert: Partial<Database['affiliate']['Tables']['accounts']['Row']> & { email: string };
        Update: Partial<Database['affiliate']['Tables']['accounts']['Row']>;
        Relationships: [];
      };
      trackers: {
        Row: { id: string; label: string | null; account_id: string; created_at: string; updated_at: string };
        Insert: Partial<Database['affiliate']['Tables']['trackers']['Row']> & { id: string; account_id: string };
        Update: Partial<Database['affiliate']['Tables']['trackers']['Row']>;
        Relationships: [{ foreignKeyName: 'trackers_account_id_fkey'; columns: ['account_id']; isOneToOne: false; referencedRelation: 'accounts'; referencedColumns: ['id'] }];
      };
      campaigns: {
        Row: {
          id: string; reward_type: 'cash_reward' | 'discount_coupon'; commission_type: 'percentage' | 'fixed' | null;
          reward: number; recurring: boolean; recurring_limit: number | null; minimum_payout: number;
          payout_term: string | null; status: 'draft' | 'active' | 'archived'; created_at: string; updated_at: string;
        };
        Insert: Partial<Database['affiliate']['Tables']['campaigns']['Row']> & { reward: number };
        Update: Partial<Database['affiliate']['Tables']['campaigns']['Row']>;
        Relationships: [];
      };
      campaign_trackers: {
        Row: { campaign_id: string; tracker_id: string; created_at: string };
        Insert: { campaign_id: string; tracker_id: string };
        Update: Partial<Database['affiliate']['Tables']['campaign_trackers']['Insert']>;
        Relationships: [];
      };
      balance: {
        Row: {
          id: string; account_id: string; tracker_id: string | null; campaign_id: string | null;
          amount: number; currency: string; released: boolean; trace: string | null; created_at: string;
        };
        Insert: Partial<Database['affiliate']['Tables']['balance']['Row']> & { account_id: string; amount: number };
        Update: Partial<Database['affiliate']['Tables']['balance']['Row']>;
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string; account_id: string; number: number; amount: number; currency: string;
          status: PayoutStatus; scheduled_for: string | null; created_at: string; updated_at: string;
        };
        Insert: Partial<Database['affiliate']['Tables']['payouts']['Row']> & { account_id: string; number: number; amount: number };
        Update: Partial<Database['affiliate']['Tables']['payouts']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// JSONB sub-types
export type BenefitIcon = 'boot' | 'bolt' | 'target' | 'speed';
export interface ProductBenefit { icon: BenefitIcon; title: string; text: string }
export interface ProductDetail { label: string; value: string }

// Convenience
export type ProductRow = Database['rollout']['Tables']['products']['Row'];
export type AnalyticsRow = Database['rollout']['Tables']['analytics']['Row'];
