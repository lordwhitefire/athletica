-- =====================================================================
-- Migration: RPC functions for model hierarchy queries
-- ARCH-003: Product Service requires these for recursive CTE queries
-- =====================================================================

-- 1. Get all leaf model IDs under a root model (recursive CTE)
-- Leaf = model with no children (products attach to leaves, not to deepest level)
create or replace function get_leaf_model_ids_under_root(root_model_id uuid)
returns table (id uuid)
language sql
stable
as $$
  with recursive model_tree as (
    select id, level from models where id = root_model_id
    union all
    select m.id, m.level from models m
    join model_tree mt on m.parent_id = mt.id
  )
  select id from model_tree mt
  where not exists (select 1 from models c where c.parent_id = mt.id)
  and id != root_model_id;
$$;

-- 2. Get all leaf model IDs under a sub-model (recursive CTE)
-- Leaf = model with no children
create or replace function get_leaf_model_ids_under_submodel(sub_model_id uuid)
returns table (id uuid)
language sql
stable
as $$
  with recursive model_tree as (
    select id, level from models where id = sub_model_id
    union all
    select m.id, m.level from models m
    join model_tree mt on m.parent_id = mt.id
  )
  select id from model_tree mt
  where not exists (select 1 from models c where c.parent_id = mt.id)
  and id != sub_model_id;
$$;

-- 3. Get leaf models (full rows) by root model
-- Leaf = model with no children
create or replace function get_leaf_models_by_root(root_model_id uuid)
returns table (
  id uuid,
  slug text,
  name text,
  brand_id uuid,
  parent_id uuid,
  level integer,
  description text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
as $$
  with recursive model_tree as (
    select * from models where id = root_model_id
    union all
    select m.* from models m
    join model_tree mt on m.parent_id = mt.id
  )
  select * from model_tree mt
  where not exists (select 1 from models c where c.parent_id = mt.id)
  and id != root_model_id
  order by name;
$$;

-- 4. Get model ancestry (breadcrumbs) for a leaf model
create or replace function get_model_ancestry(leaf_model_id uuid)
returns table (
  id uuid,
  slug text,
  name text,
  brand_id uuid,
  parent_id uuid,
  level integer,
  description text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
as $$
  with recursive ancestry as (
    select * from models where id = leaf_model_id
    union all
    select m.* from models m
    join ancestry a on m.id = a.parent_id
  )
  select * from ancestry
  order by level asc;
$$;

-- 5. Grant execute permissions
grant execute on function get_leaf_model_ids_under_root(uuid) to anon, service_role;
grant execute on function get_leaf_model_ids_under_submodel(uuid) to anon, service_role;
grant execute on function get_leaf_models_by_root(uuid) to anon, service_role;
grant execute on function get_model_ancestry(uuid) to anon, service_role;