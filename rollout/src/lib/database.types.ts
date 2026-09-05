// Manually written types for the Rollout schema — no CLI used.
// Last updated: 2026-09-05

export interface Database {
  rollout: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          status: 'published' | 'unpublished';
          gender: string | null;
          color: string | null;
          asin: string | null;
          sku: string | null;
          collection: string | null;
          tagline: string | null;
          subtitle: string | null;
          intro: string | null;
          key_benefits: ProductBenefit[];       // JSONB array
          technical_details: ProductDetail[];   // JSONB array
          adjustment: string | null;
          range: string | null;
          sole_type: string | null;
          upper_material: string | null;
          traction: string | null;
          price: number | null;
          main_image: string | null;
          images: string[];
          meta: Record<string, string>;          // JSONB
          tags: string[];
          box_contents: string[];                // JSONB array (ROLL-06 D3)
          sizes: string[];                       // TEXT[] (ROLL-07 D6)
          sizes_detail: string | null;           // (ROLL-07 D6)
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['rollout']['Tables']['products']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['rollout']['Tables']['products']['Insert']>;
        Relationships: [];
      };
      analytics: {
        Row: {
          id: string;
          product_id: string;
          event_type: 'view' | 'click';
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          event_type: 'view' | 'click';
          created_at?: string;
        };
        Update: Partial<Database['rollout']['Tables']['analytics']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'rollout_analytics_product_id_fkey',
            columns: ['product_id'],
            isOneToOne: false,
            referencedRelation: 'products',
            referencedColumns: ['id'],
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// JSONB array sub-types (for key_benefits / technical_details)
// ROLL-06 D4: benefit icons are standardized. SVG rendering untouched.
export type BenefitIcon = 'boot' | 'bolt' | 'target' | 'speed';

export interface ProductBenefit {
  icon: BenefitIcon;
  title: string;
  text: string;
}

export interface ProductDetail {
  label: string;
  value: string;
}

// Convenience types
export type ProductRow = Database['rollout']['Tables']['products']['Row'];
export type ProductInsert = Database['rollout']['Tables']['products']['Insert'];
export type ProductUpdate = Database['rollout']['Tables']['products']['Update'];

export type AnalyticsRow = Database['rollout']['Tables']['analytics']['Row'];
export type AnalyticsInsert = Database['rollout']['Tables']['analytics']['Insert'];
export type AnalyticsUpdate = Database['rollout']['Tables']['analytics']['Update'];
