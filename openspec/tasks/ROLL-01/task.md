# ROLL-01: Set up Rollout Supabase schema + types

## What and why

The Rollout system needs its own isolated data (separate from Mature). Per owner decision, this is NOT a second Supabase project — it's a **dedicated `rollout` schema inside the existing project** (one project, two schemas: `public` = Mature, `rollout` = Rollout).

It needs two tables in the `rollout` schema:
- `rollout.products` — self-contained product data (no foreign keys to hierarchy)
- `rollout.analytics` — simple view/click events

This task creates the `rollout/` Next.js app directory, creates the `rollout` schema, runs the schema SQL, and **manually writes TypeScript types** by inspecting the tables via the Supabase REST API (no CLI available).

## Hard rules

1. **One Supabase project, dedicated `rollout` schema** — Rollout lives in a `rollout` schema; Mature stays in `public`. Do NOT share tables with Mature.
2. **Schema exactly as below** — tables `rollout.products` and `rollout.analytics` with the columns specified.
3. **No Mature data migration** — fresh Rollout data; data comes later via admin UI.
4. **Types are written manually** — there is no Supabase CLI. Fetch table structure via the REST API, then write the TypeScript interfaces by hand.
5. **`rollout/` is a fresh Next.js app** — its own `package.json`, own dependencies, own build.
6. **Do NOT commit untracked files** — only the files created by this task.

## Steps (in order)

Run from the repository root (`/home/lordwhitefire/current-project/athletica/athletica`).

### 1. Create the `rollout/` Next.js app directory

```bash
cd /home/lordwhitefire/current-project/athletica/athletica
mkdir -p rollout
cd rollout
```

Initialize a minimal Next.js 14+ App Router project (TypeScript, Tailwind, ESLint):

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-git
```

> The `--no-git` flag prevents creating a nested `.git` inside `rollout/`.

### 2. Install Supabase client

```bash
npm install @supabase/supabase-js
```

No CLI needed — types are written by hand.

### 3. Use the EXISTING Supabase project

Use the project the owner already has (`athletica`). Note the **Project URL** and **anon/public key** — the same ones the Mature app already uses. Rollout will query the `rollout` schema within this same database.

### 4. Configure environment variables

Create `rollout/.env.local` (NOT committed):

```env
NEXT_PUBLIC_SUPABASE_URL=<same-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<same-service-role-key>  # for admin scripts only
NEXT_PUBLIC_SYSTEM_TYPE=rollout
```

Also create `rollout/.env.example` (committed, with placeholders):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SYSTEM_TYPE=rollout
```

### 5. Create the `rollout` schema and run the schema SQL

In the Supabase dashboard → SQL Editor, create the schema and then run the table DDL:

```sql
-- Create the dedicated Rollout schema (separate from Mature's public schema)
CREATE SCHEMA IF NOT EXISTS rollout;

-- Self-contained product table (no foreign keys to hierarchy)
CREATE TABLE rollout.products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'unpublished' CHECK (status IN ('published', 'unpublished')),

  -- Identity
  gender TEXT,
  color TEXT,
  asin TEXT,
  sku TEXT,

  -- Description
  collection TEXT,
  tagline TEXT,
  subtitle TEXT,
  intro TEXT,
  key_benefits JSONB DEFAULT '[]'::jsonb,
  technical_details JSONB DEFAULT '[]'::jsonb,

  -- Attributes
  adjustment TEXT,
  range TEXT,
  sole_type TEXT,
  upper_material TEXT,
  traction TEXT,
  price DECIMAL(10,2),

  -- Images
  main_image TEXT,
  images TEXT[] DEFAULT '{}',

  -- SEO
  meta JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple analytics (no complex attribution)
CREATE TABLE rollout.analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES rollout.products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rollout_products_status ON rollout.products(status);
CREATE INDEX idx_rollout_products_slug ON rollout.products(slug);
CREATE INDEX idx_rollout_analytics_product ON rollout.analytics(product_id);
CREATE INDEX idx_rollout_analytics_created ON rollout.analytics(created_at);
```

### 6. Fetch table structure and write TypeScript types

Since there is no Supabase CLI, fetch the table structure via the REST API and write types by hand. Because the tables are in the `rollout` schema (not `public`), the REST API requests must target the `rollout` schema via the `Accept-Profile` header (or `?schema=rollout`).

**Step 6a: Fetch `rollout.products` structure**

```bash
curl -s "https://<project-ref>.supabase.co/rest/v1/products?select=*" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <anon-key>" \
  -H "Accept-Profile: rollout" \
  | head -c 4000
```

Repeat for `rollout.analytics` (via `.../rest/v1/analytics` with the same `Accept-Profile: rollout` header).

**Step 6b: Write the types file**

Create `rollout/src/lib/database.types.ts`. Since Rollout uses the `rollout` schema, expose the tables under a `rollout` key (not the default `public`):

```typescript
// Manually written types for the Rollout schema — no CLI used.
// Last updated: <date>

export interface Database {
  rollout: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          status: 'published' | 'unpublished';
          gender: string | null;
          color: string | null;
          asin: string | null;
          sku: string | null;
          collection: string | null;
          tagline: string | null;
          subtitle: string | null;
          intro: string | null;
          key_benefits: ProductBenefit[];       // JSONB array
          technical_details: ProductDetail[];   // JSONB array
          adjustment: string | null;
          range: string | null;
          sole_type: string | null;
          upper_material: string | null;
          traction: string | null;
          price: number | null;
          main_image: string | null;
          images: string[];
          meta: Record<string, string>;          // JSONB
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['rollout']['Tables']['products']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['rollout']['Tables']['products']['Insert']>;
      };
      analytics: {
        Row: {
          id: string;
          product_id: string;
          event_type: 'view' | 'click';
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          event_type: 'view' | 'click';
          created_at?: string;
        };
        Update: Partial<Database['rollout']['Tables']['analytics']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// JSONB array sub-types (for key_benefits / technical_details)
export interface ProductBenefit {
  icon: string;
  title: string;
  text: string;
}

export interface ProductDetail {
  label: string;
  value: string;
}

// Convenience types
export type ProductRow = Database['rollout']['Tables']['products']['Row'];
export type ProductInsert = Database['rollout']['Tables']['products']['Insert'];
export type ProductUpdate = Database['rollout']['Tables']['products']['Update'];

export type AnalyticsRow = Database['rollout']['Tables']['analytics']['Row'];
export type AnalyticsInsert = Database['rollout']['Tables']['analytics']['Insert'];
export type AnalyticsUpdate = Database['rollout']['Tables']['analytics']['Update'];
```

This matches how Supabase's generated types would expose a non-`public` schema: `Database.rollout.Tables.products`, not `Database.public.Tables.rollout_products`.

**Important:** Verify the column names and types by querying the Supabase dashboard (Table Editor) in the `rollout` schema after running the SQL. Adjust the types file if any column differs.

### 7. Commit the changes

```bash
cd /home/lordwhitefire/current-project/athletica/athletica
git add rollout/
git commit -m "feat(rollout): add Rollout app with rollout schema and types"
```

**Do NOT push.** Owner reviews and pushes.

## Benchmarks (what must be true after this change)

- `rollout/` directory exists with a working Next.js app (`npm run dev` starts without error)
- In the EXISTING Supabase project, a `rollout` schema exists
- Schema contains tables `rollout.products` and `rollout.analytics` with all specified columns
- Running the schema SQL succeeds (no errors)
- `rollout/src/lib/database.types.ts` exists and contains TypeScript interfaces for both tables (under a `Database.rollout` key)
- Types include `Row`, `Insert`, `Update` for each table, plus JSONB sub-types
- `rollout/.env.example` committed with placeholders; `.env.local` NOT committed
- `git status` in `rollout/` shows only the files from this task (no untracked junk)
- One commit with message `feat(rollout): add Rollout app with rollout schema and types`

## What is explicitly NOT done in this task

- Creating any UI pages (that's ROLL-05+)
- Creating any services (that's ROLL-02+)
- Migrating any Mature data
- Creating a SECOND Supabase project (decision: one project, `rollout` schema)
- Setting up Vercel project (that's ROLL-09)
- The `rollout/` directory was created here; subsequent tasks build on it