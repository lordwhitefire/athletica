-- =====================================================================
-- Migration: ARCH-11 Part 2 (B1) — Product-model hierarchy, category-anchored
--
-- Doctrine D13-amended (owner decision 2026-08-22):
--   category -> brand? -> root model? -> submodel(s, any depth)
--       -> product model (terminal, EXACTLY ONE product)
--
-- What this migration does
--   1. Schema: brand becomes OPTIONAL on models; depth becomes UNBOUNDED;
--      models gain a nullable category_id ANCHOR (the only required container);
--      slug uniqueness re-scoped to (category-anchor, brand, slug).
--   2. Data: roots anchored to their real category; every node holding 2+
--      direct products is split into a submodel branch with one
--      product-model child per variant (named "<node> <color>");
--      the single product without any model gets a fresh category-anchored
--      product-model chain.
--
-- Guarantees after application:
--   - total products unchanged (33); every product references exactly one
--     product model; zero nodes hold more than one direct product;
--     every model chain walks up to a category anchor.
--   - Existing slugs are preserved (old leaves become branch nodes), so no
--     storefront link rots. New child slugs are newly created.
--
-- IMPORTANT: products.id is TEXT (rebuilt by 20260819000001); models.id is
-- UUID. The split staging table types reflect that exactly.
--
-- Every step is guarded (if exists / if not exists / natural no-op on
-- re-run) so the file can be re-applied safely after any earlier failure.
--
-- Backup reference: frontend/data/pre-arch11-backup-20260824.json
--   (models=21, products=33, brands=5, categories=2, category_links=0)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Schema changes (all idempotent)
-- ---------------------------------------------------------------------

-- Brand is optional everywhere (doctrine: brand NEVER structural prerequisite)
alter table models alter column brand_id drop not null;

-- Depth becomes arbitrary (was check (level in (0,1,2)))
alter table models drop constraint if exists models_level_check;

-- Category anchor: set on anchor nodes (normally roots; exceptional
-- mid-tree anchoring allowed when a sub-branch serves another category,
-- e.g. the test-data branch under Predator). Children inherit through
-- the parent chain by walking up.
alter table models add column if not exists category_id uuid references categories(id);

create index if not exists idx_models_category_id on models(category_id);

-- Slug uniqueness re-scoped: was unique(brand_id, slug) (brand-rooted era).
-- NULL-tolerant expression index keeps today's guarantee (per brand+anchor)
-- while allowing NULL brands.
alter table models drop constraint if exists models_brand_id_slug_key;
create unique index if not exists models_anchor_brand_slug_key
    on models (coalesce(category_id::text, ''), coalesce(brand_id::text, ''), slug);

-- ---------------------------------------------------------------------
-- 2. Category anchoring of existing tree (re-running writes same values)
-- ---------------------------------------------------------------------

-- All three roots (predator, x, mercurial-vapour-17) serve the boots catalog
update models m
set category_id = c.id
from categories c
where m.parent_id is null
  and c.slug = 'boots';

-- Exceptional mid-tree anchor: the 'mg' branch holds ONLY products of the
-- test-football-boots category, while its ancestors anchor to boots.
-- Anchoring 'mg' directly keeps every descendant chain category-compliant
-- without touching any product.category_id value.
update models m
set category_id = (
    select p.category_id from products p where p.leaf_model_id = m.id limit 1
)
where m.slug = 'mg'
  and m.category_id is null
  and exists (select 1 from products p where p.leaf_model_id = m.id);

-- ---------------------------------------------------------------------
-- 3. Split every node holding 2+ direct products
--    Node stays as branch; each product gets its own product-model child
--    named "<node> <color>" (slug derived deterministically; collisions
--    disambiguated with the trailing number of the product name when
--    present, else an ordinal suffix).
--    Natural re-run safety: after a successful split no node holds 2+
--    direct products, so the driving query returns zero rows.
-- ---------------------------------------------------------------------

create temp table arch11_split (
    product_id text primary key,
    new_slug   text not null,
    new_name   text not null,
    brand_id   uuid,
    parent_id  uuid not null,
    new_level  integer not null
) on commit drop;

insert into arch11_split (product_id, new_slug, new_name, brand_id, parent_id, new_level)
with multi as (
    select m.id as mid
    from models m
    where (select count(*) from products p where p.leaf_model_id = m.id) > 1
),
variants as (
    select
        p.id::text                             as product_id,
        m.id                                   as parent_id,
        m.brand_id                             as brand_id,
        m.level                                as parent_level,
        m.name || ' '
            || coalesce(nullif(trim(p.color), ''), 'Variant') as new_name,
        -- slugify(node-slug + '-' + color): mirrors app slugify()
        regexp_replace(
            regexp_replace(
                m.slug || '-' ||
                coalesce(
                    nullif(regexp_replace(lower(coalesce(p.color, '')), '[^a-z0-9]+', '-', 'g'), ''),
                    'variant'
                ),
            '-+', '-', 'g'),
        '^-|-$', '', 'g'
        )                                      as base_slug,
        nullif(regexp_replace(p.name, '^.*[^0-9]', ''), '') as trailing_num,
        row_number() over (partition by m.id order by p.id) as rn
    from products p
    join models m on m.id = p.leaf_model_id
    where m.id in (select mid from multi)
),
deduped as (
    select
        v.*,
        count(*) over (partition by v.parent_id, v.base_slug) as dup_count,
        row_number() over (partition by v.parent_id, v.base_slug order by v.rn) as dup_rn
    from variants v
)
select
    product_id,
    case
        when dup_count > 1
            then base_slug || '-' || coalesce(trailing_num, dup_rn::text)
        else base_slug
    end                    as new_slug,
    case
        when dup_count > 1
            then new_name || ' ' || coalesce(trailing_num, dup_rn::text)
        else new_name
    end                    as new_name,
    brand_id,
    parent_id,
    parent_level + 1       as new_level
from deduped;

insert into models (slug, name, brand_id, parent_id, level)
select new_slug, new_name, brand_id, parent_id, new_level
from arch11_split
where not exists (
    select 1 from models m
    where m.slug = arch11_split.new_slug
      and m.parent_id = arch11_split.parent_id
);

update products p
set leaf_model_id = nm.id
from arch11_split s
join models nm on nm.parent_id = s.parent_id and nm.slug = s.new_slug
where p.id = s.product_id
  and p.leaf_model_id <> nm.id;

drop table arch11_split;

-- ---------------------------------------------------------------------
-- 4. The one product without any model ("Test Product", test-football-boots,
--    brand "Test Brand") gets a minimal doctrine-valid chain:
--    category -> product model "Test Model" (terminal).
-- ---------------------------------------------------------------------

insert into models (slug, name, brand_id, parent_id, level, category_id)
select 'test-model', 'Test Model', tp.brand_id, null, 0, tp.category_id
from products tp
where tp.slug = 'test-product-1'
  and tp.leaf_model_id is null
  and not exists (select 1 from models m where m.slug = 'test-model');

update products tp
set leaf_model_id = m.id
from models m
where tp.slug = 'test-product-1'
  and tp.leaf_model_id is null
  and m.slug = 'test-model';

-- ---------------------------------------------------------------------
-- 5. Recreate RPCs whose fixed return shapes gained a column
--    (get_leaf_models_by_root / get_model_ancestry used select *)
-- ---------------------------------------------------------------------

drop function if exists get_leaf_models_by_root(uuid);
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
  updated_at timestamptz,
  category_id uuid
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
  select mt.id, mt.slug, mt.name, mt.brand_id, mt.parent_id, mt.level,
         mt.description, mt.created_at, mt.updated_at, mt.category_id
  from model_tree mt
  where not exists (select 1 from models c where c.parent_id = mt.id)
  and mt.id != root_model_id
  order by mt.name;
$$;

drop function if exists get_model_ancestry(uuid);
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
  updated_at timestamptz,
  category_id uuid
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
  select a.id, a.slug, a.name, a.brand_id, a.parent_id, a.level,
         a.description, a.created_at, a.updated_at, a.category_id
  from ancestry a
  order by a.level asc;
$$;

grant execute on function get_leaf_models_by_root(uuid) to anon, service_role;
grant execute on function get_model_ancestry(uuid) to anon, service_role;

commit;
