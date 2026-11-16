-- =====================================================================
-- Migration: Add models table + leaf_model_id to products
-- ARCH-REC-001: Reconciliation for model hierarchy
-- =====================================================================

-- 1. Create models table with self-referential hierarchy
create table models (
    id uuid primary key default uuid_generate_v4(),
    slug text not null,
    name text not null,
    brand_id uuid not null references brands(id) on delete cascade,
    parent_id uuid references models(id) on delete set null,
    level integer not null default 0 check (level in (0, 1, 2)),
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Unique per brand
    unique (brand_id, slug)
);

-- Indexes for hierarchy queries
create index idx_models_brand_id on models(brand_id);
create index idx_models_parent_id on models(parent_id);
create index idx_models_level on models(level);
create index idx_models_brand_level on models(brand_id, level);

-- 2. Add leaf_model_id to products
alter table products add column leaf_model_id uuid references models(id) on delete set null;

-- Index for model-based product queries
create index idx_products_leaf_model_id on products(leaf_model_id);

-- 3. Enable RLS on models
alter table models enable row level security;

-- Public read all models
create policy "Public read models"
    on models for select
    to anon
    using (true);

-- Admin full access
create policy "Admin full access models"
    on models for all
    to service_role
    using (true)
    with check (true);

-- 4. Grant permissions
grant select on models to anon;
grant all on models to service_role;

-- 5. Updated_at trigger
create trigger models_updated_at
    before update on models
    for each row execute procedure public.handle_updated_at();