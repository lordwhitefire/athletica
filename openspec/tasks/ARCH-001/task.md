# Builder Task: ARCH-001 — Supabase Schema (Products + Content Tables)

## What we're building

The complete Supabase database schema for the Athletica platform. This is the single source of truth for **all text data**: products, categories, brands, AND all website content (homepage sections, navigation, editorial text, site settings). Image files live in Sanity; this schema stores only the links to those images.

## Why it matters

Nothing else can start until this exists. The Product Service, the admin pages, the website, the import script — they all read and write to these tables. If the schema is wrong, everything downstream breaks. This is the "contract" between Supabase and the application.

## What success looks like

After this, when the migration script runs (ARCH-002), it can insert products, categories, brands, and content records without errors. When the Product Service queries (ARCH-003), the tables exist with the right columns, indexes, and relationships. When the admin creates a product or edits a homepage section, the data lands in Supabase with the correct types and constraints.

## Context you need

### Current state
- **No Supabase schema yet** — the `supabase/` folder doesn't exist
- **Data currently lives in**:
  - Sanity: products, brands, categories, navigation, homepage sections, site settings (as Sanity documents)
  - `data/` folder: JSON snapshots synced from Sanity (`products/*.json`, `brands.json`, `navigation.json`, `homepage.json`, `site-settings.json`)
- **Frontend**: Next.js 16 app at `frontend/` with `@supabase/supabase-js` + `@supabase/ssr` already installed
- **Admin**: 13 existing pages at `frontend/src/app/admin/` — they'll be wired to this schema later

### Tables to create

| Table | Purpose | Key columns |
|---|---|---|
| `products` | Product catalog | `id` (uuid, pk), `slug` (unique), `name`, `model`, `description`, `price` (numeric), `gender`, `color`, `sizes` (text[]), `attributes` (jsonb), `status` ('published'/'unpublished'), `asin`, `category_id` (fk), `brand_id` (fk), `image_links` (text[] — Sanity asset URLs), `created_at`, `updated_at` |
| `categories` | Product classification hierarchy | `id` (uuid, pk), `slug` (unique), `name`, `parent_id` (self-ref fk, nullable), `created_at`, `updated_at` |
| `brands` | Brand identity | `id` (uuid, pk), `slug` (unique), `name`, `logo_link` (text — Sanity asset URL), `created_at`, `updated_at` |
| `homepage_sections` | Homepage content sections | `id` (uuid, pk), `type` ('hero'/'carousel'/'grid'/'banner'), `order` (int), `title`, `copy` (text), `category_id` (fk, nullable), `limit` (int), `image_links` (text[]), `created_at`, `updated_at` |
| `navigation` | Website menu structure | `id` (uuid, pk), `parent_id` (self-ref fk, nullable), `label`, `route` (text — points at category slug or custom), `order` (int), `created_at`, `updated_at` |
| `editorial_content` | Marketing/editorial text blocks | `id` (uuid, pk), `key` (unique, e.g. 'hero_banner_copy'), `title`, `body` (text), `image_links` (text[]), `created_at`, `updated_at` |
| `site_settings` | Global site configuration | `id` (uuid, pk, default single row), `site_name`, `tagline`, `contact_email`, `social_links` (jsonb), `created_at`, `updated_at` |

### Indexes & constraints needed
- Unique: `products.slug`, `categories.slug`, `brands.slug`, `editorial_content.key`
- Foreign keys: `products.category_id → categories.id`, `products.brand_id → brands.id`, `homepage_sections.category_id → categories.id`, `categories.parent_id → categories.id`, `navigation.parent_id → navigation.id`
- Filtering indexes: `products(status)`, `products(category_id, status)`, `products(brand_id, status)`, `products(price)`, `homepage_sections(order)`, `navigation(parent_id, order)`

### RLS (Row Level Security)
- **Public read** (customer site): `products` where `status = 'published'`, `categories`, `brands`, `homepage_sections`, `navigation`, `editorial_content`, `site_settings` — all readable by anon role
- **Admin write** (service role): full CRUD on all tables — only via service role key (never anon)
- **No public writes** — ever

### TypeScript types
After migrations: `supabase gen types typescript` → commit generated types to `frontend/src/lib/supabase/types.ts` (or equivalent)

## Boundaries — what NOT to do

- **No seed data** — the import script (next task) handles data
- **No Supabase Auth tables** — auth already exists for admin login; don't touch `auth.users`
- **No Storage buckets** — images stay in Sanity; this schema only stores links (text)
- **No triggers/functions** unless absolutely needed for data integrity — keep it simple
- **Don't create the Product Service** — that's ARCH-003

## Acceptance benchmarks

- **Benchmark 1**: `supabase db push` (or migration apply) succeeds with zero errors
- **Benchmark 2**: `supabase gen types typescript` outputs types that include all 7 tables with correct column types (uuid, text, numeric, jsonb, text[], timestamp with time zone)
- **Benchmark 3**: In Supabase dashboard, you can see all 7 tables with correct columns, indexes, foreign keys, and RLS policies enabled
- **Benchmark 4**: An anon-key query like `supabase.from('products').select('*').eq('status', 'published')` returns data (once data exists) without RLS errors
- **Benchmark 5**: A service-role insert into `products` with all required fields succeeds; missing required fields fails with clear constraint error

## Files you'll likely touch

- `supabase/migrations/YYYYMMDDHHMMSS_initial_schema.sql` (or multiple migration files)
- `supabase/config.toml` (if needed for local dev)
- `frontend/src/lib/supabase/types.ts` (generated, committed)

**Reminder**: Explain your decisions in the implementation report. If you chose one index strategy over another, say why. If you hit a constraint, say what you did. The report is how we verify intent matched outcome.