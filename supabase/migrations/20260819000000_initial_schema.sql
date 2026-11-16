-- =====================================================================
-- Athletica Platform - Initial Database Schema
-- Migration: 20260819000000_initial_schema.sql
-- Creates: products, categories, brands, homepage_sections, navigation,
--          editorial_content, site_settings
-- =====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================================
-- BRANDS
-- =====================================================================
create table brands (
    id uuid primary key default uuid_generate_v4(),
    slug text not null unique,
    name text not null,
    logo_link text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for common lookups
create index idx_brands_slug on brands(slug);

-- =====================================================================
-- CATEGORIES (self-referencing hierarchy)
-- =====================================================================
create table categories (
    id uuid primary key default uuid_generate_v4(),
    slug text not null unique,
    name text not null,
    parent_id uuid references categories(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for hierarchy traversal and filtering
create index idx_categories_slug on categories(slug);
create index idx_categories_parent_id on categories(parent_id);

-- =====================================================================
-- PRODUCTS
-- =====================================================================
create table products (
    id uuid primary key default uuid_generate_v4(),
    slug text not null unique,
    name text,
    model text,
    description text,
    price numeric(10, 2),
    gender text,
    color text,
    sizes text[],
    attributes jsonb,
    status text not null default 'unpublished' check (status in ('published', 'unpublished')),
    asin text,
    category_id uuid references categories(id) on delete set null,
    brand_id uuid references brands(id) on delete set null,
    image_links text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for filtering and performance
create index idx_products_slug on products(slug);
create index idx_products_status on products(status);
create index idx_products_category_status on products(category_id, status);
create index idx_products_brand_status on products(brand_id, status);
create index idx_products_price on products(price);
create index idx_products_category_id on products(category_id);
create index idx_products_brand_id on products(brand_id);

-- =====================================================================
-- HOMEPAGE_SECTIONS
-- =====================================================================
create table homepage_sections (
    id uuid primary key default uuid_generate_v4(),
    type text not null check (type in ('hero', 'carousel', 'grid', 'banner')),
    "order" integer not null,
    title text,
    copy text,
    category_id uuid references categories(id) on delete set null,
    "limit" integer,
    image_links text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for ordering
create index idx_homepage_sections_order on homepage_sections("order");
create index idx_homepage_sections_category_id on homepage_sections(category_id);

-- =====================================================================
-- NAVIGATION (self-referencing hierarchy)
-- =====================================================================
create table navigation (
    id uuid primary key default uuid_generate_v4(),
    parent_id uuid references navigation(id) on delete set null,
    label text not null,
    route text,
    "order" integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for hierarchy and ordering
create index idx_navigation_parent_order on navigation(parent_id, "order");
create index idx_navigation_parent_id on navigation(parent_id);

-- =====================================================================
-- EDITORIAL_CONTENT
-- =====================================================================
create table editorial_content (
    id uuid primary key default uuid_generate_v4(),
    key text not null unique,
    title text,
    body text,
    image_links text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for key lookups
create index idx_editorial_content_key on editorial_content(key);

-- =====================================================================
-- SITE_SETTINGS (single row expected)
-- =====================================================================
create table site_settings (
    id uuid primary key default uuid_generate_v4(),
    site_name text,
    tagline text,
    contact_email text,
    social_links jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Constraint to ensure only one row (enforced at application level or via partial index)
-- Note: Single-row guarantee is handled by admin UI, not a DB constraint

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on all tables
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table homepage_sections enable row level security;
alter table navigation enable row level security;
alter table editorial_content enable row level security;
alter table site_settings enable row level security;

-- =====================================================================
-- RLS POLICIES - PUBLIC READ (anon role)
-- =====================================================================

-- Brands: public read all
create policy "Public read brands"
    on brands for select
    to anon
    using (true);

-- Categories: public read all
create policy "Public read categories"
    on categories for select
    to anon
    using (true);

-- Products: public read only published
create policy "Public read published products"
    on products for select
    to anon
    using (status = 'published');

-- Homepage sections: public read all
create policy "Public read homepage sections"
    on homepage_sections for select
    to anon
    using (true);

-- Navigation: public read all
create policy "Public read navigation"
    on navigation for select
    to anon
    using (true);

-- Editorial content: public read all
create policy "Public read editorial content"
    on editorial_content for select
    to anon
    using (true);

-- Site settings: public read all
create policy "Public read site settings"
    on site_settings for select
    to anon
    using (true);

-- =====================================================================
-- RLS POLICIES - ADMIN WRITE (service_role)
-- Service role bypasses RLS by default, but we add explicit policies
-- for clarity and defense-in-depth
-- =====================================================================

-- Brands: service_role full access
create policy "Admin full access brands"
    on brands for all
    to service_role
    using (true)
    with check (true);

-- Categories: service_role full access
create policy "Admin full access categories"
    on categories for all
    to service_role
    using (true)
    with check (true);

-- Products: service_role full access
create policy "Admin full access products"
    on products for all
    to service_role
    using (true)
    with check (true);

-- Homepage sections: service_role full access
create policy "Admin full access homepage sections"
    on homepage_sections for all
    to service_role
    using (true)
    with check (true);

-- Navigation: service_role full access
create policy "Admin full access navigation"
    on navigation for all
    to service_role
    using (true)
    with check (true);

-- Editorial content: service_role full access
create policy "Admin full access editorial content"
    on editorial_content for all
    to service_role
    using (true)
    with check (true);

-- Site settings: service_role full access
create policy "Admin full access site settings"
    on site_settings for all
    to service_role
    using (true)
    with check (true);

-- =====================================================================
-- UPDATED_AT TRIGGERS
-- =====================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Attach updated_at trigger to all tables
create trigger brands_updated_at
    before update on brands
    for each row execute procedure public.handle_updated_at();

create trigger categories_updated_at
    before update on categories
    for each row execute procedure public.handle_updated_at();

create trigger products_updated_at
    before update on products
    for each row execute procedure public.handle_updated_at();

create trigger homepage_sections_updated_at
    before update on homepage_sections
    for each row execute procedure public.handle_updated_at();

create trigger navigation_updated_at
    before update on navigation
    for each row execute procedure public.handle_updated_at();

create trigger editorial_content_updated_at
    before update on editorial_content
    for each row execute procedure public.handle_updated_at();

create trigger site_settings_updated_at
    before update on site_settings
    for each row execute procedure public.handle_updated_at();

-- =====================================================================
-- GRANTS (explicit for clarity)
-- =====================================================================

-- Grant select on all tables to anon (public read)
grant select on brands, categories, products, homepage_sections, navigation, editorial_content, site_settings to anon;

-- Grant all on all tables to service_role (admin write)
grant all on brands, categories, products, homepage_sections, navigation, editorial_content, site_settings to service_role;

-- Grant usage on sequences (for uuid_generate_v4)
grant usage on all sequences in schema public to anon, service_role;