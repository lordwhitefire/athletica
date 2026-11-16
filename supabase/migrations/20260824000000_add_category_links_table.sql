-- =====================================================================
-- CATEGORY LINKS: Store attachments between categories and entities
-- =====================================================================

-- Table to store which brands, models, submodels, or product models
-- are attached to which category. This enables FR3-D's attach-sections
-- feature where users attach existing catalog entities without
-- creating new categories.
create table category_links (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references categories(id) on delete cascade,
  target_type text not null check (target_type in ('brand', 'model', 'subcategory', 'product_model')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for lookup by category and by target entity
create index idx_category_links_category on category_links(category_id);
create index idx_category_links_target on category_links(target_type, target_id);

-- Indexes for performance when joining with categories or target entities
create index idx_category_links_category_target on category_links(category_id, target_type, target_id);

-- Row-level security (optional, can be disabled if you prefer service_role-only)
alter table category_links enable row level security;

create policy "Service role can do anything"
  on category_links for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ========================================
-- Triggers for updated_at
-- ========================================
create or replace function update_category_links_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger category_links_updated_at
  before update on category_links
  for each row
  execute function update_category_links_updated_at();
