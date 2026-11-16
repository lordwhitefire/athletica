-- =====================================================================
-- CATEGORY LINKS: add CHECK constraint on entity_type (FR3-D hardening)
-- The live table (applied via SQL editor) uses columns entity_type /
-- entity_id and currently has no type constraint. This adds one that
-- allows exactly the four FR3-D link types, including 'submodel'
-- (models.level = 1) per the world model
-- Category -> Brand -> Model -> Submodel -> Product Model.
-- =====================================================================

alter table category_links drop constraint if exists category_links_entity_type_check;

alter table category_links
  add constraint category_links_entity_type_check
  check (entity_type in ('brand', 'model', 'submodel', 'product_model'));
