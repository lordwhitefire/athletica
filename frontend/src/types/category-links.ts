// Category Links - attaches brands, models, submodels, or product models to a category
// FR3-D: attach existing entities instead of creating subcategories.
// Live schema (applied via Supabase SQL editor): columns entity_type / entity_id.
export type CategoryLinkTargetType = 'brand' | 'model' | 'submodel' | 'product_model';

export interface CategoryLink {
  id: string;
  category_id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  updated_at: string;
}
