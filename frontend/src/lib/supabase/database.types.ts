export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          id: string
          logo_link: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_link?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_link?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_links: {
        Row: {
          category_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_content: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_links: string[] | null
          key: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_links?: string[] | null
          key: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_links?: string[] | null
          key?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          attributes: Json | null
          category_id: string | null
          copy: string | null
          created_at: string
          id: string
          image_links: string[] | null
          limit: number | null
          order: number
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          copy?: string | null
          created_at?: string
          id?: string
          image_links?: string[] | null
          limit?: number | null
          order: number
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          copy?: string | null
          created_at?: string
          id?: string
          image_links?: string[] | null
          limit?: number | null
          order?: number
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_sections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          level: number
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "category_attachable_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category_attachable_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation: {
        Row: {
          created_at: string
          id: string
          label: string
          order: number
          parent_id: string | null
          route: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          order: number
          parent_id?: string | null
          route?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          order?: number
          parent_id?: string | null
          route?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          asin: string | null
          attributes: Json | null
          brand_id: string | null
          category_id: string | null
          color: string | null
          created_at: string
          description: string | null
          gender: string | null
          id: string
          image_links: string[] | null
          leaf_model_id: string | null
          model: string | null
          name: string | null
          price: number | null
          sizes: string[] | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          asin?: string | null
          attributes?: Json | null
          brand_id?: string | null
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id: string
          image_links?: string[] | null
          leaf_model_id?: string | null
          model?: string | null
          name?: string | null
          price?: number | null
          sizes?: string[] | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          asin?: string | null
          attributes?: Json | null
          brand_id?: string | null
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          image_links?: string[] | null
          leaf_model_id?: string | null
          model?: string | null
          name?: string | null
          price?: number | null
          sizes?: string[] | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "category_attachable_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_leaf_model_id_fkey"
            columns: ["leaf_model_id"]
            isOneToOne: false
            referencedRelation: "category_attachable_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_leaf_model_id_fkey"
            columns: ["leaf_model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          site_name: string | null
          social_links: Json | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          site_name?: string | null
          social_links?: Json | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          site_name?: string | null
          social_links?: Json | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      category_attachable_brands: {
        Row: {
          id: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      category_attachable_models: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          id: string | null
          level: number | null
          name: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "category_attachable_brands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_leaf_model_ids_under_root: {
        Args: { root_model_id: string }
        Returns: {
          id: string
        }[]
      }
      get_leaf_model_ids_under_submodel: {
        Args: { sub_model_id: string }
        Returns: {
          id: string
        }[]
      }
      get_leaf_models_by_root: {
        Args: { root_model_id: string }
        Returns: {
          brand_id: string
          category_id: string
          created_at: string
          description: string
          id: string
          level: number
          name: string
          parent_id: string
          slug: string
          updated_at: string
        }[]
      }
      get_model_ancestry: {
        Args: { leaf_model_id: string }
        Returns: {
          brand_id: string
          category_id: string
          created_at: string
          description: string
          id: string
          level: number
          name: string
          parent_id: string
          slug: string
          updated_at: string
        }[]
      }
      navigation_content_fingerprint: { Args: never; Returns: string }
      replace_homepage_sections: {
        Args: { p_allow_wipe?: boolean; p_loaded_ids: Json; p_rows: Json }
        Returns: Json
      }
      replace_navigation_tree:
        | {
            Args: { p_allow_wipe?: boolean; p_loaded_ids: Json; p_rows: Json }
            Returns: Json
          }
        | {
            Args: {
              p_allow_wipe?: boolean
              p_loaded_fingerprint?: string
              p_loaded_ids: Json
              p_rows: Json
            }
            Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
