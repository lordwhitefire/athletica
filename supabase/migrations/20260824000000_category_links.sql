-- =====================================================================
-- Migration: Add category_links table for FR3-D
-- Attach existing brands/models/submodels/product-models to categories
-- =====================================================================

-- 1. Create category_links table
create table category_links (
    id uuid primary key default uuid_generate_v4(),
    category_id uuid not null references categories(id) on delete cascade,
    entity_type text not null check (entity_type in ('brand', 'model', 'submodel', 'product_model')),
    entity_id uuid not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Prevent duplicate attachments
    unique (category_id, entity_type, entity_id)
);

-- Indexes for common queries
create index idx_category_links_category on category_links(category_id);
create index idx_category_links_entity on category_links(entity_type, entity_id);

-- 2. Enable RLS
alter table category_links enable row level security;

-- Public read
create policy "Public read category_links"
    on category_links for select
    to anon
    using (true);

-- Admin full access
create policy "Admin full access category_links"
    on category_links for all
    to service_role
    using (true)
    with check (true);

-- 3. Grant permissions
grant select on category_links to anon;
grant all on category_links to service_role;

-- 4. Updated_at trigger
create trigger category_links_updated_at
    before update on category_links
    for each row execute procedure public.handle_updated_at();

-- 5. Optional: helpful views for admin UI dropdowns
create or replace view category_attachable_brands as
select b.id, b.name, b.slug
from brands b
order by b.name;

create or replace view category_attachable_models as
select m.id, m.name, m.slug, m.level, m.brand_id, b.name as brand_name
from models m
join brands b on b.id = m.brand_id
order by b.name, m.level, m.name;