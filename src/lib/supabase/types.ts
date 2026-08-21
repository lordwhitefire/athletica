// Generated from Supabase schema - DO NOT EDIT MANUALLY
// Includes ARCH-REC-001: models table + products.leaf_model_id

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          slug: string
          name: string
          logo_link: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          logo_link?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          logo_link?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      editorial_content: {
        Row: {
          id: string
          key: string
          title: string | null
          body: string | null
          image_links: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          title?: string | null
          body?: string | null
          image_links?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          title?: string | null
          body?: string | null
          image_links?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          id: string
          type: 'hero' | 'carousel' | 'grid' | 'banner'
          order: number
          title: string | null
          copy: string | null
          category_id: string | null
          limit: number | null
          image_links: string[] | null
          created_at: string
          updated_at: string
          attributes: Json | null
        }
        Insert: {
          id?: string
          type: 'hero' | 'carousel' | 'grid' | 'banner'
          order: number
          title?: string | null
          copy?: string | null
          category_id?: string | null
          limit?: number | null
          image_links?: string[] | null
          created_at?: string
          updated_at?: string
          attributes?: Json | null
        }
        Update: {
          id?: string
          type?: 'hero' | 'carousel' | 'grid' | 'banner'
          order?: number
          title?: string | null
          copy?: string | null
          category_id?: string | null
          limit?: number | null
          image_links?: string[] | null
          created_at?: string
          updated_at?: string
          attributes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_sections_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      models: {
        Row: {
          id: string
          slug: string
          name: string
          brand_id: string
          parent_id: string | null
          level: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          brand_id: string
          parent_id?: string | null
          level?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          brand_id?: string
          parent_id?: string | null
          level?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "models"
            referencedColumns: ["id"]
          }
        ]
      }
      navigation: {
        Row: {
          id: string
          parent_id: string | null
          label: string
          route: string | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_id?: string | null
          label: string
          route?: string | null
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_id?: string | null
          label?: string
          route?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "navigation"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          slug: string
          name: string | null
          model: string | null
          description: Json | null
          price: number | null
          gender: string | null
          color: string | null
          sizes: string[] | null
          attributes: Json | null
          status: 'published' | 'unpublished'
          asin: string | null
          category_id: string | null
          brand_id: string | null
          leaf_model_id: string | null
          image_links: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name?: string | null
          model?: string | null
          description?: Json | null
          price?: number | null
          gender?: string | null
          color?: string | null
          sizes?: string[] | null
          attributes?: Json | null
          status?: 'published' | 'unpublished'
          asin?: string | null
          category_id?: string | null
          brand_id?: string | null
          leaf_model_id?: string | null
          image_links?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string | null
          model?: string | null
          description?: Json | null
          price?: number | null
          gender?: string | null
          color?: string | null
          sizes?: string[] | null
          attributes?: Json | null
          status?: 'published' | 'unpublished'
          asin?: string | null
          category_id?: string | null
          brand_id?: string | null
          leaf_model_id?: string | null
          image_links?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_leaf_model_id_fkey"
            columns: ["leaf_model_id"]
            referencedRelation: "models"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
          role: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          role?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          role?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          site_name: string | null
          tagline: string | null
          contact_email: string | null
          social_links: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_name?: string | null
          tagline?: string | null
          contact_email?: string | null
          social_links?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_name?: string | null
          tagline?: string | null
          contact_email?: string | null
          social_links?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      handle_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
  ? (Database['public']['Tables'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'])[TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
  ? (Database['public']['Tables'])[PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'])[TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
  ? (Database['public']['Tables'])[PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof (Database['public']['Enums'])
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicEnumNameOrOptions['schema']]['Enums'])
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicEnumNameOrOptions['schema']]['Enums'])[EnumName]
  : PublicEnumNameOrOptions extends keyof (Database['public']['Enums'])
  ? (Database['public']['Enums'])[PublicEnumNameOrOptions]
  : never